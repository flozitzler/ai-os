"use client";

import { useState, useEffect } from "react";
import { format, differenceInDays } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Check, Clock, AlertTriangle, Plus } from "lucide-react";
import type { GoalData, Goal, GoalStatus } from "@/lib/types";

const statusColors: Record<GoalStatus, string> = {
  "not-started": "text-muted-foreground",
  planning: "text-warning",
  active: "text-primary",
  completed: "text-success",
  abandoned: "text-destructive",
};

export default function GoalsPage() {
  const [data, setData] = useState<GoalData | null>(null);
  const [open, setOpen] = useState(false);
  const [newGoal, setNewGoal] = useState({ title: "", description: "", deadline: "" });

  useEffect(() => {
    fetch("/api/goals").then((r) => r.json()).then(setData);
  }, []);

  const addGoal = async () => {
    if (!newGoal.title.trim() || !data) return;
    const id = newGoal.title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const today = format(new Date(), "yyyy-MM-dd");
    const updated: GoalData = {
      ...data,
      quarter: data.quarter || `Q${Math.ceil((new Date().getMonth() + 1) / 3)}-${new Date().getFullYear()}`,
      goals: [
        ...data.goals,
        {
          id,
          title: newGoal.title.trim(),
          description: newGoal.description.trim(),
          deadline: newGoal.deadline || today,
          status: "active",
          keyResults: [],
          lastWorkedOn: null,
          createdAt: today,
        },
      ],
    };
    setData(updated);
    await fetch("/api/goals", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    setNewGoal({ title: "", description: "", deadline: "" });
    setOpen(false);
  };

  if (!data) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 animate-pulse rounded-lg bg-card" />
        ))}
      </div>
    );
  }

  const toggleKR = async (goalId: string, krId: string) => {
    const updated = {
      ...data,
      goals: data.goals.map((g) =>
        g.id === goalId
          ? {
              ...g,
              lastWorkedOn: format(new Date(), "yyyy-MM-dd"),
              keyResults: g.keyResults.map((kr) =>
                kr.id === krId ? { ...kr, done: !kr.done, progress: !kr.done ? 100 : 0 } : kr
              ),
            }
          : g
      ),
    };
    setData(updated);
    await fetch("/api/goals", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
  };

  const getOverallProgress = (goal: Goal) => {
    if (goal.keyResults.length === 0) return 0;
    const total = goal.keyResults.reduce((sum, kr) => sum + kr.progress, 0);
    return Math.round(total / goal.keyResults.length);
  };

  const getDaysSince = (date: string | null) => {
    if (!date) return null;
    return differenceInDays(new Date(), new Date(date));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Goals</h1>
          <p className="text-sm text-muted-foreground">{data.quarter || "Set your quarter goals"}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger className="inline-flex items-center justify-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" /> New Goal
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Goal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  placeholder="What do you want to achieve?"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  placeholder="Why does this matter?"
                  value={newGoal.description}
                  onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Deadline</Label>
                <Input
                  type="date"
                  value={newGoal.deadline}
                  onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                />
              </div>
              <Button onClick={addGoal} className="w-full" disabled={!newGoal.title.trim()}>
                Add Goal
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {data.goals.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No goals yet — add your first one!</p>
          </CardContent>
        </Card>
      )}

      {data.goals.map((goal) => {
        const progress = getOverallProgress(goal);
        const daysSince = getDaysSince(goal.lastWorkedOn);
        const daysLeft = differenceInDays(new Date(goal.deadline), new Date());

        return (
          <Card key={goal.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{goal.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{goal.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className={statusColors[goal.status]}>
                    {goal.status}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              <div className="flex gap-4 text-xs text-muted-foreground">
                {daysLeft > 0 ? (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {daysLeft} days left
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-destructive">
                    <AlertTriangle className="h-3 w-3" /> Overdue
                  </span>
                )}
                {daysSince !== null && (
                  <span className={daysSince > 7 ? "text-warning" : ""}>
                    Last worked on {daysSince === 0 ? "today" : `${daysSince}d ago`}
                  </span>
                )}
                {daysSince === null && <span>Not started yet</span>}
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Key Results
                </p>
                {goal.keyResults.map((kr) => (
                  <div key={kr.id} className="flex items-center gap-3">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={() => toggleKR(goal.id, kr.id)}
                    >
                      <div
                        className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${
                          kr.done
                            ? "border-success bg-success/20 text-success"
                            : "border-muted-foreground"
                        }`}
                      >
                        {kr.done && <Check className="h-3 w-3" />}
                      </div>
                    </Button>
                    <span
                      className={`text-sm ${
                        kr.done ? "text-muted-foreground line-through" : ""
                      }`}
                    >
                      {kr.text}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
