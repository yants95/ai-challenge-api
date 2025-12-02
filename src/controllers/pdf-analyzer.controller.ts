import { Request, Response } from 'express';
import { analyzePdf } from '../services/pdf-analyzer.service';

export async function analyzeController(req: Request, res: Response) {
  try {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const results = await Promise.all(
      files.map(async (file) => {
        try {
          const base64Pdf = file.buffer.toString('base64');
          const result = await analyzePdf(base64Pdf);

          if (!result) return { error: 'Empty result from AI' };

          try {
            return JSON.parse(result);
          } catch {
            const match = result.match(/\{[\s\S]*\}/);
            if (match) return JSON.parse(match[0]);
            throw new Error('Invalid JSON from AI');
          }
        } catch (err) {
          console.error(`Error analyzing ${file.originalname}:`, err);
          return { error: 'Failed to analyze this PDF' };
        }
      })
    );

    res.setHeader('Content-Type', 'application/json');
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Failed to process request' });
  }
}
