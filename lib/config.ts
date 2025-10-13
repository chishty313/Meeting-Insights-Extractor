/**
 * Configuration file for environment variables
 * This provides a more reliable way to handle environment variables in production
 */

// Vite-compatible environment variable access
export const config = {
  // Azure OpenAI Configuration - Using Vite's import.meta.env
  azure: {
    apiKey: import.meta.env.VITE_AZURE_OPENAI_API_KEY || "",
    endpoint: import.meta.env.VITE_AZURE_OPENAI_ENDPOINT || "",
  },

  // Google Gemini Configuration
  gemini: {
    apiKey: import.meta.env.VITE_GEMINI_API_KEY || "",
  },

  // Zoom API Configuration
  zoom: {
    clientId: import.meta.env.VITE_ZOOM_CLIENT_ID || "",
    clientSecret: import.meta.env.VITE_ZOOM_CLIENT_SECRET || "",
    accountId: import.meta.env.VITE_ZOOM_ACCOUNT_ID || "",
  },
};

// Configuration status checks with detailed logging
export const isConfigured = {
  azure: (() => {
    const hasKey = !!config.azure.apiKey;
    const hasEndpoint = !!config.azure.endpoint;

    console.log("🔍 Azure Configuration Debug:");
    console.log(
      "  - API Key:",
      hasKey ? `SET (${config.azure.apiKey.substring(0, 10)}...)` : "NOT SET"
    );
    console.log("  - Endpoint:", hasEndpoint ? "SET" : "NOT SET");
    console.log(
      "  - Process.env.AZURE_OPENAI_API_KEY:",
      !!process.env.AZURE_OPENAI_API_KEY
    );
    console.log(
      "  - Process.env.AZURE_OPENAI_ENDPOINT:",
      !!process.env.AZURE_OPENAI_ENDPOINT
    );

    if (typeof window !== "undefined") {
      console.log(
        "  - Window.__ENV_AZURE_OPENAI_API_KEY__:",
        !!(window as any).__ENV_AZURE_OPENAI_API_KEY__
      );
      console.log(
        "  - Window.__ENV_AZURE_OPENAI_ENDPOINT__:",
        !!(window as any).__ENV_AZURE_OPENAI_ENDPOINT__
      );
    }

    return hasKey && hasEndpoint;
  })(),

  gemini: !!config.gemini.apiKey,

  zoom: !!(
    config.zoom.clientId &&
    config.zoom.clientSecret &&
    config.zoom.accountId
  ),
};

// Export individual configuration getters for backward compatibility
export const getAzureConfig = () => config.azure;
export const getGeminiConfig = () => config.gemini;
export const getZoomConfig = () => config.zoom;
