import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const BudgetSchema = new Schema(
  {
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true, unique: true },
    amount: { type: Number, required: true, min: 0 }, // cents, monthly recurring template
    rollover: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export type Budget = InferSchemaType<typeof BudgetSchema> & { _id: string };

export default (models.Budget as Model<Budget>) || model<Budget>("Budget", BudgetSchema);
