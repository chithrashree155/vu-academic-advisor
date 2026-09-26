/**
 * Environment Configuration Validator & Typed Accessor
 * Ensures environment variables are validated cleanly without exposing secret values.
 */

export interface AppConfig {
  supabase: {
    url: string;
    anonKey: string;
    serviceRoleKey?: string;
    databaseUrl?: string;
  };
  llm: {
    apiKey: string;
    baseUrl: string;
    completionModel: string;
    reasoningModel: string;
    embeddingModel: string;
    embeddingDimension: number;
  };
  rag: {
    similarityThreshold: number;
    topK: number;
    strictHierarchy: boolean;
  };
  isProduction: boolean;
  isDevelopment: boolean;
}

function getEnvVar(key: string, defaultValue?: string, required = false): string {
  const value = process.env[key] ?? defaultValue;
  if (required && (!value || value.trim() === '')) {
    throw new Error(`[Config Error] Missing required environment variable: ${key}`);
  }
  return value ?? '';
}

export function loadConfig(): AppConfig {
  const isProd = process.env.NODE_ENV === 'production';

  return {
    supabase: {
      url: getEnvVar('NEXT_PUBLIC_SUPABASE_URL', 'https://placeholder.supabase.co'),
      anonKey: getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'placeholder-anon-key'),
      serviceRoleKey: getEnvVar('SUPABASE_SERVICE_ROLE_KEY'),
      databaseUrl: getEnvVar('DATABASE_URL'),
    },
    llm: {
      apiKey: getEnvVar('OPENAI_API_KEY', ''),
      baseUrl: getEnvVar('OPENAI_BASE_URL', 'https://api.openai.com/v1'),
      completionModel: getEnvVar('LLM_COMPLETION_MODEL', 'gpt-4o-mini'),
      reasoningModel: getEnvVar('LLM_REASONING_MODEL', 'gpt-4o'),
      embeddingModel: getEnvVar('EMBEDDING_MODEL', 'Xenova/all-MiniLM-L6-v2'),
      embeddingDimension: parseInt(getEnvVar('EMBEDDING_DIMENSION', '384'), 10),
    },
    rag: {
      similarityThreshold: parseFloat(getEnvVar('RAG_SIMILARITY_THRESHOLD', '0.68')),
      topK: parseInt(getEnvVar('RAG_TOP_K', '5'), 10),
      strictHierarchy: getEnvVar('ENABLE_STRICT_SOURCE_HIERARCHY', 'true') === 'true',
    },
    isProduction: isProd,
    isDevelopment: !isProd,
  };
}

export const config = loadConfig();
