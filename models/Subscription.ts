import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const SubscriptionSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 1 }, // cents, per billing cycle
    currency: { type: String, default: "EGP" },
    // Manual conversion rate to EGP: 1 unit of `currency` = exchangeRate EGP.
    // Only meaningful when currency !== "EGP"; stays 1 for EGP subscriptions.
    exchangeRate: { type: Number, default: 1, min: 0.0001 },
    billingCycle: { type: String, enum: ["monthly", "yearly"], default: "monthly" },
    billingDay: { type: Number, min: 1, max: 31, default: 1 }, // day of month it renews
    icon: { type: String, default: "receipt" },
    color: { type: String, default: "#A78BFA" },
    // Paused subscriptions stay in the list (unlike archived ones) but drop out of the total.
    isActive: { type: Boolean, default: true },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export type Subscription = InferSchemaType<typeof SubscriptionSchema> & { _id: string };

export default (models.Subscription as Model<Subscription>) ||
  model<Subscription>("Subscription", SubscriptionSchema);
