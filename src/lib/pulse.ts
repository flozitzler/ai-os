import { format, subDays } from "date-fns";
import type { DailyCheckin, PulseData } from "./types";
import { listDailyCheckins } from "./data";

export async function getPulseData(days: number = 30): Promise<PulseData> {
  const checkins = await listDailyCheckins(days);
  const checkinMap = new Map<string, DailyCheckin>();
  for (const c of checkins) {
    checkinMap.set(c.date, c);
  }

  const today = new Date();
  const dates: string[] = [];
  const mood: (number | null)[] = [];
  const energy: (number | null)[] = [];
  const sleep: (number | null)[] = [];
  const dayRating: (number | null)[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = format(subDays(today, i), "yyyy-MM-dd");
    const checkin = checkinMap.get(date);
    dates.push(date);
    mood.push(checkin?.mood ?? null);
    energy.push(checkin?.energy ?? null);
    sleep.push(checkin?.sleepHours ?? null);
    dayRating.push(checkin?.dayRating ?? null);
  }

  return { dates, mood, energy, sleep, dayRating };
}

export function calculateAverage(values: (number | null)[]): number | null {
  const valid = values.filter((v): v is number => v !== null);
  if (valid.length === 0) return null;
  return Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 10) / 10;
}

export function calculateTrend(values: (number | null)[]): "up" | "down" | "stable" {
  const valid = values.filter((v): v is number => v !== null);
  if (valid.length < 3) return "stable";
  const recent = valid.slice(-3);
  const earlier = valid.slice(-6, -3);
  if (earlier.length === 0) return "stable";
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length;
  const diff = recentAvg - earlierAvg;
  if (diff > 0.5) return "up";
  if (diff < -0.5) return "down";
  return "stable";
}
