import { readHabits, writeHabits } from "@/lib/data";
import type { HabitData } from "@/lib/types";

export async function GET() {
  const data = await readHabits();
  return Response.json(data);
}

export async function PUT(request: Request) {
  const body = (await request.json()) as HabitData;
  await writeHabits(body);
  return Response.json(body);
}
