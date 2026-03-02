import { Router, Request, Response } from 'express';
import { CodeReviewRequestSchema, handleError } from '../lib/utils.js';
import { AnalysisService } from '../services/analysis-service.js';

const router = Router();
const analysisService = new AnalysisService();

router.post('/', async (req: Request, res: Response) => {
  req.log.info(
    { sourceType: req.body.sourceType, language: req.body.language },
    'POST /api/analyze-code - Received request'
  );

  try {
    const data = CodeReviewRequestSchema.parse(req.body);
    req.log.info('Analyze-code input validation passed');

    const result = await analysisService.analyze(data);

    req.log.info('AI code analysis successful');
    return res.json(result);
  } catch (error) {
    req.log.error({ error }, 'Error in /analyze-code');

    // If it's a Zod error, it's a bad request
    if (error instanceof Error && error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.message,
        details: (error as any).issues,
      });
    }

    handleError(res, error);
  }
});

export default router;
