import mongoose, { type Document, Schema } from "mongoose";

export const BLOG_STATUSES = ["draft", "published", "archived"] as const;
export type BlogStatus = (typeof BLOG_STATUSES)[number];

export interface IBlogReference {
  label: string;
  url: string;
}

export interface IBlog extends Document {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  media: string[];
  tags: string[];
  references: IBlogReference[];
  status: BlogStatus;
  publishedAt?: Date;
  authorId?: string;
  timeToRead: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILeanBlog {
  _id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  media: string[];
  tags: string[];
  references: IBlogReference[];
  status: BlogStatus;
  publishedAt?: Date;
  authorId?: string;
  timeToRead: number;
  createdAt: Date;
  updatedAt: Date;
}

const BlogReferenceSchema = new Schema<IBlogReference>(
  {
    label: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const BlogSchema = new Schema<IBlog>(
  {
    slug: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true, trim: true },
    excerpt: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    coverImage: { type: String, trim: true },
    media: { type: [String], default: [] },
    tags: { type: [String], default: [] },
    references: { type: [BlogReferenceSchema], default: [] },
    status: {
      type: String,
      enum: BLOG_STATUSES,
      required: true,
      default: "draft",
    },
    publishedAt: { type: Date },
    authorId: { type: String, trim: true },
    timeToRead: { type: Number, required: true, default: 1 },
  },
  { timestamps: true },
);

// Public listings query published posts newest-first, optionally by tag.
BlogSchema.index({ status: 1, publishedAt: -1 });
BlogSchema.index({ tags: 1 });
BlogSchema.index({ createdAt: -1 });

export const Blog: mongoose.Model<IBlog> =
  mongoose.models.Blog || mongoose.model<IBlog>("Blog", BlogSchema);
