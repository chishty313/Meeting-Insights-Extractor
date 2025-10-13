/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AZURE_OPENAI_API_KEY: string
  readonly VITE_AZURE_OPENAI_ENDPOINT: string
  readonly VITE_GEMINI_API_KEY: string
  readonly VITE_ZOOM_CLIENT_ID: string
  readonly VITE_ZOOM_CLIENT_SECRET: string
  readonly VITE_ZOOM_ACCOUNT_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
