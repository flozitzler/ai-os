import { format, subDays, differenceInDays, getDay } from "date-fns";
import type { DailyCheckin, HabitData, GoalData, FinanceData, Goal } from "./types";

export interface Nudge {
  id: string;
  type: "streak" | "pattern-interrupt" | "financial" | "intervention" | "goal" | "motivation";
  icon: string;
  message: string;
  urgency: "high" | "medium" | "low";
  priority: number;
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function generateNudges(
  checkins: DailyCheckin[],
  habits: HabitData,
  goals: GoalData,
  finance?: FinanceData
): Nudge[] {
  const nudges: Nudge[] = [];
  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");
  const dayName = DAY_NAMES[getDay(today)];

  // --- STREAK AT RISK ---
  for (const habit of habits.habits) {
    // Calculate current streak
    let streak = 0;
    for (let i = 1; i <= 365; i++) {
      const d = format(subDays(today, i), "yyyy-MM-dd");
      if (habits.completions[d]?.[habit.id]) streak++;
      else break;
    }

    const doneToday = habits.completions[todayStr]?.[habit.id];

    if (streak >= 7 && !doneToday) {
      nudges.push({
        id: `streak-risk-${habit.id}`,
        type: "streak",
        icon: "flame",
        message: `Don't break your ${streak}-day streak! ${habit.name} now.`,
        urgency: "high",
        priority: 95,
      });
    } else if (streak >= 3 && !doneToday) {
      nudges.push({
        id: `streak-keep-${habit.id}`,
        type: "streak",
        icon: "flame",
        message: `${streak}-day ${habit.name} streak going. Keep it alive today.`,
        urgency: "medium",
        priority: 75,
      });
    }
  }

  // --- PATTERN INTERRUPT (day-of-week habit skip pattern) ---
  if (habits.habits.length > 0 && checkins.length >= 14) {
    for (const habit of habits.habits) {
      // Check if this day of week is a common skip day for this habit
      let skipCount = 0;
      let totalWeeks = 0;

      for (let w = 1; w <= 8; w++) {
        const d = format(subDays(today, w * 7), "yyyy-MM-dd");
        if (habits.completions[d] !== undefined || checkins.some((c) => c.date === d)) {
          totalWeeks++;
          if (!habits.completions[d]?.[habit.id]) skipCount++;
        }
      }

      if (totalWeeks >= 3 && skipCount / totalWeeks >= 0.6) {
        const doneToday = habits.completions[todayStr]?.[habit.id];
        if (!doneToday) {
          nudges.push({
            id: `pattern-interrupt-${habit.id}`,
            type: "pattern-interrupt",
            icon: "zap",
            message: `You usually skip ${habit.name} on ${dayName}s. Today is ${dayName}. Prove the data wrong.`,
            urgency: "medium",
            priority: 82,
          });
        }
      }
    }
  }

  // --- FINANCIAL WARNING ---
  if (finance && finance.transactions.length > 0) {
    // Weekly spending by category
    const weekTxns = finance.transactions.filter((t) => {
      const d = differenceInDays(today, new Date(t.date));
      return d >= 0 && d < 7 && t.type === "expense";
    });

    const catSpending: Record<string, number> = {};
    for (const t of weekTxns) {
      catSpending[t.category] = (catSpending[t.category] || 0) + t.amount;
    }

    // Alert on high-spending categories this week
    for (const [category, amount] of Object.entries(catSpending)) {
      // Compare to monthly average for this category
      const allCatTxns = finance.transactions.filter(
        (t) => t.type === "expense" && t.category === category
      );
      if (allCatTxns.length >= 4) {
        const totalDays = Math.max(
          1,
          differenceInDays(
            today,
            new Date(allCatTxns.sort((a, b) => a.date.localeCompare(b.date))[0].date)
          )
        );
        const weeklyAvg = (allCatTxns.reduce((s, t) => s + t.amount, 0) / totalDays) * 7;
        if (weeklyAvg > 0 && amount > weeklyAvg * 1.5) {
          nudges.push({
            id: `finance-warn-${category}`,
            type: "financial",
            icon: "wallet",
            message: `You've spent ${formatCurrency(amount, finance.currency)} on ${category} this week. Your weekly average is ${formatCurrency(Math.round(weeklyAvg), finance.currency)}.`,
            urgency: "medium",
            priority: 78,
          });
        }
      }
    }

    // Monthly spending pulse
    const thisMonth = format(today, "yyyy-MM");
    const monthExpenses = finance.transactions
      .filter((t) => t.date.startsWith(thisMonth) && t.type === "expense")
      .reduce((s, t) => s + t.amount, 0);
    const monthIncome = finance.transactions
      .filter((t) => t.date.startsWith(thisMonth) && t.type === "income")
      .reduce((s, t) => s + t.amount, 0);

    if (monthIncome > 0 && monthExpenses > monthIncome * 0.8) {
      const pct = Math.round((monthExpenses / monthIncome) * 100);
      nudges.push({
        id: "finance-overspend",
        type: "financial",
        icon: "alert-triangle",
        message: `You've spent ${pct}% of this month's income already. ${monthExpenses > monthIncome ? "You're in the red." : "Tread carefully."}`,
        urgency: "high",
        priority: 90,
      });
    }
  }

  // --- MOOD INTERVENTION ---
  if (checkins.length >= 3) {
    const recent = checkins
      .filter((c) => c.mood != null)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 3);

    const recentLowMood = recent.filter((c) => c.mood! <= 5);

    if (recentLowMood.length >= 3) {
      // Find what fixed low mood in the past
      let fixMessage = "";
      const pastLowPeriods = findLowMoodRecoveries(checkins, habits);
      if (pastLowPeriods) {
        fixMessage = ` Last time this happened, ${pastLowPeriods} helped.`;
      }

      nudges.push({
        id: "mood-intervention",
        type: "intervention",
        icon: "heart",
        message: `Your mood has been below 6 for ${recentLowMood.length} days.${fixMessage || " Consider doing something that usually lifts you up."}`,
        urgency: "high",
        priority: 92,
      });
    }
  }

