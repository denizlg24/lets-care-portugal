import type { CommentCreateInput } from "@/lib/blog/schemas";
import { sanitizePlainText } from "@/lib/blog/utils";
import { connectMongoose } from "@/lib/db/mongoose";
import { Blog } from "@/models/Blog";
import {
  BlogComment,
  type CommentStatus,
  type IBlogComment,
  type ILeanBlogComment,
} from "@/models/BlogComment";

/** Public shape: no email, and sessionId only echoed back to its owner. */
export interface PublicComment {
  _id: string;
  blogId: string;
  parentId?: string;
  authorName: string;
  content: string;
  status: CommentStatus;
  sessionId?: string;
  createdAt: Date;
}

function toPublicComment(comment: object, viewerSessionId?: string): PublicComment {
  const doc = comment as ILeanBlogComment & { _id: unknown };
  return {
    _id: String(doc._id),
    blogId: String(doc.blogId),
    parentId: doc.parentId ? String(doc.parentId) : undefined,
    authorName: doc.authorName,
    content: doc.content,
    status: doc.status,
    sessionId: viewerSessionId && doc.sessionId === viewerSessionId ? doc.sessionId : undefined,
    createdAt: doc.createdAt,
  };
}

function serializeComment(comment: object): ILeanBlogComment {
  const doc = comment as ILeanBlogComment & { _id: unknown };
  return {
    ...doc,
    _id: String(doc._id),
    blogId: String(doc.blogId),
    parentId: doc.parentId ? String(doc.parentId) : undefined,
  };
}

export interface PublicCommentListOptions {
  blogId: string;
  parentId?: string;
  sessionId?: string;
}

/**
 * Comments visible to a public visitor: approved ones, plus the visitor's
 * own (pending/rejected) comments when a sessionId is provided — so authors
 * see their submission immediately while it awaits moderation.
 */
export async function listPublicComments({
  blogId,
  parentId,
  sessionId,
}: PublicCommentListOptions): Promise<PublicComment[]> {
  await connectMongoose();

  const query: Record<string, unknown> = {
    blogId,
    isDeleted: false,
    parentId: parentId ?? { $exists: false },
  };
  if (sessionId) {
    query.$or = [{ status: "approved" }, { sessionId }];
  } else {
    query.status = "approved";
  }

  const comments = await BlogComment.find(query)
    // Top-level newest-first; replies oldest-first (conversation order).
    .sort({ createdAt: parentId ? 1 : -1 })
    .limit(200)
    .lean();

  return comments.map((comment) => toPublicComment(comment, sessionId));
}

export class CommentTargetError extends Error {}

/** Creates a pending comment after checking the target blog/parent exist. */
export async function createComment(input: CommentCreateInput): Promise<PublicComment> {
  await connectMongoose();

  const blog = await Blog.findOne({ _id: input.blogId, status: "published" }).select("_id").lean();
  if (!blog) {
    throw new CommentTargetError("Blog post not found");
  }

  if (input.parentId) {
    const parent = await BlogComment.findOne({
      _id: input.parentId,
      blogId: input.blogId,
      isDeleted: false,
    })
      .select("parentId")
      .lean();
    if (!parent) {
      throw new CommentTargetError("Parent comment not found");
    }
    // Keep threads one level deep: replying to a reply attaches to its root.
    if (parent.parentId) {
      input = { ...input, parentId: String(parent.parentId) };
    }
  }

  const comment = await BlogComment.create({
    blogId: input.blogId,
    parentId: input.parentId,
    authorName: sanitizePlainText(input.authorName),
    authorEmail: input.authorEmail,
    content: sanitizePlainText(input.content),
    sessionId: input.sessionId,
  });

  return toPublicComment(comment.toObject(), input.sessionId);
}

export interface AdminCommentListOptions {
  status?: CommentStatus;
  blogId?: string;
  page?: number;
  limit?: number;
}

export interface AdminCommentListResult {
  comments: (ILeanBlogComment & { blogTitle?: string; blogSlug?: string })[];
  total: number;
  page: number;
  pages: number;
}

export async function listCommentsAdmin({
  status,
  blogId,
  page = 1,
  limit = 20,
}: AdminCommentListOptions = {}): Promise<AdminCommentListResult> {
  await connectMongoose();

  const query: Record<string, unknown> = { isDeleted: false };
  if (status) query.status = status;
  if (blogId) query.blogId = blogId;

  const [comments, total] = await Promise.all([
    BlogComment.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    BlogComment.countDocuments(query),
  ]);

  // Attach blog titles for the moderation queue UI.
  const blogIds = [...new Set(comments.map((comment) => String(comment.blogId)))];
  const blogs = await Blog.find({ _id: { $in: blogIds } })
    .select("title slug")
    .lean();
  const blogsById = new Map(
    blogs.map((blog) => [String(blog._id), { title: blog.title, slug: blog.slug }]),
  );

  return {
    comments: comments.map((comment) => ({
      ...serializeComment(comment),
      blogTitle: blogsById.get(String(comment.blogId))?.title,
      blogSlug: blogsById.get(String(comment.blogId))?.slug,
    })),
    total,
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
  };
}

export interface CommentStats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

export async function getCommentStats(): Promise<CommentStats> {
  await connectMongoose();
  const rows = await BlogComment.aggregate<{ _id: CommentStatus; count: number }>([
    { $match: { isDeleted: false } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  const stats: CommentStats = { pending: 0, approved: 0, rejected: 0, total: 0 };
  for (const row of rows) {
    stats[row._id] = row.count;
    stats.total += row.count;
  }
  return stats;
}

export async function moderateComment(
  id: string,
  action: "approve" | "reject",
  moderatorId: string,
): Promise<ILeanBlogComment | null> {
  await connectMongoose();
  const comment = await BlogComment.findByIdAndUpdate(
    id,
    {
      status: action === "approve" ? "approved" : "rejected",
      moderatedBy: moderatorId,
      moderatedAt: new Date(),
    },
    { returnDocument: "after", runValidators: true },
  ).lean();

  return comment ? serializeComment(comment) : null;
}

export interface DeleteCommentResult {
  softDeleted: boolean;
}

/**
 * Hard-deletes a comment without replies; soft-deletes (hides) one that has
 * replies so the thread structure survives.
 */
export async function deleteComment(id: string): Promise<DeleteCommentResult | null> {
  await connectMongoose();

  const comment: IBlogComment | null = await BlogComment.findById(id);
  if (!comment) return null;

  const hasReplies = await BlogComment.exists({ parentId: comment._id });
  if (hasReplies) {
    comment.isDeleted = true;
    await comment.save();
    return { softDeleted: true };
  }

  await BlogComment.deleteOne({ _id: comment._id });
  return { softDeleted: false };
}
