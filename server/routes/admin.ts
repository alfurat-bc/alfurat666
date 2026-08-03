import { Router, Response } from 'express';
import database from '../db.js';
import { authenticate, requireSuperAdmin, requireAdmin, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Get all users (admin only)
router.get('/users', authenticate, requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const users = database.users.findAll().map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      is_active: u.is_active,
      created_at: u.created_at,
      survey_count: database.surveys.countByUserId(u.id)
    }));

    res.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Update user status (super admin only)
router.put('/users/:id/toggle-active', authenticate, requireSuperAdmin, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Cannot deactivate yourself
    if (parseInt(id) === req.user!.id) {
      res.status(400).json({ error: 'Cannot deactivate your own account' });
      return;
    }

    const user = database.users.findById(parseInt(id));

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    database.users.update(parseInt(id), { is_active: !user.is_active });

    res.json({ 
      message: user.is_active ? 'User deactivated' : 'User activated',
      is_active: !user.is_active 
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// Delete user (super admin only)
router.delete('/users/:id', authenticate, requireSuperAdmin, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Cannot delete yourself
    if (parseInt(id) === req.user!.id) {
      res.status(400).json({ error: 'Cannot delete your own account' });
      return;
    }

    const result = database.users.delete(parseInt(id));

    if (!result) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get all surveys (admin only)
router.get('/surveys', authenticate, requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const surveys = database.surveys.findAll().map(s => {
      const user = database.users.findById(s.user_id);
      return {
        ...s,
        user_email: user?.email,
        user_name: user?.name,
        response_count: database.responses.countBySurveyId(s.id)
      };
    });

    res.json({ surveys });
  } catch (error) {
    console.error('Error fetching all surveys:', error);
    res.status(500).json({ error: 'Failed to fetch surveys' });
  }
});

// Delete any survey (super admin only)
router.delete('/surveys/:id', authenticate, requireSuperAdmin, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = database.surveys.delete(parseInt(id));

    if (!result) {
      res.status(404).json({ error: 'Survey not found' });
      return;
    }

    res.json({ message: 'Survey deleted successfully' });
  } catch (error) {
    console.error('Error deleting survey:', error);
    res.status(500).json({ error: 'Failed to delete survey' });
  }
});

// Get platform statistics (admin only)
router.get('/stats', authenticate, requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    res.json({
      stats: {
        totalUsers: database.stats.totalUsers(),
        totalSurveys: database.stats.totalSurveys(),
        publishedSurveys: database.stats.publishedSurveys(),
        totalResponses: database.stats.totalResponses(),
      },
      topSurveys: database.stats.topSurveys(10),
      userRoles: database.stats.userRoles(),
      responsesOverTime: [] // Empty for now, can be enhanced later
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

export default router;
