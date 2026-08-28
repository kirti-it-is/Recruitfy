import { GoogleGenAI } from '@google/genai';
import { env } from '@/lib/env';

const MODELS_TO_TRY = [
  'gemini-3.5-flash-lite',
];

function isQuotaError(error: unknown): boolean {
  const message = describeGeminiError(error);
  return /429|RESOURCE_EXHAUSTED|quota/i.test(message);
}

function describeGeminiError(error: unknown): string {
  if (!(error instanceof Error)) return String(error);
  const cause = error.cause instanceof Error ? ` Cause: ${error.cause.message}` : '';
  return `${error.name}: ${error.message}${cause}`;
}

export async function generateGeminiJson<T>(prompt: string): Promise<T> {
  const apiKey = env.GEMINI_API_KEY.trim();
  if (!apiKey) {
    throw new Error(
      'Gemini is not configured. Set GEMINI_API_KEY in .env.local (or GOOGLE_GENERATIVE_AI_API_KEY / GOOGLE_API_KEY), then restart the development server.'
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
      console.warn(`Gemini model ${modelName} failed: ${describeGeminiError(err)}`);
      if (isQuotaError(err)) break;
    }
  }

  if (!rawJsonText) {
    throw new Error(`Gemini API generation failed across all models: ${lastError ? describeGeminiError(lastError) : 'Empty response'}`);
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
