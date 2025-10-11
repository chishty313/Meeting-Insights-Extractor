import React from "react";

interface ZoomMeetingInputProps {
  meetingId: string;
  onMeetingIdChange: (meetingId: string) => void;
  disabled?: boolean;
  isConfigured?: boolean;
}

const ZoomMeetingInput: React.FC<ZoomMeetingInputProps> = ({
  meetingId,
  onMeetingIdChange,
  disabled = false,
  isConfigured = true,
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Extract meeting ID from various Zoom URL formats
    let value = e.target.value.trim();

    // Handle different Zoom URL formats
    if (value.includes("zoom.us/j/")) {
      // Extract from https://zoom.us/j/123456789
      const match = value.match(/zoom\.us\/j\/(\d+)/);
      if (match) {
        value = match[1];
      }
    } else if (value.includes("zoom.us/my/")) {
      // Extract from personal meeting room URLs
      const match = value.match(/zoom\.us\/my\/([^?]+)/);
      if (match) {
        value = match[1];
      }
    }

    onMeetingIdChange(value);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label
          htmlFor="zoom-meeting-id"
          className="block text-sm font-semibold text-gray-700"
        >
          Zoom Meeting ID
        </label>
        <span className="text-xs text-gray-500">Required for Zoom API</span>
      </div>

      <input
        id="zoom-meeting-id"
        type="text"
        className="w-full h-11 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-xl p-4 border border-gray-300 bg-white text-gray-900 hover:border-blue-300 transition-colors"
        placeholder="Enter Zoom Meeting ID or URL (e.g., 123456789 or https://zoom.us/j/123456789)"
        value={meetingId}
        onChange={handleInputChange}
        disabled={disabled}
      />

      {!isConfigured && (
        <div className="px-4 py-3 rounded-xl text-sm border bg-yellow-50 border-yellow-200 text-yellow-800">
          <strong>⚠️ Zoom API credentials not configured</strong>
          <p className="mt-1">
            Add ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET, and ZOOM_ACCOUNT_ID to your
            .env file to use this feature.
          </p>
        </div>
      )}

      <div className="text-xs space-y-1 text-gray-500">
        <p>• Enter the 9-11 digit meeting ID from your Zoom meeting</p>
        <p>• Or paste the full Zoom meeting URL</p>
        <p>• Meeting must be recorded with transcription enabled</p>
      </div>
    </div>
  );
};

export default ZoomMeetingInput;
