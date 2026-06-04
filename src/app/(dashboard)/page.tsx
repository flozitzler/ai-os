import { readProfile, readHabits, readGoals, readFinance, listDailyCheckins, hasProfile } from "@/lib/data";
import { generateInsights } from "@/lib/insights";
import { format, differenceInDays } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  Battery,
  Moon,
  Flame,
  Sparkles,
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  PenSquare,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const profileExists = await hasProfile();
  if (!profileExists) redirect("/setup");

  const [profile, habits, goals, checkins] = await Promise.all([
    readProfile(),
    readHabits(),
    readGoals(),
    listDailyCheckins(7),
  ]);

  if (!profile) redirect("/setup");

  const [allCheckins, finance] = await Promise.all([
    listDailyCheckins(90),
    readFinance(),
  ]);
  const topInsights = generateInsights(allCheckins, habits, goals, finance).slice(0, 3);

  const today = format(new Date(), "yyyy-MM-dd");
  const todayCheckin = checkins.find((c) => c.date === today);
  const dayNumber = differenceInDays(new Date(), new Date(profile.startDate)) + 1;

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const todayCompletions = habits.completions[today] || {};
  const habitsDone = habits.habits.filter((h) => todayCompletions[h.id]).length;
  const habitsTotal = habits.habits.length;
  const habitPercent = habitsTotal > 0 ? Math.round((habitsDone / habitsTotal) * 100) : 0;

  const streaks = habits.habits.map((h) => {
    let streak = 0;
    for (let i = 0; i <= 365; i++) {
      const d = format(new Date(Date.now() - i * 86400000), "yyyy-MM-dd");
      if (habits.completions[d]?.[h.id]) streak++;
      else if (i > 0) break;
    }
    return { name: h.name, streak };
  }).filter((s) => s.streak > 0).sort((a, b) => b.streak - a.streak);

  const activeGoals = goals.goals.filter(
    (g) => g.status === "active" || g.status === "planning"
  );

  const moodValues = checkins
    .map((c) => c.mood)
    .filter((m): m is number => m !== undefined);
  const avgMood =
    moodValues.length > 0
      ? Math.round((moodValues.reduce((a, b) => a + b, 0) / moodValues.length) * 10) / 10
      : null;

  function TrendIcon({ values }: { values: number[] }) {
    if (values.length < 2) return <Minus className="h-4 w-4 text-muted-foreground" />;
    const recent = values.slice(0, 3);
    const earlier = values.slice(3);
    if (earlier.length === 0) return <Minus className="h-4 w-4 text-muted-foreground" />;
    const rAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const eAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length;
    if (rAvg - eAvg > 0.5) return <TrendingUp className="h-4 w-4 text-success" />;
    if (eAvg - rAvg > 0.5) return <TrendingDown className="h-4 w-4 text-destructive" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {greeting}, {profile.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            Day {dayNumber} &middot; {format(new Date(), "EEEE, MMMM d")}
          </p>
        </div>
        {!todayCheckin && (
          <Link href="/checkin">
            <Badge
              variant="secondary"
              className="cursor-pointer gap-1 hover:bg-primary/20"
            >
              <PenSquare className="h-3 w-3" /> Check in today
            </Badge>
          </Link>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Mood</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold">{todayCheckin?.mood ?? "—"}</p>
                <TrendIcon values={moodValues} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-4/20">
              <Battery className="h-5 w-5 text-chart-4" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Energy</p>
              <p className="text-2xl font-bold">{todayCheckin?.energy ?? "—"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-2/20">
              <Moon className="h-5 w-5 text-chart-2" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sleep</p>
              <p className="text-2xl font-bold">
                {todayCheckin?.sleepHours ? `${todayCheckin.sleepHours}h` : "—"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/20">
              <Flame className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Habits</p>
              <p className="text-2xl font-bold">{habitsDone}/{habitsTotal}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Today&apos;s Habits</CardTitle>
          <Link href="/habits" className="text-sm text-muted-foreground hover:text-foreground">
            View all →
          </Link>
        </CardHeader>
        <CardContent className="space-y-3">
          <Progress value={habitPercent} className="h-3" />
          <div className="flex flex-wrap gap-2">
            {habits.habits.map((h) => (
              <Badge
                key={h.id}
                variant={todayCompletions[h.id] ? "default" : "secondary"}
                className={todayCompletions[h.id] ? "bg-primary/20 text-primary" : ""}
              >
                {todayCompletions[h.id] ? "✓ " : ""}{h.name}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Active Streaks</CardTitle>
          </CardHeader>
          <CardContent>
            {streaks.length > 0 ? (
              <div className="space-y-3">
                {streaks.slice(0, 5).map((s) => (
                  <div key={s.name} className="flex items-center justify-between">
                    <span className="text-sm">{s.name}</span>
                    <Badge variant="secondary" className="gap-1">
                      <Flame className="h-3 w-3 text-warning" /> {s.streak}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No active streaks yet — check off a habit to start!
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Goals</CardTitle>
            <Link href="/goals" className="text-sm text-muted-foreground hover:text-foreground">
              View all →
            </Link>
          </CardHeader>
          <CardContent>
            {activeGoals.length > 0 ? (
              <div className="space-y-4">
                {activeGoals.map((g) => {
                  const progress = g.keyResults.length > 0
                    ? Math.round(g.keyResults.reduce((s, kr) => s + kr.progress, 0) / g.keyResults.length)
                    : 0;
                  return (
                    <div key={g.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{g.title}</span>
                        <div className="flex items-center gap-2">
                          <Target className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{progress}%</span>
                        </div>
                      </div>
                      <Progress value={progress} className="h-1.5" />
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No active goals</p>
            )}
          </CardContent>
        </Card>
      </div>

      {avgMood !== null && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-8">
              <div>
                <p className="text-sm text-muted-foreground">Avg Mood</p>
                <p className="text-3xl font-bold">{avgMood}</p>
              </div>
              <div className="flex flex-1 items-end gap-1">
                {checkins.slice().reverse().map((c) => (
                  <div key={c.date} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className="w-full rounded-sm bg-primary/30"
                      style={{ height: `${(c.mood || 0) * 6}px` }}
                    />
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(c.date), "EEE")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {topInsights.length > 0 && (
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" /> Insights
            </CardTitle>
            <Link href="/insights" className="text-sm text-muted-foreground hover:text-foreground">
              View all →
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {topInsights.map((insight) => (
              <div key={insight.id} className="flex gap-3">
                <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary mt-2" />
                <div>
                  <p className="text-sm font-medium">{insight.title}</p>
                  <p className="text-xs text-muted-foreground">{insight.body}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
