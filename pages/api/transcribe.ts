import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { audioFile } = req.body;

  if (!audioFile) {
    return res.status(400).json({ error: "No audio file provided" });
  }

  try {
    const AZURE_API_KEY = process.env.AZURE_OPENAI_API_KEY;
    const AZURE_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;

    if (!AZURE_API_KEY || !AZURE_ENDPOINT) {
      return res.status(500).json({ error: "Azure OpenAI not configured" });
    }

    // Extract base URL from endpoint
    const baseUrl = new URL(AZURE_ENDPOINT).origin;
    const whisperEndpoint = `${baseUrl}/openai/deployments/whisper/audio/translations?api-version=2024-06-01`;

    const formData = new FormData();
    formData.append("file", audioFile);

    const response = await fetch(whisperEndpoint, {
      method: "POST",
      headers: {
        "api-key": AZURE_API_KEY,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res
        .status(response.status)
        .json({ error: `Azure Whisper API failed: ${errorText}` });
    }

    const data = await response.json();
    return res.status(200).json({ transcript: data.text || "" });
  } catch (error) {
    console.error("Transcription error:", error);
    return res.status(500).json({ error: "Transcription failed" });
  }
}
