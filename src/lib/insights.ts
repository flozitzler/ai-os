import { format, differenceInDays, subDays, getDay } from "date-fns";
import type { DailyCheckin, HabitData, GoalData, FinanceData, Goal } from "./types";

export interface Insight {
  id: string;
  type: "pattern" | "warning" | "streak" | "goal" | "correlation" | "trend" | "achievement" | "finance";
  icon: string; // lucide icon name
  title: string;
  body: string;
  priority: number; // higher = more important, shown first
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function generateInsights(
  checkins: DailyCheckin[],
  habits: HabitData,
  goals: GoalData,
  finance?: FinanceData
): Insight[] {
  const insights: Insight[] = [];
  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");

  if (checkins.length < 3) {
    insights.push({
      id: "need-data",
      type: "pattern",
      icon: "info",
      title: "Keep checking in",
      body: `You have ${checkins.length} check-in${checkins.length === 1 ? "" : "s"} so far. After 7 days, insights will start appearing here. The more data you log, the smarter this gets.`,
      priority: 100,
    });
    return insights;
  }

  // --- SLEEP-MOOD CORRELATION ---
  const withSleepAndMood = checkins.filter(
    (c) => c.sleepHours != null && c.mood != null
  );
  if (withSleepAndMood.length >= 5) {
    const goodSleep = withSleepAndMood.filter((c) => c.sleepHours! >= 7);
    const badSleep = withSleepAndMood.filter((c) => c.sleepHours! < 6);

    if (goodSleep.length >= 2 && badSleep.length >= 2) {
      const goodMoodAvg = avg(goodSleep.map((c) => c.mood!));
      const badMoodAvg = avg(badSleep.map((c) => c.mood!));
      const diff = goodMoodAvg - badMoodAvg;

      if (Math.abs(diff) >= 1) {
        insights.push({
          id: "sleep-mood-correlation",
          type: "correlation",
          icon: "moon",
          title: "Sleep affects your mood",
          body: `When you sleep 7+ hours, your mood averages ${goodMoodAvg.toFixed(1)}. Under 6 hours, it drops to ${badMoodAvg.toFixed(1)}. That's a ${diff.toFixed(1)}-point swing.`,
          priority: 90,
        });
      }
    }
  }

  // --- SLEEP-ENERGY CORRELATION ---
  const withSleepAndEnergy = checkins.filter(
    (c) => c.sleepHours != null && c.energy != null
  );
  if (withSleepAndEnergy.length >= 5) {
    const goodSleep = withSleepAndEnergy.filter((c) => c.sleepHours! >= 7);
    const badSleep = withSleepAndEnergy.filter((c) => c.sleepHours! < 6);

    if (goodSleep.length >= 2 && badSleep.length >= 2) {
      const goodEnergyAvg = avg(goodSleep.map((c) => c.energy!));
      const badEnergyAvg = avg(badSleep.map((c) => c.energy!));
      const diff = goodEnergyAvg - badEnergyAvg;

      if (Math.abs(diff) >= 1) {
        insights.push({
          id: "sleep-energy-correlation",
          type: "correlation",
          icon: "battery",
          title: "Sleep drives your energy",
          body: `7+ hours of sleep gives you ${goodEnergyAvg.toFixed(1)} avg energy vs ${badEnergyAvg.toFixed(1)} when you sleep under 6. Sleep more = do more.`,
          priority: 85,
        });
      }
    }
  }

  // --- BEST DAYS ANALYSIS ---
  const withRating = checkins.filter((c) => c.dayRating != null);
  if (withRating.length >= 7) {
    const greatDays = withRating.filter((c) => c.dayRating! >= 8);
    const badDays = withRating.filter((c) => c.dayRating! <= 4);

    // What habits do great days have in common?
    if (greatDays.length >= 3) {
      const habitScores: Record<string, number> = {};
      for (const habit of habits.habits) {
        const completionRate = greatDays.filter(
          (c) => habits.completions[c.date]?.[habit.id]
        ).length / greatDays.length;
        if (completionRate >= 0.7) {
          habitScores[habit.name] = Math.round(completionRate * 100);
        }
      }

      const topHabits = Object.entries(habitScores)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

      if (topHabits.length > 0) {
        insights.push({
          id: "great-day-habits",
          type: "pattern",
          icon: "sparkles",
          title: "What makes a great day",
          body: `Your 8+/10 days almost always include: ${topHabits.map(([name, pct]) => `${name} (${pct}%)`).join(", ")}. These are your power habits.`,
          priority: 95,
        });
      }
    }

    // What do bad days have in common?
    if (badDays.length >= 3) {
      const avgSleep = avg(badDays.filter((c) => c.sleepHours != null).map((c) => c.sleepHours!));
      if (avgSleep > 0 && avgSleep < 6.5) {
        insights.push({
          id: "bad-day-sleep",
          type: "warning",
          icon: "alert-triangle",
          title: "Bad days start with bad sleep",
          body: `On your worst days (4/10 or below), you averaged only ${avgSleep.toFixed(1)} hours of sleep. Protect your sleep.`,
          priority: 80,
        });
      }
    }
  }

  // --- DAY-OF-WEEK PATTERNS ---
  if (checkins.length >= 14) {
    const byDay: Record<number, number[]> = {};
    for (const c of checkins) {
      if (c.mood == null) continue;
      const day = getDay(new Date(c.date));
      if (!byDay[day]) byDay[day] = [];
      byDay[day].push(c.mood);
    }

    const dayAvgs = Object.entries(byDay)
      .filter(([, moods]) => moods.length >= 2)
      .map(([day, moods]) => ({ day: parseInt(day), avg: avg(moods) }));

    if (dayAvgs.length >= 5) {
      const overallAvg = avg(checkins.filter((c) => c.mood != null).map((c) => c.mood!));
      const worst = dayAvgs.reduce((a, b) => (a.avg < b.avg ? a : b));
      const best = dayAvgs.reduce((a, b) => (a.avg > b.avg ? a : b));

      if (overallAvg - worst.avg >= 1) {
        insights.push({
          id: "worst-day",
          type: "pattern",
          icon: "calendar-x",
          title: `${DAY_NAMES[worst.day]}s are your toughest`,
          body: `Your average mood on ${DAY_NAMES[worst.day]}s is ${worst.avg.toFixed(1)} vs ${overallAvg.toFixed(1)} overall. Consider restructuring your ${DAY_NAMES[worst.day]}s.`,
          priority: 70,
        });
      }

      if (best.avg - overallAvg >= 1) {
        insights.push({
          id: "best-day",
          type: "achievement",
          icon: "trophy",
          title: `${DAY_NAMES[best.day]}s are your best`,
          body: `Average mood on ${DAY_NAMES[best.day]}s: ${best.avg.toFixed(1)} — what are you doing right? Do more of that.`,
          priority: 65,
        });
      }
    }
  }

  // --- WEEKLY TREND ---
  if (checkins.length >= 14) {
    const thisWeek = checkins.filter((c) => {
      const d = differenceInDays(today, new Date(c.date));
      return d >= 0 && d < 7 && c.mood != null;
    });
    const lastWeek = checkins.filter((c) => {
      const d = differenceInDays(today, new Date(c.date));
      return d >= 7 && d < 14 && c.mood != null;
    });

    if (thisWeek.length >= 3 && lastWeek.length >= 3) {
      const thisAvg = avg(thisWeek.map((c) => c.mood!));
      const lastAvg = avg(lastWeek.map((c) => c.mood!));
      const diff = thisAvg - lastAvg;

      if (Math.abs(diff) >= 0.8) {
        insights.push({
          id: "weekly-mood-trend",
          type: "trend",
          icon: diff > 0 ? "trending-up" : "trending-down",
          title: diff > 0 ? "Mood is climbing" : "Mood is dropping",
          body: `Your mood this week averages ${thisAvg.toFixed(1)} vs ${lastAvg.toFixed(1)} last week — ${diff > 0 ? "up" : "down"} ${Math.abs(diff).toFixed(1)} points.`,
          priority: 75,
        });
      }
    }

    // Energy trend
    const thisWeekEnergy = checkins.filter((c) => {
      const d = differenceInDays(today, new Date(c.date));
      return d >= 0 && d < 7 && c.energy != null;
    });
    const lastWeekEnergy = checkins.filter((c) => {
      const d = differenceInDays(today, new Date(c.date));
      return d >= 7 && d < 14 && c.energy != null;
    });

    if (thisWeekEnergy.length >= 3 && lastWeekEnergy.length >= 3) {
      const thisAvg = avg(thisWeekEnergy.map((c) => c.energy!));
      const lastAvg = avg(lastWeekEnergy.map((c) => c.energy!));
      const pctChange = ((thisAvg - lastAvg) / lastAvg) * 100;

      if (Math.abs(pctChange) >= 15) {
        insights.push({
          id: "weekly-energy-trend",
          type: "trend",
          icon: pctChange > 0 ? "zap" : "battery-low",
          title: pctChange > 0 ? "Energy is up" : "Energy is dropping",
          body: `Your energy is ${pctChange > 0 ? "up" : "down"} ${Math.abs(Math.round(pctChange))}% this week compared to last.`,
          priority: 72,
        });
      }
    }
  }

  // --- HABIT STREAK WARNINGS (Never Miss Twice) ---
  for (const habit of habits.habits) {
    const yesterday = format(subDays(today, 1), "yyyy-MM-dd");
    const dayBefore = format(subDays(today, 2), "yyyy-MM-dd");
    const missedYesterday = !habits.completions[yesterday]?.[habit.id];
    const missedDayBefore = !habits.completions[dayBefore]?.[habit.id];
    const missedToday = !habits.completions[todayStr]?.[habit.id];

    if (missedYesterday && missedDayBefore && missedToday) {
      // Count how many days missed in a row
      let missed = 0;
      for (let i = 1; i <= 30; i++) {
        const d = format(subDays(today, i), "yyyy-MM-dd");
        if (!habits.completions[d]?.[habit.id]) missed++;
        else break;
      }

      insights.push({
        id: `streak-warning-${habit.id}`,
        type: "warning",
        icon: "alert-triangle",
        title: `${habit.name} — ${missed} day streak broken`,
        body: `You've missed "${habit.name}" ${missed} days in a row. Never miss twice. Today is the day to get back on track.`,
        priority: 88,
      });
    } else if (missedYesterday && !missedDayBefore) {
      insights.push({
        id: `streak-nudge-${habit.id}`,
        type: "streak",
        icon: "flame",
        title: `Don't miss ${habit.name} twice`,
        body: `You missed "${habit.name}" yesterday. One miss is fine — two breaks the habit. Get it done today.`,
        priority: 82,
      });
    }
  }

  // --- LONGEST CURRENT STREAK ---
  let bestStreak = { name: "", streak: 0 };
  for (const habit of habits.habits) {
    let streak = 0;
    for (let i = 0; i <= 365; i++) {
      const d = format(subDays(today, i), "yyyy-MM-dd");
      if (habits.completions[d]?.[habit.id]) streak++;
      else if (i > 0) break;
    }
    if (streak > bestStreak.streak) {
      bestStreak = { name: habit.name, streak };
    }
  }

  if (bestStreak.streak >= 7) {
    insights.push({
      id: "best-streak",
      type: "achievement",
      icon: "flame",
      title: `${bestStreak.streak}-day streak on ${bestStreak.name}`,
      body: `You've done "${bestStreak.name}" ${bestStreak.streak} days in a row. Keep the chain alive.`,
      priority: 60,
    });
  }

  // --- GOAL NEGLECT ---
  for (const goal of goals.goals) {
    if (goal.status === "completed" || goal.status === "abandoned") continue;

    const daysSince = goal.lastWorkedOn
      ? differenceInDays(today, new Date(goal.lastWorkedOn))
      : null;

    if (daysSince !== null && daysSince >= 7) {
      insights.push({
        id: `goal-neglect-${goal.id}`,
        type: "goal",
        icon: "target",
        title: `${goal.title} — ${daysSince} days untouched`,
        body: `You haven't worked on "${goal.title}" in ${daysSince} days. Is it still a priority? Either work on it or reconsider it.`,
        priority: daysSince >= 14 ? 85 : 68,
      });
    }

    if (daysSince === null && goal.status !== "not-started") {
      insights.push({
        id: `goal-never-started-${goal.id}`,
        type: "goal",
        icon: "target",
        title: `${goal.title} — never started`,
        body: `You created "${goal.title}" but haven't logged any work on it yet. What's the first small step?`,
        priority: 55,
      });
    }

    // Goal deadline approaching
    const daysLeft = differenceInDays(new Date(goal.deadline), today);
    const progress = goalProgress(goal);
    if (daysLeft > 0 && daysLeft <= 14 && progress < 50) {
      insights.push({
        id: `goal-deadline-${goal.id}`,
        type: "warning",
        icon: "clock",
        title: `${goal.title} — ${daysLeft} days left, ${progress}% done`,
        body: `The deadline for "${goal.title}" is in ${daysLeft} days but you're only ${progress}% through. Time to focus or adjust scope.`,
        priority: 87,
      });
    }
  }

  // --- HABIT CONSISTENCY LEADER ---
  if (checkins.length >= 14) {
    const habitRates = habits.habits.map((habit) => {
      let done = 0;
      let total = 0;
      for (let i = 0; i < 14; i++) {
        const d = format(subDays(today, i), "yyyy-MM-dd");
        total++;
        if (habits.completions[d]?.[habit.id]) done++;
      }
      return { name: habit.name, rate: total > 0 ? done / total : 0 };
    });

    const best = habitRates.reduce((a, b) => (a.rate > b.rate ? a : b), { name: "", rate: 0 });
    const worst = habitRates.reduce((a, b) => (a.rate < b.rate ? a : b), { name: "", rate: 1 });

    if (best.rate >= 0.8 && best.name) {
      insights.push({
        id: "most-consistent",
        type: "achievement",
        icon: "award",
        title: `Most consistent: ${best.name}`,
        body: `You've hit "${best.name}" ${Math.round(best.rate * 100)}% of the last 14 days. This one is locked in.`,
        priority: 50,
      });
    }

    if (worst.rate <= 0.2 && worst.name && habits.habits.length > 1) {
      insights.push({
        id: "least-consistent",
        type: "warning",
        icon: "circle-slash",
        title: `Struggling with: ${worst.name}`,
        body: `"${worst.name}" is at ${Math.round(worst.rate * 100)}% over the last 14 days. Maybe make it easier, or drop it if it's not serving you.`,
        priority: 58,
      });
    }
  }

  // --- CHECKIN STREAK ---
  let checkinStreak = 0;
  for (let i = 0; i <= 365; i++) {
    const d = format(subDays(today, i), "yyyy-MM-dd");
    if (checkins.some((c) => c.date === d)) checkinStreak++;
    else if (i > 0) break;
  }

  if (checkinStreak >= 7) {
    insights.push({
      id: "checkin-streak",
      type: "achievement",
      icon: "calendar-check",
      title: `${checkinStreak}-day check-in streak`,
      body: `You've checked in ${checkinStreak} days in a row. Consistency is the foundation — everything else builds on this.`,
      priority: 45,
    });
  }

  // --- HABIT → MOOD CORRELATION ---
  if (checkins.length >= 7 && habits.habits.length > 0) {
    for (const habit of habits.habits) {
      const daysWithMood = checkins.filter((c) => c.mood != null);
      if (daysWithMood.length < 7) break;

      const daysWithHabit = daysWithMood.filter(
        (c) => habits.completions[c.date]?.[habit.id]
      );
      const daysWithoutHabit = daysWithMood.filter(
        (c) => !habits.completions[c.date]?.[habit.id]
      );

      if (daysWithHabit.length >= 3 && daysWithoutHabit.length >= 3) {
        const moodWith = avg(daysWithHabit.map((c) => c.mood!));
        const moodWithout = avg(daysWithoutHabit.map((c) => c.mood!));
        const pctDiff = ((moodWith - moodWithout) / moodWithout) * 100;

        if (pctDiff >= 15) {
          insights.push({
            id: `habit-mood-${habit.id}`,
            type: "correlation",
            icon: "heart-pulse",
            title: `${habit.name} boosts your mood`,
            body: `You're ${Math.round(pctDiff)}% happier on days you ${habit.name.toLowerCase()}. Mood with: ${moodWith.toFixed(1)}, without: ${moodWithout.toFixed(1)}.`,
            priority: 88,
          });
        }
      }
    }
  }

  // --- SLEEP → PRODUCTIVITY (dayRating) CORRELATION ---
  const withSleepAndRating = checkins.filter(
    (c) => c.sleepHours != null && c.dayRating != null
  );
  if (withSleepAndRating.length >= 5) {
    const goodSleep = withSleepAndRating.filter((c) => c.sleepHours! >= 7);
    const badSleep = withSleepAndRating.filter((c) => c.sleepHours! < 6);

    if (goodSleep.length >= 2 && badSleep.length >= 2) {
      const goodRatingAvg = avg(goodSleep.map((c) => c.dayRating!));
      const badRatingAvg = avg(badSleep.map((c) => c.dayRating!));

      if (badRatingAvg > 0) {
        const multiplier = goodRatingAvg / badRatingAvg;
        if (multiplier >= 1.3) {
          insights.push({
            id: "sleep-productivity",
            type: "correlation",
            icon: "brain",
            title: "Sleep drives your productivity",
            body: `Days after 7+ hours sleep, your day rating is ${multiplier.toFixed(1)}x higher (${goodRatingAvg.toFixed(1)} vs ${badRatingAvg.toFixed(1)} on less than 6h).`,
            priority: 87,
          });
        }
      }
    }
  }

  // --- HABIT STACKING (two habits together → higher rating) ---
  if (checkins.length >= 7 && habits.habits.length >= 2) {
    const withRatingCheckins = checkins.filter((c) => c.dayRating != null);
    if (withRatingCheckins.length >= 7) {
      for (let i = 0; i < habits.habits.length; i++) {
        for (let j = i + 1; j < habits.habits.length; j++) {
          const h1 = habits.habits[i];
          const h2 = habits.habits[j];

          const bothDone = withRatingCheckins.filter(
            (c) =>
              habits.completions[c.date]?.[h1.id] &&
              habits.completions[c.date]?.[h2.id]
          );
          const neitherDone = withRatingCheckins.filter(
            (c) =>
              !habits.completions[c.date]?.[h1.id] &&
              !habits.completions[c.date]?.[h2.id]
          );

          if (bothDone.length >= 3 && neitherDone.length >= 2) {
            const bothAvg = avg(bothDone.map((c) => c.dayRating!));
            const neitherAvg = avg(neitherDone.map((c) => c.dayRating!));

            if (bothAvg >= 7.5 && bothAvg - neitherAvg >= 2) {
              insights.push({
                id: `habit-stack-${h1.id}-${h2.id}`,
                type: "pattern",
                icon: "layers",
                title: `Power combo: ${h1.name} + ${h2.name}`,
                body: `When you do both ${h1.name} AND ${h2.name}, your day rating averages ${bothAvg.toFixed(1)}/10. Without either, it's ${neitherAvg.toFixed(1)}/10.`,
                priority: 86,
              });
            }
          }
        }
      }
    }
  }

  // --- STREAK BREAK DAY-OF-WEEK PATTERN ---
  if (habits.habits.length > 0) {
    const breakDays: Record<number, number> = {};
    for (const habit of habits.habits) {
      const sortedDates = Object.keys(habits.completions).sort();
      for (let i = 1; i < sortedDates.length; i++) {
        const prev = sortedDates[i - 1];
        const curr = sortedDates[i];
        if (
          habits.completions[prev]?.[habit.id] &&
          !habits.completions[curr]?.[habit.id]
        ) {
          const day = getDay(new Date(curr));
          breakDays[day] = (breakDays[day] || 0) + 1;
        }
      }
    }

    const totalBreaks = Object.values(breakDays).reduce((a, b) => a + b, 0);
    if (totalBreaks >= 5) {
      const worstDay = Object.entries(breakDays).sort(
        (a, b) => b[1] - a[1]
      )[0];
      const worstPct = Math.round((parseInt(worstDay[1].toString()) / totalBreaks) * 100);
      if (worstPct >= 30) {
        insights.push({
          id: "streak-break-day",
          type: "pattern",
          icon: "calendar-x",
          title: `Streaks usually break on ${DAY_NAMES[parseInt(worstDay[0])]}s`,
          body: `${worstPct}% of your habit streak breaks happen on ${DAY_NAMES[parseInt(worstDay[0])]}s. Plan extra accountability for that day.`,
          priority: 73,
        });
      }
    }
  }

  // --- DAY-OF-WEEK PRODUCTIVITY PATTERN ---
  if (checkins.length >= 14) {
    const byDayRating: Record<number, number[]> = {};
    for (const c of checkins) {
      if (c.dayRating == null) continue;
      const day = getDay(new Date(c.date));
      if (!byDayRating[day]) byDayRating[day] = [];
      byDayRating[day].push(c.dayRating);
    }

    const dayRatingAvgs = Object.entries(byDayRating)
      .filter(([, ratings]) => ratings.length >= 2)
      .map(([day, ratings]) => ({ day: parseInt(day), avg: avg(ratings) }));

    if (dayRatingAvgs.length >= 5) {
      const best = dayRatingAvgs.reduce((a, b) => (a.avg > b.avg ? a : b));
      const overallRatingAvg = avg(
        checkins.filter((c) => c.dayRating != null).map((c) => c.dayRating!)
      );

      if (best.avg - overallRatingAvg >= 0.8) {
        insights.push({
          id: "most-productive-day",
          type: "achievement",
          icon: "rocket",
          title: `${DAY_NAMES[best.day]}s are your most productive`,
          body: `Your day rating on ${DAY_NAMES[best.day]}s averages ${best.avg.toFixed(1)} vs ${overallRatingAvg.toFixed(1)} overall. Schedule your hardest work here.`,
          priority: 63,
        });
      }
    }
  }

  // --- FINANCE INSIGHTS ---
  if (finance && finance.transactions.length > 0) {
    const thisMonth = format(today, "yyyy-MM");
    const lastMonth = format(subDays(today, 30), "yyyy-MM");
    const monthTxns = finance.transactions.filter((t) => t.date.startsWith(thisMonth));
    const lastMonthTxns = finance.transactions.filter((t) => t.date.startsWith(lastMonth));

    const thisExpenses = monthTxns.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const lastExpenses = lastMonthTxns.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const thisIncome = monthTxns.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const lastIncome = lastMonthTxns.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const thisNet = thisIncome - thisExpenses;
    const lastNet = lastIncome - lastExpenses;

    // Spending trend month-over-month
    if (lastExpenses > 0 && thisExpenses > 0) {
      const pctChange = ((thisExpenses - lastExpenses) / lastExpenses) * 100;
      if (Math.abs(pctChange) >= 20) {
        insights.push({
          id: "spending-trend",
          type: "finance",
          icon: pctChange > 0 ? "trending-up" : "trending-down",
          title: pctChange > 0 ? "Spending is up" : "Spending is down",
          body: `You've spent ${Math.abs(Math.round(pctChange))}% ${pctChange > 0 ? "more" : "less"} this month compared to last month.`,
          priority: 74,
        });
      }
    }

    // Savings improvement
    if (lastNet !== 0 && thisNet > lastNet) {
      const savedMore = thisNet - lastNet;
      insights.push({
        id: "savings-improvement",
        type: "finance",
        icon: "piggy-bank",
        title: "Saving more this month",
        body: `You've saved ${formatCurrency(savedMore, finance.currency)} more this month than last month. Keep it up.`,
        priority: 66,
      });
    }

    // Weekend vs weekday spending
    const weekendTxns = finance.transactions.filter((t) => {
      const day = getDay(new Date(t.date));
      return t.type === "expense" && (day === 0 || day === 6);
    });
    const weekdayTxns = finance.transactions.filter((t) => {
      const day = getDay(new Date(t.date));
      return t.type === "expense" && day >= 1 && day <= 5;
    });

    if (weekendTxns.length >= 3 && weekdayTxns.length >= 5) {
      // Calculate average daily spending for weekends vs weekdays
      const weekendDays = new Set(weekendTxns.map((t) => t.date)).size;
      const weekdayDays = new Set(weekdayTxns.map((t) => t.date)).size;
      const weekendTotal = weekendTxns.reduce((s, t) => s + t.amount, 0);
      const weekdayTotal = weekdayTxns.reduce((s, t) => s + t.amount, 0);

      if (weekendDays > 0 && weekdayDays > 0) {
        const weekendAvg = weekendTotal / weekendDays;
        const weekdayAvg = weekdayTotal / weekdayDays;
        const ratio = weekendAvg / weekdayAvg;

        if (ratio >= 2) {
          insights.push({
            id: "weekend-spending",
            type: "finance",
            icon: "wallet",
            title: "Weekend spending spikes",
            body: `You spend ${ratio.toFixed(1)}x more on weekends than weekdays. Weekend avg: ${formatCurrency(Math.round(weekendAvg), finance.currency)}/day vs ${formatCurrency(Math.round(weekdayAvg), finance.currency)}/day.`,
            priority: 69,
          });
        }
      }
    }

    // Top spending category
    if (monthTxns.length >= 3) {
      const catSpending: Record<string, number> = {};
      for (const t of monthTxns.filter((t) => t.type === "expense")) {
        catSpending[t.category] = (catSpending[t.category] || 0) + t.amount;
      }
      const topCat = Object.entries(catSpending).sort((a, b) => b[1] - a[1])[0];
      if (topCat && thisExpenses > 0) {
        const pct = Math.round((topCat[1] / thisExpenses) * 100);
        if (pct >= 40) {
          insights.push({
            id: "top-category",
            type: "finance",
            icon: "pie-chart",
            title: `${capitalize(topCat[0])} dominates spending`,
            body: `${capitalize(topCat[0])} accounts for ${pct}% of your spending this month (${formatCurrency(topCat[1], finance.currency)}).`,
            priority: 62,
          });
        }
      }
    }
  }

  return insights.sort((a, b) => b.priority - a.priority);
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

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).replace("-", " ");
}
