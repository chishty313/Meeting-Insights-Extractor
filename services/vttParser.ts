// VTT (WebVTT) Parser for meeting transcripts
// Handles both file uploads and Zoom API responses

export interface VTTEntry {
  start: number;
  end: number;
  text: string;
  speaker?: string;
}

export const parseVTTContent = (
  vttContent: string,
  includeTimestamps: boolean = true
): string => {
  try {
    const lines = vttContent.split("\n");
    let transcript = "";
    let currentSpeaker = 1;
    let lastTimestamp = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip WebVTT header, empty lines, and cue identifiers
      if (
        line.startsWith("WEBVTT") ||
        line.startsWith("Kind:") ||
        line.startsWith("Language:") ||
        line.trim() === "" ||
        /^\d+$/.test(line.trim())
      ) {
        continue;
      }

      // Match timestamp and text (e.g., "00:00:00.000 --> 00:00:05.000")
      const timestampMatch = line.match(
        /(\d{2}):(\d{2}):(\d{2})\.\d{3}\s*-->\s*(\d{2}):(\d{2}):(\d{2})\.\d{3}/
      );
      if (timestampMatch) {
        if (includeTimestamps) {
          const startSeconds =
            parseInt(timestampMatch[1]) * 3600 +
            parseInt(timestampMatch[2]) * 60 +
            parseInt(timestampMatch[3]);
          const minutes = Math.floor(startSeconds / 60);
          const seconds = startSeconds % 60;
          const timeString = `[${minutes.toString().padStart(2, "0")}:${seconds
            .toString()
            .padStart(2, "0")}]`;

          // Simple speaker alternation for VTT if no speaker info is embedded
          if (startSeconds - lastTimestamp > 5) {
            // Arbitrary threshold for new speaker/segment
            currentSpeaker = currentSpeaker === 1 ? 2 : 1;
          }
          transcript += `\nSpeaker ${currentSpeaker}: ${timeString} `;
          lastTimestamp = startSeconds;
        }
        // Remove timestamp string from the line to get just the text
        transcript += line.replace(timestampMatch[0], "").trim() + "\n";
      } else {
        // If no timestamp, just append the line (might be speaker name or actual text)
        transcript += line.trim() + "\n";
      }
    }

    return transcript.trim();
  } catch (error) {
    console.error("Error parsing VTT content:", error);
    throw new Error("Failed to parse VTT content");
  }
};

export const parseVTTToEntries = (vttContent: string): VTTEntry[] => {
  try {
    const lines = vttContent.split("\n");
    const entries: VTTEntry[] = [];
    let currentEntry: Partial<VTTEntry> = {};

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip WebVTT header and metadata
      if (
        line.startsWith("WEBVTT") ||
        line.startsWith("Kind:") ||
        line.startsWith("Language:") ||
        line.trim() === ""
      ) {
        continue;
      }

      // Match timestamp line (e.g., "00:00:00.000 --> 00:00:05.000")
      const timestampMatch = line.match(
        /(\d{2}):(\d{2}):(\d{2})\.(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})\.(\d{3})/
      );
      if (timestampMatch) {
        const startHours = parseInt(timestampMatch[1]);
        const startMinutes = parseInt(timestampMatch[2]);
        const startSeconds = parseInt(timestampMatch[3]);
        const startMs = parseInt(timestampMatch[4]);

        const endHours = parseInt(timestampMatch[5]);
        const endMinutes = parseInt(timestampMatch[6]);
        const endSeconds = parseInt(timestampMatch[7]);
        const endMs = parseInt(timestampMatch[8]);

        currentEntry.start =
          startHours * 3600 + startMinutes * 60 + startSeconds + startMs / 1000;
        currentEntry.end =
          endHours * 3600 + endMinutes * 60 + endSeconds + endMs / 1000;
      } else if (
        currentEntry.start !== undefined &&
        currentEntry.end !== undefined
      ) {
        // This is the text content
        if (line.trim() !== "") {
          currentEntry.text = line.trim();
          entries.push(currentEntry as VTTEntry);
          currentEntry = {};
        }
      }
    }

    return entries;
  } catch (error) {
    console.error("Error parsing VTT to entries:", error);
    throw new Error("Failed to parse VTT to entries");
  }
};

export const formatVTTEntriesToTranscript = (
  entries: VTTEntry[],
  includeTimestamps: boolean = true
): string => {
  let transcript = "";
  let currentSpeaker = 1;
  let lastTimestamp = 0;

  for (const entry of entries) {
    if (includeTimestamps) {
      const minutes = Math.floor(entry.start / 60);
      const seconds = Math.floor(entry.start % 60);
      const timeString = `[${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}]`;

      // Simple speaker alternation
      if (entry.start - lastTimestamp > 5) {
        currentSpeaker = currentSpeaker === 1 ? 2 : 1;
      }

      transcript += `\nSpeaker ${currentSpeaker}: ${timeString} ${entry.text}`;
      lastTimestamp = entry.start;
    } else {
      transcript += `\n${entry.text}`;
    }
  }

  return transcript.trim();
};
