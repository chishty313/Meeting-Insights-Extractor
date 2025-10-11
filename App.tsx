import React, { useState, useCallback, useEffect, useRef } from "react";
import { TRANSCRIPTION_MODELS, SUMMARY_MODELS } from "./constants";
import type { SummaryResult, Model } from "./types";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";
import {
  summarizeAndExtractTasks as summarizeWithGemini,
  labelSpeakersWithGemini,
} from "./services/geminiService";
import {
  transcribeWithAzureWhisper,
  summarizeWithAzureOpenAI,
  labelSpeakersWithAzureOpenAI,
} from "./services/azureOpenAIService";
import { getZoomTranscript, testZoomConnection } from "./services/zoomService";

import Header from "./components/Header";
import FileUpload from "./components/FileUpload";
import TranscriptInput from "./components/TranscriptInput";
import ZoomMeetingInput from "./components/ZoomMeetingInput";
import ModelSelector from "./components/ModelSelector";
import ResultsDisplay from "./components/ResultsDisplay";
import Spinner from "./components/Spinner";
import ConfigurationNotice from "./components/ConfigurationNotice";
import { Button } from "./components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Textarea } from "./components/ui/textarea";
import { Label } from "./components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";

// Check for API key configuration at the top level
const isGeminiConfigured = !!process.env.API_KEY;
const isAzureConfigured =
  !!process.env.AZURE_OPENAI_API_KEY && !!process.env.AZURE_OPENAI_ENDPOINT;
const isZoomConfigured =
  !!process.env.ZOOM_CLIENT_ID &&
  !!process.env.ZOOM_CLIENT_SECRET &&
  !!process.env.ZOOM_ACCOUNT_ID;

