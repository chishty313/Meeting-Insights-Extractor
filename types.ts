export interface Model {
  id: string;
  name: string;
  description: string;
  provider: "gemini" | "azure" | "simulated" | "zoom";
}

export interface SummaryResult {
  // Legacy fields (kept for compatibility)
  summary?: string;
  tasks?: string[];

  // New structured sections
  overview?: string; // 2-3 sentence executive summary
  toDoList?: ToDoItem[]; // Combined takeaways and next steps, sorted by person
}

export interface ToDoItem {
  person: string; // Person assigned to the task
  task: string; // The actual task description
  type: "takeaway" | "action"; // Whether it's a key takeaway or actionable step
}
