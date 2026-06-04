import { readProfile, writeProfile } from "@/lib/data";
import type { Profile } from "@/lib/types";

export async function GET() {
  const data = await readProfile();
  return Response.json(data);
}

export async function PUT(request: Request) {
  const body = (await request.json()) as Profile;
  await writeProfile(body);
  return Response.json(body);
}
