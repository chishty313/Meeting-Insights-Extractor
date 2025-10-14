import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
// No custom .env file parsing needed; Vite handles VITE_ vars automatically

export default defineConfig(({ mode }) => {
  // Load environment variables from .env files and system environment
  loadEnv(mode, ".", "");

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
    define: {},
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
  };
});
