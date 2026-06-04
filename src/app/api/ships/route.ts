import { readShips, writeShips } from "@/lib/data";
import { format } from "date-fns";
import type { ShipEntry } from "@/lib/types";

export async function GET() {
  const data = await readShips();
  return Response.json(data);
}

export async function POST(request: Request) {
  const body = (await request.json()) as ShipEntry;
  const data = await readShips();
  const id = `ship_${Date.now()}`;
  const entry: ShipEntry = {
    ...body,
    id,
    date: body.date || format(new Date(), "yyyy-MM-dd"),
    createdAt: new Date().toISOString(),
  };
  data.entries.unshift(entry);

  // Check revenue milestones
  if (entry.revenueGenerated && entry.revenueGenerated > 0) {
    const totalRevenue = data.entries
      .filter((e) => e.revenueGenerated)
      .reduce((s, e) => s + (e.revenueGenerated || 0), 0);

    for (const milestone of data.milestones) {
      if (!milestone.reachedDate && totalRevenue >= milestone.amount) {
        milestone.reachedDate = entry.date;
      }
    }
  }

  await writeShips(data);
  return Response.json(entry);
}
