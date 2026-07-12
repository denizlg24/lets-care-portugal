import mongoose, { type Document, Schema, type Types } from "mongoose";

export const COMMENT_STATUSES = ["pending", "approved", "rejected"] as const;
export type CommentStatus = (typeof COMMENT_STATUSES)[number];

/**
 * Comments are pre-moderated: they are created as "pending" and only become
 * publicly visible once an admin approves them. `sessionId` is an anonymous
 * browser-generated token that lets authors see their own pending comments.
 */
export interface IBlogComment extends Document {
  blogId: Types.ObjectId;
  parentId?: Types.ObjectId;
  authorName: string;
  authorEmail?: string;
  content: string;
  sessionId?: string;
  status: CommentStatus;
  moderatedBy?: string;
  moderatedAt?: Date;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILeanBlogComment {
  _id: string;
  blogId: string;
  parentId?: string;
  authorName: string;
  authorEmail?: string;
  content: string;
  sessionId?: string;
  status: CommentStatus;
  moderatedBy?: string;
  moderatedAt?: Date;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BlogCommentSchema = new Schema<IBlogComment>(
  {
    blogId: {
      type: Schema.Types.ObjectId,
      ref: "Blog",
      required: true,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: "BlogComment",
    },
    authorName: { type: String, required: true, trim: true },
    // Optional, admin-only visibility (never returned by public endpoints).
    authorEmail: { type: String, trim: true, lowercase: true },
    content: { type: String, required: true },
    sessionId: { type: String, trim: true },
    status: {
      type: String,
      enum: COMMENT_STATUSES,
      required: true,
      default: "pending",
    },
    moderatedBy: { type: String, trim: true },
    moderatedAt: { type: Date },
    isDeleted: { type: Boolean, required: true, default: false },
  },
  { timestamps: true },
);

// Public thread queries: comments of a blog (top level or replies) by status.
BlogCommentSchema.index({ blogId: 1, parentId: 1, status: 1, createdAt: -1 });
// Moderation queue: cursor scans by `_id` newest-first. Separate indexes keep
// the sort covered for the supported status/blog filter combinations.
BlogCommentSchema.index({ isDeleted: 1, _id: -1 });
BlogCommentSchema.index({ isDeleted: 1, status: 1, _id: -1 });
BlogCommentSchema.index({ isDeleted: 1, blogId: 1, _id: -1 });
BlogCommentSchema.index({ isDeleted: 1, blogId: 1, status: 1, _id: -1 });
BlogCommentSchema.index({ sessionId: 1 });

export const BlogComment: mongoose.Model<IBlogComment> =
  mongoose.models.BlogComment || mongoose.model<IBlogComment>("BlogComment", BlogCommentSchema);
