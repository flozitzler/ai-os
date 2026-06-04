"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Moon,
  Battery,
  Flame,
  Target,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Sparkles,
  Trophy,
  Award,
  CalendarCheck,
  CalendarX,
  Clock,
  Zap,
  BatteryLow,
  CircleSlash,
  Info,
  HeartPulse,
  Brain,
  Layers,
  Rocket,
  PiggyBank,
  Wallet,
  PieChart,
} from "lucide-react";
import type { Insight } from "@/lib/insights";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  moon: Moon,
  battery: Battery,
  flame: Flame,
  target: Target,
  "trending-up": TrendingUp,
  "trending-down": TrendingDown,
  "alert-triangle": AlertTriangle,
  sparkles: Sparkles,
  trophy: Trophy,
  award: Award,
  "calendar-check": CalendarCheck,
  "calendar-x": CalendarX,
  clock: Clock,
  zap: Zap,
  "battery-low": BatteryLow,
  "circle-slash": CircleSlash,
  info: Info,
  "heart-pulse": HeartPulse,
  brain: Brain,
  layers: Layers,
  rocket: Rocket,
  "piggy-bank": PiggyBank,
  wallet: Wallet,
  "pie-chart": PieChart,
};

const typeStyles: Record<Insight["type"], { border: string; bg: string; badge: string; badgeText: string }> = {
  correlation: {
    border: "border-chart-2/30",
    bg: "bg-chart-2/10",
    badge: "bg-chart-2/20",
    badgeText: "text-chart-2",
  },
  pattern: {
    border: "border-primary/30",
    bg: "bg-primary/10",
    badge: "bg-primary/20",
    badgeText: "text-primary",
  },
  warning: {
    border: "border-warning/30",
    bg: "bg-warning/10",
    badge: "bg-warning/20",
    badgeText: "text-warning",
  },
  streak: {
    border: "border-warning/30",
    bg: "bg-warning/10",
    badge: "bg-warning/20",
    badgeText: "text-warning",
  },
  goal: {
    border: "border-destructive/30",
    bg: "bg-destructive/10",
    badge: "bg-destructive/20",
    badgeText: "text-destructive",
  },
  trend: {
    border: "border-chart-4/30",
    bg: "bg-chart-4/10",
    badge: "bg-chart-4/20",
    badgeText: "text-chart-4",
  },
  achievement: {
    border: "border-chart-4/30",
    bg: "bg-chart-4/10",
    badge: "bg-chart-4/20",
    badgeText: "text-chart-4",
  },
  finance: {
    border: "border-chart-5/30",
    bg: "bg-chart-5/10",
    badge: "bg-chart-5/20",
    badgeText: "text-chart-5",
  },
};

const typeLabels: Record<Insight["type"], string> = {
  correlation: "Correlation",
  pattern: "Pattern",
  warning: "Heads Up",
  streak: "Streak",
  goal: "Goal",
  trend: "Trend",
  achievement: "Achievement",
  finance: "Finance",
};

export default function InsightsPage() {
  const [insights, setInsights] = useState<Insight[] | null>(null);

  useEffect(() => {
    fetch("/api/insights").then((r) => r.json()).then(setInsights);
  }, []);

  if (!insights) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg bg-card" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Insights</h1>
        <p className="text-sm text-muted-foreground">
          Patterns and signals from your data — updated every time you check in
        </p>
      </div>

      {insights.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Sparkles className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground">
              Not enough data yet. Keep checking in daily — insights will appear after a week.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {insights.map((insight) => {
          const style = typeStyles[insight.type];
          const Icon = iconMap[insight.icon] || Info;

          return (
            <Card
              key={insight.id}
              className={`border ${style.border} transition-colors`}
            >
              <CardContent className="flex gap-4 py-4">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${style.bg}`}
                >
                  <Icon className={`h-5 w-5 ${style.badgeText}`} />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold leading-tight">
                      {insight.title}
                    </p>
                    <Badge
                      variant="secondary"
                      className={`shrink-0 text-[10px] ${style.badge} ${style.badgeText}`}
                    >
                      {typeLabels[insight.type]}
                    </Badge>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {insight.body}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
