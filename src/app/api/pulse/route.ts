import { getPulseData } from "@/lib/pulse";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") || "30");
  const data = await getPulseData(days);
  return Response.json(data);
}
