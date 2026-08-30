import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const AccountSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["cash", "bank", "credit_card", "savings", "other"],
      required: true,
    },
    currency: { type: String, default: "EGP" },
    balance: { type: Number, required: true, default: 0 }, // cents
    icon: { type: String, default: "wallet" },
    color: { type: String, default: "#34D399" },
    isArchived: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export type Account = InferSchemaType<typeof AccountSchema> & { _id: string };

export default (models.Account as Model<Account>) || model<Account>("Account", AccountSchema);
