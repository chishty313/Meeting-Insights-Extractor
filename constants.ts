import type { Model } from "./types";

export const TRANSCRIPTION_MODELS: Model[] = [
  {
    id: "azure-whisper",
    name: "Azure Whisper",
    description: "Transcription via Azure OpenAI Whisper.",
    provider: "azure",
  },
  {
    id: "zoom-api",
    name: "Zoom API",
    description: "Fetch transcript directly from Zoom meeting recordings.",
    provider: "zoom",
  },
  {
    id: "whisper-large-v3",
    name: "Whisper V3 (Simulated)",
    description: "High accuracy transcription model.",
    provider: "simulated",
  },
  {
    id: "deepgram-nova-2",
    name: "Deepgram Nova-2 (Simulated)",
    description: "Real-time and pre-recorded audio transcription.",
    provider: "simulated",
  },
];

export const SUMMARY_MODELS: Model[] = [
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    description: "Fast and versatile model for summarization.",
    provider: "gemini",
  },
  {
    id: "gpt-5",
    name: "Azure gpt-5",
    description: "Summarization via Azure OpenAI gpt-5 deployment.",
    provider: "azure",
  },
];
