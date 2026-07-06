import mongoose, { type Document, Schema, type Types } from "mongoose";

export interface IBlogView extends Document {
  blogId: Types.ObjectId;
  views: number;
  createdAt: Date;
  updatedAt: Date;
}

const BlogViewSchema = new Schema<IBlogView>(
  {
    blogId: {
      type: Schema.Types.ObjectId,
      ref: "Blog",
      required: true,
      unique: true,
    },
    views: { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
);

export const BlogView: mongoose.Model<IBlogView> =
  mongoose.models.BlogView || mongoose.model<IBlogView>("BlogView", BlogViewSchema);
