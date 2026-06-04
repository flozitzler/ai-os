import { readFinance, writeFinance } from "@/lib/data";
import type { Transaction } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");
  const data = await readFinance();

  if (month) {
    const filtered = data.transactions.filter((t) => t.date.startsWith(month));
    return Response.json({ ...data, transactions: filtered });
  }
  return Response.json(data);
}

export async function POST(request: Request) {
  const body = (await request.json()) as Transaction;
  const data = await readFinance();
  const id = `txn_${Date.now()}`;
  const transaction: Transaction = {
    ...body,
    id,
    createdAt: new Date().toISOString(),
  };
  data.transactions.push(transaction);
  await writeFinance(data);
  return Response.json(transaction);
}
