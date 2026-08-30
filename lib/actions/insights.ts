"use server";

import { generateInsight } from "@/lib/services/insightService";

export async function generateInsightAction() {
  try {
    const insight = await generateInsight();
    return { ok: true as const, insight: JSON.parse(JSON.stringify(insight)) };
  } catch (e) {
    return { ok: false as const, error: (e as Error).message };
  }
}
