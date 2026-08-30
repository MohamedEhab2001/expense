import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const TransactionSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["expense", "income", "transfer", "atm_withdrawal"],
      required: true,
    },
    amount: { type: Number, required: true, min: 1 }, // cents, always positive
    accountId: { type: Schema.Types.ObjectId, ref: "Account", required: true },
    linkedAccountId: { type: Schema.Types.ObjectId, ref: "Account" }, // transfer/atm_withdrawal destination
    categoryId: { type: Schema.Types.ObjectId, ref: "Category" }, // expense/income only
    date: { type: Date, required: true, default: Date.now },
    note: { type: String, trim: true },
    merchant: { type: String, trim: true },
  },
  { timestamps: true }
);

TransactionSchema.index({ date: -1 });
TransactionSchema.index({ accountId: 1, date: -1 });
TransactionSchema.index({ categoryId: 1, date: -1 });
TransactionSchema.index({ type: 1, date: -1 });

export type Transaction = InferSchemaType<typeof TransactionSchema> & { _id: string };

export default (models.Transaction as Model<Transaction>) ||
  model<Transaction>("Transaction", TransactionSchema);
