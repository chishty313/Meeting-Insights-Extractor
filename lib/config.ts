/**
 * Configuration file for environment variables
 * This provides a more reliable way to handle environment variables in production
 */

// Direct environment variable access with fallbacks
export const config = {
  // Azure OpenAI Configuration
  azure: {
    apiKey:
      process.env.AZURE_OPENAI_API_KEY ||
      (typeof window !== "undefined" &&
        (window as any).__ENV_AZURE_OPENAI_API_KEY__) ||
      (typeof window !== "undefined" && (window as any).AZURE_OPENAI_API_KEY) ||
      "",
    endpoint:
      process.env.AZURE_OPENAI_ENDPOINT ||
      (typeof window !== "undefined" &&
        (window as any).__ENV_AZURE_OPENAI_ENDPOINT__) ||
      (typeof window !== "undefined" &&
        (window as any).AZURE_OPENAI_ENDPOINT) ||
      "",
  },

  // Google Gemini Configuration
  gemini: {
    apiKey:
      process.env.GEMINI_API_KEY ||
      (typeof window !== "undefined" &&
        (window as any).__ENV_GEMINI_API_KEY__) ||
      (typeof window !== "undefined" && (window as any).GEMINI_API_KEY) ||
      "",
  },

  // Zoom API Configuration
  zoom: {
    clientId:
      process.env.ZOOM_CLIENT_ID ||
      (typeof window !== "undefined" &&
        (window as any).__ENV_ZOOM_CLIENT_ID__) ||
      (typeof window !== "undefined" && (window as any).ZOOM_CLIENT_ID) ||
      "",
    clientSecret:
      process.env.ZOOM_CLIENT_SECRET ||
      (typeof window !== "undefined" &&
        (window as any).__ENV_ZOOM_CLIENT_SECRET__) ||
      (typeof window !== "undefined" && (window as any).ZOOM_CLIENT_SECRET) ||
      "",
    accountId:
      process.env.ZOOM_ACCOUNT_ID ||
      (typeof window !== "undefined" &&
        (window as any).__ENV_ZOOM_ACCOUNT_ID__) ||
      (typeof window !== "undefined" && (window as any).ZOOM_ACCOUNT_ID) ||
      "",
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
