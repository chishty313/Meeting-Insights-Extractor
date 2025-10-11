import React from "react";
import type { Model } from "../types";

interface ModelSelectorProps {
  label: string;
  models: Model[];
  selectedValue: string;
  onChange: (value: string) => void;
  helpText?: string;
  disabled?: boolean;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({
  label,
  models,
  selectedValue,
  onChange,
  helpText,
  disabled = false,
}) => {
  return (
    <div className="space-y-2">
      <label
        htmlFor={label}
        className="block text-sm font-semibold text-gray-700"
      >
        {label}
      </label>
      <select
        id={label}
        value={selectedValue}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full h-11 pl-3 pr-10 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-xl border border-gray-300 bg-white text-gray-900 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
      >
        {models.length > 0 ? (
          models.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name}
            </option>
          ))
        ) : (
          <option value="">No models configured</option>
        )}
      </select>
      {helpText && <p className="text-sm text-gray-500">{helpText}</p>}
    </div>
  );
};

export default ModelSelector;
