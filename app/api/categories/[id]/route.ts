import { NextRequest, NextResponse } from "next/server";
import { updateCategory, archiveCategory } from "@/lib/services/categoryService";
import { updateCategorySchema } from "@/lib/validation/category";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = updateCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const category = await updateCategory(id, parsed.data);
  return NextResponse.json(category);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const category = await archiveCategory(id);
  return NextResponse.json(category);
}
