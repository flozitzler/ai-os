import { readDecisions, writeDecisions } from "@/lib/data";
import type { Decision } from "@/lib/types";

export async function GET() {
  const data = await readDecisions();
  return Response.json(data);
}

export async function POST(request: Request) {
  const body = (await request.json()) as Decision;
  const data = await readDecisions();
  const id = `dec_${Date.now()}`;
  const decision: Decision = {
    ...body,
    id,
    createdAt: new Date().toISOString(),
  };
  data.decisions.unshift(decision);
  await writeDecisions(data);
  return Response.json(decision);
}
