import dotenv from "dotenv";
import path from "node:path";
import { Pinecone } from "@pinecone-database/pinecone";
import { OpenAIClientService } from "./OpenAIClient";

dotenv.config({ path: path.resolve(process.cwd(), "backend/.env") });

const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_INDEX = process.env.PINECONE_INDEX || "meeting-context-index";
// For serverless indexes, Pinecone v4 client requires the index host URL
// Example: https://<index-host>.svc.<region>-<project>.pinecone.io
const PINECONE_INDEX_HOST = process.env.PINECONE_INDEX_HOST;
// Optional: expected index vector dimension (useful when falling back to local embeddings)
const RAW_INDEX_DIM = Number(process.env.PINECONE_INDEX_DIM || 0) || undefined;
// Default to 1024 if not explicitly set (per user-provided index config)
const EFFECTIVE_INDEX_DIM = RAW_INDEX_DIM || 1024;

if (!PINECONE_API_KEY) {
  console.warn("PINECONE_API_KEY not set. Vector operations will fail.");
}

export class PineconeService {
  private pinecone: Pinecone;
  private indexName: string;
  private indexHost?: string;
  private openai: OpenAIClientService;

  constructor(openai: OpenAIClientService) {
    this.openai = openai;
    this.indexName = PINECONE_INDEX;
    this.indexHost = PINECONE_INDEX_HOST;
    this.pinecone = new Pinecone({ apiKey: PINECONE_API_KEY || "" });
  }

  async indexData(
    chunks: string[],
    projectName: string,
    department: string,
    dateISO: string
  ): Promise<void> {
    console.log("[Pinecone] Preparing upsert", {
      index: this.indexName,
      host: this.indexHost,
      namespace: projectName,
      chunks: chunks.length,
      targetDim: EFFECTIVE_INDEX_DIM,
    });
    const index = this.indexHost
      ? this.pinecone.index(this.indexName, this.indexHost)
      : this.pinecone.index(this.indexName);
    const embeddings = await this.openai.getEmbeddings(chunks);
    console.log("[Pinecone] Got embeddings", {
      count: embeddings.length,
      dim: embeddings[0]?.length,
    });

    // Adapt vectors by padding/truncating to effective dimension
    const targetDim = EFFECTIVE_INDEX_DIM;
    if (!targetDim) {
      console.warn(
        "[Pinecone] No target dimension configured; proceeding without adaptation"
      );
    }
    let adaptedEmbeddings = embeddings;
    if (targetDim && embeddings[0] && embeddings[0].length !== targetDim) {
      console.warn("[Pinecone] Adapting embedding dimensions", {
        from: embeddings[0].length,
        to: targetDim,
      });
      adaptedEmbeddings = embeddings.map((vec) => {
        if (vec.length === targetDim) return vec;
        if (vec.length > targetDim) return vec.slice(0, targetDim);
        const padded = new Array(targetDim).fill(0);
        for (let i = 0; i < vec.length; i++) padded[i] = vec[i];
        return padded;
      });
    }

    const vectors = adaptedEmbeddings.map((values, i) => ({
      id: `${projectName}-${dateISO}-${i}`,
      values,
      metadata: {
        projectName,
        department,
        date: dateISO,
        chunkIndex: i,
        text: chunks[i],
      } as Record<string, any>,
    }));

    // Use namespace per project for isolation
    try {
      console.log("[Pinecone] Upserting vectors", { count: vectors.length });
      await index.namespace(projectName).upsert(vectors);
      console.log("[Pinecone] Upsert complete");
    } catch (err) {
      console.error("Pinecone upsert failed:", err);
      throw err;
    }
  }

