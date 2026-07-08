import { z } from "zod";

// Storage URLs end up in public `href`/`src` attributes, so we restrict them to
// http(s) or root-relative paths — this keeps out `javascript:`/`data:` schemes
// while still allowing the (non-canonical) URLs our storage service returns.
const storageUrl = z
  .string()
  .trim()
  .min(1)
  .max(2048)
  .refine((value) => /^(https?:\/\/|\/)/i.test(value), {
    message: "URL de armazenamento inválido",
  });
const storageFileId = z.string().trim().min(1).max(300);

// --- Newsletters (PDF) -----------------------------------------------------

export const newsletterCreateSchema = z.object({
  title: z.string().trim().min(1).max(300),
  publishedAt: z.coerce.date(),
  fileUrl: storageUrl,
  storageFileId,
  fileSize: z.number().int().nonnegative().optional(),
  thumbnailUrl: storageUrl.optional(),
  thumbnailStorageFileId: storageFileId.optional(),
  visible: z.boolean().default(false),
});

export const newsletterUpdateSchema = z.object({
  title: z.string().trim().min(1).max(300).optional(),
  publishedAt: z.coerce.date().optional(),
  fileUrl: storageUrl.optional(),
  storageFileId: storageFileId.optional(),
  fileSize: z.number().int().nonnegative().optional(),
  // `null` clears the thumbnail (e.g. the replacement PDF failed to render).
  thumbnailUrl: storageUrl.nullish(),
  thumbnailStorageFileId: storageFileId.nullish(),
  visible: z.boolean().optional(),
});

// --- Project photos --------------------------------------------------------

export const projectPhotoCreateSchema = z.object({
  imageUrl: storageUrl,
  storageFileId,
  // Both captions are optional.
  subtitle: z.string().trim().max(200).optional(),
  takenAt: z.coerce.date().optional(),
  visible: z.boolean().default(false),
});

export const projectPhotoUpdateSchema = z.object({
  imageUrl: storageUrl.optional(),
  storageFileId: storageFileId.optional(),
  // `null` clears the optional field; omitting leaves it untouched.
  subtitle: z.string().trim().max(200).nullish(),
  takenAt: z.coerce.date().nullish(),
  visible: z.boolean().optional(),
});

// --- News ------------------------------------------------------------------

export const newsItemCreateSchema = z.object({
  imageUrl: storageUrl,
  storageFileId,
  title: z.string().trim().min(1).max(300),
  description: z.string().trim().min(1).max(2000),
  date: z.coerce.date(),
  externalUrl: z.url().max(2048),
  visible: z.boolean().default(false),
});

export const newsItemUpdateSchema = z.object({
  imageUrl: storageUrl.optional(),
  storageFileId: storageFileId.optional(),
  title: z.string().trim().min(1).max(300).optional(),
  description: z.string().trim().min(1).max(2000).optional(),
  date: z.coerce.date().optional(),
  externalUrl: z.url().max(2048).optional(),
  visible: z.boolean().optional(),
});

export type NewsletterCreateInput = z.infer<typeof newsletterCreateSchema>;
export type NewsletterUpdateInput = z.infer<typeof newsletterUpdateSchema>;
export type ProjectPhotoCreateInput = z.infer<typeof projectPhotoCreateSchema>;
export type ProjectPhotoUpdateInput = z.infer<typeof projectPhotoUpdateSchema>;
export type NewsItemCreateInput = z.infer<typeof newsItemCreateSchema>;
export type NewsItemUpdateInput = z.infer<typeof newsItemUpdateSchema>;
