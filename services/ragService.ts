// 4-Stage RAG Service for Meeting Insights
// This service orchestrates the complete RAG pipeline with console logging

import {
  extractMetadataWithAzureOpenAI,
  summarizeWithAzureOpenAI,
} from "./azureOpenAIService";
import { chunkTranscript } from "../backend/utils/textSplitter";

// Backend API base URL
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

// Stage 1: Extract structured metadata from transcript
export const stage1ExtractMetadata = async (
  transcript: string,
  deployment: string
): Promise<{
  projectName: string;
  department: string;
  searchString: string;
}> => {
  console.log("🔍 Stage 1: Extracting metadata from transcript...");
  console.log("📝 Transcript length:", transcript.length);

  const metadata = await extractMetadataWithAzureOpenAI(transcript, deployment);

  console.log("✅ Stage 1 Complete - Structured metadata:", metadata);
  return metadata;
};

// Stage 2: Embed and store transcript chunks in Pinecone
export const stage2EmbedAndStore = async (
  transcript: string,
  metadata: { projectName: string; department: string; searchString: string }
): Promise<void> => {
  console.log("🔍 Stage 2: Embedding and storing transcript chunks...");

  // Chunk the transcript
  const chunks = await chunkTranscript(transcript);
  console.log("📝 Chunked transcript into", chunks.length, "pieces");
  console.log("📄 Sample chunks:", chunks.slice(0, 2));

  // Send to backend for embedding and storage
  const response = await fetch(`${BACKEND_URL}/api/embed-upsert`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      documents: chunks,
      projectName: metadata.projectName,
      department: metadata.department,
      dateISO: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Stage 2 failed: ${response.status} ${error}`);
  }

  const result = await response.json();
  console.log(
    "✅ Stage 2 Complete - Stored",
    result.count,
    "chunks in Pinecone"
  );
};

// Stage 3: Retrieve context and generate insights
export const stage3RetrieveAndGenerate = async (
  transcript: string,
  metadata: { projectName: string; department: string; searchString: string },
  systemPrompt: string,
  deployment: string
): Promise<{
  overview: string;
  toDoList: Array<{ person: string; task: string; type: string }>;
}> => {
  console.log("🔍 Stage 3: Retrieving context and generating insights...");

  // Retrieve relevant context from Pinecone
  const retrieveResponse = await fetch(`${BACKEND_URL}/api/retrieve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      projectName: metadata.projectName,
      department: metadata.department,
      searchQuery: metadata.searchString,
      k: 5,
    }),
  });

  if (!retrieveResponse.ok) {
    const error = await retrieveResponse.text();
    throw new Error(
      `Context retrieval failed: ${retrieveResponse.status} ${error}`
    );
  }

  const { context } = await retrieveResponse.json();
  console.log("📚 Retrieved context from Pinecone:");
  console.log("🔍 Search Query:", metadata.searchString);
  console.log("📊 Project:", metadata.projectName);
  console.log("🏢 Department:", metadata.department);
  console.log("📝 Context Length:", context?.length || 0, "characters");
  console.log("📄 Context Content:");
  console.log("-".repeat(60));
  console.log(context || "No context retrieved");
  console.log("-".repeat(60));

  // Construct composite prompt
  const compositePrompt = `${systemPrompt}

--- HISTORICAL CONTEXT (Project: ${metadata.projectName}) ---
${context}
--- END OF HISTORICAL CONTEXT ---

--- CURRENT MEETING TRANSCRIPT ---
${transcript}
---

INSTRUCTIONS: Generate a detailed Summary, a specific To-Do List, and clear Action Items using Markdown. Use the historical context to resolve any ambiguities in the current transcript.`;

  console.log("📝 Stage 3 - Composite prompt being sent to GPT-5:");
  console.log("=".repeat(80));
  console.log(compositePrompt);
  console.log("=".repeat(80));

  // Generate insights using GPT-5
  const result = await summarizeWithAzureOpenAI(
    transcript,
    deployment,
    compositePrompt
  );

  console.log("✅ Stage 3 Complete - Generated insights:", result);

  // Ensure required fields are present
  return {
    overview: result.overview || result.summary || "No overview generated",
    toDoList: result.toDoList || [],
  };
};

// Stage 4: Store generated insights for future reference
export const stage4StoreInsights = async (
  insights: {
    overview: string;
    toDoList: Array<{ person: string; task: string; type: string }>;
  },
  metadata: { projectName: string; department: string; searchString: string }
): Promise<void> => {
  console.log("🔍 Stage 4: Storing generated insights for future reference...");

  // Prepare insights for storage
  const insightTexts = [
    `Overview: ${insights.overview}`,
    ...insights.toDoList.map(
      (item) => `${item.person}: ${item.task} (${item.type})`
    ),
  ];

  console.log("📝 Generated insights to store:", insightTexts);

  // Send to backend for embedding and storage
  const response = await fetch(`${BACKEND_URL}/api/embed-upsert`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      documents: insightTexts,
      projectName: metadata.projectName,
      department: metadata.department,
      dateISO: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Stage 4 failed: ${response.status} ${error}`);
  }

  const result = await response.json();
  console.log(
    "✅ Stage 4 Complete - Stored",
    result.count,
    "insight chunks in Pinecone"
  );
};

// Complete 4-Stage RAG Pipeline
export const runCompleteRAGPipeline = async (
  transcript: string,
  systemPrompt: string,
  deployment: string
): Promise<{
  overview: string;
  toDoList: Array<{ person: string; task: string; type: string }>;
}> => {
  console.log("🚀 Starting Complete 4-Stage RAG Pipeline");
  console.log("=".repeat(80));

  try {
    // Stage 1: Extract metadata
    const metadata = await stage1ExtractMetadata(transcript, deployment);

    // Stage 2: Store transcript chunks
    await stage2EmbedAndStore(transcript, metadata);

    // Stage 3: Retrieve context and generate insights
    const insights = await stage3RetrieveAndGenerate(
      transcript,
      metadata,
      systemPrompt,
      deployment
    );

    // Stage 4: Store generated insights
    await stage4StoreInsights(insights, metadata);

    console.log("🎉 Complete RAG Pipeline Finished Successfully!");
    console.log("=".repeat(80));

    return insights;
  } catch (error) {
    console.error("❌ RAG Pipeline Failed:", error);
    throw error;
  }
};
