import { listDailyCheckins, writeDailyCheckin } from "@/lib/data";
import type { DailyCheckin } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") || "7");
  const checkins = await listDailyCheckins(days);
  return Response.json(checkins);
}

export async function POST(request: Request) {
  const body = (await request.json()) as DailyCheckin;
  const now = new Date().toISOString();
  const data: DailyCheckin = {
    ...body,
    createdAt: body.createdAt || now,
    updatedAt: now,
  };
  await writeDailyCheckin(data.date, data);
  return Response.json(data);
}