const AppContent: React.FC = () => {
  const { theme } = useTheme();
  // Filter models based on whether their provider is configured
  const availableTranscriptionModels = TRANSCRIPTION_MODELS.filter(
    (m) =>
      (m.provider === "azure" && isAzureConfigured) || m.provider === "zoom" // Always show Zoom option, handle credentials in processing
  );
  const availableSummaryModels = SUMMARY_MODELS.filter(
    (m) => m.provider === "azure" && isAzureConfigured
  );

  // Add simulated models if no Azure models are configured, for demo purposes
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
  const [inputMode, setInputMode] = useState<"audio" | "transcript" | "zoom">(
    "transcript"
  );
  const [providedTranscript, setProvidedTranscript] = useState<string>("");

  // Clear error when user types in transcript
  const handleTranscriptChange = (value: string) => {
    setProvidedTranscript(value);
    if (inputMode === "transcript" && value.trim()) {
      setError(null);
    }
  };
  const [zoomMeetingId, setZoomMeetingId] = useState<string>("");
  const [includeTimestamps, setIncludeTimestamps] = useState<boolean>(true);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [timestampPrompt, setTimestampPrompt] =
    useState<string>(`You are a transcript timestamp formatter. Add timestamps and speaker labels ONLY.

OUTPUT FORMAT (STRICT):
Speaker X: [MM:SS] Exact text from transcript.
Speaker Y: [MM:SS] Next exact text from transcript.

RULES:
1. ONE line per speaker turn
2. ONE timestamp per line in [MM:SS] format (e.g., [00:00], [00:05], [02:30])
3. Start at [00:00]
4. Increment by 3-8 seconds between turns
5. NO decimals in timestamps (❌ [00:14.25] ✓ [00:14])
6. NO duplicate speaker labels (❌ "Speaker 1: [00:00] Speaker 1:" ✓ "Speaker 1: [00:00]")
7. DO NOT modify the original text
8. DO NOT add any explanations

CORRECT EXAMPLE:
Speaker 1: [00:00] So if next renewal date, I mean current date plus one year is bigger than June 30, then it will suggest a user to renew till December 13.
Speaker 2: [00:08] And we have listed five years like June 37, 31, 27.
Speaker 1: [00:15] This is rendering just like this is it.
Speaker 2: [00:18] Okay, that's perfect.

INCORRECT EXAMPLES (DO NOT DO THIS):
❌ Speaker 1: [00:00] Speaker 1: [00:00] Text here
❌ Speaker 1: [00:00:14.25] Text here
❌ Speaker 1: [00:00] Speaker 1: [00:17.125] Text
❌ [00:00] Speaker 1: Text here

YOUR TASK:
Process the transcript below. Output ONLY the formatted transcript with timestamps. No other text.

TRANSCRIPT TO PROCESS:`);
  const [transcriptionModelId, setTranscriptionModelId] = useState<string>("");
  const [summaryModelId, setSummaryModelId] = useState<string>("");
  const [systemPrompt, setSystemPrompt] =
    useState<string>(`You are a professional meeting analyst. Analyze the following meeting transcript and provide a structured summary with these exact sections:

1. **Overview**: Write a 2-3 sentence executive summary that captures the main focus of the meeting and the primary outcomes or decisions made.

2. **To-Do List**: Create a comprehensive list combining both key takeaways and action items, organized by person. For each item:
   - Identify the person responsible (or "To be Assigned" if unclear)
   - Include both decisions/agreements and actionable tasks
   - Group all items by the same person together
   - Format as: "Person Name: Task/Decision description"
   - Sort by person alphabetically

**IMPORTANT**: 
- Focus only on the meeting content provided
- Do not modify or add to the transcript content
- Base your analysis strictly on what was discussed
- Use professional, clear language
- Group all tasks for each person together in the To-Do List

**Transcript to analyze:**`);

  const [transcript, setTranscript] = useState<string>("");
  const [summaryResult, setSummaryResult] = useState<SummaryResult | null>(
    null
  );

  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [isSummarizing, setIsSummarizing] = useState<boolean>(false);
  const [isLabelingSpeakers, setIsLabelingSpeakers] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [hasStartedProcessing, setHasStartedProcessing] =
    useState<boolean>(false);
  const [trimInstructions, setTrimInstructions] = useState<string>("");
  const resultsSectionRef = useRef<HTMLDivElement>(null);

  // Clear error when input mode changes
  useEffect(() => {
    setError(null);
  }, [inputMode]);

  // Function to scroll to results section
  const scrollToResults = () => {
    if (resultsSectionRef.current) {
      resultsSectionRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  // Initialize transcription model with first available model
  useEffect(() => {
    if (availableTranscriptionModels.length > 0 && !transcriptionModelId) {
      setTranscriptionModelId(availableTranscriptionModels[0].id);
    }
  }, [availableTranscriptionModels, transcriptionModelId]);

  // Effect to reset model selection if the list of available models changes
  useEffect(() => {
    if (
      !availableTranscriptionModels.find((m) => m.id === transcriptionModelId)
    ) {
      setTranscriptionModelId(availableTranscriptionModels[0]?.id || "");
    }
  }, [transcriptionModelId, availableTranscriptionModels]);

  // Initialize summary model with Azure GPT-5 if available, otherwise first available model
  useEffect(() => {
    if (availableSummaryModels.length > 0 && !summaryModelId) {
      const gpt5Model = availableSummaryModels.find((m) => m.id === "gpt-5");
      const azureModel = availableSummaryModels.find(
        (m) => m.provider === "azure"
      );
      const defaultModel = gpt5Model || azureModel || availableSummaryModels[0];
      setSummaryModelId(defaultModel.id);
    }
  }, [availableSummaryModels, summaryModelId]);

  useEffect(() => {
    if (!availableSummaryModels.find((m) => m.id === summaryModelId)) {
      setSummaryModelId(availableSummaryModels[0]?.id || "");
    }
  }, [summaryModelId, availableSummaryModels]);

  // Set initialized state when both models are selected
  useEffect(() => {
    if (transcriptionModelId && summaryModelId) {
      setIsInitialized(true);
    }
  }, [transcriptionModelId, summaryModelId]);

  const handleFileChange = (file: File | null) => {
    setAudioFile(file);
    setTranscript("");
    setSummaryResult(null);
    setError(null);

    if (file) {
      // Get audio duration for trimming
      const audio = new Audio();
      audio.onloadedmetadata = () => {
        setAudioDuration(audio.duration);
      };
      audio.src = URL.createObjectURL(file);
    }
  };

  // Function to add timestamps using AI
  const addTimestampsWithAI = async (transcript: string): Promise<string> => {
    try {
      const selectedModel = availableSummaryModels.find(
        (m) => m.id === summaryModelId
      );
      if (!selectedModel) throw new Error("No model selected");

      if (selectedModel.provider === "azure") {
        // Use Azure OpenAI for timestamp processing
        const { summarizeWithAzureOpenAI } = await import(
          "./services/azureOpenAIService"
        );
        const result = await summarizeWithAzureOpenAI(
          `${timestampPrompt}\n\n${transcript}`,
          summaryModelId,
          timestampPrompt
        );
        return result.summary || result.overview || transcript;
      } else {
        // For Gemini or other models, use direct API call
        const { addTimestampsWithGemini } = await import(
          "./services/geminiService"
        );
        return await addTimestampsWithGemini(
          transcript,
          summaryModelId,
          timestampPrompt
        );
      }
    } catch (error) {
      console.error("Error adding timestamps:", error);
      return transcript; // Return original transcript if timestamping fails
    }
  };

  const addFallbackTimestamps = (transcript: string): string => {
    console.log("Using fallback timestamp method");
    const sentences = transcript
      .split(/[.!?]+/)
      .filter((s) => s.trim().length > 0);
    let result = "";
    let currentTime = 0;
    let speaker = 1;

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i].trim();
      if (sentence.length === 0) continue;

      // Use MM:SS format (no hours, no decimals)
      const minutes = Math.floor(currentTime / 60);
      const seconds = Math.floor(currentTime % 60);
      const timeString = `[${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}]`;

      result += `\nSpeaker ${speaker}: ${timeString} ${sentence}.`;

      // Alternate speakers every 2-3 sentences
      if (i % 2 === 1) {
        speaker = speaker === 1 ? 2 : 1;
      }

      // Increment time based on sentence length (3-8 seconds per turn)
      currentTime += Math.max(3, Math.min(8, sentence.length / 4));
    }

    return result.trim();
  };

  const processAudio = useCallback(async () => {
    // Clear any existing errors first
    setError(null);

    if (inputMode === "audio" && !audioFile) {
      setError("Please select an audio file first.");
      return;
    }
    if (inputMode === "transcript" && !providedTranscript.trim()) {
      setError("Please paste or upload a transcript.");
      return;
    }
    if (inputMode === "zoom" && !zoomMeetingId.trim()) {
      setError("Please enter a Zoom Meeting ID.");
      return;
    }
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

    // 1. Get transcript (either user-provided, transcribed, or from Zoom)
    let currentTranscript = "";
    if (inputMode === "transcript") {
      currentTranscript = providedTranscript.trim();
      setTranscript(currentTranscript);
    } else if (inputMode === "zoom") {
      // Check if Zoom credentials are configured
      if (!isZoomConfigured) {
        setError(
          "Zoom API credentials are not configured. Please add ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET, and ZOOM_ACCOUNT_ID to your .env file."
        );
        return;
      }

      setIsTranscribing(true);
      try {
        console.log("Fetching transcript from Zoom meeting:", zoomMeetingId);
        currentTranscript = await getZoomTranscript(
          zoomMeetingId,
          true // Always include timestamps for Zoom transcripts
        );
        console.log("Received Zoom transcript:", currentTranscript);
        setTranscript(currentTranscript);
      } catch (err) {
        console.error("Zoom transcript fetch failed:", err);
        setError(
          `Failed to fetch Zoom transcript: ${
            err instanceof Error ? err.message : "Unknown error"
          }`
        );
        return;
      } finally {
        setIsTranscribing(false);
      }
    } else {
      setIsTranscribing(true);
      try {
        if (selectedTranscriptionModel.provider === "azure") {
          console.log("Calling transcribeWithAzureWhisper");
          currentTranscript = await transcribeWithAzureWhisper(audioFile);
          console.log("Received transcript:", currentTranscript);
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

    // 2. Add timestamps using AI (for Audio mode only, not Transcript or Zoom)
    if (includeTimestamps && inputMode === "audio") {
      setIsLabelingSpeakers(true);
      try {
        console.log("Adding timestamps with AI (mandatory)...");
        const timestampedTranscript = await addTimestampsWithAI(
          currentTranscript
        );
        console.log("Timestamped transcript:", timestampedTranscript);

        // Verify timestamps were actually added (look for MM:SS format)
        if (
          timestampedTranscript.includes("[00:") ||
          timestampedTranscript.includes("[0") ||
          timestampedTranscript.includes("Speaker")
        ) {
          currentTranscript = timestampedTranscript;
          setTranscript(currentTranscript);
        } else {
          console.warn(
            "AI timestamping failed - no timestamps found, using fallback"
          );
          // Fallback: Add basic timestamps
          currentTranscript = addFallbackTimestamps(currentTranscript);
          setTranscript(currentTranscript);
        }
      } catch (err) {
        console.warn("Timestamp processing failed, using fallback:", err);
        // Fallback: Add basic timestamps
        currentTranscript = addFallbackTimestamps(currentTranscript);
        setTranscript(currentTranscript);
      } finally {
        setIsLabelingSpeakers(false);
      }
    } else if (inputMode === "zoom") {
      console.log(
        "Zoom mode: Using transcript with existing timestamps from Zoom"
      );
      // Zoom transcript already has timestamps, no additional processing needed
    }

    // 3. Speaker labeling (optional): transform transcript to Speaker N: ...
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
      // Combine system prompt with trim instructions if provided
      let enhancedSystemPrompt = systemPrompt;
      if (inputMode === "transcript" && trimInstructions.trim()) {
        enhancedSystemPrompt = `${systemPrompt}

IMPORTANT: Before analyzing the transcript, please remove the following sections based on the user's trim instructions:
"${trimInstructions.trim()}"

Please process only the remaining content after removing these sections.`;
      }

      if (selectedSummaryModel.provider === "azure") {
        result = await summarizeWithAzureOpenAI(
          currentTranscript,
          selectedSummaryModel.id,
          enhancedSystemPrompt
        );
      } else {
        // Fallback to simulated model if Azure is not available
        result = await summarizeWithGemini(
          currentTranscript,
          selectedSummaryModel.id,
          enhancedSystemPrompt
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
  }, [
    audioFile,
    providedTranscript,
    zoomMeetingId,
    inputMode,
    transcriptionModelId,
    summaryModelId,
    systemPrompt,
    includeTimestamps,
    timestampPrompt,
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <Header />

        <main className="space-y-12">
          <ConfigurationNotice
            isGeminiConfigured={isGeminiConfigured}
            isAzureConfigured={isAzureConfigured}
          />

          <Card className="bg-white shadow-xl border-0 rounded-2xl">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-2xl">
              <CardTitle className="text-2xl font-bold text-white">
                Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-8">
                {/* Mode Selection */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Input Method
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setInputMode("transcript");
                        setError(null);
                      }}
                      className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                        inputMode === "transcript"
                          ? "bg-blue-600 text-white shadow-lg transform scale-105"
                          : "bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-300 hover:shadow-md"
                      }`}
                    >
                      📝 Transcript Mode
                    </button>
                    <button
                      type="button"
                      onClick={() => setInputMode("audio")}
                      className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                        inputMode === "audio"
                          ? "bg-blue-600 text-white shadow-lg transform scale-105"
                          : "bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-300 hover:shadow-md"
                      }`}
                    >
                      🎵 Audio Mode
                    </button>
                    <button
                      type="button"
                      onClick={() => setInputMode("zoom")}
                      className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                        inputMode === "zoom"
                          ? "bg-blue-600 text-white shadow-lg transform scale-105"
                          : "bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-300 hover:shadow-md"
                      }`}
                    >
                      📹 Zoom Mode
                    </button>
                  </div>
                </div>
                {/* Input Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Input Content
                  </h3>
                  {inputMode === "audio" ? (
                    <FileUpload onFileChange={handleFileChange} />
                  ) : inputMode === "zoom" ? (
                    <ZoomMeetingInput
                      meetingId={zoomMeetingId}
                      onMeetingIdChange={setZoomMeetingId}
                      isConfigured={isZoomConfigured}
                    />
                  ) : (
                    <div className="space-y-6">
                      <TranscriptInput
                        value={providedTranscript}
                        onChange={handleTranscriptChange}
                      />

                      {/* Transcript Trimming Instructions */}
                      {providedTranscript.trim() && (
                        <div className="space-y-4">
                          <h4 className="text-lg font-semibold text-gray-800">
                            Trim Instructions (Optional)
                          </h4>

                          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                            <p className="text-sm text-yellow-700">
                              <strong>✂️ Trim Feature:</strong> Specify which
                              timestamp ranges to remove from your transcript.
                              The AI will automatically trim these sections
                              before processing.
                            </p>
                          </div>

                          <div>
                            <label
                              htmlFor="trim-instructions"
                              className="block text-sm font-medium text-gray-700 mb-2"
                            >
                              Timestamp Ranges to Remove
                            </label>
                            <textarea
                              id="trim-instructions"
                              rows={3}
                              className="w-full text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-xl p-4 border border-gray-300 bg-white text-gray-900 hover:border-blue-300 transition-colors resize-none"
                              placeholder="e.g., Remove sections from 5:30 to 8:45, and from 15:20 to 18:10"
                              value={trimInstructions}
                              onChange={(e) =>
                                setTrimInstructions(e.target.value)
                              }
                            />
                            <p className="mt-2 text-sm text-gray-500">
                              Specify timestamp ranges in natural language
                              (e.g., "Remove from 5:30 to 8:45, skip 15:20 to
                              18:10")
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                        <p className="text-sm text-blue-700">
                          <strong>💡 Note:</strong> In Transcript mode, provide
                          your already formatted transcript with timestamps and
                          speaker labels. The system will process it directly
                          with the AI model without additional timestamp
                          formatting.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Model Selection */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    AI Models
                  </h3>
                  {inputMode === "audio" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        helpText="Azure GPT-5 is recommended for optimal results."
                        disabled={availableSummaryModels.length === 0}
                      />
                    </div>
                  ) : (
                    <div className="max-w-md">
                      <ModelSelector
                        label="Insights Model"
                        models={availableSummaryModels}
                        selectedValue={summaryModelId}
                        onChange={setSummaryModelId}
                        helpText="Azure GPT-5 is recommended for optimal results."
                        disabled={availableSummaryModels.length === 0}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Timestamp Section for Audio Mode */}
              {inputMode === "audio" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Audio Processing
                  </h3>
                  <div className="flex items-center space-x-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                    <div className="h-5 w-5 text-green-600 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <span className="text-xs text-green-600">✓</span>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-green-800">
                        Include timestamps in transcript (Mandatory)
                      </label>
                      <p className="text-xs text-green-600 mt-1">
                        Automatically adds [HH:MM:SS] timestamps and speaker
                        detection to the transcript
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* System Prompt Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  AI Instructions
                </h3>
                <div>
                  <label
                    htmlFor="system-prompt"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    System Prompt (Optional)
                  </label>
                  <textarea
                    id="system-prompt"
                    rows={5}
                    className="w-full text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-xl p-4 border border-gray-300 bg-white text-gray-900 hover:border-blue-300 transition-colors resize-none"
                    placeholder="e.g., You are a project manager. Focus on deadlines and blockers."
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    Provide custom instructions to guide the AI's response style
                    and focus.
                  </p>
                </div>
              </div>

              {/* Timestamp Prompt Section for Audio Mode */}
              {includeTimestamps && inputMode === "audio" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Timestamp Customization
                  </h3>
                  <div>
                    <label
                      htmlFor="timestamp-prompt"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Timestamp Prompt (Optional)
                    </label>
                    <textarea
                      id="timestamp-prompt"
                      rows={6}
                      className="w-full text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-xl p-4 border border-gray-300 bg-white text-gray-900 hover:border-blue-300 transition-colors resize-none"
                      placeholder="Custom instructions for adding timestamps..."
                      value={timestampPrompt}
                      onChange={(e) => setTimestampPrompt(e.target.value)}
                    />
                    <p className="mt-2 text-sm text-gray-500">
                      Customize how AI adds timestamps and speaker labels to
                      your transcript.
                    </p>
                  </div>
                </div>
              )}

              {/* Process Button */}
              <div className="pt-6 border-t border-gray-200">
                <div className="text-center">
                  <Button
                    onClick={() => {
                      // Set processing started state and scroll immediately
                      setHasStartedProcessing(true);
                      scrollToResults();
                      // Then start processing
                      processAudio();
                    }}
                    disabled={
                      !isInitialized ||
                      (inputMode === "audio" && !audioFile) ||
                      (inputMode === "transcript" &&
                        !providedTranscript.trim()) ||
                      (inputMode === "zoom" && !zoomMeetingId.trim()) ||
                      isTranscribing ||
                      isSummarizing
                    }
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-bold py-4 px-12 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl text-lg"
                  >
                    {isTranscribing
                      ? "Transcribing..."
                      : isSummarizing
                      ? "Generating Insights..."
                      : inputMode === "audio"
                      ? "Process Audio"
                      : inputMode === "zoom"
                      ? "Process Zoom Meeting"
                      : "Process Transcript"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

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
            summaryResult ||
            hasStartedProcessing) && (
            <Card
              ref={resultsSectionRef}
              className="bg-white shadow-xl border-0 rounded-2xl"
            >
              <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-2xl">
                <CardTitle className="text-2xl font-bold text-white">
                  Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {hasStartedProcessing &&
                    !isTranscribing &&
                    !isLabelingSpeakers &&
                    !isSummarizing &&
                    !summaryResult && (
                      <div className="flex items-center space-x-3 text-lg">
                        <Spinner />
                        <span>Starting processing...</span>
                      </div>
                    )}
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
                        <h3
                          className={`text-xl font-semibold mb-3 ${
                            theme === "dark"
                              ? "text-slate-300"
                              : "text-gray-900"
                          }`}
                        >
                          Transcript
                        </h3>
                        <div
                          className={`p-4 rounded-lg max-h-60 overflow-y-auto border ${
                            theme === "dark"
                              ? "bg-slate-900/70 border-slate-700"
                              : "bg-gray-100 border-gray-300"
                          }`}
                        >
                          <p
                            className={`whitespace-pre-wrap ${
                              theme === "dark"
                                ? "text-slate-400"
                                : "text-gray-700"
                            }`}
                          >
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
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};

export default App;
