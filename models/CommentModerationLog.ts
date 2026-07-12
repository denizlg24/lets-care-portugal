import mongoose, { type Document, Schema, type Types } from "mongoose";
import { COMMENT_STATUSES, type CommentStatus } from "@/models/BlogComment";

export const MODERATION_ACTIONS = ["approve", "reject", "delete"] as const;
export type ModerationAction = (typeof MODERATION_ACTIONS)[number];

/**
 * Append-only audit trail for admin moderation actions on blog comments.
 * `moderatorName` is a denormalized snapshot for display if the account changes.
 */
export interface ICommentModerationLog extends Document {
  commentId: Types.ObjectId;
  blogId: Types.ObjectId;
  action: ModerationAction;
  fromStatus: CommentStatus;
  toStatus?: CommentStatus;
  moderatorId: string;
  moderatorName?: string;
  createdAt: Date;
}

export interface ILeanCommentModerationLog {
  _id: string;
  commentId: string;
  blogId: string;
  action: ModerationAction;
  fromStatus: CommentStatus;
  toStatus?: CommentStatus;
  moderatorId: string;
  moderatorName?: string;
  createdAt: Date;
}

const CommentModerationLogSchema = new Schema<ICommentModerationLog>(
  {
    commentId: {
      type: Schema.Types.ObjectId,
      ref: "BlogComment",
      required: true,
      immutable: true,
    },
    blogId: {
      type: Schema.Types.ObjectId,
      ref: "Blog",
      required: true,
      immutable: true,
    },
    action: {
      type: String,
      enum: MODERATION_ACTIONS,
      required: true,
      immutable: true,
    },
    fromStatus: {
      type: String,
      enum: COMMENT_STATUSES,
      required: true,
      immutable: true,
    },
    toStatus: {
      type: String,
      enum: COMMENT_STATUSES,
      immutable: true,
    },
    moderatorId: {
      type: String,
      required: true,
      trim: true,
      immutable: true,
    },
    moderatorName: {
      type: String,
      trim: true,
      immutable: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// Per-comment history, newest first.
CommentModerationLogSchema.index({ commentId: 1, createdAt: -1 });
// Global audit feed, newest first.
CommentModerationLogSchema.index({ createdAt: -1 });
// Per-moderator audit trail, newest first.
CommentModerationLogSchema.index({ moderatorId: 1, createdAt: -1 });

export const CommentModerationLog: mongoose.Model<ICommentModerationLog> =
  mongoose.models.CommentModerationLog ||
  mongoose.model<ICommentModerationLog>("CommentModerationLog", CommentModerationLogSchema);
