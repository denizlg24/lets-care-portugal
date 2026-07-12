import { Types } from "mongoose";
import type { CommentBulkActionInput, CommentCreateInput } from "@/lib/blog/schemas";
import { sanitizePlainText } from "@/lib/blog/utils";
import { connectMongoose } from "@/lib/db/mongoose";
import { Blog } from "@/models/Blog";
import {
  BlogComment,
  type CommentStatus,
  type IBlogComment,
  type ILeanBlogComment,
} from "@/models/BlogComment";
import {
  CommentModerationLog,
  type ILeanCommentModerationLog,
  type ModerationAction,
} from "@/models/CommentModerationLog";

/** Public shape: no email, and sessionId is only returned to its owner. */
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

function serializeModerationLog(log: object): ILeanCommentModerationLog {
  const doc = log as ILeanCommentModerationLog & {
    _id: unknown;
    commentId: unknown;
    blogId: unknown;
  };
  return {
    _id: String(doc._id),
    commentId: String(doc.commentId),
    blogId: String(doc.blogId),
    action: doc.action,
    fromStatus: doc.fromStatus,
    toStatus: doc.toStatus,
    moderatorId: doc.moderatorId,
    moderatorName: doc.moderatorName,
    createdAt: doc.createdAt,
  };
}

export interface PublicCommentListOptions {
  blogId: string;
  parentId?: string;
  sessionId?: string;
}

/**
 * Comments visible to a public visitor: approved comments plus the visitor's
 * own pending/rejected comments when a sessionId is present, so authors can
 * see their submission while it awaits moderation.
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

/** Creates a pending comment after confirming the blog/parent exist. */
export async function createComment(input: CommentCreateInput): Promise<PublicComment> {
  await connectMongoose();

  const blog = await Blog.findOne({ _id: input.blogId, status: "published" }).select("_id").lean();
  if (!blog) {
    throw new CommentTargetError("Artigo do blogue não encontrado");
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
      throw new CommentTargetError("Comentário principal não encontrado");
    }
    // Keep conversations one level deep: replying to a reply attaches to root.
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
  q?: string;
  cursor?: string;
  limit?: number;
}

export type AdminComment = ILeanBlogComment & {
  blogTitle?: string;
  blogSlug?: string;
  moderatorName?: string;
};

export interface AdminCommentListResult {
  comments: AdminComment[];
  nextCursor: string | null;
  hasMore: boolean;
}

export async function listCommentsAdmin({
  status,
  blogId,
  q,
  cursor,
  limit = 20,
}: AdminCommentListOptions = {}): Promise<AdminCommentListResult> {
  await connectMongoose();

  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const query: Record<string, unknown> = { isDeleted: false };
  if (status) query.status = status;
  if (blogId) query.blogId = new Types.ObjectId(blogId);
  if (cursor) query._id = { $lt: new Types.ObjectId(cursor) };

  if (q) {
    const pattern = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const matchingBlogs = await Blog.find({
      $or: [{ title: pattern }, { slug: pattern }],
    })
      .select("_id")
      .lean();
    query.$or = [
      { authorName: pattern },
      { authorEmail: pattern },
      { content: pattern },
      { blogId: { $in: matchingBlogs.map((blog) => blog._id) } },
    ];
  }

  const rows = await BlogComment.find(query)
    .sort({ _id: -1 })
    .limit(safeLimit + 1)
    .lean();
  const hasMore = rows.length > safeLimit;
  const comments = hasMore ? rows.slice(0, safeLimit) : rows;

  // Attach blog titles for the moderation queue.
  const blogIds = [...new Set(comments.map((comment) => String(comment.blogId)))];
  const commentIds = comments.map((comment) => comment._id);
  const [blogs, latestLogs] = await Promise.all([
    Blog.find({ _id: { $in: blogIds } })
      .select("title slug")
      .lean(),
    CommentModerationLog.aggregate<{ _id: Types.ObjectId; moderatorName?: string }>([
      { $match: { commentId: { $in: commentIds } } },
      { $sort: { createdAt: -1, _id: -1 } },
      {
        $group: {
          _id: "$commentId",
          moderatorName: { $first: "$moderatorName" },
        },
      },
    ]),
  ]);
  const blogsById = new Map(
    blogs.map((blog) => [String(blog._id), { title: blog.title, slug: blog.slug }]),
  );
  const moderatorNamesByCommentId = new Map(
    latestLogs.map((log) => [String(log._id), log.moderatorName]),
  );

  return {
    comments: comments.map((comment) => ({
      ...serializeComment(comment),
      blogTitle: blogsById.get(String(comment.blogId))?.title,
      blogSlug: blogsById.get(String(comment.blogId))?.slug,
      moderatorName: moderatorNamesByCommentId.get(String(comment._id)),
    })),
    nextCursor: hasMore ? String(comments[comments.length - 1]._id) : null,
    hasMore,
  };
}

