"use server";

import { runCalculator } from "@/lib/services/calculatorService";
import { calculatorInputSchema } from "@/lib/validation/calculator";

export async function runCalculatorAction(input: unknown) {
  try {
    const parsed = calculatorInputSchema.parse(input);
    const result = await runCalculator(parsed);
    return { ok: true as const, result };
  } catch (e) {
    return { ok: false as const, error: (e as Error).message };
  }
}
