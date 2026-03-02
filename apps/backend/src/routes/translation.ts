import { Router, Request, Response } from 'express';
import { TranslationRequestSchema, handleError } from '../lib/utils.js';
import { AIServiceFactory } from '../factories/ai-service-factory.js';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  req.log.info(
    { language: req.body.language, model: req.body.selectedModel?.key },
    'POST /api/translate-code - Received request'
  );

  try {
    const data = TranslationRequestSchema.parse(req.body);
    req.log.info('Translation input validation passed');

    if (!data.selectedModel || !data.apiKey) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Both selectedModel and apiKey are required',
      });
    }

    const aiService = AIServiceFactory.createCloudAIService(
      data.selectedModel,
      data.apiKey
    );
    req.log.info('AI service created for translation');

    const result = await aiService.translateCode({
      sourceCode: data.code,
      sourceLanguage: 'auto',
      targetLanguage: data.language,
    });

    if (result.error) {
      req.log.error({ result }, 'Translation failed');

      return res.status(500).json({
        message: result.message,
        details: result.details,
      });
    }
    req.log.info('Code translation successful');

    return res.json({ document: result.text });
  } catch (error) {
    req.log.error({ error }, 'Unhandled error in /translate-code');
    handleError(res, error);
  }
});

export default router;
