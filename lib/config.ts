/**
 * Configuration file for environment variables
 * This provides a more reliable way to handle environment variables in production
 */

import { getAzureConfig, getGeminiConfig, getZoomConfig } from './env-utils';

// Use the environment utilities for consistent access
export const config = {
  azure: getAzureConfig(),
  gemini: getGeminiConfig(),
  zoom: getZoomConfig(),
};

// Import the isConfigured from env-utils for consistency
export { isConfigured, getAzureConfig, getGeminiConfig, getZoomConfig } from './env-utils';
