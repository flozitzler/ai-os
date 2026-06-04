import { readGoals, writeGoals } from "@/lib/data";
import type { GoalData } from "@/lib/types";

export async function GET() {
  const data = await readGoals();
  return Response.json(data);
}

export async function PUT(request: Request) {
  const body = (await request.json()) as GoalData;
  await writeGoals(body);
  return Response.json(body);
}
