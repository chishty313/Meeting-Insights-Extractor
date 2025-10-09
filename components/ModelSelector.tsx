import React from 'react';
import type { Model } from '../types';

interface ModelSelectorProps {
  label: string;
  models: Model[];
  selectedValue: string;
  onChange: (value: string) => void;
  helpText?: string;
  disabled?: boolean;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ label, models, selectedValue, onChange, helpText, disabled = false }) => {
  return (
    <div>
      <label htmlFor={label} className="block text-sm font-medium text-slate-300">
        {label}
      </label>
      <select
        id={label}
        value={selectedValue}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-slate-900 border-slate-700 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm rounded-md text-white disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed"
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
      {helpText && <p className="mt-2 text-sm text-slate-500">{helpText}</p>}
    </div>
  );
};

export default ModelSelector;
