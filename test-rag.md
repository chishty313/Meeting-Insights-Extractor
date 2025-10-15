
-----

# 🛠️ Phase 1: Infrastructure and Core Services Setup

This phase establishes the foundational environment, installs necessary packages, and defines the core service classes responsible for managing external dependencies (Chroma DB and OpenAI).

## 1\. Environment & Infrastructure Setup

This section outlines the non-code steps to get the environment ready.

### 1.1. Vector Database Deployment (Chroma DB)

Chroma DB will run persistently as a separate service using Docker.

| Step | Action | Command/Detail |
| :--- | :--- | :--- |
| **1.** | **Create `docker-compose.yml`** | Defines the Chroma image and volume for persistence. |
| **2.** | **Start Chroma Server** | `docker-compose up -d chromadb` (Accessible at `http://localhost:8000`) |
| **3.** | **Configure `.env`** | `CHROMA_HOST=localhost`, `CHROMA_PORT=8000` |

### 1.2. Package Installation

Install the necessary libraries for the Node.js/Express backend.

| Package | Purpose | Installation Command |
| :--- | :--- | :--- |
| **Core RAG** | Express, OpenAI SDK, Chroma DB client | `npm install express openai chromadb dotenv` |
| **Data Utility** | Text chunking/splitting | `npm install @langchain/textsplitters` |

## 2\. Core Service Classes (Pseudocode)

These are the reusable modules that will be injected or imported into your main Express logic.

### 2.1. $\text{TextSplitter}$ Utility (`src/utils/textSplitter.ts`)

Ensures transcripts are broken down into optimal, overlapping chunks for embedding.

```typescript:textsplitter Utility Pseudocode
/**
 * Splits a large transcript into smaller, overlapping chunks.
 */
function chunkTranscript(transcript: string): array<string>
    // Uses LangChain's RecursiveCharacterTextSplitter
    splitter = new RecursiveCharacterTextSplitter(
        chunkSize=500,    // Target size (approx. 100-200 words)
        chunkOverlap=100  // Overlap for context coherence
    )
    Return splitter.splitDocuments(transcript).map(doc => doc.content)
```

### 2.2. $\text{OpenAIClient}$ (`src/services/OpenAIClient.ts`)

Centralizes all interactions with the $\text{LLM}$ and $\text{Embedding}$ models.

```typescript:openaiclient Pseudocode
class OpenAIClient:
    init(api_key):
        Initialize OpenAI SDK with environment key.

    method getEmbeddings(texts: array<string>): array<array<number>>
        # Calls 'text-embedding-3-small' model
        Return list of vector arrays

    method extractMetadata(transcript: string): { projectId: string, department: string, searchString: string }
        # STAGE 1 (Pre-processing): Initial GPT-5 call for structured data.
        # Prompt instructs model to return a JSON object with the primary project ID, department, 
        # and a composite search string of all ambiguous phrases.
        Call openai.chat.completions.create(model='gpt-5', prompt=METADATA_PROMPT, response_format='json')
        Return parsed JSON

    method getFinalAnalysis(augmented_prompt: string): string
        # STAGE 4 (Generation): Final GPT-5 call for full analysis.
        Call openai.chat.completions.create(model='gpt-5', prompt=augmented_prompt)
        Return final analysis (Markdown string)
```

### 2.3. $\text{ChromaService}$ (`src/services/ChromaClient.ts`)

Manages the persistent knowledge base, handling indexing and retrieval.

```typescript:chromaservice Pseudocode
class ChromaService:
    init(openai_client):
        # Connects to the Docker server and sets up the collection
        Connect to Chroma DB server (http://localhost:8000)
        Get or Create Collection: 'meeting_context_knowledge'

    method indexData(chunks, projectId, department, date):
        # Data Ingestion / Feedback Loop
        # 1. Get embeddings for chunks (via OpenAIClient)
        # 2. Add embeddings, text, and metadata to Chroma collection
        # Saves the meeting's context to the DB.

    method retrieveContext(projectId, department, searchQuery, K=5): string
        # STAGE 2 (Retrieval): Fetches context for augmentation
        # 1. Get embedding for searchQuery (via OpenAIClient)
        # 2. QUERY Chroma:
        #    - Apply METADATA FILTER (where: {projectId, department}) first.
        #    - Search for vector similarity (semantic search) against the filtered results.
        # 3. Format the top K text results into a single string.
        Return formatted_context_string
```
Here is the content for **Phase 2: Data Ingestion and RAG Orchestration**, provided entirely in code blocks as requested, adhering to the Node.js/Express implementation plan.

