import { readDailyCheckin, writeDailyCheckin } from "@/lib/data";
import type { DailyCheckin } from "@/lib/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ date: string }> }
) {
  const { date } = await params;
  const checkin = await readDailyCheckin(date);
  if (!checkin) {
    return Response.json(null);
  }
  return Response.json(checkin);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ date: string }> }
) {
  const { date } = await params;
  const body = (await request.json()) as Partial<DailyCheckin>;
  const existing = await readDailyCheckin(date);
  const now = new Date().toISOString();
  const data: DailyCheckin = {
    date,
    ...existing,
    ...body,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };
  await writeDailyCheckin(date, data);
  return Response.json(data);
}
