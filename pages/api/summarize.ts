import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { transcript, provider, model, systemPrompt } = req.body;

  if (!transcript) {
    return res.status(400).json({ error: "No transcript provided" });
  }

  try {
    if (provider === "azure") {
      const AZURE_API_KEY = process.env.AZURE_OPENAI_API_KEY;
      const AZURE_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;

      if (!AZURE_API_KEY || !AZURE_ENDPOINT) {
        return res.status(500).json({ error: "Azure OpenAI not configured" });
      }

      const baseUrl = new URL(AZURE_ENDPOINT).origin;
      const chatEndpoint = `${baseUrl}/openai/deployments/${model}/chat/completions?api-version=2025-01-01-preview`;

      const insightsTool = {
        type: "function",
        function: {
          name: "extract_meeting_insights",
          description:
            "Extracts structured meeting insights including Overview, Key Takeaways, Next Steps, and Key Topics.",
          parameters: {
            type: "object",
            properties: {
              overview: {
                type: "string",
                description:
                  "A 2-3 sentence executive summary capturing focus and primary outcomes.",
              },
              keyTakeaways: {
                type: "array",
                description:
                  "4-7 bullets of important decisions/agreements phrased as The team ...",
                items: { type: "string" },
              },
              nextSteps: {
                type: "array",
                description:
                  "Action items with assignee name (or To be Assigned) and clear task.",
                items: { type: "string" },
              },
              keyTopics: {
                type: "array",
                description:
                  "5-8 concise topic phrases (3-7 words) with labels like Update/Decision/Idea.",
                items: { type: "string" },
              },
            },
            required: ["overview", "keyTakeaways", "nextSteps", "keyTopics"],
          },
        },
      };

      const messages = [
        {
          role: "system",
          content: systemPrompt || "You are a helpful meeting assistant.",
        },
        {
          role: "user",
          content: `Analyze the following meeting transcript. Provide a concise summary and extract all action items.\n\nTranscript:\n---\n${transcript}\n---`,
        },
      ];

      const response = await fetch(chatEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": AZURE_API_KEY,
        },
        body: JSON.stringify({
          messages,
          tools: [insightsTool],
          tool_choice: {
            type: "function",
            function: { name: "extract_meeting_insights" },
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return res
          .status(response.status)
          .json({ error: `Azure Chat API failed: ${errorText}` });
      }

      const data = await response.json();
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

      if (toolCall && toolCall.function?.name === "extract_meeting_insights") {
        const parsedArgs = JSON.parse(toolCall.function.arguments);
        return res.status(200).json({
          overview: parsedArgs.overview,
          keyTakeaways: parsedArgs.keyTakeaways,
          nextSteps: parsedArgs.nextSteps,
          keyTopics: parsedArgs.keyTopics,
        });
      }

      return res.status(500).json({ error: "Invalid response from Azure API" });
    } else if (provider === "gemini") {
      const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

      if (!GEMINI_API_KEY) {
        return res.status(500).json({ error: "Gemini API not configured" });
      }

      // Gemini implementation would go here
      return res
        .status(500)
        .json({ error: "Gemini API not implemented in server" });
    } else {
      return res.status(400).json({ error: "Invalid provider" });
    }
  } catch (error) {
    console.error("Summarization error:", error);
    return res.status(500).json({ error: "Summarization failed" });
  }
}
