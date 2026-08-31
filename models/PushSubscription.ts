import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const PushSubscriptionSchema = new Schema(
  {
    endpoint: { type: String, required: true, unique: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
  },
  { timestamps: true }
);

export type PushSubscription = InferSchemaType<typeof PushSubscriptionSchema> & { _id: string };

export default (models.PushSubscription as Model<PushSubscription>) ||
  model<PushSubscription>("PushSubscription", PushSubscriptionSchema);
