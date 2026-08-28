import 'server-only';
import fs from 'fs';
import path from 'path';

/**
 * Environment configuration and validation for HireMind AI
 */

function getEnvValue(key: string): string {
  if (process.env[key]) {
    return process.env[key] as string;
  }

  // Fallback: manually check .env.local and .env files if running in standalone script
  try {
    const envLocalPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envLocalPath)) {
      const content = fs.readFileSync(envLocalPath, 'utf-8');
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith(`${key}=`)) {
          const val = trimmed.substring(`${key}=`.length).trim().replace(/^["']|["']$/g, '');
          process.env[key] = val;
          return val;
        }
      }
    }

    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith(`${key}=`)) {
          const val = trimmed.substring(`${key}=`.length).trim().replace(/^["']|["']$/g, '');
          process.env[key] = val;
          return val;
        }
      }
    }
  } catch {
    // Ignore file read errors
  }

  return '';
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',

  // AI Provider Keys (Server-side only)
  get GEMINI_API_KEY(): string {
    return getEnvValue('GEMINI_API_KEY') || getEnvValue('GOOGLE_GENERATIVE_AI_API_KEY') || getEnvValue('GOOGLE_API_KEY');
  },
  get GOOGLE_GENERATIVE_AI_API_KEY(): string {
    return getEnvValue('GEMINI_API_KEY') || getEnvValue('GOOGLE_GENERATIVE_AI_API_KEY') || getEnvValue('GOOGLE_API_KEY');
  },
  get OPENAI_API_KEY(): string {
    return getEnvValue('OPENAI_API_KEY');
  },
  get ANTHROPIC_API_KEY(): string {
    return getEnvValue('ANTHROPIC_API_KEY');
  },

  // Storage and Upload Config
  UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
  MAX_FILE_SIZE_MB: Number(process.env.MAX_FILE_SIZE_MB || '25'),
};

export type Env = typeof env;
