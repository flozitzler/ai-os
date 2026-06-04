export interface Priority {
  text: string;
  done: boolean;
}

export interface DailyCheckin {
  date: string;
  mood?: number;
  energy?: number;
  sleepHours?: number;
  dayRating?: number;
  gratitude?: string;
  notes?: string;
  morningCheckin?: string;
  topPriorities?: Priority[];
  wins?: string[];
  lessons?: string[];
  shipped?: string; // what did you ship today
  revenueToday?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Habit {
  id: string;
  name: string;
  emoji: string;
  block: "morning" | "day" | "evening";
  createdAt: string;
}

export interface HabitData {
  habits: Habit[];
  completions: Record<string, Record<string, boolean>>;
}

export interface KeyResult {
  id: string;
  text: string;
  done: boolean;
  progress: number;
}

export type GoalStatus = "not-started" | "planning" | "active" | "completed" | "abandoned";

export interface Goal {
  id: string;
  title: string;
  description: string;
  deadline: string;
  status: GoalStatus;
  keyResults: KeyResult[];
  lastWorkedOn: string | null;
  createdAt: string;
}

export interface GoalData {
  quarter: string;
  goals: Goal[];
}

export interface Transaction {
  id: string;
  date: string;
  type: "income" | "expense";
  category: string;
  amount: number;
  description: string;
  createdAt: string;
}

export interface FinanceData {
  currency: string;
  transactions: Transaction[];
  categories: {
    income: string[];
    expense: string[];
  };
}

export interface LifeArea {
  score: number;
  updatedAt: string;
}

export interface Profile {
  name: string;
  timezone: string;
  startDate: string;
  currentQuarter: string;
  lifeAreas: Record<string, LifeArea>;
}

// Decision Journal
export type DecisionStatus = "pending" | "resolved";
export type DecisionOutcome = "better-than-expected" | "as-expected" | "worse-than-expected" | null;

export interface Decision {
  id: string;
  date: string;
  title: string;
  context: string;
  options: string;
  decision: string;
  expectedOutcome: string;
  confidence: number; // 1-10
  stakes: "low" | "medium" | "high" | "critical";
  category: string;
  status: DecisionStatus;
  actualOutcome?: string;
  outcome?: DecisionOutcome;
  resolvedDate?: string;
  lessonsLearned?: string;
  createdAt: string;
}

export interface DecisionData {
  decisions: Decision[];
  categories: string[];
}

// Ship Log
export interface ShipEntry {
  id: string;
  date: string;
  title: string;
  description: string;
  category: "code" | "content" | "outreach" | "product" | "learning" | "automation" | "other";
  impact: "small" | "medium" | "big" | "launch";
  revenueGenerated?: number;
  createdAt: string;
}

export interface ShipData {
  entries: ShipEntry[];
  milestones: RevenueMilestone[];
}

export interface RevenueMilestone {
  amount: number;
  label: string;
  reachedDate: string | null;
}

export interface HabitStreak {
  habitId: string;
  currentStreak: number;
  longestStreak: number;
  missedYesterday: boolean;
}

export interface PulseData {
  dates: string[];
  mood: (number | null)[];
  energy: (number | null)[];
  sleep: (number | null)[];
  dayRating: (number | null)[];
}
