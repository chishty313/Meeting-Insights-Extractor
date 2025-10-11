import React from "react";
import type { SummaryResult, ToDoItem } from "../types";
import { DocumentTextIcon } from "./icons/DocumentTextIcon";
import { CheckCircleIcon } from "./icons/CheckCircleIcon";
import { useTheme } from "../contexts/ThemeContext";

interface ResultsDisplayProps {
  result: SummaryResult;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ result }) => {
  const { theme } = useTheme();
  const hasStructured = !!(result.overview || result.toDoList);

  return (
    <div className="space-y-8 mt-6 animate-fade-in">
      {hasStructured ? (
        <>
          {/* Overview */}
          {result.overview && (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <DocumentTextIcon className="w-6 h-6 text-blue-500" />
                <h3 className="text-xl font-semibold text-gray-900">
                  Overview
                </h3>
              </div>
              <div className="p-6 rounded-xl border border-gray-200 bg-white shadow-sm">
                <p className="leading-relaxed text-gray-700">
                  {result.overview}
                </p>
              </div>
            </div>
          )}

          {/* To-Do List */}
          {result.toDoList && result.toDoList.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <CheckCircleIcon className="w-6 h-6 text-green-500" />
                <h3 className="text-xl font-semibold text-gray-900">
                  To-Do List
                </h3>
              </div>
              <div className="p-6 rounded-xl border border-gray-200 bg-white shadow-sm">
                {(() => {
                  // Group items by person
                  const groupedByPerson = result.toDoList.reduce(
                    (acc, item) => {
                      if (!acc[item.person]) {
                        acc[item.person] = [];
                      }
                      acc[item.person].push(item);
                      return acc;
                    },
                    {} as Record<string, ToDoItem[]>
                  );

                  // Sort people alphabetically
                  const sortedPeople = Object.keys(groupedByPerson).sort();

                  return (
                    <div className="space-y-6">
                      {sortedPeople.map((person) => {
                        const personItems = groupedByPerson[person];

                        // Separate Actions and Takeaways
                        const actions = personItems.filter(
                          (item) => item.type === "action"
                        );
                        const takeaways = personItems.filter(
                          (item) => item.type === "takeaway"
                        );

                        return (
                          <div
                            key={person}
                            className="border-l-2 border-blue-500 pl-4"
                          >
                            <h4 className="text-lg font-semibold text-blue-600 mb-4">
                              {person}
                            </h4>

                            {/* Actions Section */}
                            {actions.length > 0 && (
                              <div className="mb-4">
                                <h5 className="text-md font-medium text-green-600 mb-2 flex items-center">
                                  <span className="mr-2">✓</span>
                                  Actions
                                </h5>
                                <ul className="space-y-2 ml-4">
                                  {actions.map((item, index) => (
                                    <li
                                      key={`action-${index}`}
                                      className="flex items-start"
                                    >
                                      <span className="text-green-600 mr-3 mt-1">
                                        ✓
                                      </span>
                                      <span className="text-gray-700">
                                        {item.task}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Takeaways Section */}
                            {takeaways.length > 0 && (
                              <div>
                                <h5 className="text-md font-medium text-blue-600 mb-2 flex items-center">
                                  <span className="mr-2">•</span>
                                  Takeaways
                                </h5>
                                <ul className="space-y-2 ml-4">
                                  {takeaways.map((item, index) => (
                                    <li
                                      key={`takeaway-${index}`}
                                      className="flex items-start"
                                    >
                                      <span className="text-blue-600 mr-3 mt-1">
                                        •
                                      </span>
                                      <span className="text-gray-700">
                                        {item.task}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
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
              <h3
                className={`text-xl font-semibold ${
                  theme === "dark" ? "text-slate-300" : "text-gray-900"
                }`}
              >
                Summary
              </h3>
            </div>
            <div
              className={`p-4 rounded-lg border ${
                theme === "dark"
                  ? "bg-slate-900/70 border-slate-700"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              <p
                className={`leading-relaxed ${
                  theme === "dark" ? "text-slate-300" : "text-gray-700"
                }`}
              >
                {result.summary}
              </p>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-3">
              <CheckCircleIcon className="w-6 h-6 text-green-400" />
              <h3
                className={`text-xl font-semibold ${
                  theme === "dark" ? "text-slate-300" : "text-gray-900"
                }`}
              >
                Action Items
              </h3>
            </div>
            <div
              className={`p-4 rounded-lg border ${
                theme === "dark"
                  ? "bg-slate-900/70 border-slate-700"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              {result.tasks && result.tasks.length > 0 ? (
                <ul className="space-y-3">
                  {result.tasks.map((task, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-green-400 mr-3 mt-1">&#10003;</span>
                      <span
                        className={`${
                          theme === "dark" ? "text-slate-300" : "text-gray-700"
                        }`}
                      >
                        {task}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p
                  className={`${
                    theme === "dark" ? "text-slate-500" : "text-gray-500"
                  }`}
                >
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
