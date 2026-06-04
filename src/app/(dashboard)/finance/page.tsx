"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import type { FinanceData } from "@/lib/types";

export default function FinancePage() {
  const [data, setData] = useState<FinanceData | null>(null);
  const [open, setOpen] = useState(false);
  const [newTxn, setNewTxn] = useState({
    type: "expense" as "income" | "expense",
    category: "food",
    amount: "",
    description: "",
  });

  const load = () => fetch("/api/finance").then((r) => r.json()).then(setData);

  useEffect(() => { load(); }, []);

  if (!data) {
    return <div className="h-64 animate-pulse rounded-lg bg-card" />;
  }

  const addTransaction = async () => {
    if (!newTxn.amount || !newTxn.description) return;
    await fetch("/api/finance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: format(new Date(), "yyyy-MM-dd"),
        type: newTxn.type,
        category: newTxn.category,
        amount: parseInt(newTxn.amount),
        description: newTxn.description,
      }),
    });
    setNewTxn({ type: "expense", category: "food", amount: "", description: "" });
    setOpen(false);
    load();
  };

  const deleteTransaction = async (id: string) => {
    await fetch(`/api/finance/${id}`, { method: "DELETE" });
    load();
  };

  const thisMonth = format(new Date(), "yyyy-MM");
  const monthTxns = data.transactions.filter((t) => t.date.startsWith(thisMonth));
  const income = monthTxns.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expenses = monthTxns.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const net = income - expenses;

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: data.currency,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const sorted = [...data.transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Finance</h1>
          <p className="text-sm text-muted-foreground">
            {format(new Date(), "MMMM yyyy")}
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            className="inline-flex items-center justify-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> Add
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Transaction</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button
                  variant={newTxn.type === "expense" ? "default" : "secondary"}
                  onClick={() => setNewTxn({ ...newTxn, type: "expense", category: "food" })}
                  className="flex-1"
                >
                  Expense
                </Button>
                <Button
                  variant={newTxn.type === "income" ? "default" : "secondary"}
                  onClick={() => setNewTxn({ ...newTxn, type: "income", category: "salary" })}
                  className="flex-1"
                >
                  Income
                </Button>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={newTxn.category}
                  onValueChange={(v) => setNewTxn({ ...newTxn, category: v ?? newTxn.category })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {data.categories[newTxn.type].map((c) => (
                      <SelectItem key={c} value={c}>
                        {c.charAt(0).toUpperCase() + c.slice(1).replace("-", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Amount ({data.currency})</Label>
                <Input
                  type="number"
                  placeholder="50000"
                  value={newTxn.amount}
                  onChange={(e) => setNewTxn({ ...newTxn, amount: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  placeholder="What was this for?"
                  value={newTxn.description}
                  onChange={(e) => setNewTxn({ ...newTxn, description: e.target.value })}
                />
              </div>
              <Button onClick={addTransaction} className="w-full">
                Add Transaction
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="flex items-center justify-center gap-2">
              <TrendingUp className="h-4 w-4 text-success" />
              <p className="text-sm text-muted-foreground">Income</p>
            </div>
            <p className="text-2xl font-bold text-success">{formatAmount(income)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="flex items-center justify-center gap-2">
              <TrendingDown className="h-4 w-4 text-destructive" />
              <p className="text-sm text-muted-foreground">Expenses</p>
            </div>
            <p className="text-2xl font-bold text-destructive">{formatAmount(expenses)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">Net</p>
            <p className={`text-2xl font-bold ${net >= 0 ? "text-success" : "text-destructive"}`}>
              {formatAmount(net)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {sorted.length > 0 ? (
            <div className="space-y-2">
              {sorted.slice(0, 50).map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        t.type === "income" ? "bg-success" : "bg-destructive"
                      }`}
                    />
                    <div>
                      <p className="text-sm font-medium">{t.description}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{t.date}</span>
                        <Badge variant="secondary" className="text-[10px]">
                          {t.category}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-medium ${
                        t.type === "income" ? "text-success" : "text-destructive"
                      }`}
                    >
                      {t.type === "income" ? "+" : "-"}{formatAmount(t.amount)}
                    </span>
                    <button
                      onClick={() => deleteTransaction(t.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No transactions yet — add your first one!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
