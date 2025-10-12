import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  // Load environment variables from .env files and system environment
  const env = loadEnv(mode, ".", "");
  
  return {
    server: {
      port: 3000,
      host: "0.0.0.0",
    },
    plugins: [react()],
    define: {
      // Use environment variables from .env files or system environment
      "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || ""),
      "process.env.AZURE_OPENAI_API_KEY": JSON.stringify(
        env.AZURE_OPENAI_API_KEY || process.env.AZURE_OPENAI_API_KEY || ""
      ),
      "process.env.AZURE_OPENAI_ENDPOINT": JSON.stringify(
        env.AZURE_OPENAI_ENDPOINT || process.env.AZURE_OPENAI_ENDPOINT || ""
      ),
      "process.env.ZOOM_CLIENT_ID": JSON.stringify(env.ZOOM_CLIENT_ID || process.env.ZOOM_CLIENT_ID || ""),
      "process.env.ZOOM_CLIENT_SECRET": JSON.stringify(env.ZOOM_CLIENT_SECRET || process.env.ZOOM_CLIENT_SECRET || ""),
      "process.env.ZOOM_ACCOUNT_ID": JSON.stringify(env.ZOOM_ACCOUNT_ID || process.env.ZOOM_ACCOUNT_ID || ""),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
  };
});
