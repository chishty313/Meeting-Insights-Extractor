import React from "react";
import { SparklesIcon } from "./icons/SparklesIcon";

const Header: React.FC = () => {
  return (
    <header className="text-center mb-12">
      <div className="flex items-center justify-center gap-4 mb-6">
        <SparklesIcon className="w-12 h-12 text-blue-600" />
        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
          Meeting Insights Extractor
        </h1>
      </div>
      <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
        Transform your meeting recordings into actionable insights with
        AI-powered transcription and analysis.
      </p>
    </header>
  );
};

export default Header;
