import React from 'react';
import { InformationCircleIcon } from './icons/InformationCircleIcon';

interface ConfigurationNoticeProps {
  isGeminiConfigured: boolean;
  isAzureConfigured: boolean;
}

const ConfigurationNotice: React.FC<ConfigurationNoticeProps> = ({ isGeminiConfigured, isAzureConfigured }) => {
  if (isGeminiConfigured && isAzureConfigured) {
    return null;
  }

  return (
    <div className="bg-yellow-900/40 border border-yellow-700 text-yellow-300 px-4 py-3 rounded-lg flex items-start space-x-3">
      <div className="flex-shrink-0">
        <InformationCircleIcon className="w-6 h-6 text-yellow-400" />
      </div>
      <div>
        <h3 className="font-bold">Configuration Notice</h3>
        <p className="text-sm">Some AI models are unavailable. To enable all features, please set the following environment variables:</p>
        <ul className="list-disc list-inside text-sm mt-2">
          {!isGeminiConfigured && <li><code className="bg-yellow-900/50 p-1 rounded">API_KEY</code> for Google Gemini models.</li>}
          {!isAzureConfigured && <li><code className="bg-yellow-900/50 p-1 rounded">AZURE_OPENAI_API_KEY</code> &amp; <code className="bg-yellow-900/50 p-1 rounded">AZURE_OPENAI_ENDPOINT</code> for Azure models.</li>}
        </ul>
      </div>
    </div>
  );
};

export default ConfigurationNotice;
