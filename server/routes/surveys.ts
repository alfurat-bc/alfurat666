import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import database from '../db.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Get all published surveys (for public access)
router.get('/', (req: Request, res: Response) => {
  try {
    const surveys = database.surveys.findPublished().map(s => ({
      id: s.id,
      title: s.title,
      description: s.description,
      created_at: s.created_at
    }));

    res.json({ surveys });
  } catch (error) {
    console.error('Error fetching surveys:', error);
    res.status(500).json({ error: 'Failed to fetch surveys' });
  }
});

// Get single survey (public, for filling)
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const survey = database.surveys.findById(parseInt(id));

    if (!survey || !survey.is_published) {
      res.status(404).json({ error: 'Survey not found' });
      return;
    }

    res.json({ survey });
  } catch (error) {
    console.error('Error fetching survey:', error);
    res.status(500).json({ error: 'Failed to fetch survey' });
  }
});

// Create new survey (authenticated)
router.post('/', authenticate, [
  body('title').trim().isLength({ min: 1 }),
  body('questions').isArray(),
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { title, description, questions } = req.body;

    const survey = database.surveys.create({
      user_id: req.user!.id,
      title,
      description: description || '',
      questions,
      is_published: false,
    });

    res.status(201).json({ 
      message: 'Survey created successfully',
      survey 
    });
  } catch (error) {
    console.error('Error creating survey:', error);
    res.status(500).json({ error: 'Failed to create survey' });
  }
});

// Update survey (owner only)
router.put('/:id', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, questions } = req.body;

    // Check ownership
    const survey = database.surveys.findById(parseInt(id));

    if (!survey) {
      res.status(404).json({ error: 'Survey not found' });
      return;
    }

    if (survey.user_id !== req.user!.id && req.user!.role !== 'super_admin') {
      res.status(403).json({ error: 'Not authorized to edit this survey' });
      return;
    }

    const updated = database.surveys.update(parseInt(id), {
      title,
      description: description || '',
      questions,
    });

    res.json({ 
      message: 'Survey updated successfully',
      survey: updated 
    });
  } catch (error) {
    console.error('Error updating survey:', error);
    res.status(500).json({ error: 'Failed to update survey' });
  }
});

// Delete survey (owner only)
router.delete('/:id', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check ownership
    const survey = database.surveys.findById(parseInt(id));

    if (!survey) {
      res.status(404).json({ error: 'Survey not found' });
      return;
    }

    if (survey.user_id !== req.user!.id && req.user!.role !== 'super_admin') {
      res.status(403).json({ error: 'Not authorized to delete this survey' });
      return;
    }

    database.surveys.delete(parseInt(id));

    res.json({ message: 'Survey deleted successfully' });
  } catch (error) {
    console.error('Error deleting survey:', error);
    res.status(500).json({ error: 'Failed to delete survey' });
  }
});

// Publish/unpublish survey
router.post('/:id/publish', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { is_published } = req.body;

    // Check ownership
    const survey = database.surveys.findById(parseInt(id));

    if (!survey) {
      res.status(404).json({ error: 'Survey not found' });
      return;
    }

    if (survey.user_id !== req.user!.id && req.user!.role !== 'super_admin') {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    database.surveys.update(parseInt(id), { is_published: !!is_published });

    res.json({ 
      message: is_published ? 'Survey published' : 'Survey unpublished',
      is_published: !!is_published 
    });
  } catch (error) {
    console.error('Error publishing survey:', error);
    res.status(500).json({ error: 'Failed to update survey status' });
  }
});

// Get QR code for survey
router.get('/:id/qrcode', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
    const surveyUrl = `${baseUrl}/survey/${id}`;

    // Generate QR code as data URL
    const qrDataUrl = await QRCode.toDataURL(surveyUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    });

    res.json({ 
      qrCode: qrDataUrl,
      surveyUrl,
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// Download QR code as PNG
router.get('/:id/qrcode/download', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
    const surveyUrl = `${baseUrl}/survey/${id}`;

    // Ensure uploads directory exists
    const uploadsDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filename = `survey-${id}-qrcode.png`;
    const filepath = path.join(uploadsDir, filename);

    await QRCode.toFile(filepath, surveyUrl, {
      width: 800,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    });

    res.download(filepath, filename);
  } catch (error) {
    console.error('Error generating QR code file:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// Get user's surveys (authenticated)
router.get('/user/my-surveys', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const surveys = database.surveys.findByUserId(req.user!.id).map(s => ({
      ...s,
      response_count: database.responses.countBySurveyId(s.id)
    }));

    res.json({ surveys });
  } catch (error) {
    console.error('Error fetching user surveys:', error);
    res.status(500).json({ error: 'Failed to fetch surveys' });
  }
});

export default router;
