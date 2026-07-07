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

// Base field validators without defaults. Create and update compose these so
// that omitting a field on update means "leave it untouched" — applying a
// `.default()` here would silently overwrite unspecified fields (e.g. wiping
// `content` to "" when the details form saves without it).
const blogFields = {
  title: z.string().trim().min(1).max(300),
  excerpt: z.string().trim().max(1000),
  content: z.string().max(200_000),
  slug: z.string().trim().min(1).max(120),
  coverImage: z.string().trim().max(2048).nullish(),
  media: z.array(z.string().trim().min(1).max(2048)).max(50),
  tags: z.array(z.string().trim().min(1).max(50)).max(25),
  references: z.array(blogReferenceSchema).max(50),
  authors: z.array(blogAuthorSchema).max(20),
  status: z.enum(BLOG_STATUSES),
};

export const blogCreateSchema = z.object({
  title: blogFields.title,
  // Optional at the API level (draft-first flow); the admin UI requires both
  // before a post can be published.
  excerpt: blogFields.excerpt.default(""),
  content: blogFields.content.default(""),
  // Optional explicit slug; generated from title when omitted.
  slug: blogFields.slug.optional(),
  coverImage: blogFields.coverImage,
  media: blogFields.media.default([]),
  tags: blogFields.tags.default([]),
  references: blogFields.references.default([]),
  authors: blogFields.authors.default([]),
  status: blogFields.status.default("draft"),
});

// Every field optional and default-free: only the keys actually sent are
// applied, so a partial save never clobbers fields it didn't include.
export const blogUpdateSchema = z.object({
  title: blogFields.title.optional(),
  excerpt: blogFields.excerpt.optional(),
  content: blogFields.content.optional(),
  slug: blogFields.slug.optional(),
  coverImage: blogFields.coverImage,
  media: blogFields.media.optional(),
  tags: blogFields.tags.optional(),
  references: blogFields.references.optional(),
  authors: blogFields.authors.optional(),
  status: blogFields.status.optional(),
});

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