  async retrieveContext(
    projectName: string,
    department: string,
    searchQuery: string,
    K: number = 5
  ): Promise<string> {
    const index = this.indexHost
      ? this.pinecone.index(this.indexName, this.indexHost)
      : this.pinecone.index(this.indexName);

    console.log("[Pinecone] Starting comprehensive context retrieval", {
      index: this.indexName,
      host: this.indexHost,
      projectName,
      department,
      searchQuery: searchQuery.substring(0, 100) + "...",
      topK: K,
      targetDim: EFFECTIVE_INDEX_DIM,
    });

    const [queryEmbedding] = await this.openai.getEmbeddings([searchQuery]);

    // Adapt query vector as well
    const targetDim = EFFECTIVE_INDEX_DIM;
    let queryVector = queryEmbedding;
    if (targetDim && queryVector && queryVector.length !== targetDim) {
      console.warn("[Pinecone] Adapting query embedding dimension", {
        from: queryVector.length,
        to: targetDim,
      });
      if (queryVector.length > targetDim) {
        queryVector = queryVector.slice(0, targetDim);
      } else {
        const padded = new Array(targetDim).fill(0);
        for (let i = 0; i < queryVector.length; i++) padded[i] = queryVector[i];
        queryVector = padded;
      }
    }

    console.log("[Pinecone] Query embedding dim", {
      dim: queryVector?.length,
    });

    // Strategy 1: Search within specific project namespace with department filter
    console.log(
      "[Pinecone] Strategy 1: Searching within project namespace with department filter"
    );
    let results = await index.namespace(projectName).query({
      vector: queryVector,
      topK: K,
      includeMetadata: true,
      filter: { department },
    });

    console.log("[Pinecone] Strategy 1 results:", {
      matches: results.matches?.length || 0,
    });

    // Strategy 2: If no results, search within project namespace without department filter
    if (!results.matches || results.matches.length === 0) {
      console.log(
        "[Pinecone] Strategy 2: Searching within project namespace without department filter"
      );
      results = await index.namespace(projectName).query({
        vector: queryVector,
        topK: K,
        includeMetadata: true,
      });
      console.log("[Pinecone] Strategy 2 results:", {
        matches: results.matches?.length || 0,
      });
    }

    // Strategy 3: If still no results, search across all namespaces with department filter
    if (!results.matches || results.matches.length === 0) {
      console.log(
        "[Pinecone] Strategy 3: Searching across all namespaces with department filter"
      );
      results = await index.query({
        vector: queryVector,
        topK: K,
        includeMetadata: true,
        filter: { department },
      });
      console.log("[Pinecone] Strategy 3 results:", {
        matches: results.matches?.length || 0,
      });
    }

    // Strategy 4: If still no results, search across all namespaces without any filter
    if (!results.matches || results.matches.length === 0) {
      console.log(
        "[Pinecone] Strategy 4: Searching across all namespaces without filters"
      );
      results = await index.query({
        vector: queryVector,
        topK: K,
        includeMetadata: true,
      });
      console.log("[Pinecone] Strategy 4 results:", {
        matches: results.matches?.length || 0,
      });
    }

    // Log detailed information about retrieved matches
    if (results.matches && results.matches.length > 0) {
      console.log("[Pinecone] Retrieved matches details:");
      results.matches.forEach((match, index) => {
        const metadata = match.metadata as any;
        console.log(`  Match ${index + 1}:`, {
          score: match.score,
          projectName: metadata?.projectName,
          department: metadata?.department,
          date: metadata?.date,
          chunkIndex: metadata?.chunkIndex,
          textLength: metadata?.text?.length || 0,
          textPreview: metadata?.text?.substring(0, 100) + "...",
        });
      });
    } else {
      console.log(
        "[Pinecone] No matches found after all search strategies - this might be the first meeting in the entire system"
      );
    }

    const formatted = (results.matches || [])
      .map((m, i) => {
        const text = (m.metadata as any)?.text || "";
        return `Context #${i + 1}: ${text}`;
      })
      .filter(Boolean)
      .join("\n\n");

    console.log(
      "[Pinecone] Final formatted context length:",
      formatted.length,
      "characters"
    );
    return formatted;
  }
}
