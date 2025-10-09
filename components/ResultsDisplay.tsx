import React from "react";
import type { SummaryResult } from "../types";
import { DocumentTextIcon } from "./icons/DocumentTextIcon";
import { CheckCircleIcon } from "./icons/CheckCircleIcon";

interface ResultsDisplayProps {
  result: SummaryResult;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ result }) => {
  const hasStructured = !!(
    result.overview ||
    result.keyTakeaways ||
    result.nextSteps ||
    result.keyTopics
  );

  return (
    <div className="space-y-8 mt-6 animate-fade-in">
      {hasStructured ? (
        <>
          {/* Overview */}
          {result.overview && (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <DocumentTextIcon className="w-6 h-6 text-violet-400" />
                <h3 className="text-xl font-semibold text-slate-300">
                  Overview
                </h3>
              </div>
              <div className="bg-slate-900/70 p-4 rounded-lg border border-slate-700">
                <p className="text-slate-300 leading-relaxed">
                  {result.overview}
                </p>
              </div>
            </div>
          )}

          {/* Key Takeaways */}
          {result.keyTakeaways && result.keyTakeaways.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <DocumentTextIcon className="w-6 h-6 text-violet-400" />
                <h3 className="text-xl font-semibold text-slate-300">
                  Key Takeaways
                </h3>
              </div>
              <div className="bg-slate-900/70 p-4 rounded-lg border border-slate-700">
                <ul className="space-y-3 list-disc pl-5 text-slate-300">
                  {result.keyTakeaways.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Next Steps */}
          {result.nextSteps && result.nextSteps.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <CheckCircleIcon className="w-6 h-6 text-green-400" />
                <h3 className="text-xl font-semibold text-slate-300">
                  Next Steps
                </h3>
              </div>
              <div className="bg-slate-900/70 p-4 rounded-lg border border-slate-700">
                <ul className="space-y-3">
                  {result.nextSteps.map((task, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-green-400 mr-3 mt-1">&#10003;</span>
                      <span className="text-slate-300">{task}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Key Topics */}
          {result.keyTopics && result.keyTopics.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <DocumentTextIcon className="w-6 h-6 text-violet-400" />
                <h3 className="text-xl font-semibold text-slate-300">
                  Key Topics
                </h3>
              </div>
              <div className="bg-slate-900/70 p-4 rounded-lg border border-slate-700">
                <ul className="space-y-2 list-disc pl-5 text-slate-300">
                  {result.keyTopics.map((topic, idx) => (
                    <li key={idx}>{topic}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </>
      ) : (
        // Backward compatibility: Summary + Tasks
        <>
          <div>
            <div className="flex items-center gap-3 mb-3">
              <DocumentTextIcon className="w-6 h-6 text-violet-400" />
              <h3 className="text-xl font-semibold text-slate-300">Summary</h3>
            </div>
            <div className="bg-slate-900/70 p-4 rounded-lg border border-slate-700">
              <p className="text-slate-300 leading-relaxed">{result.summary}</p>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-3">
              <CheckCircleIcon className="w-6 h-6 text-green-400" />
              <h3 className="text-xl font-semibold text-slate-300">
                Action Items
              </h3>
            </div>
            <div className="bg-slate-900/70 p-4 rounded-lg border border-slate-700">
              {result.tasks && result.tasks.length > 0 ? (
                <ul className="space-y-3">
                  {result.tasks.map((task, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-green-400 mr-3 mt-1">&#10003;</span>
                      <span className="text-slate-300">{task}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-500">
                  No specific action items were identified.
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ResultsDisplay;
