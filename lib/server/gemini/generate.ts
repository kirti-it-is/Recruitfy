import { GoogleGenAI } from '@google/genai';
import { env } from '@/lib/env';

const MODELS_TO_TRY = [
  'gemini-3.6-flash',
  'gemini-2.5-flash-lite',
  'gemini-flash-latest',
  'gemini-3.7-flash',
  'gemini-2.5-pro',
];

export async function generateGeminiJson<T>(prompt: string): Promise<T> {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is not configured in server environment. Please set GEMINI_API_KEY in .env.local.'
    );
  }

  const ai = new GoogleGenAI({ apiKey });
  let rawJsonText = '';
  let lastError: Error | null = null;

  for (const modelName of MODELS_TO_TRY) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      if (response.text && response.text.trim().length > 0) {
        rawJsonText = response.text;
        break;
      }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`Model ${modelName} failed, trying next candidate model...`);
    }
  }

  if (!rawJsonText) {
    throw new Error(`Gemini API generation failed across all models: ${lastError?.message || 'Empty response'}`);
  }

  try {
    const cleaned = rawJsonText.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned) as T;
  } catch (parseError) {
    console.error('Failed to parse Gemini output:', rawJsonText);
    throw new Error(
      `Invalid JSON returned from Gemini: ${parseError instanceof Error ? parseError.message : String(parseError)}`
    );
  }
}
