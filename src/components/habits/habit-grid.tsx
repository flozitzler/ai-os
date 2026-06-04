"use client";

import { useState, useEffect } from "react";
import { format, startOfWeek, addDays } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Flame, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HabitData } from "@/lib/types";

export function HabitGrid() {
  const [data, setData] = useState<HabitData | null>(null);

  useEffect(() => {
    fetch("/api/habits").then((r) => r.json()).then(setData);
  }, []);

  if (!data) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg bg-card" />
        ))}
      </div>
    );
  }

  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const todayStr = format(today, "yyyy-MM-dd");

  const toggle = async (habitId: string, date: string) => {
    const updated = { ...data };
    if (!updated.completions[date]) updated.completions[date] = {};
    updated.completions[date][habitId] = !updated.completions[date][habitId];
    setData({ ...updated });
    await fetch("/api/habits", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
  };

  const getStreak = (habitId: string): number => {
    let streak = 0;
    for (let i = 0; i <= 365; i++) {
      const d = format(addDays(today, -i), "yyyy-MM-dd");
      if (data.completions[d]?.[habitId]) streak++;
      else if (i > 0) break;
    }
    return streak;
  };

  const missedYesterday = (habitId: string): boolean => {
    const yesterday = format(addDays(today, -1), "yyyy-MM-dd");
    return !(data.completions[yesterday]?.[habitId]);
  };

  const todayDone = data.habits.filter(
    (h) => data.completions[todayStr]?.[h.id]
  ).length;

  const blocks = {
    morning: data.habits.filter((h) => h.block === "morning"),
    day: data.habits.filter((h) => h.block === "day"),
    evening: data.habits.filter((h) => h.block === "evening"),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Habits</h1>
          <p className="text-sm text-muted-foreground">
            {todayDone}/{data.habits.length} done today
          </p>
        </div>
        <Badge variant="secondary" className="gap-1 text-lg">
          <Flame className="h-4 w-4 text-warning" />
          {Math.max(...data.habits.map((h) => getStreak(h.id)))} day best
        </Badge>
      </div>

      {/* Week header */}
      <div className="grid grid-cols-[1fr_repeat(7,40px)_60px] items-center gap-1 px-4 text-xs text-muted-foreground">
        <span />
        {weekDays.map((d) => (
          <span key={d.toISOString()} className="text-center">
            {format(d, "EEE")}
          </span>
        ))}
        <span className="text-center">Streak</span>
      </div>

      {(["morning", "day", "evening"] as const).map((block) => (
        <Card key={block}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">
              {block}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {blocks[block].map((habit) => {
              const streak = getStreak(habit.id);
              const missed = missedYesterday(habit.id);
              return (
                <div
                  key={habit.id}
                  className="grid grid-cols-[1fr_repeat(7,40px)_60px] items-center gap-1"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-sm">{habit.name}</span>
                    {missed && streak === 0 && (
                      <AlertTriangle className="h-3 w-3 shrink-0 text-warning" />
                    )}
                  </div>
                  {weekDays.map((d) => {
                    const dateStr = format(d, "yyyy-MM-dd");
                    const done = data.completions[dateStr]?.[habit.id] ?? false;
                    const isToday = dateStr === todayStr;
                    const isFuture = d > today;
                    return (
                      <button
                        key={dateStr}
                        disabled={isFuture}
                        onClick={() => toggle(habit.id, dateStr)}
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-md border transition-all mx-auto",
                          done
                            ? "border-primary bg-primary/20 text-primary"
                            : isToday
                            ? "border-border bg-secondary hover:border-primary"
                            : "border-border/50 bg-transparent",
                          isFuture && "cursor-not-allowed opacity-20"
                        )}
                      >
                        {done && <Check className="h-4 w-4" />}
                      </button>
                    );
                  })}
                  <div className="text-center">
                    {streak > 0 ? (
                      <Badge variant="secondary" className="gap-0.5 text-xs">
                        <Flame className="h-3 w-3 text-warning" />
                        {streak}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
