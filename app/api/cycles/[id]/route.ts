import { NextRequest, NextResponse } from "next/server";
import { deleteCycle } from "@/lib/services/cycleService";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await deleteCycle(id);
  return NextResponse.json({ ok: true });
}
