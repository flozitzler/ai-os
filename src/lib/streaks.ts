import { format, subDays } from "date-fns";
import type { HabitData, HabitStreak } from "./types";

export function calculateStreak(
  habitId: string,
  completions: HabitData["completions"]
): HabitStreak {
  const today = new Date();
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let missedYesterday = false;

  // Check yesterday
  const yesterday = format(subDays(today, 1), "yyyy-MM-dd");
  const yesterdayDone = completions[yesterday]?.[habitId] ?? false;
  missedYesterday = !yesterdayDone;

  // Walk backwards from yesterday to count current streak
  for (let i = 1; i <= 365; i++) {
    const date = format(subDays(today, i), "yyyy-MM-dd");
    const done = completions[date]?.[habitId] ?? false;
    if (done) {
      currentStreak++;
    } else {
      break;
    }
  }

  // If today is completed, add it
  const todayStr = format(today, "yyyy-MM-dd");
  if (completions[todayStr]?.[habitId]) {
    currentStreak++;
  }

  // Calculate longest streak (scan all dates)
  const dates = Object.keys(completions).sort();
  for (const date of dates) {
    if (completions[date]?.[habitId]) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }

  longestStreak = Math.max(longestStreak, currentStreak);

  return { habitId, currentStreak, longestStreak, missedYesterday };
}

export function calculateConsistency(
  habitId: string,
  completions: HabitData["completions"],
  days: number = 30
): number {
  const today = new Date();
  let completed = 0;
  for (let i = 0; i < days; i++) {
    const date = format(subDays(today, i), "yyyy-MM-dd");
    if (completions[date]?.[habitId]) completed++;
  }
  return Math.round((completed / days) * 100);
}

export function getWeekCompletions(
  habitId: string,
  completions: HabitData["completions"],
  weekStart: Date
): boolean[] {
  const result: boolean[] = [];
  for (let i = 0; i < 7; i++) {
    const date = format(subDays(weekStart, -i), "yyyy-MM-dd");
    result.push(completions[date]?.[habitId] ?? false);
  }
  return result;
}
