import { GoogleGenAI, Type } from "@google/genai";
import type { SummaryResult } from "../types";

const API_KEY = process.env.GEMINI_API_KEY;
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    overview: {
      type: Type.STRING,
      description:
        "A 2-3 sentence executive summary capturing focus and primary outcomes.",
    },
    toDoList: {
      type: Type.ARRAY,
      description:
        "Combined key takeaways and action items, organized by person. Each item should be formatted as 'Person Name: Task/Decision description' and sorted by person alphabetically.",
      items: {
        type: Type.OBJECT,
        properties: {
          person: {
            type: Type.STRING,
            description:
              "Name of the person responsible (or 'To be Assigned' if unclear)",
          },
          task: {
            type: Type.STRING,
            description: "The task or decision description",
          },
          type: {
            type: Type.STRING,
            description: "Whether this is a key takeaway or actionable step",
            enum: ["takeaway", "action"],
          },
        },
        required: ["person", "task", "type"],
      },
    },
  },
  required: ["overview", "toDoList"],
};

export const summarizeAndExtractTasks = async (
  transcript: string,
  model: string,
  systemInstruction?: string
): Promise<SummaryResult> => {
  if (!ai) {
    throw new Error(
      "Gemini API key is not configured. Please set the GEMINI_API_KEY environment variable."
    );
  }

  const prompt = `Please analyze the following meeting transcript and provide EXACTLY the following JSON fields matching the response schema: overview, toDoList. The toDoList should combine both key takeaways and action items, organized by person alphabetically. Do not include any extra fields or commentary.\n\nTranscript:\n---\n${transcript}\n---`;

  try {
    const config: {
      responseMimeType: "application/json";
      responseSchema: typeof responseSchema;
      temperature: number;
      systemInstruction?: string;
    } = {
      responseMimeType: "application/json",
      responseSchema: responseSchema,
      temperature: 0.2,
    };

    if (systemInstruction && systemInstruction.trim() !== "") {
      config.systemInstruction = systemInstruction;
    }

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: config,
    });

    const jsonText = response.text.trim();
    const parsedJson = JSON.parse(jsonText);

    if (
      parsedJson &&
      typeof parsedJson.overview === "string" &&
      Array.isArray(parsedJson.toDoList)
    ) {
      return parsedJson as SummaryResult;
    } else {
      throw new Error("Invalid JSON structure received from API.");
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error(
      "Failed to get insights from the AI model. Please check the console for more details."
    );
  }
};

// Label speakers using Gemini
export const labelSpeakersWithGemini = async (
  transcript: string,
  model: string
): Promise<string> => {
  if (!ai) {
    throw new Error(
      "Gemini API key is not configured. Please set the GEMINI_API_KEY environment variable."
    );
  }

  const prompt = `Rewrite the following raw meeting transcript by assigning generic speaker labels in the form 'Speaker 1:', 'Speaker 2:', etc. Preserve order, group contiguous speech by the same speaker, and do not invent names. Output only the labeled transcript.\n\n${transcript}`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        temperature: 0.2,
      },
    });

    return response.text.trim();
  } catch (error) {
    console.error("Error labeling speakers with Gemini:", error);
    throw new Error("Failed to label speakers with Gemini.");
  }
};

// Function to add timestamps using Gemini
export const addTimestampsWithGemini = async (
  transcript: string,
  model: string,
  prompt: string
): Promise<string> => {
  if (!ai) {
    throw new Error(
      "Gemini API key is not configured. Please set the GEMINI_API_KEY environment variable."
    );
  }

  try {
    const fullPrompt = `${prompt}\n\n${transcript}`;

    const result = await ai.models.generateContent({
      model: model,
      contents: fullPrompt,
      config: {
        temperature: 0.2,
      },
    });

    return result.text.trim() || transcript;
  } catch (error) {
    console.error("Error adding timestamps with Gemini:", error);
    throw error;
  }
};
