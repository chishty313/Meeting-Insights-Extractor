import React from "react";
import { InformationCircleIcon } from "./icons/InformationCircleIcon";

interface ConfigurationNoticeProps {
  isGeminiConfigured: boolean;
  isAzureConfigured: boolean;
}

const ConfigurationNotice: React.FC<ConfigurationNoticeProps> = ({
  isGeminiConfigured,
  isAzureConfigured,
}) => {
  if (isAzureConfigured) {
    return null;
  }

  return (
    <div className="bg-yellow-900/40 border border-yellow-700 text-yellow-300 px-4 py-3 rounded-lg flex items-start space-x-3">
      <div className="flex-shrink-0">
        <InformationCircleIcon className="w-6 h-6 text-yellow-400" />
      </div>
      <div>
        <h3 className="font-bold">Azure Configuration Required</h3>
        <p className="text-sm">
          Azure GPT-5 is not configured. To use the application, please set the
          following environment variables:
        </p>
        <ul className="list-disc list-inside text-sm mt-2">
          <li>
            <code className="bg-yellow-900/50 p-1 rounded">
              AZURE_OPENAI_API_KEY
            </code>{" "}
            - Your Azure OpenAI API key
          </li>
          <li>
            <code className="bg-yellow-900/50 p-1 rounded">
              AZURE_OPENAI_ENDPOINT
            </code>{" "}
            - Your Azure OpenAI endpoint URL
          </li>
        </ul>
        <p className="text-sm mt-2 text-yellow-200">
          <strong>Note:</strong> This application is optimized for Azure GPT-5.
          Other models are available as fallbacks only.
        </p>
      </div>
    </div>
  );
};

export default ConfigurationNotice;
