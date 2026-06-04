import {
  readProfile,
  readHabits,
  readGoals,
  readFinance,
  listDailyCheckins,
} from "@/lib/data";
import { generateBriefing } from "@/lib/briefing";
import { generateNudges } from "@/lib/nudges";
import { generateInsights } from "@/lib/insights";

export const dynamic = "force-dynamic";

export async function GET() {
  const [profile, habits, goals, finance, checkins] = await Promise.all([
    readProfile(),
    readHabits(),
    readGoals(),
    readFinance(),
    listDailyCheckins(90),
  ]);

  if (!profile) {
    return Response.json({ error: "No profile found" }, { status: 404 });
  }

  const nudges = generateNudges(checkins, habits, goals, finance);
  const insights = generateInsights(checkins, habits, goals, finance);
  const briefing = generateBriefing(profile, checkins, habits, goals, nudges, insights, finance);

  return Response.json(briefing);
}
