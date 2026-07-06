import type { BlogCreateInput, BlogUpdateInput } from "@/lib/blog/schemas";
import { calculateReadingTime, slugify } from "@/lib/blog/utils";
import { connectMongoose } from "@/lib/db/mongoose";
import { Blog, type ILeanBlog } from "@/models/Blog";
import { BlogComment } from "@/models/BlogComment";
import { BlogView } from "@/models/BlogView";

function serializeBlog(blog: object): ILeanBlog {
  const doc = blog as ILeanBlog & { _id: unknown };
  return { ...doc, _id: String(doc._id) };
}

/** Appends -2, -3, ... until the slug is unique. */
async function ensureUniqueSlug(base: string, excludeId?: string): Promise<string> {
  const root = base || "post";
  let candidate = root;
  for (let attempt = 2; ; attempt++) {
    const clash = await Blog.exists(
      excludeId ? { slug: candidate, _id: { $ne: excludeId } } : { slug: candidate },
    );
    if (!clash) return candidate;
    candidate = `${root}-${attempt}`;
  }
}

export interface BlogListResult {
  blogs: ILeanBlog[];
  total: number;
  page: number;
  pages: number;
}

export interface AdminBlogListOptions {
  status?: string;
  tag?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export async function listBlogsAdmin({
  status,
  tag,
  search,
  page = 1,
  limit = 20,
}: AdminBlogListOptions = {}): Promise<BlogListResult> {
  await connectMongoose();

  const query: Record<string, unknown> = {};
  if (status) query.status = status;
  if (tag) query.tags = tag;
  if (search) {
    const pattern = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    query.$or = [{ title: pattern }, { excerpt: pattern }, { slug: pattern }];
  }

  const [blogs, total] = await Promise.all([
    Blog.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Blog.countDocuments(query),
  ]);

  return {
    blogs: blogs.map(serializeBlog),
    total,
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
  };
}

export interface PublicBlogListOptions {
  tag?: string;
  page?: number;
  limit?: number;
}

/** Published posts, newest first, without the full content body. */
export async function listPublishedBlogs({
  tag,
  page = 1,
  limit = 12,
}: PublicBlogListOptions = {}): Promise<BlogListResult> {
  await connectMongoose();

  const query: Record<string, unknown> = { status: "published" };
  if (tag) query.tags = tag;

  const [blogs, total] = await Promise.all([
    Blog.find(query)
      .select("-content -references")
      .sort({ publishedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Blog.countDocuments(query),
  ]);

  return {
    blogs: blogs.map(serializeBlog),
    total,
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function getBlogById(id: string): Promise<ILeanBlog | null> {
  await connectMongoose();
  const blog = await Blog.findById(id).lean();
  return blog ? serializeBlog(blog) : null;
}

export async function getPublishedBlogBySlug(slug: string): Promise<ILeanBlog | null> {
  await connectMongoose();
  const blog = await Blog.findOne({ slug, status: "published" }).lean();
  return blog ? serializeBlog(blog) : null;
}

export async function createBlog(input: BlogCreateInput, authorId?: string): Promise<ILeanBlog> {
  await connectMongoose();

  const slug = await ensureUniqueSlug(slugify(input.slug ?? input.title));
  const blog = await Blog.create({
    ...input,
    coverImage: input.coverImage ?? undefined,
    slug,
    authorId,
    timeToRead: calculateReadingTime(input.content),
    publishedAt: input.status === "published" ? new Date() : undefined,
  });

  return serializeBlog(blog.toObject());
}

export async function updateBlog(id: string, input: BlogUpdateInput): Promise<ILeanBlog | null> {
  await connectMongoose();

  const existing = await Blog.findById(id);
  if (!existing) return null;

  const update: Record<string, unknown> = { ...input };

  if (input.content !== undefined) {
    update.timeToRead = calculateReadingTime(input.content);
  }
  // Slugs only change when explicitly provided; renaming a title must not
  // silently break published URLs.
  if (input.slug !== undefined) {
    update.slug = await ensureUniqueSlug(slugify(input.slug), id);
  }
  // Stamp publishedAt on the first transition to published; keep the
  // original date on later re-publishes.
  if (input.status === "published" && !existing.publishedAt) {
    update.publishedAt = new Date();
  }
  // `coverImage: null` removes the cover image.
  if (input.coverImage === null) {
    delete update.coverImage;
    update.$unset = { coverImage: 1 };
  }

  const blog = await Blog.findByIdAndUpdate(id, update, {
    returnDocument: "after",
    runValidators: true,
  }).lean();

  return blog ? serializeBlog(blog) : null;
}

/** Deletes the post and cascades to its comments and view counters. */
export async function deleteBlog(id: string): Promise<boolean> {
  await connectMongoose();
  const blog = await Blog.findByIdAndDelete(id);
  if (!blog) return false;

  await Promise.all([
    BlogComment.deleteMany({ blogId: blog._id }),
    BlogView.deleteMany({ blogId: blog._id }),
  ]);
  return true;
}

export async function incrementBlogViews(blogId: string): Promise<number> {
  await connectMongoose();
  const doc = await BlogView.findOneAndUpdate(
    { blogId },
    { $inc: { views: 1 } },
    { upsert: true, returnDocument: "after" },
  );
  return doc?.views ?? 1;
}

export async function getBlogViews(blogId: string): Promise<number> {
  await connectMongoose();
  const doc = await BlogView.findOne({ blogId }).lean();
  return doc?.views ?? 0;
}

/** Map of blogId -> view count, for admin listings. */
export async function getAllBlogViews(): Promise<Record<string, number>> {
  await connectMongoose();
  const docs = await BlogView.find().lean();
  return Object.fromEntries(docs.map((doc) => [String(doc.blogId), doc.views]));
}
