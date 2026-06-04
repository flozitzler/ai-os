import { listDailyCheckins, readHabits, readGoals, readFinance } from "@/lib/data";
import { generateNudges } from "@/lib/nudges";

export const dynamic = "force-dynamic";

export async function GET() {
  const [checkins, habits, goals, finance] = await Promise.all([
    listDailyCheckins(90),
    readHabits(),
    readGoals(),
    readFinance(),
  ]);
  const nudges = generateNudges(checkins, habits, goals, finance);
  return Response.json(nudges);
}
