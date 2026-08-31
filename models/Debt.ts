import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const DebtSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ["installment", "debt", "credit_card"], required: true },
    paymentSchedule: { type: String, enum: ["monthly", "one_time"], default: "monthly" },
    totalAmount: { type: Number }, // cents, optional (credit cards may not have a fixed total)
    remainingAmount: { type: Number, required: true, min: 0 }, // cents
    // Only used when linkedAccountId is unset — a linked debt follows that account's currency.
    currency: { type: String, default: "EGP" },
    monthlyPayment: { type: Number, min: 1 }, // cents, required only when paymentSchedule is "monthly"
    dueDay: { type: Number, min: 1, max: 31 }, // required only when paymentSchedule is "monthly"
    linkedAccountId: { type: Schema.Types.ObjectId, ref: "Account" },
    lastPaidMonth: { type: String }, // "YYYY-MM", set when a payment is marked
    icon: { type: String, default: "credit-card" },
    color: { type: String, default: "#F87171" },
    isPaidOff: { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export type Debt = InferSchemaType<typeof DebtSchema> & { _id: string };

export default (models.Debt as Model<Debt>) || model<Debt>("Debt", DebtSchema);
