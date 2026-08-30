import { NextRequest, NextResponse } from "next/server";
import { listCategories, createCategory } from "@/lib/services/categoryService";
import { createCategorySchema } from "@/lib/validation/category";

export async function GET() {
  const categories = await listCategories();
  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = createCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const category = await createCategory(parsed.data);
  return NextResponse.json(category, { status: 201 });
}
