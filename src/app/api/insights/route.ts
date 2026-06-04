import { listDailyCheckins, readHabits, readGoals, readFinance } from "@/lib/data";
import { generateInsights } from "@/lib/insights";

export const dynamic = "force-dynamic";

export async function GET() {
  const [checkins, habits, goals, finance] = await Promise.all([
    listDailyCheckins(90),
    readHabits(),
    readGoals(),
    readFinance(),
  ]);
  const insights = generateInsights(checkins, habits, goals, finance);
  return Response.json(insights);
}
