"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Check, Trash2 } from "lucide-react";
import type { Profile, HabitData, Habit } from "@/lib/types";

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [habits, setHabits] = useState<HabitData | null>(null);
  const [saved, setSaved] = useState(false);
  const [newHabitName, setNewHabitName] = useState("");
  const [newHabitBlock, setNewHabitBlock] = useState<"morning" | "day" | "evening">("day");

  useEffect(() => {
    fetch("/api/profile").then((r) => r.json()).then(setProfile);
    fetch("/api/habits").then((r) => r.json()).then(setHabits);
  }, []);

  if (!profile || !habits) {
    return <div className="space-y-4">{[1, 2].map((i) => <div key={i} className="h-40 animate-pulse rounded-lg bg-card" />)}</div>;
  }

  const saveProfile = async (updated: Profile) => {
    setProfile(updated);
    await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const saveHabits = async (updated: HabitData) => {
    setHabits(updated);
    await fetch("/api/habits", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const addHabit = () => {
    if (!newHabitName.trim()) return;
    const id = newHabitName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const habit: Habit = {
      id,
      name: newHabitName.trim(),
      emoji: "circle-dot",
      block: newHabitBlock,
      createdAt: new Date().toISOString().split("T")[0],
    };
    const updated = { ...habits, habits: [...habits.habits, habit] };
    saveHabits(updated);
    setNewHabitName("");
  };

  const removeHabit = (id: string) => {
    const updated = { ...habits, habits: habits.habits.filter((h) => h.id !== id) };
    saveHabits(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Settings</h1>
        {saved && (
          <Badge variant="secondary" className="gap-1 text-success">
            <Check className="h-3 w-3" /> Saved
          </Badge>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              onBlur={() => saveProfile(profile)}
            />
          </div>
          <div className="space-y-2">
            <Label>Currency</Label>
            <Select
              value={profile.timezone}
              onValueChange={() => {}}
            >
              <SelectTrigger>
                <SelectValue placeholder={profile.timezone} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={profile.timezone}>{profile.timezone}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Started</p>
              <p className="font-medium">{profile.startDate}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Quarter</p>
              <p className="font-medium">{profile.currentQuarter}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Habits</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(["morning", "day", "evening"] as const).map((block) => {
            const blockHabits = habits.habits.filter((h) => h.block === block);
            if (blockHabits.length === 0) return null;
            return (
              <div key={block} className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{block}</p>
                {blockHabits.map((h) => (
                  <div key={h.id} className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2">
                    <span className="text-sm">{h.name}</span>
                    <button onClick={() => removeHabit(h.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            );
          })}

          <div className="flex gap-2">
            <Input
              placeholder="New habit name..."
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addHabit()}
            />
            <Select value={newHabitBlock} onValueChange={(v) => setNewHabitBlock((v ?? newHabitBlock) as "morning" | "day" | "evening")}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="morning">Morning</SelectItem>
                <SelectItem value="day">Day</SelectItem>
                <SelectItem value="evening">Evening</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="secondary" onClick={addHabit}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Life Areas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(profile.lifeAreas).map(([key, area]) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm capitalize">{key}</span>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={area.score}
                  onChange={(e) => {
                    const updated = {
                      ...profile,
                      lifeAreas: {
                        ...profile.lifeAreas,
                        [key]: { score: parseInt(e.target.value), updatedAt: new Date().toISOString().split("T")[0] },
                      },
                    };
                    setProfile(updated);
                  }}
                  onMouseUp={() => saveProfile(profile)}
                  onTouchEnd={() => saveProfile(profile)}
                  className="w-24 accent-primary"
                />
                <span className="w-6 text-right text-sm font-medium">{area.score}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            To reset your data, delete the files in the <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">data/</code> folder and refresh.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
