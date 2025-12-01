import 'dotenv/config';
import express, { Request, Response } from 'express';
import Groq from 'groq-sdk';
import fs from 'fs';

import cors from 'cors';
import multer from 'multer';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
  origin: function (origin, callback) {
    return callback(null, true); // allow all, including null
  },
  credentials: true
}));

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

// app.use(express.json({ limit: '50mb' })); // Not needed for multipart/form-data, but good to keep if we support JSON too.
// Keeping it doesn't hurt, but multer handles the multipart parsing.

async function analyzePdf(base64Pdf: string): Promise<string | null> {
  const response = await client.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [
      {
        role: 'system',
        content: `
          You are a expert contract-analysis agent.

          Detect risks:
          - Missing insurance requirements
          - Uncapped liability
          - Vague payment terms
          - Broad indemnification clauses
          - Missing termination terms
          - Ambiguous scope of work
          - Recommend remmediation or revision

          Return ONLY valid JSON:
          {
            "risks": [
              {
                "risk": "string",
                "explanation": "string"
              }
            ],
            "revision": "string"
          }
        `,
      },
      {
        role: 'user',
        content: `
          Analyze this contract PDF. The PDF is base64 encoded below:

          === PDF FILE (base64) ===
          ${base64Pdf}
          === END PDF ===
        `,
      },
    ],
    response_format: { type: 'json_object' },
  });

  return response.choices[0].message.content;
}

app.post('/analyze', upload.any(), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    console.log('files', files)

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const results = await Promise.all(files.map(async (file) => {
      try {
        const base64Pdf = file.buffer.toString('base64');
        const result = await analyzePdf(base64Pdf);
        if (!result) return { error: 'Empty result from AI' };

        let parsed;
        try {
          parsed = JSON.parse(result);
        } catch (e) {
          const match = result.match(/\{[\s\S]*\}/);
          if (match) {
            parsed = JSON.parse(match[0]);
          } else {
            throw e;
          }
        }
        return parsed;
      } catch (error) {
        console.error(`Error analyzing ${file.originalname}:`, error);
        return { error: 'Failed to analyze this PDF' };
      }
    }));

    // Ensure only analysis data is sent back, without multer metadata
    res.setHeader('Content-Type', 'application/json');
    res.json(results);
  } catch (error) {
    console.error('Analysis Error:', error);
    fs.writeFileSync('error.log', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    res.status(500).json({ error: 'Failed to process request' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});