import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";

// Function to load .env file directly
const loadEnvFile = () => {
  const envPath = path.resolve(".env");
  const envVars: Record<string, string> = {};
  
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf8");
    envContent.split("\n").forEach((line) => {
      const [key, ...valueParts] = line.split("=");
      if (key && valueParts.length > 0) {
        const value = valueParts.join("=").trim();
        if (value && !value.startsWith("#")) {
          envVars[key.trim()] = value;
        }
      }
    });
  }
  
  return envVars;
};

export default defineConfig(({ mode }) => {
  // Load environment variables from .env files and system environment
  const env = loadEnv(mode, ".", "");
  const directEnv = loadEnvFile();

  // Debug logging
  console.log("🔍 Vite Config Debug:");
  console.log("  - Mode:", mode);
  console.log("  - AZURE_OPENAI_API_KEY from loadEnv:", !!env.AZURE_OPENAI_API_KEY);
  console.log("  - AZURE_OPENAI_API_KEY from direct load:", !!directEnv.AZURE_OPENAI_API_KEY);
  console.log("  - AZURE_OPENAI_ENDPOINT from loadEnv:", !!env.AZURE_OPENAI_ENDPOINT);
  console.log("  - AZURE_OPENAI_ENDPOINT from direct load:", !!directEnv.AZURE_OPENAI_ENDPOINT);
  console.log("  - AZURE_OPENAI_API_KEY from process.env:", !!process.env.AZURE_OPENAI_API_KEY);
  console.log("  - AZURE_OPENAI_ENDPOINT from process.env:", !!process.env.AZURE_OPENAI_ENDPOINT);

  return {
    server: {
      port: 3000,
      host: "0.0.0.0",
    },
    preview: {
      port: 4173,
      host: "0.0.0.0",
      allowedHosts: ["assistant.niftyai.net", "20.244.80.234", "localhost"],
    },
    plugins: [react()],
    define: {
      // Use direct .env file loading as primary source, with fallbacks
      "process.env.GEMINI_API_KEY": JSON.stringify(
        directEnv.GEMINI_API_KEY || env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || ""
      ),
      "process.env.AZURE_OPENAI_API_KEY": JSON.stringify(
        directEnv.AZURE_OPENAI_API_KEY || env.AZURE_OPENAI_API_KEY || process.env.AZURE_OPENAI_API_KEY || ""
      ),
      "process.env.AZURE_OPENAI_ENDPOINT": JSON.stringify(
        directEnv.AZURE_OPENAI_ENDPOINT || env.AZURE_OPENAI_ENDPOINT || process.env.AZURE_OPENAI_ENDPOINT || ""
      ),
      "process.env.ZOOM_CLIENT_ID": JSON.stringify(
        directEnv.ZOOM_CLIENT_ID || env.ZOOM_CLIENT_ID || process.env.ZOOM_CLIENT_ID || ""
      ),
      "process.env.ZOOM_CLIENT_SECRET": JSON.stringify(
        directEnv.ZOOM_CLIENT_SECRET || env.ZOOM_CLIENT_SECRET || process.env.ZOOM_CLIENT_SECRET || ""
      ),
      "process.env.ZOOM_ACCOUNT_ID": JSON.stringify(
        directEnv.ZOOM_ACCOUNT_ID || env.ZOOM_ACCOUNT_ID || process.env.ZOOM_ACCOUNT_ID || ""
      ),
      // Also define them as global variables for direct access
      __ENV_AZURE_OPENAI_API_KEY__: JSON.stringify(
        directEnv.AZURE_OPENAI_API_KEY || env.AZURE_OPENAI_API_KEY || process.env.AZURE_OPENAI_API_KEY || ""
      ),
      __ENV_AZURE_OPENAI_ENDPOINT__: JSON.stringify(
        directEnv.AZURE_OPENAI_ENDPOINT || env.AZURE_OPENAI_ENDPOINT || process.env.AZURE_OPENAI_ENDPOINT || ""
      ),
      __ENV_GEMINI_API_KEY__: JSON.stringify(
        directEnv.GEMINI_API_KEY || env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || ""
      ),
      __ENV_ZOOM_CLIENT_ID__: JSON.stringify(
        directEnv.ZOOM_CLIENT_ID || env.ZOOM_CLIENT_ID || process.env.ZOOM_CLIENT_ID || ""
      ),
      __ENV_ZOOM_CLIENT_SECRET__: JSON.stringify(
        directEnv.ZOOM_CLIENT_SECRET || env.ZOOM_CLIENT_SECRET || process.env.ZOOM_CLIENT_SECRET || ""
      ),
      __ENV_ZOOM_ACCOUNT_ID__: JSON.stringify(
        directEnv.ZOOM_ACCOUNT_ID || env.ZOOM_ACCOUNT_ID || process.env.ZOOM_ACCOUNT_ID || ""
      ),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
  };
});