## 🚀 Phase 2: Data Ingestion and RAG Orchestration

This phase integrates the core services ($\text{ChromaClient}$, $\text{OpenAIClient}$) into the application layer, establishing the **Data Ingestion Pipeline** and the **RAG Orchestration Flow** within the $\text{Express}$ server.

### 1. Data Ingestion Pipeline (Memory Building)

The primary goal is to index historical and newly completed meeting transcripts correctly into the Chroma Vector Database.

#### 1.1. The Feedback Loop (Post-Processing)

This process updates the knowledge base with the *latest* and *most accurate* context from the meeting that was *just analyzed*.

| Action | Responsibility | Process |
| :--- | :--- | :--- |
| **Index New Context** | $\text{ChromaService.indexData}$ | Executed after Stage 4 (Final Generation) to save the concrete insights (or the processed transcript chunks) to the Vector DB. |

### 1.2. Express Server Setup (`src/server.ts`)

The server is configured to handle the raw transcript text input and defines the main endpoint.

```typescript:Express Server Pseudocode
const express = require('express');
const app = express();
const PORT = 3000;

// Middleware to parse incoming plain text transcripts with a size limit
app.use(express.text({ type: 'text/plain', limit: '5mb' }));

app.post('/analyze', async (req, res) => {
    const transcript = req.body;
    try {
        const insights = await analyzeMeeting(transcript); // Calls the orchestrator
        res.setHeader('Content-Type', 'text/markdown');
        res.status(200).send(insights);
    } catch (error) {
        // Log error and return a generic server failure message
        console.error("RAG Analysis Failed:", error);
        res.status(500).send({ error: 'Failed to generate contextual insights.' });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
````

## 2\. RAG Orchestration Pipeline

The core application logic executed by the `/analyze` endpoint, implemented in the `analyzeMeeting` function.

### 2.1. The 5-Stage Orchestration Logic (`analyzeMeeting` Pseudocode)

```typescript:analyzemeeting Orchestrator Pseudocode
async function analyzeMeeting(transcript): string {
    
    // Services must be instantiated or injected here
    const openaiClient = new OpenAIClient();
    const chromaService = new ChromaService(openaiClient);

    // --- STAGE 1: METADATA EXTRACTION (Pre-processing) ---
    // Uses GPT-5 to get filters and the semantic search query.
    const metadata = await openaiClient.extractMetadata(transcript);
    
    // --- STAGE 2: CONTEXT RETRIEVAL (The Memory Fetch) ---
    // Filters search space using metadata, then performs vector similarity search.
    const retrieved_context = await chromaService.retrieveContext(
        metadata.projectId, 
        metadata.department, 
        metadata.searchString, 
        K=5 
    );
    
    // --- STAGE 3: PROMPT AUGMENTATION ---
    // Constructs the final, composite prompt for high-quality analysis.
    const augmented_prompt = constructAugmentedPrompt(transcript, retrieved_context, metadata.projectId);
    
    // --- STAGE 4: FINAL GENERATION ---
    // GPT-5 uses the provided context to resolve ambiguities.
    const final_insights = await openaiClient.getFinalAnalysis(augmented_prompt);
    
    // --- STAGE 5: POST-PROCESSING / FEEDBACK LOOP ---
    // Ensures the *new* meeting's context is immediately available for future retrievals.
    const chunks_to_save = chunkTranscript(transcript); 
    await chromaService.indexData(
        chunks_to_save, 
        metadata.projectId, 
        metadata.department, 
        new Date().toISOString() // Use ISO string or similar for date
    );
    
    return final_insights;
}
```

### 2.2. Stage 3: Prompt Augmentation Structure (`constructAugmentedPrompt` Pseudocode)

```typescript:prompt Augmentation Pseudocode
function constructAugmentedPrompt(transcript, context, projectId): string {
    return `
SYSTEM PROMPT: You are an expert meeting analyst... Use the provided Context Snippets to disambiguate vague terms.

--- START OF HISTORICAL CONTEXT (Project: ${projectId}) ---
${context} 
--- END OF HISTORICAL CONTEXT ---

--- CURRENT MEETING TRANSCRIPT ---
${transcript}

---
INSTRUCTIONS: Generate a detailed Summary, a specific To-Do List, and clear Action Items using Markdown.
    `;
}
```

## 🎯 Phase 3: Verification, Refinement, and Deployment Strategy

This final phase transitions the implemented RAG pipeline from development to a reliable, production-ready system by focusing on testing, optimization, and maintenance.

---

## 1. System Verification (The Context Test)

The primary goal of testing is to confirm that the RAG pipeline successfully resolves ambiguity by retrieving and utilizing historical context.

### 1.1. Core RAG Test Case Structure

Tests must validate the seamless flow between retrieval and generation.

| Criterion | Test Focus | Rationale |
| :--- | :--- | :--- |
| **Grounding** | Does the output use specific terms (e.g., "Dark Mode UI") that were *only* present in the retrieved context? | Confirms the core value proposition: ambiguity resolution. |
| **Filtering** | When searching for Project Alpha, does the retrieval *only* return documents tagged with `projectId: 'Alpha'`? | Confirms the system's scalability and efficiency via metadata filtering. |
| **Coherence** | Is the final summary a coherent narrative, or does it awkwardly stitch together the current transcript and past context? | Confirms the quality of the Stage 4 (Generation) prompt engineering. |

### 1.2. Verification Script Pseudocode

This pseudocode confirms the critical ambiguity resolution capability.

```typescript:Verification Script Pseudocode
async function verifyRAGSystem(): void {
    // 1. Setup necessary context in Chroma DB (Pre-condition)
    // Indexes context that is intentionally vague, but the DB snippet is specific.
    await chromaService.indexData(
        [ "Action: Jane - Complete development of the Dark Mode UI for Project Phoenix by EOD." ], 
        "Phoenix", "Engineering", "2025-10-10"
    );

    // 2. Define the ambiguous test case
    const ambiguous_transcript = "In the meeting, we agreed to finalize the implementation of the feature discussed in the previous sync. Mike will take the lead on this."
    
    // 3. Execute the RAG pipeline
    const insights = await analyzeMeeting(ambiguous_transcript); 

    // 4. Assert the result (Crucial check for resolved ambiguity)
    if (insights.includes("Dark Mode UI") && insights.includes("Mike")) {
        console.log("RAG Test PASS: Ambiguity resolved successfully.");
    } else {
        console.error("RAG Test FAIL: Context was not used to resolve ambiguity.");
    }
}
````

