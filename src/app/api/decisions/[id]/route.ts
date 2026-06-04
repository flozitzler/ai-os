import { readDecisions, writeDecisions } from "@/lib/data";
import type { Decision } from "@/lib/types";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await request.json()) as Partial<Decision>;
  const data = await readDecisions();
  const idx = data.decisions.findIndex((d) => d.id === id);
  if (idx === -1) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  data.decisions[idx] = { ...data.decisions[idx], ...body };
  await writeDecisions(data);
  return Response.json(data.decisions[idx]);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await readDecisions();
  data.decisions = data.decisions.filter((d) => d.id !== id);
  await writeDecisions(data);
  return Response.json({ success: true });
}
