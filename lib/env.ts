/**
 * Environment variable utility for handling both development and production
 * This ensures environment variables work correctly in all deployment scenarios
 */

// Function to safely get environment variables
export const getEnvVar = (key: string, defaultValue: string = ""): string => {
  // In production, environment variables are injected at build time
  // In development, they come from .env files
  if (typeof window !== "undefined") {
    // Client-side: variables are injected by Vite
    return (window as any).__ENV__?.[key] || defaultValue;
  }

  // Server-side: use process.env
  return process.env[key] || defaultValue;
};

// Pre-configured environment variable getters
export const env = {
  // Azure OpenAI
  AZURE_OPENAI_API_KEY: getEnvVar("AZURE_OPENAI_API_KEY"),
  AZURE_OPENAI_ENDPOINT: getEnvVar("AZURE_OPENAI_ENDPOINT"),

  // Google Gemini
  GEMINI_API_KEY: getEnvVar("GEMINI_API_KEY"),

  // Zoom API
  ZOOM_CLIENT_ID: getEnvVar("ZOOM_CLIENT_ID"),
  ZOOM_CLIENT_SECRET: getEnvVar("ZOOM_CLIENT_SECRET"),
  ZOOM_ACCOUNT_ID: getEnvVar("ZOOM_ACCOUNT_ID"),
};

// Configuration status checks
export const isConfigured = {
  azure: !!(env.AZURE_OPENAI_API_KEY && env.AZURE_OPENAI_ENDPOINT),
  gemini: !!env.GEMINI_API_KEY,
  zoom: !!(env.ZOOM_CLIENT_ID && env.ZOOM_CLIENT_SECRET && env.ZOOM_ACCOUNT_ID),
};
