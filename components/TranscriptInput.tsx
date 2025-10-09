import React, { useCallback } from "react";

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
      if (file && (file.type === "text/plain" || file.name.endsWith(".txt"))) {
        const text = await file.text();
        onChange(text);
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
          className="block text-sm font-medium text-slate-300"
        >
          Transcript
        </label>
        <label className="text-sm text-cyan-400 hover:underline cursor-pointer">
          <input
            type="file"
            accept=".txt,text/plain"
            className="hidden"
            onChange={onFileChange}
          />
          Upload .txt
        </label>
      </div>
      <textarea
        id="transcript-text"
        rows={8}
        className="mt-1 block w-full text-base bg-slate-900 border-slate-700 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm rounded-md text-white p-3"
        placeholder="Paste your transcript here (optionally with Speaker 1:, Speaker 2: labels)"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <p className="text-xs text-slate-500">
        Tip: If your transcript already has speaker labels (e.g., "Speaker 1:"),
        we will keep them.
      </p>
    </div>
  );
};

export default TranscriptInput;
