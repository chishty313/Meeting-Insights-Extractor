import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

export async function chunkTranscript(transcript: string): Promise<string[]> {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 100,
  });
  return await splitter.splitText(transcript);
}

