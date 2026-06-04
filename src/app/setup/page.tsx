"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRight, Plus, X } from "lucide-react";
import type { Profile, Habit } from "@/lib/types";

const SUGGESTED_HABITS: Omit<Habit, "createdAt">[] = [
  { id: "wake-early", name: "Wake up early", emoji: "sunrise", block: "morning" },
  { id: "no-phone", name: "No phone first 30 min", emoji: "smartphone-off", block: "morning" },
  { id: "plan-day", name: "Plan the day (top 3)", emoji: "list-checks", block: "morning" },
  { id: "exercise", name: "Exercise", emoji: "dumbbell", block: "day" },
  { id: "deep-work", name: "Deep work (2h+ block)", emoji: "target", block: "day" },
  { id: "revenue-action", name: "1 revenue action", emoji: "dollar-sign", block: "day" },
  { id: "ship", name: "Ship something", emoji: "rocket", block: "day" },
  { id: "talk-customer", name: "Talk to a customer", emoji: "message-circle", block: "day" },
  { id: "read", name: "Read 20 min", emoji: "book-open", block: "evening" },
  { id: "reflect", name: "Evening reflection", emoji: "pen-line", block: "evening" },
  { id: "no-screens", name: "No screens before bed", emoji: "monitor-off", block: "evening" },
  { id: "gratitude", name: "Gratitude", emoji: "heart", block: "evening" },
];

const CURRENCIES = [
  { code: "USD", label: "US Dollar ($)" },
  { code: "EUR", label: "Euro (\u20AC)" },
  { code: "GBP", label: "British Pound (\u00A3)" },
  { code: "IDR", label: "Indonesian Rupiah (Rp)" },
  { code: "JPY", label: "Japanese Yen (\u00A5)" },
  { code: "AUD", label: "Australian Dollar (A$)" },
  { code: "CAD", label: "Canadian Dollar (C$)" },
  { code: "INR", label: "Indian Rupee (\u20B9)" },
  { code: "BRL", label: "Brazilian Real (R$)" },
  { code: "MXN", label: "Mexican Peso (MX$)" },
];

export default function SetupPage() {
  const router = useRouter();
  const today = format(new Date(), "yyyy-MM-dd");
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [selectedHabits, setSelectedHabits] = useState<Set<string>>(new Set());
  const [customHabit, setCustomHabit] = useState("");
  const [customHabits, setCustomHabits] = useState<{ id: string; name: string; block: "morning" | "day" | "evening" }[]>([]);
  const [saving, setSaving] = useState(false);

  const toggleHabit = (id: string) => {
    const next = new Set(selectedHabits);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedHabits(next);
  };

  const addCustomHabit = () => {
    if (!customHabit.trim()) return;
    const id = customHabit.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    setCustomHabits([...customHabits, { id, name: customHabit.trim(), block: "day" }]);
    setCustomHabit("");
  };

  const removeCustomHabit = (id: string) => {
    setCustomHabits(customHabits.filter((h) => h.id !== id));
  };

  const finish = async () => {
    setSaving(true);

    const profile: Profile = {
      name,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      startDate: today,
      currentQuarter: `Q${Math.ceil((new Date().getMonth() + 1) / 3)}-${new Date().getFullYear()}`,
      lifeAreas: {
        health: { score: 5, updatedAt: today },
        finance: { score: 5, updatedAt: today },
        career: { score: 5, updatedAt: today },
        relationships: { score: 5, updatedAt: today },
        growth: { score: 5, updatedAt: today },
        fulfillment: { score: 5, updatedAt: today },
      },
    };

    const habits = [
      ...SUGGESTED_HABITS.filter((h) => selectedHabits.has(h.id)).map((h) => ({ ...h, createdAt: today })),
      ...customHabits.map((h) => ({ ...h, emoji: "circle-dot", createdAt: today })),
    ];

    await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });

    await fetch("/api/habits", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ habits, completions: {} }),
    });

    if (currency !== "USD") {
      const finance = await fetch("/api/finance").then((r) => r.json());
      finance.currency = currency;
      await fetch("/api/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finance),
      });
    }

    router.push("/briefing");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            AI<span className="text-primary"> OS</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            {step === 1 ? "From zero to freedom. Let's set you up." : "Pick the habits that build your future."}
          </p>
          <div className="flex justify-center gap-2 pt-2">
            <div className={`h-1.5 w-12 rounded-full ${step >= 1 ? "bg-primary" : "bg-secondary"}`} />
            <div className={`h-1.5 w-12 rounded-full ${step >= 2 ? "bg-primary" : "bg-secondary"}`} />
          </div>
        </div>

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>About You</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Your Name</Label>
                <Input
                  placeholder="What should we call you?"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={currency} onValueChange={(v) => setCurrency(v ?? currency)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => setStep(2)}
                disabled={!name.trim()}
                className="w-full gap-2"
              >
                Next <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Choose Your Habits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(["morning", "day", "evening"] as const).map((block) => (
                <div key={block} className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {block}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTED_HABITS.filter((h) => h.block === block).map((h) => (
                      <button
                        key={h.id}
                        onClick={() => toggleHabit(h.id)}
                        className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                          selectedHabits.has(h.id)
                            ? "border-primary bg-primary/20 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/50"
                        }`}
                      >
                        {h.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {customHabits.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Custom
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {customHabits.map((h) => (
                      <div
                        key={h.id}
                        className="flex items-center gap-1 rounded-lg border border-primary bg-primary/20 px-3 py-1.5 text-sm text-primary"
                      >
                        {h.name}
                        <button onClick={() => removeCustomHabit(h.id)}>
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Input
                  placeholder="Add a custom habit..."
                  value={customHabit}
                  onChange={(e) => setCustomHabit(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCustomHabit()}
                />
                <Button variant="secondary" size="sm" onClick={addCustomHabit}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={finish}
                  disabled={saving || (selectedHabits.size === 0 && customHabits.length === 0)}
                  className="flex-1 gap-2"
                >
                  {saving ? "Setting up..." : "Start Your Journey"}
                  {!saving && <ArrowRight className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
