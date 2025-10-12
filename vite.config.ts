import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  // Load environment variables from .env files and system environment
  const env = loadEnv(mode, ".", "");
  
  // Debug logging
  console.log('🔍 Vite Config Debug:');
  console.log('  - Mode:', mode);
  console.log('  - AZURE_OPENAI_API_KEY from env:', !!env.AZURE_OPENAI_API_KEY);
  console.log('  - AZURE_OPENAI_ENDPOINT from env:', !!env.AZURE_OPENAI_ENDPOINT);
  console.log('  - AZURE_OPENAI_API_KEY from process.env:', !!process.env.AZURE_OPENAI_API_KEY);
  console.log('  - AZURE_OPENAI_ENDPOINT from process.env:', !!process.env.AZURE_OPENAI_ENDPOINT);
  
  return {
    server: {
      port: 3000,
      host: "0.0.0.0",
    },
    preview: {
      port: 4173,
      host: "0.0.0.0",
      allowedHosts: [
        'assistant.niftyai.net',
        '20.244.80.234',
        'localhost'
      ]
    },
    plugins: [react()],
    define: {
      // Use environment variables from .env files or system environment
      "process.env.GEMINI_API_KEY": JSON.stringify(
        env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || ""
      ),
      "process.env.AZURE_OPENAI_API_KEY": JSON.stringify(
        env.AZURE_OPENAI_API_KEY || process.env.AZURE_OPENAI_API_KEY || ""
      ),
      "process.env.AZURE_OPENAI_ENDPOINT": JSON.stringify(
        env.AZURE_OPENAI_ENDPOINT || process.env.AZURE_OPENAI_ENDPOINT || ""
      ),
      "process.env.ZOOM_CLIENT_ID": JSON.stringify(
        env.ZOOM_CLIENT_ID || process.env.ZOOM_CLIENT_ID || ""
      ),
      "process.env.ZOOM_CLIENT_SECRET": JSON.stringify(
        env.ZOOM_CLIENT_SECRET || process.env.ZOOM_CLIENT_SECRET || ""
      ),
      "process.env.ZOOM_ACCOUNT_ID": JSON.stringify(
        env.ZOOM_ACCOUNT_ID || process.env.ZOOM_ACCOUNT_ID || ""
      ),
      // Also define them as global variables for direct access
      "__ENV_AZURE_OPENAI_API_KEY__": JSON.stringify(
        env.AZURE_OPENAI_API_KEY || process.env.AZURE_OPENAI_API_KEY || ""
      ),
      "__ENV_AZURE_OPENAI_ENDPOINT__": JSON.stringify(
        env.AZURE_OPENAI_ENDPOINT || process.env.AZURE_OPENAI_ENDPOINT || ""
      ),
      "__ENV_GEMINI_API_KEY__": JSON.stringify(
        env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || ""
      ),
      "__ENV_ZOOM_CLIENT_ID__": JSON.stringify(
        env.ZOOM_CLIENT_ID || process.env.ZOOM_CLIENT_ID || ""
      ),
      "__ENV_ZOOM_CLIENT_SECRET__": JSON.stringify(
        env.ZOOM_CLIENT_SECRET || process.env.ZOOM_CLIENT_SECRET || ""
      ),
      "__ENV_ZOOM_ACCOUNT_ID__": JSON.stringify(
        env.ZOOM_ACCOUNT_ID || process.env.ZOOM_ACCOUNT_ID || ""
      ),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
  };
});
