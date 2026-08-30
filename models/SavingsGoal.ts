import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const SavingsGoalSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    targetAmount: { type: Number, required: true, min: 1 }, // cents
    targetDate: { type: Date },
    currentAmount: { type: Number, default: 0 }, // cents, virtual mode only
    linkedAccountId: { type: Schema.Types.ObjectId, ref: "Account" },
    icon: { type: String, default: "target" },
    color: { type: String, default: "#34D399" },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export type SavingsGoal = InferSchemaType<typeof SavingsGoalSchema> & { _id: string };

export default (models.SavingsGoal as Model<SavingsGoal>) ||
  model<SavingsGoal>("SavingsGoal", SavingsGoalSchema);
