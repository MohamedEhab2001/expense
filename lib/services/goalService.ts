import { connectDB } from "@/lib/db";
import SavingsGoal from "@/models/SavingsGoal";
import "@/models/Account";
import type { z } from "zod";
import type { createGoalSchema, updateGoalSchema } from "@/lib/validation/goal";

export async function listGoals(includeArchived = false) {
  await connectDB();
  const filter = includeArchived ? {} : { isArchived: false };
  const goals = await SavingsGoal.find(filter)
    .populate("linkedAccountId", "name balance currency")
    .sort({ createdAt: -1 })
    .lean();

  return goals.map((g) => {
    const linked = g.linkedAccountId as unknown as { balance: number; currency?: string } | undefined;
    return {
      ...g,
      currentAmount: linked ? linked.balance : g.currentAmount,
      // A linked goal follows its account's currency; g.currency is only the fallback.
      currency: linked?.currency ?? g.currency ?? "EGP",
    };
  });
}

export async function createGoal(input: z.infer<typeof createGoalSchema>) {
  await connectDB();
  return SavingsGoal.create(input);
}

export async function updateGoal(id: string, input: z.infer<typeof updateGoalSchema>) {
  await connectDB();
  return SavingsGoal.findByIdAndUpdate(id, input, { new: true }).lean();
}

export async function archiveGoal(id: string) {
  await connectDB();
  return SavingsGoal.findByIdAndUpdate(id, { isArchived: true }, { new: true }).lean();
}

export async function contributeToGoal(id: string, amount: number) {
  await connectDB();
  const goal = await SavingsGoal.findById(id);
  if (!goal) throw new Error("Goal not found");
  if (goal.linkedAccountId) throw new Error("Cannot manually contribute to a linked goal");
  goal.currentAmount += amount;
  await goal.save();
  return goal.toObject();
}
