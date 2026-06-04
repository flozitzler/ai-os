import { readFinance, writeFinance } from "@/lib/data";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await readFinance();
  data.transactions = data.transactions.filter((t) => t.id !== id);
  await writeFinance(data);
  return Response.json({ success: true });
}