  // --- GOAL MATH ---
  for (const goal of goals.goals) {
    if (goal.status === "completed" || goal.status === "abandoned") continue;

    const daysLeft = differenceInDays(new Date(goal.deadline), today);
    const progress = goalProgress(goal);

    if (daysLeft > 0 && daysLeft <= 60 && progress < 100) {
      const remaining = 100 - progress;
      const weeksLeft = Math.ceil(daysLeft / 7);
      const pctPerWeek = Math.round(remaining / weeksLeft);

      if (pctPerWeek > 10) {
        nudges.push({
          id: `goal-math-${goal.id}`,
          type: "goal",
          icon: "target",
          message: `"${goal.title}" is at ${progress}%. You need ${pctPerWeek}% progress per week to hit it by ${format(new Date(goal.deadline), "MMM d")}.`,
          urgency: daysLeft <= 14 ? "high" : "medium",
          priority: daysLeft <= 14 ? 88 : 70,
        });
      }
    }

    // Goal not worked on recently
    if (goal.lastWorkedOn) {
      const daysSince = differenceInDays(today, new Date(goal.lastWorkedOn));
      if (daysSince >= 5 && daysSince < 14) {
        nudges.push({
          id: `goal-neglect-nudge-${goal.id}`,
          type: "goal",
          icon: "target",
          message: `Haven't touched "${goal.title}" in ${daysSince} days. What's one small step you can take today?`,
          urgency: "medium",
          priority: 68,
        });
      }
    }
  }

  // --- MORNING MOTIVATION ---
  if (checkins.length >= 7) {
    const yesterday = format(subDays(today, 1), "yyyy-MM-dd");
    const yesterdayCheckin = checkins.find((c) => c.date === yesterday);

    if (yesterdayCheckin?.dayRating != null && yesterdayCheckin.dayRating >= 8) {
      nudges.push({
        id: "momentum",
        type: "motivation",
        icon: "rocket",
        message: `Yesterday was a ${yesterdayCheckin.dayRating}/10 day. Ride that momentum today.`,
        urgency: "low",
        priority: 45,
      });
    }

    // Check if all habits were done yesterday
    const yesterdayHabits = habits.completions[yesterday] || {};
    const allDone = habits.habits.every((h) => yesterdayHabits[h.id]);
    if (allDone && habits.habits.length > 0) {
      nudges.push({
        id: "perfect-day-follow",
        type: "motivation",
        icon: "crown",
        message: `Perfect habit day yesterday. Can you go 2 for 2?`,
        urgency: "low",
        priority: 50,
      });
    }
  }

  return nudges.sort((a, b) => b.priority - a.priority);
}

function findLowMoodRecoveries(
  checkins: DailyCheckin[],
  habits: HabitData
): string | null {
  const sorted = [...checkins]
    .filter((c) => c.mood != null)
    .sort((a, b) => a.date.localeCompare(b.date));

  // Find transitions from low mood to high mood
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    if (prev.mood! <= 5 && curr.mood! >= 7) {
      // What habits were done on the recovery day?
      const recoveryHabits = habits.habits.filter(
        (h) => habits.completions[curr.date]?.[h.id]
      );
      if (recoveryHabits.length > 0) {
        return recoveryHabits.map((h) => h.name.toLowerCase()).join(" and ");
      }
    }
  }
  return null;
}

function goalProgress(goal: Goal): number {
  if (goal.keyResults.length === 0) return 0;
  return Math.round(
    goal.keyResults.reduce((s, kr) => s + kr.progress, 0) / goal.keyResults.length
  );
}

function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}
