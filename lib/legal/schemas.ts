import { z } from "zod";

export const legalPageUpdateSchema = z.object({
  title: z.string().trim().min(1).max(200),
  content: z.string().trim().min(1).max(100_000),
});

export type LegalPageUpdateInput = z.infer<typeof legalPageUpdateSchema>;
