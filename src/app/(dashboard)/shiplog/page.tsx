"use client";

import { useState, useEffect } from "react";
import { format, differenceInDays } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Hammer, Rocket, Check, Lock, DollarSign } from "lucide-react";
import type { ShipData, ShipEntry } from "@/lib/types";

const impactColors: Record<string, string> = {
  small: "text-muted-foreground",
  medium: "text-primary",
  big: "text-chart-5",
  launch: "text-chart-4",
};

const impactLabels: Record<string, string> = {
  small: "Small win",
  medium: "Solid ship",
  big: "Big move",
  launch: "Launch",
};

const categoryLabels: Record<string, string> = {
  code: "Code",
  content: "Content",
  outreach: "Outreach",
  product: "Product",
  learning: "Learning",
  automation: "Automation",
  other: "Other",
};

export default function ShipLogPage() {
  const [data, setData] = useState<ShipData | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "code" as ShipEntry["category"],
    impact: "small" as ShipEntry["impact"],
    revenueGenerated: "",
  });

  const load = () => fetch("/api/ships").then((r) => r.json()).then(setData);
  useEffect(() => { load(); }, []);

  if (!data) {
    return <div className="space-y-4">{[1, 2].map((i) => <div key={i} className="h-32 animate-pulse rounded-lg bg-card" />)}</div>;
  }

  const ship = async () => {
    if (!form.title.trim()) return;
    await fetch("/api/ships", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        revenueGenerated: form.revenueGenerated ? parseFloat(form.revenueGenerated) : undefined,
      }),
    });
    setForm({ title: "", description: "", category: "code", impact: "small", revenueGenerated: "" });
    setOpen(false);
    load();
  };

  const totalRevenue = data.entries
    .filter((e) => e.revenueGenerated)
    .reduce((s, e) => s + (e.revenueGenerated || 0), 0);

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const shippedToday = data.entries.filter((e) => e.date === todayStr).length;

  // Shipping streak
  let shipStreak = 0;
  for (let i = 0; i <= 365; i++) {
    const d = format(new Date(Date.now() - i * 86400000), "yyyy-MM-dd");
    if (data.entries.some((e) => e.date === d)) shipStreak++;
    else if (i > 0) break;
  }

  const thisWeek = data.entries.filter((e) => {
    const d = differenceInDays(new Date(), new Date(e.date));
    return d >= 0 && d < 7;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ship Log</h1>
          <p className="text-sm text-muted-foreground">
            If you didn&apos;t ship, it didn&apos;t happen.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger className="inline-flex items-center justify-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Hammer className="h-4 w-4" /> I shipped
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>What did you ship?</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>What</Label>
                <Input placeholder="Built the onboarding flow" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} autoFocus />
              </div>
              <div className="space-y-2">
                <Label>Details (optional)</Label>
                <Textarea placeholder="What exactly did you build/launch/create?" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: (v ?? form.category) as ShipEntry["category"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryLabels).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Impact</Label>
                  <Select value={form.impact} onValueChange={(v) => setForm({ ...form, impact: (v ?? form.impact) as ShipEntry["impact"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(impactLabels).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Revenue generated ($) — optional</Label>
                <Input type="number" placeholder="0" value={form.revenueGenerated} onChange={(e) => setForm({ ...form, revenueGenerated: e.target.value })} />
              </div>
              <Button onClick={ship} className="w-full gap-2" disabled={!form.title.trim()}>
                <Rocket className="h-4 w-4" /> Ship it
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">Today</p>
            <p className="text-2xl font-bold">{shippedToday}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">This week</p>
            <p className="text-2xl font-bold">{thisWeek.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">Streak</p>
            <p className="text-2xl font-bold">{shipStreak > 0 ? `${shipStreak}d` : "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">Revenue</p>
            <p className="text-2xl font-bold text-chart-4">${totalRevenue.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Milestones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <DollarSign className="h-4 w-4 text-chart-4" /> Zero to Freedom
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-1">
            {data.milestones.map((m, i) => {
              const reached = m.reachedDate !== null;
              const isNext = !reached && (i === 0 || data.milestones[i - 1].reachedDate !== null);
              return (
                <div key={m.amount} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors ${
                      reached
                        ? "border-chart-4 bg-chart-4/20 text-chart-4"
                        : isNext
                        ? "border-primary bg-primary/10 text-primary animate-pulse"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    {reached ? <Check className="h-4 w-4" /> : <Lock className="h-3 w-3" />}
                  </div>
                  <span className={`text-[10px] font-mono ${reached ? "text-chart-4" : isNext ? "text-primary" : "text-muted-foreground"}`}>
                    {m.label}
                  </span>
                  {reached && m.reachedDate && (
                    <span className="text-[9px] text-muted-foreground">{m.reachedDate}</span>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Ship entries */}
      {data.entries.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Hammer className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground">Nothing shipped yet. Build something and log it.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {data.entries.slice(0, 50).map((entry) => (
            <Card key={entry.id}>
              <CardContent className="flex items-start gap-3 py-3">
                <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                  entry.impact === "launch" ? "bg-chart-4" : entry.impact === "big" ? "bg-chart-5" : entry.impact === "medium" ? "bg-primary" : "bg-muted-foreground"
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{entry.title}</span>
                    {entry.revenueGenerated && entry.revenueGenerated > 0 && (
                      <Badge variant="secondary" className="text-[10px] text-chart-4 bg-chart-4/10">
                        +${entry.revenueGenerated}
                      </Badge>
                    )}
                  </div>
                  {entry.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{entry.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <span>{entry.date}</span>
                    <Badge variant="secondary" className="text-[10px]">{categoryLabels[entry.category]}</Badge>
                    <Badge variant="secondary" className={`text-[10px] ${impactColors[entry.impact]}`}>
                      {impactLabels[entry.impact]}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
