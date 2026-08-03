import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import database from '../db.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Submit response (public)
router.post('/:id/responses', [
  body('answers').isObject(),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { id } = req.params;
    const { answers } = req.body;

    // Check if survey exists and is published
    const survey = database.surveys.findById(parseInt(id));

    if (!survey) {
      res.status(404).json({ error: 'Survey not found' });
      return;
    }

    if (!survey.is_published) {
      res.status(400).json({ error: 'Survey is not available for responses' });
      return;
    }

    // Insert response
    const response = database.responses.create({
      survey_id: parseInt(id),
      answers: JSON.stringify(answers),
      ip_address: req.ip || '',
      user_agent: req.headers['user-agent'] || ''
    });

    res.status(201).json({ 
      message: 'Response submitted successfully',
      responseId: response.id,
    });
  } catch (error) {
    console.error('Error submitting response:', error);
    res.status(500).json({ error: 'Failed to submit response' });
  }
});

// Get responses for a survey (owner only)
router.get('/:id/responses', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check ownership
    const survey = database.surveys.findById(parseInt(id));

    if (!survey) {
      res.status(404).json({ error: 'Survey not found' });
      return;
    }

    if (survey.user_id !== req.user!.id && req.user!.role !== 'super_admin') {
      res.status(403).json({ error: 'Not authorized to view responses' });
      return;
    }

    const responses = database.responses.findBySurveyId(parseInt(id));

    // Parse JSON answers
    const parsedResponses = responses.map(r => ({
      ...r,
      answers: JSON.parse(r.answers),
    }));

    res.json({ responses: parsedResponses });
  } catch (error) {
    console.error('Error fetching responses:', error);
    res.status(500).json({ error: 'Failed to fetch responses' });
  }
});

// Get analytics for a survey (owner only)
router.get('/:id/analytics', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check ownership
    const survey = database.surveys.findById(parseInt(id));

    if (!survey) {
      res.status(404).json({ error: 'Survey not found' });
      return;
    }

    if (survey.user_id !== req.user!.id && req.user!.role !== 'super_admin') {
      res.status(403).json({ error: 'Not authorized to view analytics' });
      return;
    }

    // Get all responses
    const responses = database.responses.findBySurveyId(parseInt(id));

    // Calculate analytics for each question
    const analytics = survey.questions.map((question: any, qIndex: number) => {
      const counts: Record<string, number> = {};
      
      responses.forEach((response) => {
        const answers = JSON.parse(response.answers);
        const answer = answers[`q${qIndex + 1}`];
        
        if (answer !== undefined && answer !== '') {
          if (question.type === 'checkbox') {
            // Multiple selections
            if (Array.isArray(answer)) {
              answer.forEach((item: string) => {
                counts[item] = (counts[item] || 0) + 1;
              });
            }
          } else {
            // Single selection or text
            const key = String(answer);
            counts[key] = (counts[key] || 0) + 1;
          }
        }
      });

      return {
        questionId: `q${qIndex + 1}`,
        question: question.text,
        type: question.type,
        options: question.options || [],
        counts,
        total: responses.length,
      };
    });

    res.json({
      surveyId: parseInt(id),
      totalResponses: responses.length,
      analytics,
    });
  } catch (error) {
    console.error('Error generating analytics:', error);
    res.status(500).json({ error: 'Failed to generate analytics' });
  }
});

// Export responses as CSV (owner only)
router.get('/:id/export', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

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

    const questions = survey.questions;
    const responses = database.responses.findBySurveyId(parseInt(id));

    // Build CSV header
    const headers = ['Response ID', 'Submitted At', ...questions.map((q: any, i: number) => `Q${i + 1}: ${q.text}`)];
    
    // Build CSV rows
    const rows = responses.map((r: any) => {
      const answers = JSON.parse(r.answers);
      return [
        r.id,
        r.submitted_at,
        ...questions.map((_: any, i: number) => {
          const answer = answers[`q${i + 1}`];
          if (Array.isArray(answer)) return answer.join('; ');
          return answer || '';
        }),
      ];
    });

    // Convert to CSV string
    const escapeCSV = (str: string) => {
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csv = [
      headers.map(escapeCSV).join(','),
      ...rows.map(row => row.map((cell: any) => escapeCSV(String(cell))).join(',')),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${survey.title}-responses.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Error exporting responses:', error);
    res.status(500).json({ error: 'Failed to export responses' });
  }
});

export default router;
