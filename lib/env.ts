/**
 * Environment variable utility for handling both development and production
 * This ensures environment variables work correctly in all deployment scenarios
 */

// Function to safely get environment variables
export const getEnvVar = (key: string, defaultValue: string = ""): string => {
  // Check multiple sources for environment variables
  const sources = [
    process.env[key],
    (window as any)?.[`__ENV_${key}__`],
    (window as any)?.[key],
    localStorage.getItem(key),
  ];
  
  // Return the first non-empty value
  for (const value of sources) {
    if (value && value.trim() !== "") {
      return value;
    }
  }
  
  return defaultValue;
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

// Configuration status checks with debug logging
export const isConfigured = {
  azure: (() => {
    const hasKey = !!env.AZURE_OPENAI_API_KEY;
    const hasEndpoint = !!env.AZURE_OPENAI_ENDPOINT;
    console.log("Azure Config Debug:", { hasKey, hasEndpoint, key: env.AZURE_OPENAI_API_KEY?.substring(0, 10) + "...", endpoint: env.AZURE_OPENAI_ENDPOINT });
    return hasKey && hasEndpoint;
  })(),
  gemini: !!env.GEMINI_API_KEY,
  zoom: !!(env.ZOOM_CLIENT_ID && env.ZOOM_CLIENT_SECRET && env.ZOOM_ACCOUNT_ID),
};
