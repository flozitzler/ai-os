"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Check, Plus, X } from "lucide-react";
import type { DailyCheckin, Priority } from "@/lib/types";

const moodEmojis = ["", "😞", "😔", "😐", "🙂", "😊", "😄", "😁", "🤩", "🔥", "💎"];

export function CheckinForm() {
  const today = format(new Date(), "yyyy-MM-dd");
  const [saved, setSaved] = useState(false);
  const [data, setData] = useState<Partial<DailyCheckin>>({
    date: today,
    mood: 5,
    energy: 5,
    sleepHours: 7,
    dayRating: 5,
    gratitude: "",
    notes: "",
    morningCheckin: "",
    topPriorities: [
      { text: "", done: false },
      { text: "", done: false },
      { text: "", done: false },
    ],
    wins: [],
    lessons: [],
  });

  useEffect(() => {
    fetch(`/api/checkin/${today}`)
      .then((r) => r.json())
      .then((existing) => {
        if (existing) {
          setData(existing);
        }
      });
  }, [today]);

  const save = useCallback(async (updated: Partial<DailyCheckin>) => {
    await fetch(`/api/checkin/${today}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }, [today]);

  const update = (field: string, value: unknown) => {
    const updated = { ...data, [field]: value };
    setData(updated);
  };

  const updatePriority = (index: number, field: keyof Priority, value: string | boolean) => {
    const priorities = [...(data.topPriorities || [])];
    priorities[index] = { ...priorities[index], [field]: value };
    const updated = { ...data, topPriorities: priorities };
    setData(updated);
  };

  const addListItem = (field: "wins" | "lessons") => {
    const list = [...(data[field] || []), ""];
    setData({ ...data, [field]: list });
  };

  const updateListItem = (field: "wins" | "lessons", index: number, value: string) => {
    const list = [...(data[field] || [])];
    list[index] = value;
    setData({ ...data, [field]: list });
  };

  const removeListItem = (field: "wins" | "lessons", index: number) => {
    const list = [...(data[field] || [])];
    list.splice(index, 1);
    const updated = { ...data, [field]: list };
    setData(updated);
    save(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Daily Check-in</h1>
          <p className="text-sm text-muted-foreground">
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <Badge variant="secondary" className="gap-1 text-success">
              <Check className="h-3 w-3" /> Saved
            </Badge>
          )}
          <Button onClick={() => save(data)}>Save</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">How are you feeling?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Mood</Label>
              <span className="text-2xl">{moodEmojis[data.mood || 5]}</span>
            </div>
            <Slider
              value={[data.mood || 5]}
              onValueChange={(v) => update("mood", Array.isArray(v) ? v[0] : v)}
              onValueCommitted={(v) => { const val = Array.isArray(v) ? v[0] : v; save({ ...data, mood: val }); }}
              min={1}
              max={10}
              step={1}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Low</span>
              <span>{data.mood}/10</span>
              <span>High</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Energy</Label>
              <span className="text-sm font-medium text-primary">{data.energy}/10</span>
            </div>
            <Slider
              value={[data.energy || 5]}
              onValueChange={(v) => update("energy", Array.isArray(v) ? v[0] : v)}
              onValueCommitted={(v) => { const val = Array.isArray(v) ? v[0] : v; save({ ...data, energy: val }); }}
              min={1}
              max={10}
              step={1}
            />
          </div>

          <div className="space-y-2">
            <Label>Sleep (hours)</Label>
            <Input
              type="number"
              step={0.5}
              min={0}
              max={14}
              value={data.sleepHours || ""}
              onChange={(e) => update("sleepHours", parseFloat(e.target.value) || 0)}
              onBlur={() => save(data)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Morning Check-in</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="How do I feel? What's on my mind?"
            value={data.morningCheckin || ""}
            onChange={(e) => update("morningCheckin", e.target.value)}
            onBlur={() => save(data)}
            rows={3}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top 3 Priorities</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(data.topPriorities || []).map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              <button
                onClick={() => {
                  updatePriority(i, "done", !p.done);
                  save({ ...data, topPriorities: data.topPriorities?.map((pp, j) => j === i ? { ...pp, done: !pp.done } : pp) });
                }}
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                  p.done ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground"
                }`}
              >
                {p.done && <Check className="h-3 w-3" />}
              </button>
              <Input
                placeholder={`Priority ${i + 1}`}
                value={p.text}
                onChange={(e) => updatePriority(i, "text", e.target.value)}
                onBlur={() => save(data)}
                className={p.done ? "line-through opacity-50" : ""}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <span className="text-primary">What did you ship today?</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="Built the onboarding flow, wrote 2 blog posts, fixed the payment bug..."
            value={data.shipped || ""}
            onChange={(e) => update("shipped", e.target.value)}
            onBlur={() => save(data)}
            rows={2}
          />
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Revenue generated today ($)</Label>
            <Input
              type="number"
              placeholder="0"
              value={data.revenueToday || ""}
              onChange={(e) => update("revenueToday", parseFloat(e.target.value) || 0)}
              onBlur={() => save(data)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gratitude</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="What am I grateful for today?"
            value={data.gratitude || ""}
            onChange={(e) => update("gratitude", e.target.value)}
            onBlur={() => save(data)}
            rows={2}
          />
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Wins</CardTitle>
            <Button size="sm" variant="ghost" onClick={() => addListItem("wins")}>
              <Plus className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {(data.wins || []).map((w, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  placeholder="Something that went well..."
                  value={w}
                  onChange={(e) => updateListItem("wins", i, e.target.value)}
                  onBlur={() => save(data)}
                />
                <button onClick={() => removeListItem("wins", i)} className="text-muted-foreground hover:text-destructive">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            {(data.wins || []).length === 0 && (
              <p className="text-sm text-muted-foreground">No wins yet — add one!</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Lessons</CardTitle>
            <Button size="sm" variant="ghost" onClick={() => addListItem("lessons")}>
              <Plus className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {(data.lessons || []).map((l, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  placeholder="Something I learned..."
                  value={l}
                  onChange={(e) => updateListItem("lessons", i, e.target.value)}
                  onBlur={() => save(data)}
                />
                <button onClick={() => removeListItem("lessons", i)} className="text-muted-foreground hover:text-destructive">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            {(data.lessons || []).length === 0 && (
              <p className="text-sm text-muted-foreground">No lessons yet — add one!</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Evening Reflection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Free-form notes about the day..."
            value={data.notes || ""}
            onChange={(e) => update("notes", e.target.value)}
            onBlur={() => save(data)}
            rows={3}
          />
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Day Rating</Label>
              <span className="text-sm font-medium text-primary">{data.dayRating}/10</span>
            </div>
            <Slider
              value={[data.dayRating || 5]}
              onValueChange={(v) => update("dayRating", Array.isArray(v) ? v[0] : v)}
              onValueCommitted={(v) => { const val = Array.isArray(v) ? v[0] : v; save({ ...data, dayRating: val }); }}
              min={1}
              max={10}
              step={1}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
