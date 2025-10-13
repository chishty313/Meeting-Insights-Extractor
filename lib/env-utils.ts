/**
 * Environment variable utilities that work in both client and server contexts
 * This provides a unified interface for accessing environment variables
 */

// Type-safe environment variable access
export const getEnvVar = (key: string): string | undefined => {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    // Client-side: use import.meta.env (Vite)
    return (import.meta as any).env?.[key];
  } else {
    // Server-side: use process.env
    return process.env[key];
  }
};

// Specific environment variable getters with fallbacks
export const getAzureConfig = () => ({
  apiKey: getEnvVar('VITE_AZURE_OPENAI_API_KEY') || getEnvVar('AZURE_OPENAI_API_KEY') || '',
  endpoint: getEnvVar('VITE_AZURE_OPENAI_ENDPOINT') || getEnvVar('AZURE_OPENAI_ENDPOINT') || '',
});

export const getGeminiConfig = () => ({
  apiKey: getEnvVar('VITE_GEMINI_API_KEY') || getEnvVar('GEMINI_API_KEY') || '',
});

export const getZoomConfig = () => ({
  clientId: getEnvVar('VITE_ZOOM_CLIENT_ID') || getEnvVar('ZOOM_CLIENT_ID') || '',
  clientSecret: getEnvVar('VITE_ZOOM_CLIENT_SECRET') || getEnvVar('ZOOM_CLIENT_SECRET') || '',
  accountId: getEnvVar('VITE_ZOOM_ACCOUNT_ID') || getEnvVar('ZOOM_ACCOUNT_ID') || '',
});

// Configuration status checks
export const isConfigured = {
  azure: (() => {
    const config = getAzureConfig();
    return !!(config.apiKey && config.endpoint);
  })(),
  
  gemini: (() => {
    const config = getGeminiConfig();
    return !!config.apiKey;
  })(),
  
  zoom: (() => {
    const config = getZoomConfig();
    return !!(config.clientId && config.clientSecret && config.accountId);
  })(),
};
