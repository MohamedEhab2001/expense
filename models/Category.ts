import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const CategorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    kind: { type: String, enum: ["expense", "income"], required: true },
    icon: { type: String, default: "tag" },
    color: { type: String, default: "#34D399" },
    isArchived: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export type Category = InferSchemaType<typeof CategorySchema> & { _id: string };

export default (models.Category as Model<Category>) || model<Category>("Category", CategorySchema);
