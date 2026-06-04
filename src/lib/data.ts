import { promises as fs } from "fs";
import path from "path";
import type {
  DailyCheckin,
  HabitData,
  GoalData,
  FinanceData,
  Profile,
  DecisionData,
  ShipData,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DAILY_DIR = path.join(DATA_DIR, "daily");

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

async function readJSON<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function writeJSON<T>(filePath: string, data: T): Promise<void> {
  try {
    await ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch {
    // Vercel's filesystem is read-only in production — silently skip writes
    console.warn(`[data] Write skipped (read-only filesystem): ${path.basename(filePath)}`);
  }
}

// Daily check-ins
export async function readDailyCheckin(
  date: string
): Promise<DailyCheckin | null> {
  return readJSON<DailyCheckin>(path.join(DAILY_DIR, `${date}.json`));
}

export async function writeDailyCheckin(
  date: string,
  data: DailyCheckin
): Promise<void> {
  await writeJSON(path.join(DAILY_DIR, `${date}.json`), data);
}

export async function listDailyCheckins(
  days: number = 30
): Promise<DailyCheckin[]> {
  await ensureDir(DAILY_DIR);
  try {
    const files = await fs.readdir(DAILY_DIR);
    const jsonFiles = files
      .filter((f) => f.endsWith(".json"))
      .sort()
      .reverse()
      .slice(0, days);

    const checkins: DailyCheckin[] = [];
    for (const file of jsonFiles) {
      const data = await readJSON<DailyCheckin>(path.join(DAILY_DIR, file));
      if (data) checkins.push(data);
    }
    return checkins;
  } catch {
    return [];
  }
}

// Habits
const HABITS_PATH = path.join(DATA_DIR, "habits.json");

const DEFAULT_HABITS: HabitData = {
  habits: [],
  completions: {},
};

export async function readHabits(): Promise<HabitData> {
  const data = await readJSON<HabitData>(HABITS_PATH);
  return data ?? DEFAULT_HABITS;
}

export async function writeHabits(data: HabitData): Promise<void> {
  await writeJSON(HABITS_PATH, data);
}

// Goals
const GOALS_PATH = path.join(DATA_DIR, "goals.json");

const DEFAULT_GOALS: GoalData = {
  quarter: "",
  goals: [],
};

export async function readGoals(): Promise<GoalData> {
  const data = await readJSON<GoalData>(GOALS_PATH);
  return data ?? DEFAULT_GOALS;
}

export async function writeGoals(data: GoalData): Promise<void> {
  await writeJSON(GOALS_PATH, data);
}

// Finance
const FINANCE_PATH = path.join(DATA_DIR, "finance.json");

const DEFAULT_FINANCE: FinanceData = {
  currency: "USD",
  transactions: [],
  categories: {
    income: ["salary", "freelance", "side-project", "other"],
    expense: ["food", "transport", "housing", "health", "entertainment", "tools", "education", "other"],
  },
};

export async function readFinance(): Promise<FinanceData> {
  const data = await readJSON<FinanceData>(FINANCE_PATH);
  return data ?? DEFAULT_FINANCE;
}

export async function writeFinance(data: FinanceData): Promise<void> {
  await writeJSON(FINANCE_PATH, data);
}

// Profile
const PROFILE_PATH = path.join(DATA_DIR, "profile.json");

export async function readProfile(): Promise<Profile | null> {
  return readJSON<Profile>(PROFILE_PATH);
}

export async function hasProfile(): Promise<boolean> {
  const profile = await readJSON<Profile>(PROFILE_PATH);
  return profile !== null;
}

export async function writeProfile(data: Profile): Promise<void> {
  await writeJSON(PROFILE_PATH, data);
}

// Decisions
const DECISIONS_PATH = path.join(DATA_DIR, "decisions.json");

const DEFAULT_DECISIONS: DecisionData = {
  decisions: [],
  categories: ["product", "hiring", "finance", "strategy", "personal", "tech", "marketing", "other"],
};

export async function readDecisions(): Promise<DecisionData> {
  const data = await readJSON<DecisionData>(DECISIONS_PATH);
  return data ?? DEFAULT_DECISIONS;
}

export async function writeDecisions(data: DecisionData): Promise<void> {
  await writeJSON(DECISIONS_PATH, data);
}

// Ship Log
const SHIPS_PATH = path.join(DATA_DIR, "ships.json");

const DEFAULT_SHIPS: ShipData = {
  entries: [],
  milestones: [
    { amount: 1, label: "First Dollar", reachedDate: null },
    { amount: 100, label: "$100", reachedDate: null },
    { amount: 1000, label: "$1K", reachedDate: null },
    { amount: 5000, label: "$5K", reachedDate: null },
    { amount: 10000, label: "$10K", reachedDate: null },
    { amount: 50000, label: "$50K", reachedDate: null },
    { amount: 100000, label: "$100K", reachedDate: null },
  ],
};

export async function readShips(): Promise<ShipData> {
  const data = await readJSON<ShipData>(SHIPS_PATH);
  return data ?? DEFAULT_SHIPS;
}

export async function writeShips(data: ShipData): Promise<void> {
  await writeJSON(SHIPS_PATH, data);
}
