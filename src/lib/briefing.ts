import { format, subDays, differenceInDays, getDay } from "date-fns";
import type { DailyCheckin, HabitData, GoalData, FinanceData, Profile, Goal } from "./types";
import type { Nudge } from "./nudges";
import type { Insight } from "./insights";

export interface BriefingSection {
  id: string;
  icon: string;
  label: string;
  content: string;
  type: "positive" | "neutral" | "warning" | "action";
}

export interface Briefing {
  greeting: string;
  subtitle: string;
  sections: BriefingSection[];
  focusSuggestion: string | null;
  oneLiner: string;
  nudges: Nudge[];
  insightOfTheDay: Insight | null;
  financePulse: FinancePulse | null;
}

export interface FinancePulse {
  income: number;
  expenses: number;
  net: number;
  currency: string;
  topCategory: string | null;
  topCategoryAmount: number;
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function generateBriefing(
  profile: Profile,
  checkins: DailyCheckin[],
  habits: HabitData,
  goals: GoalData,
  nudges?: Nudge[],
  insights?: Insight[],
  finance?: FinanceData
): Briefing {
  const now = new Date();
  const yesterday = format(subDays(now, 1), "yyyy-MM-dd");
  const dayNumber = differenceInDays(now, new Date(profile.startDate)) + 1;
  const dayName = DAY_NAMES[getDay(now)];

  const hour = now.getHours();
  const timeOfDay = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
  const greeting = `Good ${timeOfDay}, ${profile.name}.`;

  const sections: BriefingSection[] = [];
  const yesterdayCheckin = checkins.find((c) => c.date === yesterday);

  // --- YESTERDAY RECAP ---
  if (yesterdayCheckin) {
    const parts: string[] = [];
    if (yesterdayCheckin.dayRating != null) {
      const ratingWord = yesterdayCheckin.dayRating >= 8 ? "great" : yesterdayCheckin.dayRating >= 6 ? "solid" : yesterdayCheckin.dayRating >= 4 ? "okay" : "rough";
      parts.push(`Yesterday was a ${ratingWord} day (${yesterdayCheckin.dayRating}/10)`);
    }
    if (yesterdayCheckin.mood != null) {
      parts.push(`mood ${yesterdayCheckin.mood}/10`);
    }
    if (yesterdayCheckin.energy != null) {
      parts.push(`energy ${yesterdayCheckin.energy}/10`);
    }

    // Count consecutive good days
    let goodStreak = 0;
    for (let i = 1; i <= 30; i++) {
      const d = format(subDays(now, i), "yyyy-MM-dd");
      const c = checkins.find((ch) => ch.date === d);
      if (c && c.dayRating != null && c.dayRating >= 7) goodStreak++;
      else break;
    }

    if (goodStreak >= 3) {
      parts.push(`${goodStreak} good days in a row — keep it going`);
    }

    sections.push({
      id: "yesterday",
      icon: goodStreak >= 3 ? "trending-up" : "calendar",
      label: "YESTERDAY",
      content: parts.join(". ") + ".",
      type: yesterdayCheckin.dayRating != null && yesterdayCheckin.dayRating >= 7 ? "positive" : "neutral",
    });
  }

  // --- SLEEP ---
  if (yesterdayCheckin?.sleepHours != null) {
    const sleep = yesterdayCheckin.sleepHours;
    const recentSleep = checkins
      .filter((c) => c.sleepHours != null)
      .slice(0, 14)
      .map((c) => c.sleepHours!);
    const avgSleep = recentSleep.length > 0
      ? Math.round((recentSleep.reduce((a, b) => a + b, 0) / recentSleep.length) * 10) / 10
      : null;

    let content = `${sleep}h last night`;
    if (avgSleep !== null) {
      const diff = sleep - avgSleep;
      if (diff >= 0.5) content += ` (above your ${avgSleep}h average)`;
      else if (diff <= -0.5) content += ` (below your ${avgSleep}h average — protect your sleep)`;
      else content += ` (right at your ${avgSleep}h average)`;
    }

    sections.push({
      id: "sleep",
      icon: "moon",
      label: "SLEEP",
      content,
      type: sleep >= 7 ? "positive" : sleep < 6 ? "warning" : "neutral",
    });
  }

  // --- HABITS ---
  const yesterdayHabits = habits.completions[yesterday] || {};
  const doneYesterday = habits.habits.filter((h) => yesterdayHabits[h.id]).length;
  const totalHabits = habits.habits.length;

  if (totalHabits > 0) {
    // Calculate habit streak (consecutive days with >50% completion)
    let habitStreak = 0;
    for (let i = 1; i <= 60; i++) {
      const d = format(subDays(now, i), "yyyy-MM-dd");
      const comp = habits.completions[d] || {};
      const done = habits.habits.filter((h) => comp[h.id]).length;
      if (done >= totalHabits / 2) habitStreak++;
      else break;
    }

    let content = `${doneYesterday}/${totalHabits} done yesterday`;
    if (habitStreak >= 3) content += ` — ${habitStreak}-day habit streak 🔥`;

    // Find missed habits that have "never miss twice" risk
    const missedYesterday = habits.habits.filter((h) => !yesterdayHabits[h.id]);
    const atRisk = missedYesterday.filter((h) => {
      const dayBefore = format(subDays(now, 2), "yyyy-MM-dd");
      return !habits.completions[dayBefore]?.[h.id];
    });

    if (atRisk.length > 0 && atRisk.length <= 3) {
      content += `. At risk: ${atRisk.map((h) => h.name).join(", ")} — don't miss twice`;
    }

    sections.push({
      id: "habits",
      icon: "check-square",
      label: "HABITS",
      content,
      type: doneYesterday >= totalHabits * 0.7 ? "positive" : doneYesterday <= totalHabits * 0.3 ? "warning" : "neutral",
    });
  }

  // --- GOALS ---
  const activeGoals = goals.goals.filter(
    (g) => g.status === "active" || g.status === "planning"
  );

  const neglectedGoals = activeGoals.filter((g) => {
    if (!g.lastWorkedOn) return true;
    return differenceInDays(now, new Date(g.lastWorkedOn)) >= 7;
  });

  const urgentGoals = activeGoals.filter((g) => {
    const daysLeft = differenceInDays(new Date(g.deadline), now);
    const progress = goalProgress(g);
    return daysLeft > 0 && daysLeft <= 14 && progress < 50;
  });

  if (neglectedGoals.length > 0) {
    const goalNames = neglectedGoals.map((g) => {
      const days = g.lastWorkedOn ? differenceInDays(now, new Date(g.lastWorkedOn)) : null;
      return days ? `${g.title} (${days}d ago)` : `${g.title} (never started)`;
    });
    sections.push({
      id: "goals-neglected",
      icon: "target",
      label: "GOALS",
      content: `Untouched: ${goalNames.join(", ")}. Pick one and move it forward today.`,
      type: "warning",
    });
  } else if (activeGoals.length > 0) {
    const progressList = activeGoals.map(
      (g) => `${g.title} (${goalProgress(g)}%)`
    );
    sections.push({
      id: "goals-status",
      icon: "target",
      label: "GOALS",
      content: `On track: ${progressList.join(", ")}.`,
      type: "positive",
    });
  }

  if (urgentGoals.length > 0) {
    for (const g of urgentGoals) {
      const daysLeft = differenceInDays(new Date(g.deadline), now);
      sections.push({
        id: `goal-urgent-${g.id}`,
        icon: "alert-triangle",
        label: "DEADLINE",
        content: `"${g.title}" is ${goalProgress(g)}% done with ${daysLeft} days left. This needs attention now.`,
        type: "warning",
      });
    }
  }

  // --- DAY PATTERN ---
  if (checkins.length >= 14) {
    const sameDayCheckins = checkins.filter(
      (c) => c.mood != null && getDay(new Date(c.date)) === getDay(now)
    );
    if (sameDayCheckins.length >= 2) {
      const avgMood = avg(sameDayCheckins.map((c) => c.mood!));
      const overallAvg = avg(
        checkins.filter((c) => c.mood != null).map((c) => c.mood!)
      );
      const diff = avgMood - overallAvg;

      if (Math.abs(diff) >= 1) {
        sections.push({
          id: "day-pattern",
          icon: diff > 0 ? "sun" : "cloud",
          label: "PATTERN",
          content: diff > 0
            ? `${dayName}s are usually good for you (avg mood ${avgMood.toFixed(1)} vs ${overallAvg.toFixed(1)} overall). Ride the momentum.`
            : `${dayName}s tend to be harder (avg mood ${avgMood.toFixed(1)} vs ${overallAvg.toFixed(1)}). Plan something you enjoy today.`,
          type: diff > 0 ? "positive" : "neutral",
        });
      }
    }
  }

  // --- FOCUS SUGGESTION ---
  let focusSuggestion: string | null = null;

  // Priority: urgent deadline > neglected goal > most impactful habit
  if (urgentGoals.length > 0) {
    const most = urgentGoals.sort(
      (a, b) => differenceInDays(new Date(a.deadline), now) - differenceInDays(new Date(b.deadline), now)
    )[0];
    focusSuggestion = `${most.title} — deadline in ${differenceInDays(new Date(most.deadline), now)} days, ${goalProgress(most)}% done`;
  } else if (neglectedGoals.length > 0) {
    const most = neglectedGoals.sort((a, b) => {
      const aDays = a.lastWorkedOn ? differenceInDays(now, new Date(a.lastWorkedOn)) : 999;
      const bDays = b.lastWorkedOn ? differenceInDays(now, new Date(b.lastWorkedOn)) : 999;
      return bDays - aDays;
    })[0];
    focusSuggestion = `${most.title} — most neglected goal, pick it up today`;
  } else if (activeGoals.length > 0) {
    const leastProgress = activeGoals.sort(
      (a, b) => goalProgress(a) - goalProgress(b)
    )[0];
    focusSuggestion = `${leastProgress.title} — lowest progress (${goalProgress(leastProgress)}%), push it forward`;
  }

  // --- ONE-LINER ---
  let oneLiner: string;
  if (checkins.length < 3) {
    oneLiner = `Day ${dayNumber}. Every check-in makes the system smarter. Keep going.`;
  } else if (neglectedGoals.length > 0 && doneYesterday >= totalHabits * 0.7) {
    oneLiner = "Habits are strong. Now point that energy at your goals.";
  } else if (doneYesterday <= totalHabits * 0.3 && totalHabits > 0) {
    oneLiner = "Rough day yesterday. Today is a clean slate — pick one habit and do it.";
  } else if (yesterdayCheckin?.dayRating != null && yesterdayCheckin.dayRating >= 8) {
    oneLiner = "Yesterday was great. Repeat what worked.";
  } else {
    oneLiner = `Day ${dayNumber}. Small moves, every day.`;
  }

  // --- FINANCIAL PULSE ---
  let financePulse: FinancePulse | null = null;
  if (finance && finance.transactions.length > 0) {
    const thisMonth = format(now, "yyyy-MM");
    const monthTxns = finance.transactions.filter((t) => t.date.startsWith(thisMonth));
    const income = monthTxns.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expenses = monthTxns.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const net = income - expenses;

    const catSpending: Record<string, number> = {};
    for (const t of monthTxns.filter((t) => t.type === "expense")) {
      catSpending[t.category] = (catSpending[t.category] || 0) + t.amount;
    }
    const topCatEntry = Object.entries(catSpending).sort((a, b) => b[1] - a[1])[0];

    financePulse = {
      income,
      expenses,
      net,
      currency: finance.currency,
      topCategory: topCatEntry ? topCatEntry[0] : null,
      topCategoryAmount: topCatEntry ? topCatEntry[1] : 0,
    };

    if (income > 0 || expenses > 0) {
      sections.push({
        id: "finance-pulse",
        icon: "wallet",
        label: "FINANCE",
        content: net >= 0
          ? `Net +${formatCurrency(net, finance.currency)} this month (${formatCurrency(income, finance.currency)} in, ${formatCurrency(expenses, finance.currency)} out).`
          : `Net ${formatCurrency(net, finance.currency)} this month — spending exceeds income by ${formatCurrency(Math.abs(net), finance.currency)}.`,
        type: net >= 0 ? "positive" : "warning",
      });
    }
  }

  // --- INSIGHT OF THE DAY ---
  // Pick the highest priority insight that isn't a generic "need more data" type
  const insightOfTheDay = insights && insights.length > 0
    ? insights.find((i) => i.id !== "need-data") ?? null
    : null;

  // --- TOP NUDGES ---
  const topNudges = nudges ? nudges.slice(0, 3) : [];

  return {
    greeting,
    subtitle: `Day ${dayNumber} · ${format(now, "EEEE, MMMM d")}`,
    sections,
    focusSuggestion,
    oneLiner,
    nudges: topNudges,
    insightOfTheDay,
    financePulse,
  };
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

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function goalProgress(goal: Goal): number {
  if (goal.keyResults.length === 0) return 0;
  return Math.round(
    goal.keyResults.reduce((s, kr) => s + kr.progress, 0) / goal.keyResults.length
  );
}
