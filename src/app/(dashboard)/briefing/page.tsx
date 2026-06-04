import {
  readProfile,
  readHabits,
  readGoals,
  readFinance,
  listDailyCheckins,
  hasProfile,
} from "@/lib/data";
import { generateBriefing } from "@/lib/briefing";
import { generateNudges } from "@/lib/nudges";
import { generateInsights } from "@/lib/insights";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Target,
  AlertTriangle,
  Wallet,
  Flame,
  Zap,
  Heart,
  Rocket,
  Crown,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export const dynamic = "force-dynamic";

const nudgeIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  flame: Flame,
  zap: Zap,
  wallet: Wallet,
  "alert-triangle": AlertTriangle,
  heart: Heart,
  target: Target,
  rocket: Rocket,
  crown: Crown,
};

const typeColor: Record<string, string> = {
  positive: "text-chart-4",
  neutral: "text-foreground",
  warning: "text-warning",
  action: "text-primary",
};

const typeDot: Record<string, string> = {
  positive: "bg-chart-4",
  neutral: "bg-muted-foreground",
  warning: "bg-warning",
  action: "bg-primary",
};

const urgencyStyles: Record<string, { border: string; bg: string; text: string }> = {
  high: { border: "border-destructive/30", bg: "bg-destructive/10", text: "text-destructive" },
  medium: { border: "border-warning/30", bg: "bg-warning/10", text: "text-warning" },
  low: { border: "border-chart-4/30", bg: "bg-chart-4/10", text: "text-chart-4" },
};

export default async function BriefingPage() {
  const profileExists = await hasProfile();
  if (!profileExists) redirect("/setup");

  const [profile, habits, goals, finance, checkins] = await Promise.all([
    readProfile(),
    readHabits(),
    readGoals(),
    readFinance(),
    listDailyCheckins(90),
  ]);

  if (!profile) redirect("/setup");

  const nudges = generateNudges(checkins, habits, goals, finance);
  const insights = generateInsights(checkins, habits, goals, finance);
  const briefing = generateBriefing(profile, checkins, habits, goals, nudges, insights, finance);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">{briefing.greeting}</h1>
        <p className="font-mono text-sm text-muted-foreground">{briefing.subtitle}</p>
      </div>

      {/* Briefing sections */}
      <div className="space-y-1">
        {briefing.sections.map((section) => {
          return (
            <div
              key={section.id}
              className="group flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-card"
            >
              <div className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${typeDot[section.type]}`} />
              <div className="flex-1 min-w-0">
                <span className="font-mono text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                  {section.label}
                </span>
                <p className={`text-sm leading-relaxed ${typeColor[section.type]}`}>
                  {section.content}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Nudges / Action Items */}
      {briefing.nudges.length > 0 && (
        <div className="space-y-3">
          <h2 className="flex items-center gap-2 font-mono text-xs font-medium uppercase tracking-widest text-muted-foreground px-3">
            <Zap className="h-3.5 w-3.5 text-primary" />
            Actions for today
          </h2>
          <div className="space-y-2">
            {briefing.nudges.map((nudge) => {
              const style = urgencyStyles[nudge.urgency];
              const Icon = nudgeIconMap[nudge.icon] || Zap;
              return (
                <Card key={nudge.id} className={`border ${style.border}`}>
                  <CardContent className="flex items-start gap-3 py-3">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${style.bg}`}>
                      <Icon className={`h-4 w-4 ${style.text}`} />
                    </div>
                    <p className="text-sm leading-relaxed pt-1">{nudge.message}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Financial Pulse */}
      {briefing.financePulse && (briefing.financePulse.income > 0 || briefing.financePulse.expenses > 0) && (
        <div className="space-y-3">
          <h2 className="flex items-center gap-2 font-mono text-xs font-medium uppercase tracking-widest text-muted-foreground px-3">
            <Wallet className="h-3.5 w-3.5 text-chart-5" />
            Financial pulse
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardContent className="py-4 text-center">
                <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">Income</p>
                <p className="text-lg font-bold text-chart-4">
                  {formatDisplay(briefing.financePulse.income, briefing.financePulse.currency)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 text-center">
                <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">Expenses</p>
                <p className="text-lg font-bold text-destructive">
                  {formatDisplay(briefing.financePulse.expenses, briefing.financePulse.currency)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 text-center">
                <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">Net</p>
                <p className={`text-lg font-bold ${briefing.financePulse.net >= 0 ? "text-chart-4" : "text-destructive"}`}>
                  {formatDisplay(briefing.financePulse.net, briefing.financePulse.currency)}
                </p>
              </CardContent>
            </Card>
          </div>
          {briefing.financePulse.income > 0 && (
            <div className="px-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                <span>Spending vs Income</span>
                <span>
                  {briefing.financePulse.income > 0
                    ? `${Math.round((briefing.financePulse.expenses / briefing.financePulse.income) * 100)}%`
                    : "---"}
                </span>
              </div>
              <Progress
                value={briefing.financePulse.income > 0 ? Math.min(100, (briefing.financePulse.expenses / briefing.financePulse.income) * 100) : 0}
                className="h-2"
              />
            </div>
          )}
        </div>
      )}

      {/* Goal Progress Snapshot */}
      {(() => {
        const activeGoals = goals.goals.filter(
          (g) => g.status === "active" || g.status === "planning"
        );
        if (activeGoals.length === 0) return null;
        return (
          <div className="space-y-3">
            <h2 className="flex items-center gap-2 font-mono text-xs font-medium uppercase tracking-widest text-muted-foreground px-3">
              <Target className="h-3.5 w-3.5 text-primary" />
              Goal progress
            </h2>
            <div className="space-y-2 px-3">
              {activeGoals.map((g) => {
                const progress = g.keyResults.length > 0
                  ? Math.round(g.keyResults.reduce((s, kr) => s + kr.progress, 0) / g.keyResults.length)
                  : 0;
                return (
                  <div key={g.id} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{g.title}</span>
                      <span className="text-xs text-muted-foreground">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-1.5" />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Focus */}
      {briefing.focusSuggestion && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
          <p className="font-mono text-[11px] font-medium uppercase tracking-widest text-primary">
            TODAY&apos;S FOCUS
          </p>
          <p className="mt-1 text-lg font-semibold">{briefing.focusSuggestion}</p>
        </div>
      )}

      {/* Insight of the Day */}
      {briefing.insightOfTheDay && (
        <div className="rounded-xl border border-chart-2/20 bg-chart-2/5 p-5">
          <p className="flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-widest text-chart-2">
            <Sparkles className="h-3.5 w-3.5" />
            Insight of the day
          </p>
          <p className="mt-1 text-sm font-semibold">{briefing.insightOfTheDay.title}</p>
          <p className="mt-0.5 text-sm text-muted-foreground leading-relaxed">{briefing.insightOfTheDay.body}</p>
        </div>
      )}

      {/* One-liner */}
      <div className="border-t border-border pt-6">
        <p className="text-center text-sm italic text-muted-foreground">
          {briefing.oneLiner}
        </p>
      </div>

      {/* Actions */}
      <div className="flex justify-center gap-3">
        <Link
          href="/checkin"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Check in <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/habits"
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-card transition-colors"
        >
          Habits
        </Link>
        <Link
          href="/goals"
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-card transition-colors"
        >
          Goals
        </Link>
        <Link
          href="/insights"
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-card transition-colors"
        >
          Insights
        </Link>
      </div>
    </div>
  );
}

function formatDisplay(amount: number, currency: string): string {
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
