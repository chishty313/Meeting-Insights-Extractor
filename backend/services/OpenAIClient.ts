import dotenv from "dotenv";
import path from "node:path";
import { LocalEmbeddingsService } from "./LocalEmbeddingsService";

dotenv.config({ path: path.resolve(process.cwd(), "backend/.env") });

const AZURE_API_KEY = process.env.AZURE_OPENAI_API_KEY;
// Support separate endpoints per resource (chat vs embeddings)
const AZURE_CHAT_ENDPOINT =
  process.env.AZURE_OPENAI_CHAT_ENDPOINT || process.env.AZURE_OPENAI_ENDPOINT; // e.g., https://<resource>.openai.azure.com
const AZURE_CHAT_DEPLOYMENT =
  process.env.AZURE_OPENAI_CHAT_DEPLOYMENT || "gpt-5"; // your GPT-5 deployment name
const AZURE_EMBEDDINGS_ENDPOINT =
  process.env.AZURE_OPENAI_EMBEDDINGS_ENDPOINT ||
  process.env.AZURE_OPENAI_ENDPOINT; // allow different resource for embeddings
const AZURE_EMBEDDINGS_DEPLOYMENT =
  process.env.AZURE_OPENAI_EMBEDDINGS_DEPLOYMENT; // e.g., text-embedding-3-large
const AZURE_API_VERSION =
  process.env.AZURE_OPENAI_API_VERSION || "2025-01-01-preview";

if (!AZURE_API_KEY || !AZURE_CHAT_ENDPOINT) {
  console.warn(
    "Azure OpenAI chat credentials not set (AZURE_OPENAI_API_KEY, AZURE_OPENAI_CHAT_ENDPOINT/AZURE_OPENAI_ENDPOINT). Chat features may not work."
  );
}

export interface ExtractedMetadata {
  projectName: string;
  department: string;
  searchString: string;
}

export class OpenAIClientService {
  constructor() {}

  async getEmbeddings(texts: string[]): Promise<number[][]> {
    // Prefer Azure embeddings when fully configured
    if (
      AZURE_API_KEY &&
      AZURE_EMBEDDINGS_ENDPOINT &&
      AZURE_EMBEDDINGS_DEPLOYMENT
    ) {
      try {
        console.log("[Embeddings] Using Azure embeddings", {
          endpoint: AZURE_EMBEDDINGS_ENDPOINT,
          deployment: AZURE_EMBEDDINGS_DEPLOYMENT,
          count: texts.length,
        });
        const endpoint = `${AZURE_EMBEDDINGS_ENDPOINT}/openai/deployments/${AZURE_EMBEDDINGS_DEPLOYMENT}/embeddings?api-version=${AZURE_API_VERSION}`;

        const result: number[][] = [];
        for (const text of texts) {
          console.log("[Embeddings] Requesting Azure embedding", {
            textLen: text?.length || 0,
          });
          const resp = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "api-key": AZURE_API_KEY,
            },
            body: JSON.stringify({ input: text }),
          });
          if (!resp.ok) {
            const err = await resp.text();
            console.error("[Embeddings] Azure error", {
              status: resp.status,
              body: err,
            });
            throw new Error(`Azure embeddings failed: ${resp.status} ${err}`);
          }
          const json = (await resp.json()) as any;
          const emb = json.data?.[0]?.embedding;
          if (!Array.isArray(emb))
            throw new Error("Invalid embeddings response");
          result.push(emb as number[]);
          console.log("[Embeddings] Azure vector generated", {
            dim: (emb as number[]).length,
          });
        }
        return result;
      } catch (azureError) {
        console.warn(
          "[Embeddings] Azure embeddings failed, falling back to local embeddings",
          azureError
        );
        // Intentional fallthrough to local embeddings
      }
    }

    // Fallback: local embeddings via transformers.js
    console.log("[Embeddings] Falling back to local transformers embeddings");
    return await LocalEmbeddingsService.embed(texts);
  }

  async extractMetadata(transcript: string): Promise<ExtractedMetadata> {
    if (!AZURE_API_KEY || !AZURE_CHAT_ENDPOINT) {
      return {
        projectName: "General Discussion",
        department: "General",
        searchString: transcript.slice(0, 200),
      };
    }

    try {
      const chatEndpoint = `${AZURE_CHAT_ENDPOINT}/openai/deployments/${AZURE_CHAT_DEPLOYMENT}/chat/completions?api-version=${AZURE_API_VERSION}`;
      const body = {
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "Extract metadata from the meeting transcript. Return JSON with: projectName, department, searchString. Rules: Always provide non-empty values. Defaults: projectName='General Discussion', department='General', searchString should summarize ambiguous terms requiring context.",
          },
          { role: "user", content: transcript },
        ],
      } as const;

      const resp = await fetch(chatEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": AZURE_API_KEY,
        },
        body: JSON.stringify(body),
      });
      if (!resp.ok) {
        const err = await resp.text();
        throw new Error(`Azure chat failed: ${resp.status} ${err}`);
      }
      const json = (await resp.json()) as any;
      const content = json.choices?.[0]?.message?.content || "{}";
      const parsed = JSON.parse(content);
      return {
        projectName: parsed.projectName || "General Discussion",
        department: parsed.department || "General",
        searchString: parsed.searchString || transcript.slice(0, 200),
      };
    } catch (error) {
      console.error("Metadata extraction failed, using defaults:", error);
      return {
        projectName: "General Discussion",
        department: "General",
        searchString: transcript.slice(0, 200),
      };
    }
  }
}