export interface CommentBlogOption {
  id: string;
  title: string;
  slug: string;
}

/** Stable, filter-independent blog options for the moderation list. */
export async function listCommentBlogOptions(): Promise<CommentBlogOption[]> {
  await connectMongoose();

  const blogs = await Blog.find({}).select("title slug").sort({ title: 1 }).lean();

  return blogs.map((blog) => ({
    id: String(blog._id),
    title: blog.title,
    slug: blog.slug,
  }));
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

export async function getPendingCommentCount(): Promise<number> {
  await connectMongoose();
  return BlogComment.countDocuments({ status: "pending", isDeleted: false });
}

export interface CreateCommentModerationLogInput {
  commentId: string;
  blogId: string;
  action: ModerationAction;
  fromStatus: CommentStatus;
  toStatus?: CommentStatus;
  moderatorId: string;
  moderatorName?: string;
}

export async function createCommentModerationLog(
  input: CreateCommentModerationLogInput,
): Promise<ILeanCommentModerationLog> {
  await connectMongoose();

  const log = await CommentModerationLog.create(input);
  return serializeModerationLog(log.toObject());
}

export interface CommentModerationHistoryOptions {
  limit?: number;
}

export async function getCommentModerationHistory(
  commentId: string,
  { limit = 20 }: CommentModerationHistoryOptions = {},
): Promise<ILeanCommentModerationLog[] | null> {
  await connectMongoose();

  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const logs = await CommentModerationLog.find({ commentId })
    .sort({ createdAt: -1, _id: -1 })
    .limit(safeLimit)
    .lean();

  if (logs.length > 0) {
    return logs.map((log) => serializeModerationLog(log));
  }

  // Hard-deleted comments remain addressable through their audit entries. An
  // empty history is only a 404 when neither a comment nor a log exists.
  const commentExists = await BlogComment.exists({ _id: commentId });
  return commentExists ? [] : null;
}

export interface CommentModerator {
  id: string;
  name?: string;
}

export type CommentActionErrorCode = "conflict" | "ineligible";

export class CommentActionError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: CommentActionErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "CommentActionError";
  }
}

export async function moderateComment(
  id: string,
  action: "approve" | "reject",
  moderator: CommentModerator,
): Promise<ILeanBlogComment | null> {
  await connectMongoose();

  const toStatus: CommentStatus = action === "approve" ? "approved" : "rejected";

  // The status in the update filter makes the preceding read safe under
  // concurrent moderation: the recorded fromStatus is exactly the state that
  // this operation replaced. A raced update is retried against fresh state.
  for (let attempt = 0; attempt < 3; attempt++) {
    const existing = await BlogComment.findOne({ _id: id, isDeleted: false })
      .select("status blogId")
      .lean();
    if (!existing) return null;

    if (existing.status === toStatus) {
      throw new CommentActionError(
        409,
        "ineligible",
        action === "approve"
          ? "O comentário já se encontra aprovado"
          : "O comentário já se encontra rejeitado",
      );
    }

    const moderatedAt = new Date();
    const comment = await BlogComment.findOneAndUpdate(
      {
        _id: id,
        blogId: existing.blogId,
        isDeleted: false,
        status: existing.status,
      },
      {
        status: toStatus,
        moderatedBy: moderator.id,
        moderatedAt,
      },
      { returnDocument: "after", runValidators: true },
    ).lean();
    if (!comment) continue;

    await createCommentModerationLog({
      commentId: id,
      blogId: String(existing.blogId),
      action,
      fromStatus: existing.status,
      toStatus,
      moderatorId: moderator.id,
      moderatorName: moderator.name,
    });

    return serializeComment(comment);
  }

  throw new CommentActionError(
    409,
    "conflict",
    "O comentário foi alterado por outro administrador. Tente novamente.",
  );
}

