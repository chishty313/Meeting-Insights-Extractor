import dotenv from "dotenv";
import path from "node:path";
import express from "express";
import cors from "cors";
import net from "node:net";

import { OpenAIClientService } from "./services/OpenAIClient";
// import { ChromaService } from "./services/ChromaService";
import { PineconeService } from "./services/PineconeService";
import { chunkTranscript } from "./utils/textSplitter";

dotenv.config({ path: path.resolve(process.cwd(), "backend/.env") });

const app = express();
const REQUESTED_PORT = Number(process.env.PORT || 3001);
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
// Support multiple allowed origins (comma-separated)
const ALLOWED_ORIGINS = FRONTEND_ORIGIN.split(",").map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "5mb" }));
app.use(express.text({ type: "text/plain", limit: "5mb" }));

const openai = new OpenAIClientService();
const pinecone = new PineconeService(openai);

app.post("/api/analyze", async (req, res) => {
  try {
    const transcript: string = req.body?.transcript || req.body;
    if (!transcript || typeof transcript !== "string") {
      return res.status(400).json({ error: "Missing transcript" });
    }

    // Stage 1: Metadata extraction
    const metadata = await openai.extractMetadata(transcript);

    // Stage 2: Retrieve context
    const retrievedContext = await pinecone.retrieveContext(
      metadata.projectName,
      metadata.department,
      metadata.searchString,
      5
    );

    // Stage 3: Prompt augmentation
    const augmentedPrompt = `SYSTEM PROMPT: You are an expert meeting analyst. Use the provided Context Snippets to disambiguate vague terms.\n\n--- START OF HISTORICAL CONTEXT (Project: ${metadata.projectName}) ---\n${retrievedContext}\n--- END OF HISTORICAL CONTEXT ---\n\n--- CURRENT MEETING TRANSCRIPT ---\n${transcript}\n\n---\nINSTRUCTIONS: Generate a detailed Summary, a specific To-Do List, and clear Action Items using Markdown.`;

    // Stage 4: Final generation using existing Azure summarizer in frontend contract
    // We keep server minimal for now: return augmented prompt parts to front if needed.
    // Alternatively, call Azure here if you prefer full server-side generation later.

    // Stage 5: Feedback loop - index current meeting
    const chunks = await chunkTranscript(transcript);
    await pinecone.indexData(
      chunks,
      metadata.projectName,
      metadata.department,
      new Date().toISOString()
    );

    return res.status(200).json({
      metadata,
      context: retrievedContext,
      augmentedPrompt,
    });
  } catch (error: any) {
    console.error("/api/analyze error:", error);
    return res
      .status(500)
      .json({ error: "Failed to generate contextual insights." });
  }
});

// New: embed and upsert documents into Pinecone (Stage 2 and 4)
app.post("/api/embed-upsert", async (req, res) => {
  try {
    const { documents, projectName, department, dateISO } = req.body || {};
    if (!Array.isArray(documents) || documents.length === 0) {
      return res.status(400).json({ error: "Missing documents array" });
    }
    const pn = projectName || "General Discussion";
    const dept = department || "General";
    const date = dateISO || new Date().toISOString();

    await pinecone.indexData(documents, pn, dept, date);
    return res.status(200).json({ ok: true, count: documents.length });
  } catch (err: any) {
    console.error("/api/embed-upsert error:", err);
    return res.status(500).json({ error: "Failed to embed/upsert documents" });
  }
});

// New: retrieve topK context for a query (Stage 3)
app.post("/api/retrieve", async (req, res) => {
  try {
    const { projectName, department, searchQuery, k } = req.body || {};
    console.log("[Backend] Context retrieval request:", {
      projectName,
      department,
      searchQuery: searchQuery?.substring(0, 100) + "...",
      k,
    });

    if (!searchQuery || !projectName || !department) {
      return res
        .status(400)
        .json({ error: "Missing projectName, department, or searchQuery" });
    }
    const topK = Number(k || 5);
    const context = await pinecone.retrieveContext(
      projectName,
      department,
      searchQuery,
      topK
    );

    console.log("[Backend] Context retrieval response:", {
      contextLength: context?.length || 0,
      hasContext: !!context && context.length > 0,
    });

    return res.status(200).json({ context });
  } catch (err: any) {
    console.error("/api/retrieve error:", err);
    return res.status(500).json({ error: "Failed to retrieve context" });
  }
});

app.get("/health", (_req, res) => res.json({ ok: true }));

function findAvailablePort(startPort: number): Promise<number> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => {
      // Try next port
      server.close(() => resolve(findAvailablePort(startPort + 1)) as any);
    });
    server.once("listening", () => {
      const { port } = server.address() as net.AddressInfo;
      server.close(() => resolve(port));
    });
    server.listen(startPort, "0.0.0.0");
  });
}

findAvailablePort(REQUESTED_PORT).then((actualPort) => {
  app.listen(actualPort, () => {
    const portNote =
      actualPort === REQUESTED_PORT ? "" : ` (requested ${REQUESTED_PORT})`;
    console.log(`Backend server running on port ${actualPort}${portNote}`);
  });
});
