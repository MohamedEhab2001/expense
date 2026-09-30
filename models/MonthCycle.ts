import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

// A "home month": a spending period that starts whenever the user says so (usually payday),
// not on the 1st of the calendar month. Each cycle runs until the next one starts.
const MonthCycleSchema = new Schema(
  {
    startDate: { type: Date, required: true },
  },
  { timestamps: true }
);

MonthCycleSchema.index({ startDate: -1 });

export type MonthCycle = InferSchemaType<typeof MonthCycleSchema> & { _id: string };

export default (models.MonthCycle as Model<MonthCycle>) ||
  model<MonthCycle>("MonthCycle", MonthCycleSchema);
