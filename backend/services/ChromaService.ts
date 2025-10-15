import dotenv from "dotenv";
import path from "node:path";
import { OpenAIClientService } from "./OpenAIClient";
import { ChromaClient, Collection } from "chromadb";

dotenv.config({ path: path.resolve(process.cwd(), "backend/.env") });

const CHROMA_HOST = process.env.CHROMA_HOST || "localhost";
const CHROMA_PORT = Number(process.env.CHROMA_PORT || 8000);

export class ChromaService {
  private client: ChromaClient;
  private collection?: Collection;
  private openai: OpenAIClientService;
  private readonly collectionName = "meeting_context_knowledge";

  constructor(openai: OpenAIClientService) {
    this.openai = openai;
    this.client = new ChromaClient({
      path: `http://${CHROMA_HOST}:${CHROMA_PORT}`,
    });
  }

  async init(): Promise<void> {
    this.collection = await this.client.getOrCreateCollection({
      name: this.collectionName,
      metadata: { description: "Meeting context knowledge base" },
    });
  }

  async indexData(
    chunks: string[],
    projectName: string,
    department: string,
    dateISO: string
  ): Promise<void> {
    if (!this.collection) await this.init();
    if (!this.collection) throw new Error("Chroma collection not initialized");

    const embeddings = await this.openai.getEmbeddings(chunks);

    const ids = chunks.map((_, idx) => `${projectName}-${dateISO}-${idx}`);
    const metadatas = chunks.map((_, idx) => ({
      projectName,
      department,
      date: dateISO,
      chunkIndex: idx,
    }));

    await this.collection.add({
      ids,
      documents: chunks,
      embeddings,
      metadatas,
    });
  }

  async retrieveContext(
    projectName: string,
    department: string,
    searchQuery: string,
    K: number = 5
  ): Promise<string> {
    if (!this.collection) await this.init();
    if (!this.collection) throw new Error("Chroma collection not initialized");

    // Get embedding for the search query
    const [queryEmbedding] = await this.openai.getEmbeddings([searchQuery]);

    const results = await this.collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: K,
      where: { projectName, department },
    });

    const docs = (results.documents?.[0] || []) as string[];
    const formatted = docs
      .map((d, i) => `Context #${i + 1}: ${d}`)
      .join("\n\n");

    return formatted;
  }
}
