export interface Model {
  id: string;
  name: string;
  description: string;
  provider: "gemini" | "azure" | "simulated";
}

export interface SummaryResult {
  // Legacy fields (kept for compatibility)
  summary?: string;
  tasks?: string[];

  // New structured sections
  overview?: string; // 2-3 sentence executive summary
  keyTakeaways?: string[]; // 4-7 bullets
  nextSteps?: string[]; // actionable items (may include assignees in text)
  keyTopics?: string[]; // 5-8 concise topic phrases
}
