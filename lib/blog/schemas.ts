import { z } from "zod";
import { BLOG_STATUSES } from "@/models/Blog";
import { COMMENT_STATUSES } from "@/models/BlogComment";

export const objectIdSchema = z.string().regex(/^[a-fA-F0-9]{24}$/, "Formato de ID inválido");

const blogReferenceSchema = z.object({
  label: z.string().trim().min(1).max(200),
  url: z.url().max(2048),
});

// Display author: name is required; email and link are independently optional.
const blogAuthorSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.email().max(254).optional(),
  link: z.url().max(2048).optional(),
});

export const blogCreateSchema = z.object({
  title: z.string().trim().min(1).max(300),
  // Optional at the API level (draft-first flow); the admin UI requires both
  // before a post can be published.
  excerpt: z.string().trim().max(1000).default(""),
  content: z.string().max(200_000).default(""),
  // Optional explicit slug; generated from title when omitted.
  slug: z.string().trim().min(1).max(120).optional(),
  coverImage: z.string().trim().max(2048).nullish(),
  media: z.array(z.string().trim().min(1).max(2048)).max(50).default([]),
  tags: z.array(z.string().trim().min(1).max(50)).max(25).default([]),
  references: z.array(blogReferenceSchema).max(50).default([]),
  authors: z.array(blogAuthorSchema).max(20).default([]),
  status: z.enum(BLOG_STATUSES).default("draft"),
});

export const blogUpdateSchema = blogCreateSchema.partial();

export type BlogCreateInput = z.infer<typeof blogCreateSchema>;
export type BlogUpdateInput = z.infer<typeof blogUpdateSchema>;

export const commentCreateSchema = z.object({
  blogId: objectIdSchema,
  parentId: objectIdSchema.optional(),
  authorName: z.string().trim().min(1).max(100),
  // Optional; only shown to admins.
  authorEmail: z.email().max(254).optional(),
  content: z.string().trim().min(2).max(5000),
  // Anonymous browser token for authors to see their pending comments.
  sessionId: z.string().trim().min(8).max(100).optional(),
});

export type CommentCreateInput = z.infer<typeof commentCreateSchema>;

export const commentModerationSchema = z.object({
  action: z.enum(["approve", "reject"]),
});

export const commentListQuerySchema = z.object({
  status: z.enum(COMMENT_STATUSES).optional(),
  blogId: objectIdSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
