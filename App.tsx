import React, { useState, useCallback, useEffect } from "react";
import { TRANSCRIPTION_MODELS, SUMMARY_MODELS } from "./constants";
import type { SummaryResult, Model } from "./types";
import {
  summarizeAndExtractTasks as summarizeWithGemini,
  labelSpeakersWithGemini,
} from "./services/geminiService";
import {
  transcribeWithAzureWhisper,
  summarizeWithAzureOpenAI,
  labelSpeakersWithAzureOpenAI,
} from "./services/azureOpenAIService";

import Header from "./components/Header";
import FileUpload from "./components/FileUpload";
import TranscriptInput from "./components/TranscriptInput";
import ModelSelector from "./components/ModelSelector";
import ResultsDisplay from "./components/ResultsDisplay";
import Spinner from "./components/Spinner";
import ConfigurationNotice from "./components/ConfigurationNotice";

// Check for API key configuration at the top level
const isGeminiConfigured = !!process.env.API_KEY;
const isAzureConfigured =
  !!process.env.AZURE_OPENAI_API_KEY && !!process.env.AZURE_OPENAI_ENDPOINT;

const App: React.FC = () => {
  // Filter models based on whether their provider is configured
  const availableTranscriptionModels = TRANSCRIPTION_MODELS.filter(
    (m) =>
      (m.provider === "gemini" && isGeminiConfigured) ||
      (m.provider === "azure" && isAzureConfigured)
  );
  const availableSummaryModels = SUMMARY_MODELS.filter(
    (m) =>
      (m.provider === "gemini" && isGeminiConfigured) ||
      (m.provider === "azure" && isAzureConfigured)
  );

  // Add simulated models if no real ones are configured, for demo purposes
  if (availableTranscriptionModels.length === 0) {
    availableTranscriptionModels.push(
      ...TRANSCRIPTION_MODELS.filter((m) => m.provider === "simulated")
    );
  }
  if (availableSummaryModels.length === 0) {
    availableSummaryModels.push(
      ...SUMMARY_MODELS.filter((m) => m.provider === "simulated")
    );
  }

  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [inputMode, setInputMode] = useState<"audio" | "transcript">("audio");
  const [providedTranscript, setProvidedTranscript] = useState<string>("");
  const [transcriptionModelId, setTranscriptionModelId] = useState<string>(
    availableTranscriptionModels[0]?.id || ""
  );
  const [summaryModelId, setSummaryModelId] = useState<string>(
    availableSummaryModels[0]?.id || ""
  );
  const [systemPrompt, setSystemPrompt] =
    useState<string>(`Please analyze the following meeting transcript and provide a structured summary with these sections:

1. **Overview**: Write a 2-3 sentence executive summary that captures the main focus of the meeting and the primary outcomes or decisions made.

2. **Key Takeaways**: List 4-7 bullet points highlighting the most important decisions, agreements, or conclusions reached during the meeting. Each bullet should:
   - Start with "The team decided/confirmed/agreed/endorsed/planned..."
   - Be specific and actionable
   - Focus on concrete outcomes rather than discussions

3. **Next Steps**: Create a list of action items with:
   - The assigned person's name (or "To be Assigned" if unclear)
   - A clear, actionable task description
   - Keep tasks specific and measurable

4. **Key Topics**: List 5-8 main topics discussed in the meeting. Format each as a concise phrase (3-7 words) that captures the subject matter. Add labels like "Update," "Decision," or "Idea" to categorize the topic type.

**Formatting Guidelines:**
- Use clear, professional language
- Avoid verbatim quotes unless they add significant value
- Focus on outcomes and decisions over discussions
- Be concise but comprehensive
- Ensure all action items are specific enough to be acted upon

**Transcript:**
[INSERT TRANSCRIPT HERE]`);

  const [transcript, setTranscript] = useState<string>("");
  const [summaryResult, setSummaryResult] = useState<SummaryResult | null>(
    null
  );

  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [isSummarizing, setIsSummarizing] = useState<boolean>(false);
  const [isLabelingSpeakers, setIsLabelingSpeakers] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Effect to reset model selection if the list of available models changes
  useEffect(() => {
    if (
      !availableTranscriptionModels.find((m) => m.id === transcriptionModelId)
    ) {
      setTranscriptionModelId(availableTranscriptionModels[0]?.id || "");
    }
  }, [transcriptionModelId, availableTranscriptionModels]);

  useEffect(() => {
    if (!availableSummaryModels.find((m) => m.id === summaryModelId)) {
      setSummaryModelId(availableSummaryModels[0]?.id || "");
    }
  }, [summaryModelId, availableSummaryModels]);

  const handleFileChange = (file: File | null) => {
    setAudioFile(file);
    setTranscript("");
    setSummaryResult(null);
    setError(null);
  };

  const processAudio = useCallback(async () => {
    if (inputMode === "audio" && !audioFile) {
      setError("Please select an audio file first.");
      return;
    }
    if (inputMode === "transcript" && !providedTranscript.trim()) {
      setError("Please paste or upload a transcript.");
      return;
    }

    setError(null);
    setTranscript("");
    setSummaryResult(null);

    const selectedTranscriptionModel = TRANSCRIPTION_MODELS.find(
      (m) => m.id === transcriptionModelId
    );
    const selectedSummaryModel = SUMMARY_MODELS.find(
      (m) => m.id === summaryModelId
    );

    if (!selectedTranscriptionModel || !selectedSummaryModel) {
      setError(
        "Invalid model selection. Please ensure models are configured correctly."
      );
      return;
    }

    // 1. Get transcript (either user-provided or transcribed)
    let currentTranscript = "";
    if (inputMode === "transcript") {
      currentTranscript = providedTranscript.trim();
      setTranscript(currentTranscript);
    } else {
      setIsTranscribing(true);
      try {
        if (selectedTranscriptionModel.provider === "azure") {
          currentTranscript = await transcribeWithAzureWhisper(audioFile);
        } else {
          await new Promise((resolve) => setTimeout(resolve, 1500));
          currentTranscript = `Didnt capture anything`;
        }
        setTranscript(currentTranscript);
      } catch (err) {
        console.error(err);
        setError(
          err instanceof Error
            ? err.message
            : "An unknown error occurred during transcription."
        );
        setIsTranscribing(false);
        return;
      }
      setIsTranscribing(false);
    }

    if (!currentTranscript) {
      setError("Transcription failed or produced no text.");
      return;
    }

    // 2. Speaker labeling (optional): transform transcript to Speaker N: ...
    // If transcript already seems labeled (contains 'Speaker N:'), skip labeling
    const hasSpeakerLabels = /Speaker\s+\d+:/i.test(currentTranscript);
    if (!hasSpeakerLabels) {
      setIsLabelingSpeakers(true);
      try {
        if (selectedSummaryModel.provider === "azure") {
          currentTranscript = await labelSpeakersWithAzureOpenAI(
            currentTranscript,
            selectedSummaryModel.id
          );
        } else if (selectedSummaryModel.provider === "gemini") {
          currentTranscript = await labelSpeakersWithGemini(
            currentTranscript,
            selectedSummaryModel.id
          );
        }
        setTranscript(currentTranscript);
      } catch (e) {
        console.warn(
          "Speaker labeling step failed, continuing with raw transcript.",
          e
        );
      } finally {
        setIsLabelingSpeakers(false);
      }
    }

    // 3. Generate Summary and Tasks
    setIsSummarizing(true);
    try {
      let result;
      if (selectedSummaryModel.provider === "azure") {
        result = await summarizeWithAzureOpenAI(
          currentTranscript,
          selectedSummaryModel.id,
          systemPrompt
        );
      } else {
        // Handles 'gemini' and 'simulated'
        result = await summarizeWithGemini(
          currentTranscript,
          selectedSummaryModel.id,
          systemPrompt
        );
      }
      setSummaryResult(result);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "An unknown error occurred during summarization."
      );
    } finally {
      setIsSummarizing(false);
    }
  }, [audioFile, transcriptionModelId, summaryModelId, systemPrompt]);

  return (
    <div className="min-h-screen bg-slate-900 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <Header />

        <main className="mt-8 space-y-8">
          <ConfigurationNotice
            isGeminiConfigured={isGeminiConfigured}
            isAzureConfigured={isAzureConfigured}
          />

          <div className="bg-slate-800/50 rounded-xl shadow-lg p-6 border border-slate-700">
            <h2 className="text-2xl font-bold text-cyan-400 mb-6">
              1. Configuration
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setInputMode("audio")}
                    className={`px-3 py-1 rounded-md text-sm ${
                      inputMode === "audio"
                        ? "bg-cyan-600 text-white"
                        : "bg-slate-800 text-slate-300 border border-slate-700"
                    }`}
                  >
                    Audio Mode
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode("transcript")}
                    className={`px-3 py-1 rounded-md text-sm ${
                      inputMode === "transcript"
                        ? "bg-cyan-600 text-white"
                        : "bg-slate-800 text-slate-300 border border-slate-700"
                    }`}
                  >
                    Transcript Mode
                  </button>
                </div>
                {inputMode === "audio" ? (
                  <FileUpload onFileChange={handleFileChange} />
                ) : (
                  <TranscriptInput
                    value={providedTranscript}
                    onChange={setProvidedTranscript}
                  />
                )}
              </div>
              <div className="space-y-4">
                <ModelSelector
                  label="Transcription Model"
                  models={availableTranscriptionModels}
                  selectedValue={transcriptionModelId}
                  onChange={setTranscriptionModelId}
                  helpText="Select the model for audio-to-text conversion."
                  disabled={availableTranscriptionModels.length === 0}
                />
                <ModelSelector
                  label="Insights Model"
                  models={availableSummaryModels}
                  selectedValue={summaryModelId}
                  onChange={setSummaryModelId}
                  helpText="Select the model for summary and task generation."
                  disabled={availableSummaryModels.length === 0}
                />
              </div>
            </div>

            <div className="mt-6">
              <label
                htmlFor="system-prompt"
                className="block text-sm font-medium text-slate-300"
              >
                System Prompt (Optional)
              </label>
              <textarea
                id="system-prompt"
                rows={4}
                className="mt-1 block w-full text-base bg-slate-900 border-slate-700 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm rounded-md text-white p-3"
                placeholder="e.g., You are a project manager. Focus on deadlines and blockers."
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
              />
              <p className="mt-2 text-sm text-slate-500">
                Provide custom instructions to guide the AI's response style and
                focus.
              </p>
            </div>

            <div className="mt-8 text-center">
              <button
                onClick={processAudio}
                disabled={
                  (inputMode === "audio" && !audioFile) ||
                  (inputMode === "transcript" && !providedTranscript.trim()) ||
                  isTranscribing ||
                  isSummarizing ||
                  !transcriptionModelId ||
                  !summaryModelId
                }
                className="bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg shadow-cyan-500/20"
              >
                {isTranscribing
                  ? "Transcribing..."
                  : isSummarizing
                  ? "Generating Insights..."
                  : inputMode === "audio"
                  ? "Process Audio"
                  : "Process Transcript"}
              </button>
            </div>
          </div>

          {error && (
            <div
              className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg"
              role="alert"
            >
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {(isTranscribing ||
            isLabelingSpeakers ||
            isSummarizing ||
            summaryResult) && (
            <div className="bg-slate-800/50 rounded-xl shadow-lg p-6 border border-slate-700">
              <h2 className="text-2xl font-bold text-cyan-400 mb-4">
                2. Results
              </h2>
              <div className="space-y-6">
                {isTranscribing && (
                  <div className="flex items-center space-x-3 text-lg">
                    <Spinner />
                    <span>Transcribing audio...</span>
                  </div>
                )}
                {isLabelingSpeakers && (
                  <div className="flex items-center space-x-3 text-lg">
                    <Spinner />
                    <span>Labeling speakers...</span>
                  </div>
                )}
                {transcript &&
                  !isTranscribing &&
                  !isLabelingSpeakers &&
                  inputMode === "audio" && (
                    <div>
                      <h3 className="text-xl font-semibold text-slate-300 mb-3">
                        Transcript
                      </h3>
                      <div className="bg-slate-900/70 p-4 rounded-lg max-h-60 overflow-y-auto border border-slate-700">
                        <p className="text-slate-400 whitespace-pre-wrap">
                          {transcript}
                        </p>
                      </div>
                    </div>
                  )}
                {isSummarizing && (
                  <div className="flex items-center space-x-3 text-lg">
                    <Spinner />
                    <span>Generating insights...</span>
                  </div>
                )}
                {summaryResult && !isSummarizing && (
                  <ResultsDisplay result={summaryResult} />
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
