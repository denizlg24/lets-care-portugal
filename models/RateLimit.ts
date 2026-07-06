import mongoose, { type Document, Schema } from "mongoose";

export interface IRateLimit extends Document {
  key: string;
  timestamps: Date[];
  createdAt: Date;
  updatedAt: Date;
}

const RateLimitSchema = new Schema<IRateLimit>(
  {
    key: { type: String, required: true, unique: true },
    timestamps: { type: [Date], default: [] },
  },
  { timestamps: true },
);

// Stale buckets are garbage-collected by MongoDB once idle for an hour.
RateLimitSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 60 * 60 });

export const RateLimit: mongoose.Model<IRateLimit> =
  mongoose.models.RateLimit || mongoose.model<IRateLimit>("RateLimit", RateLimitSchema);
