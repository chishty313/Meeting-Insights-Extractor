// Lightweight local embeddings generator using @xenova/transformers
// This provides a fallback when Azure embeddings deployment is not available.

export class LocalEmbeddingsService {
  private static pipelinePromise: Promise<any> | null = null;

  private static async getPipeline() {
    if (!LocalEmbeddingsService.pipelinePromise) {
      LocalEmbeddingsService.pipelinePromise = (async () => {
        try {
          // Dynamic import to make this dependency optional at runtime
          const { pipeline } = await import("@xenova/transformers");
          // Use a small, CPU-friendly model by default
          return await pipeline(
            "feature-extraction",
            "Xenova/all-MiniLM-L6-v2"
          );
        } catch (err) {
          throw new Error(
            "@xenova/transformers is not installed. Run: npm i @xenova/transformers"
          );
        }
      })();
    }
    return LocalEmbeddingsService.pipelinePromise;
  }

  static async embed(texts: string[]): Promise<number[][]> {
    console.log("[LocalEmbeddings] Starting local embedding generation", {
      numTexts: texts.length,
    });
    const extractor = await LocalEmbeddingsService.getPipeline();
    const results: number[][] = [];
    for (const text of texts) {
      const len = text?.length || 0;
      console.log("[LocalEmbeddings] Embedding text", { length: len });
      const output = await extractor(text, {
        pooling: "mean",
        normalize: true,
      });
      // output.data is a Float32Array
      const arr = Array.from(output.data as Float32Array);
      results.push(arr);
      console.log("[LocalEmbeddings] Vector generated", {
        dim: arr.length,
      });
    }
    console.log("[LocalEmbeddings] Completed", { vectors: results.length });
    return results;
  }
}
