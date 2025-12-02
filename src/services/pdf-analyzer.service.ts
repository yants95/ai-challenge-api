import { groqClient } from '../config/groq';

export async function analyzePdf(base64Pdf: string): Promise<string | null> {
  const response = await groqClient.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [
      {
        role: 'system',
        content: `
          You are an expert contract-analysis agent.

          Detect risks:
          - Missing insurance requirements
          - Uncapped liability
          - Vague payment terms
          - Broad indemnification clauses
          - Missing termination terms
          - Ambiguous scope of work
          - Recommend remediation or revision

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

  return response.choices[0].message.content ?? null;
}
