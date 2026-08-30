import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const InsightItemSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["spending_pattern", "budget_adherence", "savings_feasibility", "suggestion"],
      required: true,
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    severity: { type: String, enum: ["info", "warning", "positive"], required: true },
  },
  { _id: false }
);

const AIInsightSchema = new Schema({
  generatedAt: { type: Date, required: true, default: Date.now },
  periodStart: { type: Date, required: true },
  periodEnd: { type: Date, required: true },
  model: { type: String, required: true },
  summary: { type: String, required: true },
  insights: { type: [InsightItemSchema], default: [] },
  contextHash: { type: String, required: true, index: true },
  tokenUsage: {
    inputTokens: { type: Number },
    outputTokens: { type: Number },
  },
});

export type AIInsight = InferSchemaType<typeof AIInsightSchema> & { _id: string };

export default (models.AIInsight as Model<AIInsight>) || model<AIInsight>("AIInsight", AIInsightSchema);