export interface DeleteCommentResult {
  softDeleted: boolean;
}

/**
 * Hard-deletes a comment without replies; hides a comment with replies to
 * preserve the conversation structure.
 */
export async function deleteComment(
  id: string,
  moderator: CommentModerator,
): Promise<DeleteCommentResult | null> {
  await connectMongoose();

  for (let attempt = 0; attempt < 3; attempt++) {
    const existing = await BlogComment.findOne({ _id: id, isDeleted: false })
      .select("status blogId")
      .lean();
    if (!existing) return null;

    const hasReplies = await BlogComment.exists({ parentId: id });
    if (hasReplies) {
      const comment = await BlogComment.findOneAndUpdate(
        {
          _id: id,
          blogId: existing.blogId,
          isDeleted: false,
          status: existing.status,
        },
        { isDeleted: true },
        { returnDocument: "after", runValidators: true },
      ).lean();
      if (!comment) continue;

      await createCommentModerationLog({
        commentId: id,
        blogId: String(existing.blogId),
        action: "delete",
        fromStatus: existing.status,
        moderatorId: moderator.id,
        moderatorName: moderator.name,
      });

      return { softDeleted: true };
    }

    const comment: IBlogComment | null = await BlogComment.findOneAndDelete({
      _id: id,
      blogId: existing.blogId,
      isDeleted: false,
      status: existing.status,
    });
    if (!comment) continue;

    await createCommentModerationLog({
      commentId: id,
      blogId: String(comment.blogId),
      action: "delete",
      fromStatus: comment.status,
      moderatorId: moderator.id,
      moderatorName: moderator.name,
    });

    return { softDeleted: false };
  }

  throw new CommentActionError(
    409,
    "conflict",
    "O comentário foi alterado por outro administrador. Tente novamente.",
  );
}

export type CommentBulkResult =
  | {
      id: string;
      success: true;
      comment?: ILeanBlogComment;
      softDeleted?: boolean;
    }
  | {
      id: string;
      success: false;
      code: "conflict" | "ineligible" | "internal_error" | "not_found";
      error: string;
    };

export interface CommentBulkActionResult {
  succeeded: number;
  failed: number;
  results: CommentBulkResult[];
}

/**
 * Applies a bulk request item-by-item. Standalone Mongo deployments cannot use
 * multi-document transactions, so every result truthfully reports its own
 * outcome and successful items retain their individual audit entries.
 */
export async function applyBulkCommentAction(
  input: CommentBulkActionInput,
  moderator: CommentModerator,
): Promise<CommentBulkActionResult> {
  const ids = [...new Set(input.ids.map((id) => id.toLowerCase()))];
  const results: CommentBulkResult[] = [];

  for (const id of ids) {
    try {
      if (input.action === "delete") {
        const result = await deleteComment(id, moderator);
        results.push(
          result
            ? { id, success: true, softDeleted: result.softDeleted }
            : {
                id,
                success: false,
                code: "not_found",
                error: "Comentário não encontrado",
              },
        );
        continue;
      }

      const comment = await moderateComment(id, input.action, moderator);
      results.push(
        comment
          ? { id, success: true, comment }
          : {
              id,
              success: false,
              code: "not_found",
              error: "Comentário não encontrado",
            },
      );
    } catch (error) {
      if (error instanceof CommentActionError) {
        results.push({
          id,
          success: false,
          code: error.code,
          error: error.message,
        });
        continue;
      }

      console.error(`[comments:bulk:${id}]`, error);
      results.push({
        id,
        success: false,
        code: "internal_error",
        error: "Não foi possível processar o comentário",
      });
    }
  }

  const succeeded = results.filter((result) => result.success).length;
  return { succeeded, failed: results.length - succeeded, results };
}
