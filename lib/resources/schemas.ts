import { z } from "zod";
import { RESOURCE_TYPES } from "@/lib/resources/constants";

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

const resourceBaseSchema = z.object({
  type: z.enum(RESOURCE_TYPES),
  title: z.string().trim().min(1).max(300),
  description: z.string().trim().max(2000).optional(),
  authors: z.string().trim().max(500).optional(),
  publishedAt: z.coerce.date(),
  fileUrl: storageUrl.optional(),
  storageFileId: storageFileId.optional(),
  fileSize: z.number().int().nonnegative().optional(),
  thumbnailUrl: storageUrl.optional(),
  thumbnailStorageFileId: storageFileId.optional(),
  externalUrl: z.url().max(2048).optional(),
  visible: z.boolean().default(false),
});

// A resource must be reachable somehow: an uploaded file, an external link,
// or both (e.g. a paper with both the publisher page and an author PDF).
export const resourceCreateSchema = resourceBaseSchema.refine(
  (value) => value.fileUrl || value.externalUrl,
  { message: "Adicione um ficheiro ou um link externo" },
);

export const resourceUpdateSchema = z.object({
  type: z.enum(RESOURCE_TYPES).optional(),
  title: z.string().trim().min(1).max(300).optional(),
  // `null` clears the optional field; omitting leaves it untouched.
  description: z.string().trim().max(2000).nullish(),
  authors: z.string().trim().max(500).nullish(),
  publishedAt: z.coerce.date().optional(),
  fileUrl: storageUrl.nullish(),
  storageFileId: storageFileId.nullish(),
  fileSize: z.number().int().nonnegative().nullish(),
  thumbnailUrl: storageUrl.nullish(),
  thumbnailStorageFileId: storageFileId.nullish(),
  externalUrl: z.url().max(2048).nullish(),
  visible: z.boolean().optional(),
});

export type ResourceCreateInput = z.infer<typeof resourceCreateSchema>;
export type ResourceUpdateInput = z.infer<typeof resourceUpdateSchema>;
