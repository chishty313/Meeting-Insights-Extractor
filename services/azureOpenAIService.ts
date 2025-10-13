import type { SummaryResult } from "../types";
import { getAzureConfig } from "../lib/env-utils";

// Get Azure configuration using the environment utility
const { apiKey: AZURE_API_KEY, endpoint: AZURE_ENDPOINT } = getAzureConfig();

// Helper to get the base URL (origin) from a potentially full endpoint URL.
// This allows the user to provide either "https://name.openai.azure.com" or a full
// deployment URL, and the service will still work.
const getBaseUrl = (endpoint: string | undefined): string | undefined => {
  if (!endpoint) return undefined;
  try {
    const url = new URL(endpoint);
    return url.origin; // e.g., "https://niftyai.openai.azure.com"
  } catch (e) {
    console.warn(
      "Could not parse AZURE_OPENAI_ENDPOINT as a full URL. Assuming it is the base endpoint.",
      e
    );
    // Fallback for cases where it's not a full URL (less likely)
    return endpoint.replace(/\/$/, "");
  }
};

// Helper to extract deployment name from endpoint URL
const getDeploymentName = (
  endpoint: string | undefined
): string | undefined => {
  if (!endpoint) return undefined;
  try {
    const url = new URL(endpoint);
    const pathParts = url.pathname.split("/");
    const deploymentIndex = pathParts.indexOf("deployments");
    if (deploymentIndex !== -1 && deploymentIndex + 1 < pathParts.length) {
      return pathParts[deploymentIndex + 1];
    }
  } catch (e) {
    console.warn("Could not extract deployment name from endpoint URL", e);
  }
  return undefined;
};

const AZURE_BASE_URL = getBaseUrl(AZURE_ENDPOINT);
const AZURE_DEPLOYMENT_NAME = getDeploymentName(AZURE_ENDPOINT);

if (!AZURE_API_KEY || !AZURE_BASE_URL) {
  console.warn(
    "Azure OpenAI environment variables (VITE_AZURE_OPENAI_API_KEY, VITE_AZURE_OPENAI_ENDPOINT) are not set or invalid. Azure features will not work."
  );
}

// Function to transcribe audio using Azure Whisper with timestamps
export const transcribeWithAzureWhisper = async (
  audioFile: File
): Promise<string> => {
  if (!AZURE_API_KEY || !AZURE_BASE_URL) {
    throw new Error("Azure OpenAI API key or endpoint is not configured.");
  }

  const whisperEndpoint = `${AZURE_BASE_URL}/openai/deployments/whisper/audio/translations?api-version=2024-06-01`;
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
    throw new Error(
      `Azure Whisper API request failed: ${response.statusText} - ${errorText}`
    );
  }

  const data = await response.json();
  console.log("Azure Whisper response:", data);

  return data.text || "";
};

// Function to label speakers in a transcript using Azure OpenAI chat model
export const labelSpeakersWithAzureOpenAI = async (
  transcript: string,
  deployment?: string
): Promise<string> => {
  if (!AZURE_API_KEY || !AZURE_BASE_URL) {
    throw new Error("Azure OpenAI API key or endpoint is not configured.");
  }

  const deploymentName = AZURE_DEPLOYMENT_NAME || deployment || "gpt-5";
  const chatEndpoint = `${AZURE_BASE_URL}/openai/deployments/${deploymentName}/chat/completions?api-version=2025-01-01-preview`;

  const messages = [
    {
      role: "system",
      content:
        "You are given a raw meeting transcript without speaker labels. Rewrite it by grouping contiguous lines into sentences and prepend a generic speaker label in the form 'Speaker 1:', 'Speaker 2:', etc. If the same person continues speaking, keep the same speaker number. Do not invent names; only use 'Speaker N:'. Output only the labeled transcript.",
    },
    {
      role: "user",
      content: transcript,
    },
  ];

  const body = {
    messages,
  } as const;

  const response = await fetch(chatEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": AZURE_API_KEY,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Azure Chat API request failed: ${response.statusText} - ${errorText}`
    );
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    // Some SDKs return content as an array of parts
    return content
      .map((p: any) => (typeof p === "string" ? p : p?.text || ""))
      .join("");
  }
  throw new Error(
    "Invalid response content from Azure when labeling speakers."
  );
};

// Function to summarize and extract tasks using an Azure OpenAI chat model
export const summarizeWithAzureOpenAI = async (
  transcript: string,
  deployment: string,
  systemInstruction?: string
): Promise<SummaryResult> => {
  if (!AZURE_API_KEY || !AZURE_BASE_URL) {
    throw new Error("Azure OpenAI API key or endpoint is not configured.");
  }

  // Use the deployment name from the endpoint if available, otherwise use the provided deployment parameter
  const deploymentName = AZURE_DEPLOYMENT_NAME || deployment;
  const chatEndpoint = `${AZURE_BASE_URL}/openai/deployments/${deploymentName}/chat/completions?api-version=2025-01-01-preview`;

  const insightsTool = {
    type: "function",
    function: {
      name: "extract_meeting_insights",
      description:
        "Extracts structured meeting insights including Overview and To-Do List organized by person.",
      parameters: {
        type: "object",
        properties: {
          overview: {
            type: "string",
            description:
              "A 2-3 sentence executive summary capturing focus and primary outcomes.",
          },
          toDoList: {
            type: "array",
            description:
              "Combined key takeaways and action items, organized by person. Each item should be formatted as 'Person Name: Task/Decision description' and sorted by person alphabetically.",
            items: {
              type: "object",
              properties: {
                person: {
                  type: "string",
                  description:
                    "Name of the person responsible (or 'To be Assigned' if unclear)",
                },
                task: {
                  type: "string",
                  description: "The task or decision description",
                },
                type: {
                  type: "string",
                  enum: ["takeaway", "action"],
                  description:
                    "Whether this is a key takeaway or actionable step",
                },
              },
              required: ["person", "task", "type"],
            },
          },
        },
        required: ["overview", "toDoList"],
      },
    },
  };

  const messages = [
    {
      role: "system",
      content: systemInstruction || "You are a helpful meeting assistant.",
    },
    {
      role: "user",
      content: `Analyze the following meeting transcript. Provide a concise summary and extract all action items.\n\nTranscript:\n---\n${transcript}\n---`,
    },
  ];

  const body = {
    messages,
    tools: [insightsTool],
    tool_choice: {
      type: "function",
      function: { name: "extract_meeting_insights" },
    },
  };

  try {
    const response = await fetch(chatEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": AZURE_API_KEY,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Azure Chat API request failed: ${response.statusText} - ${errorText}`
      );
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (toolCall && toolCall.function?.name === "extract_meeting_insights") {
      const parsedArgs = JSON.parse(toolCall.function.arguments);
      const result: SummaryResult = {
        overview:
          typeof parsedArgs.overview === "string"
            ? parsedArgs.overview
            : undefined,
        toDoList: Array.isArray(parsedArgs.toDoList)
          ? parsedArgs.toDoList
          : undefined,
      };
      return result;
    }

    throw new Error("Invalid or missing tool call in Azure API response.");
  } catch (error) {
    console.error("Error calling Azure OpenAI API:", error);
    throw new Error(
      "Failed to get insights from the Azure AI model. Please check the console for more details."
    );
  }
};
