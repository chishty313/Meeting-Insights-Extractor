// Zoom API Service for fetching meeting transcripts
// This service handles authentication and transcript retrieval from Zoom recordings

import { parseVTTContent } from "./vttParser";

const ZOOM_CLIENT_ID = process.env.ZOOM_CLIENT_ID;
const ZOOM_CLIENT_SECRET = process.env.ZOOM_CLIENT_SECRET;
const ZOOM_ACCOUNT_ID = process.env.ZOOM_ACCOUNT_ID;
const ZOOM_BASE_URL = "https://api.zoom.us/v2";

// Interface for Zoom API responses
interface ZoomAccessToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

interface ZoomRecording {
  id: string;
  meeting_id: string;
  recording_start: string;
  recording_end: string;
  file_type: string;
  file_size: number;
  play_url: string;
  download_url: string;
  status: string;
  recording_files: ZoomRecordingFile[];
}

interface ZoomRecordingFile {
  id: string;
  meeting_id: string;
  recording_start: string;
  recording_end: string;
  file_type: string;
  file_size: number;
  play_url: string;
  download_url: string;
  status: string;
  file_extension: string;
}

interface ZoomMeetingRecordings {
  uuid: string;
  id: string;
  account_id: string;
  host_id: string;
  topic: string;
  type: number;
  start_time: string;
  timezone: string;
  duration: number;
  total_size: number;
  recording_count: number;
  recording_files: ZoomRecordingFile[];
}

// Get Zoom access token using Server-to-Server OAuth
export const getZoomAccessToken = async (): Promise<string> => {
  if (!ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET || !ZOOM_ACCOUNT_ID) {
    throw new Error(
      "Zoom API credentials not configured. Please set ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET, and ZOOM_ACCOUNT_ID environment variables."
    );
  }

  try {
    const response = await fetch("https://zoom.us/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${btoa(
          `${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`
        )}`,
      },
      body: new URLSearchParams({
        grant_type: "account_credentials",
        account_id: ZOOM_ACCOUNT_ID,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Zoom OAuth failed: ${errorData.error_description || errorData.error}`
      );
    }

    const data: ZoomAccessToken = await response.json();
    return data.access_token;
  } catch (error) {
    console.error("Error getting Zoom access token:", error);
    throw error;
  }
};

// Get meeting recordings by meeting ID
export const getMeetingRecordings = async (
  meetingId: string
): Promise<ZoomMeetingRecordings> => {
  const accessToken = await getZoomAccessToken();

  try {
    const response = await fetch(
      `${ZOOM_BASE_URL}/meetings/${meetingId}/recordings`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Failed to get meeting recordings: ${
          errorData.message || errorData.error
        }`
      );
    }

    const data: ZoomMeetingRecordings = await response.json();
    return data;
  } catch (error) {
    console.error("Error getting meeting recordings:", error);
    throw error;
  }
};

// Get transcript from recording files
export const getTranscriptFromRecording = async (
  recordingFiles: ZoomRecordingFile[]
): Promise<string> => {
  // Find transcript file (usually VTT format)
  const transcriptFile = recordingFiles.find(
    (file) => file.file_type === "TRANSCRIPT" || file.file_extension === "vtt"
  );

  if (!transcriptFile) {
    throw new Error(
      "No transcript file found in the recording. Please ensure the meeting was recorded with transcription enabled."
    );
  }

  try {
    // Download the transcript file
    const response = await fetch(transcriptFile.download_url);

    if (!response.ok) {
      throw new Error(`Failed to download transcript: ${response.statusText}`);
    }

    const vttContent = await response.text();
    return parseVTTContent(vttContent, false); // No timestamps for basic transcript
  } catch (error) {
    console.error("Error downloading transcript:", error);
    throw error;
  }
};

// Parse VTT (WebVTT) transcript to readable format
export const parseVTTTranscript = (vttContent: string): string => {
  try {
    // Remove VTT header and metadata
    const lines = vttContent
      .split("\n")
      .filter(
        (line) =>
          line.trim() !== "" &&
          !line.startsWith("WEBVTT") &&
          !line.includes("-->") &&
          !/^\d+$/.test(line.trim())
      );

    // Join all text lines
    const transcript = lines.join(" ").trim();

    // Clean up extra spaces
    return transcript.replace(/\s+/g, " ");
  } catch (error) {
    console.error("Error parsing VTT transcript:", error);
    throw new Error("Failed to parse transcript file");
  }
};

// Get transcript with timestamps from VTT
export const parseVTTTranscriptWithTimestamps = (
  vttContent: string
): string => {
  try {
    const lines = vttContent.split("\n");
    let result = "";
    let currentSpeaker = 1;
    let lastTimestamp = "";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip empty lines, WEBVTT header, and line numbers
      if (!line || line === "WEBVTT" || /^\d+$/.test(line)) {
        continue;
      }

      // Check if this line contains timestamps (format: 00:00:00.000 --> 00:00:05.000)
      if (line.includes("-->")) {
        const timestampMatch = line.match(/(\d{2}:\d{2}:\d{2}\.\d{3})/);
        if (timestampMatch) {
          lastTimestamp = timestampMatch[1];
        }
        continue;
      }

      // This is a text line
      if (line && !line.includes("-->")) {
        // Add speaker and timestamp if we have a timestamp
        if (lastTimestamp) {
          const timeFormatted = lastTimestamp.split(".")[0]; // Remove milliseconds
          result += `Speaker ${currentSpeaker}: [${timeFormatted}] ${line}\n`;
          currentSpeaker = currentSpeaker === 1 ? 2 : 1; // Alternate speakers
        } else {
          result += `${line}\n`;
        }
      }
    }

    return result.trim();
  } catch (error) {
    console.error("Error parsing VTT transcript with timestamps:", error);
    throw new Error("Failed to parse transcript with timestamps");
  }
};

// Main function to get transcript from Zoom meeting
export const getZoomTranscript = async (
  meetingId: string,
  includeTimestamps: boolean = false
): Promise<string> => {
  try {
    console.log(`Fetching transcript for meeting: ${meetingId}`);

    // Get meeting recordings
    const recordings = await getMeetingRecordings(meetingId);

    if (
      !recordings.recording_files ||
      recordings.recording_files.length === 0
    ) {
      throw new Error(
        "No recording files found for this meeting. Please ensure the meeting was recorded."
      );
    }

    console.log(`Found ${recordings.recording_files.length} recording files`);

    // Get transcript from recording files
    const transcript = await getTranscriptFromRecording(
      recordings.recording_files
    );

    if (includeTimestamps) {
      // If timestamps are requested, we need to re-parse the VTT with timestamp info
      const transcriptFile = recordings.recording_files.find(
        (file) =>
          file.file_type === "TRANSCRIPT" || file.file_extension === "vtt"
      );

      if (transcriptFile) {
        const response = await fetch(transcriptFile.download_url);
        const vttContent = await response.text();
        return parseVTTContent(vttContent, true); // Include timestamps for Zoom mode
      }
    }

    return transcript;
  } catch (error) {
    console.error("Error getting Zoom transcript:", error);
    throw error;
  }
};

// Test function to verify Zoom API connection
export const testZoomConnection = async (): Promise<boolean> => {
  try {
    await getZoomAccessToken();
    return true;
  } catch (error) {
    console.error("Zoom API connection test failed:", error);
    return false;
  }
};
