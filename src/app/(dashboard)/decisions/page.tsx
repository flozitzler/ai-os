"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
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
import { Plus, ChevronDown, ChevronUp, Check, Clock, AlertTriangle, Scale } from "lucide-react";
import type { DecisionData, Decision, DecisionOutcome } from "@/lib/types";

const stakesColors: Record<string, string> = {
  low: "text-muted-foreground",
  medium: "text-chart-5",
  high: "text-warning",
  critical: "text-destructive",
};

const outcomeLabels: Record<string, { label: string; color: string }> = {
  "better-than-expected": { label: "Better than expected", color: "text-chart-4" },
  "as-expected": { label: "As expected", color: "text-primary" },
  "worse-than-expected": { label: "Worse than expected", color: "text-destructive" },
};

export default function DecisionsPage() {
  const [data, setData] = useState<DecisionData | null>(null);
  const [open, setOpen] = useState(false);
  const [resolveId, setResolveId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "resolved">("all");
  const [form, setForm] = useState({
    title: "",
    context: "",
    options: "",
    decision: "",
    expectedOutcome: "",
    confidence: 5,
    stakes: "medium" as Decision["stakes"],
    category: "product",
  });
  const [resolveForm, setResolveForm] = useState({
    actualOutcome: "",
    outcome: "as-expected" as DecisionOutcome,
    lessonsLearned: "",
  });

  const load = () => fetch("/api/decisions").then((r) => r.json()).then(setData);
  useEffect(() => { load(); }, []);

  if (!data) {
    return <div className="space-y-4">{[1, 2].map((i) => <div key={i} className="h-32 animate-pulse rounded-lg bg-card" />)}</div>;
  }

  const addDecision = async () => {
    if (!form.title.trim() || !form.decision.trim()) return;
    await fetch("/api/decisions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        date: format(new Date(), "yyyy-MM-dd"),
        status: "pending",
      }),
    });
    setForm({ title: "", context: "", options: "", decision: "", expectedOutcome: "", confidence: 5, stakes: "medium", category: "product" });
    setOpen(false);
    load();
  };

  const resolveDecision = async (id: string) => {
    await fetch(`/api/decisions/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...resolveForm,
        status: "resolved",
        resolvedDate: format(new Date(), "yyyy-MM-dd"),
      }),
    });
    setResolveId(null);
    setResolveForm({ actualOutcome: "", outcome: "as-expected", lessonsLearned: "" });
    load();
  };

  const filtered = data.decisions.filter((d) => {
    if (filter === "pending") return d.status === "pending";
    if (filter === "resolved") return d.status === "resolved";
    return true;
  });

  const pendingCount = data.decisions.filter((d) => d.status === "pending").length;

  // Stats
  const resolved = data.decisions.filter((d) => d.status === "resolved" && d.outcome);
  const betterCount = resolved.filter((d) => d.outcome === "better-than-expected").length;
  const asExpectedCount = resolved.filter((d) => d.outcome === "as-expected").length;
  const avgConfidence = resolved.length > 0
    ? (resolved.reduce((s, d) => s + d.confidence, 0) / resolved.length).toFixed(1)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Decision Journal</h1>
          <p className="text-sm text-muted-foreground">
            Log decisions. Review outcomes. Get sharper over time.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger className="inline-flex items-center justify-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Log Decision
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Log a Decision</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>What&apos;s the decision?</Label>
                <Input placeholder="e.g. Switching from Stripe to Lemon Squeezy" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} autoFocus />
              </div>
              <div className="space-y-2">
                <Label>Context</Label>
                <Textarea placeholder="What situation led to this decision?" value={form.context} onChange={(e) => setForm({ ...form, context: e.target.value })} rows={2} />
              </div>
              <div className="space-y-2">
                <Label>Options considered</Label>
                <Textarea placeholder="What alternatives did you consider?" value={form.options} onChange={(e) => setForm({ ...form, options: e.target.value })} rows={2} />
              </div>
              <div className="space-y-2">
                <Label>What I decided & why</Label>
                <Textarea placeholder="The actual decision and reasoning" value={form.decision} onChange={(e) => setForm({ ...form, decision: e.target.value })} rows={2} />
              </div>
              <div className="space-y-2">
                <Label>Expected outcome</Label>
                <Textarea placeholder="What do you expect will happen?" value={form.expectedOutcome} onChange={(e) => setForm({ ...form, expectedOutcome: e.target.value })} rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Stakes</Label>
                  <Select value={form.stakes} onValueChange={(v) => setForm({ ...form, stakes: (v ?? form.stakes) as Decision["stakes"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v ?? form.category })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {data.categories.map((c) => (
                        <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Confidence</Label>
                  <span className="text-sm text-primary font-medium">{form.confidence}/10</span>
                </div>
                <Slider
                  value={[form.confidence]}
                  onValueChange={(v) => setForm({ ...form, confidence: Array.isArray(v) ? v[0] : v })}
                  min={1} max={10} step={1}
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Guessing</span><span>Very confident</span>
                </div>
              </div>
              <Button onClick={addDecision} className="w-full" disabled={!form.title.trim() || !form.decision.trim()}>
                Log Decision
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      {resolved.length >= 3 && (
        <div className="grid grid-cols-4 gap-3">
          <Card>
            <CardContent className="py-4 text-center">
              <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">Decisions</p>
              <p className="text-2xl font-bold">{data.decisions.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">Hit rate</p>
              <p className="text-2xl font-bold text-chart-4">{Math.round(((betterCount + asExpectedCount) / resolved.length) * 100)}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">Avg conf.</p>
              <p className="text-2xl font-bold">{avgConfidence}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold text-warning">{pendingCount}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2">
        {(["all", "pending", "resolved"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
              filter === f ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === "pending" && pendingCount > 0 && (
              <span className="ml-1 text-xs">({pendingCount})</span>
            )}
          </button>
        ))}
      </div>

      {/* Decision List */}
      {filtered.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Scale className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground">
              {filter === "all"
                ? "No decisions logged yet. Every decision you track makes you a sharper founder."
                : `No ${filter} decisions.`}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {filtered.map((d) => {
          const isExpanded = expandedId === d.id;
          const isResolving = resolveId === d.id;
          return (
            <Card key={d.id}>
              <CardContent className="py-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {d.status === "pending" ? (
                        <Clock className="h-3.5 w-3.5 text-warning" />
                      ) : (
                        <Check className="h-3.5 w-3.5 text-chart-4" />
                      )}
                      <span className="text-sm font-semibold">{d.title}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{d.date}</span>
                      <Badge variant="secondary" className="text-[10px]">{d.category}</Badge>
                      <Badge variant="secondary" className={`text-[10px] ${stakesColors[d.stakes]}`}>
                        {d.stakes} stakes
                      </Badge>
                      <span>confidence {d.confidence}/10</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {d.status === "pending" && (
                      <Button size="sm" variant="ghost" onClick={() => { setResolveId(isResolving ? null : d.id); setExpandedId(d.id); }}>
                        <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => setExpandedId(isExpanded ? null : d.id)}>
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {d.status === "resolved" && d.outcome && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={`text-xs ${outcomeLabels[d.outcome].color}`}>
                      {outcomeLabels[d.outcome].label}
                    </Badge>
                    {d.resolvedDate && (
                      <span className="text-xs text-muted-foreground">resolved {d.resolvedDate}</span>
                    )}
                  </div>
                )}

                {isExpanded && (
                  <div className="space-y-3 border-t border-border pt-3 text-sm">
                    {d.context && <div><p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">Context</p><p className="text-muted-foreground">{d.context}</p></div>}
                    {d.options && <div><p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">Options considered</p><p className="text-muted-foreground">{d.options}</p></div>}
                    <div><p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">Decision & reasoning</p><p>{d.decision}</p></div>
                    <div><p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">Expected outcome</p><p className="text-muted-foreground">{d.expectedOutcome}</p></div>
                    {d.actualOutcome && <div><p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">Actual outcome</p><p>{d.actualOutcome}</p></div>}
                    {d.lessonsLearned && <div><p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">Lessons learned</p><p className="italic">{d.lessonsLearned}</p></div>}
                  </div>
                )}

                {isResolving && (
                  <div className="space-y-3 rounded-lg border border-warning/20 bg-warning/5 p-4">
                    <p className="text-sm font-semibold">How did it turn out?</p>
                    <div className="space-y-2">
                      <Label>What actually happened</Label>
                      <Textarea placeholder="Describe the actual outcome..." value={resolveForm.actualOutcome} onChange={(e) => setResolveForm({ ...resolveForm, actualOutcome: e.target.value })} rows={2} />
                    </div>
                    <div className="space-y-2">
                      <Label>vs. your expectation</Label>
                      <div className="flex gap-2">
                        {(["better-than-expected", "as-expected", "worse-than-expected"] as const).map((o) => (
                          <button
                            key={o}
                            onClick={() => setResolveForm({ ...resolveForm, outcome: o })}
                            className={`flex-1 rounded-lg border px-2 py-1.5 text-xs transition-colors ${
                              resolveForm.outcome === o
                                ? `border-primary bg-primary/10 ${outcomeLabels[o].color}`
                                : "border-border text-muted-foreground"
                            }`}
                          >
                            {outcomeLabels[o].label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>What did you learn?</Label>
                      <Textarea placeholder="Key takeaway from this decision..." value={resolveForm.lessonsLearned} onChange={(e) => setResolveForm({ ...resolveForm, lessonsLearned: e.target.value })} rows={2} />
                    </div>
                    <div className="flex gap-2">
                      <Button variant="secondary" onClick={() => setResolveId(null)} className="flex-1">Cancel</Button>
                      <Button onClick={() => resolveDecision(d.id)} className="flex-1" disabled={!resolveForm.actualOutcome.trim()}>Resolve</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
