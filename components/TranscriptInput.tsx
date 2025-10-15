import React, { useCallback } from "react";
import { parseVTTContent } from "../services/vttParser";
import { parsePdfFile } from "../services/pdfParser";

interface TranscriptInputProps {
  value: string;
  onChange: (text: string) => void;
}

const TranscriptInput: React.FC<TranscriptInputProps> = ({
  value,
  onChange,
}) => {
  const handleFile = useCallback(
    async (file: File) => {
      if (!file) return;

      // PDF handling
      if (
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf")
      ) {
        try {
          const text = await parsePdfFile(file);
          onChange(text);
          return;
        } catch (err) {
          console.error("Error parsing PDF:", err);
          return;
        }
      }

      // TXT/VTT handling
      if (
        file.type === "text/plain" ||
        file.name.endsWith(".txt") ||
        file.name.endsWith(".vtt") ||
        file.type === "text/vtt"
      ) {
        const text = await file.text();

        // Check if it's a VTT file
        if (
          file.name.endsWith(".vtt") ||
          file.type === "text/vtt" ||
          text.includes("WEBVTT")
        ) {
          try {
            const parsedTranscript = parseVTTContent(text, true); // Include timestamps
            onChange(parsedTranscript);
          } catch (error) {
            console.error("Error parsing VTT file:", error);
            // Fallback to raw text if VTT parsing fails
            onChange(text);
          }
        } else {
          onChange(text);
        }
      }
    },
    [onChange]
  );

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label
          htmlFor="transcript-text"
          className="block text-sm font-semibold text-gray-700"
        >
          Transcript
        </label>
        <label className="text-sm text-blue-600 hover:text-blue-700 hover:underline cursor-pointer transition-colors">
          <input
            type="file"
            accept=".txt,.vtt,.pdf,text/plain,text/vtt,application/pdf"
            className="hidden"
            onChange={onFileChange}
          />
          Upload .txt/.vtt/.pdf
        </label>
      </div>
      <textarea
        id="transcript-text"
        rows={10}
        className="w-full text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-xl p-4 border border-gray-300 bg-white text-gray-900 hover:border-blue-300 transition-colors resize-none"
        placeholder="Paste your transcript here or upload .txt/.vtt/.pdf files (optionally with Speaker 1:, Speaker 2: labels)"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <p className="text-xs text-gray-500">
        Tip: Upload .vtt files from Zoom or other sources. If your transcript
        already has speaker labels (e.g., "Speaker 1:"), we will keep them. PDFs
        are supported too.
      </p>
    </div>
  );
};

export default TranscriptInput;
