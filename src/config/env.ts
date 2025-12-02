import 'dotenv/config';

export const env = {
  PORT: process.env.PORT || 3000,
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
};

if (!env.GROQ_API_KEY) {
  throw new Error('Missing GROQ_API_KEY in environment');
}