## 2\. Prompt Engineering Refinement

Refine the two core $\text{GPT-5}$ prompts for maximum reliability and efficiency.

### 2.1. Stage 1: Metadata Extraction Prompt (Optimization)

The goal is to ensure the output is a **reliable JSON** structure for subsequent programmatic use.

| Technique | Rationale |
| :--- | :--- |
| **JSON Enforcement** | Use `response_format: { type: "json_object" }` in the $\text{OpenAI}$ API call to guarantee structured output. |
| **Clarity** | Use explicit numbering or markers in the prompt to guide the model's extraction logic. |

### 2.2. Stage 3: Final Augmented Generation Prompt (Grounding)

The prompt must explicitly instruct the $\text{LLM}$ to use the retrieved text.

| Technique | Rationale |
| :--- | :--- |
| **Role Setting** | Define the persona clearly: "You are an expert AI meeting analyst specializing in corporate project documentation." |
| **Context Delineation** | Use clear delimiters (`--- START/END OF CONTEXT ---`) so the model knows precisely where the retrieved facts begin and end. |
| **Forcing Grounding** | Use strong language in the instruction: "**You MUST use** the provided context to replace vague references." |

## 3\. Production Readiness and Maintenance

### 3.1. Knowledge Base Maintenance

To maintain performance and relevance over time, data hygiene is necessary.

| Strategy | Rationale | Implementation Detail |
| :--- | :--- | :--- |
| **Time-Based Deletion** | Older context is less relevant and degrades search performance. | Implement a separate script to query $\text{Chroma}$ and delete documents older than a specified threshold (e.g., 180 days). |
| **Data Integrity** | Accurate filtering relies on clean metadata. | Validate `projectId` and `department` against a predefined master list during ingestion (Stage 5) to prevent bad data. |

### 3.2. Performance and Fault Tolerance (Node.js)

  * **Asynchronous Processing:** Ensure all API calls (Chroma, $\text{GPT-5}$) use $\text{async/await}$ and are non-blocking to maintain $\text{Express}$ server responsiveness.
  * **Retry Logic:** Implement **exponential backoff** for retries around the $\text{GPT-5}$ calls and $\text{Chroma}$ connections to gracefully handle transient network errors and rate limits.
  * **Rate Limiting:** Monitor $\text{OpenAI}$ usage to prevent exceeding rate limits, potentially by using a simple queuing mechanism if throughput is high.



