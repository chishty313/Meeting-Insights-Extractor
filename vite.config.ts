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
      // Vite automatically handles VITE_ prefixed variables
      // No need to manually define them - Vite will inject them automatically
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
  };
});
