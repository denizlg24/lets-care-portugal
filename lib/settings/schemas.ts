import { z } from "zod";

export const siteLinkSchema = z.object({
  icon: z.string().trim().min(1, "O ícone é obrigatório").max(64),
  label: z.string().trim().min(1, "A etiqueta é obrigatória").max(80),
  value: z.string().trim().max(160).optional(),
  href: z
    .string()
    .trim()
    .min(1, "A ligação é obrigatória")
    .max(500)
    .regex(/^(https?:\/\/|mailto:|tel:)/, "A ligação tem de começar por https://, mailto: ou tel:"),
});

export type SiteLinkInput = z.infer<typeof siteLinkSchema>;

export const siteSettingsUpdateSchema = z.object({
  socialLinks: z.array(siteLinkSchema).max(20),
  contactLinks: z.array(siteLinkSchema).max(20),
});

export type SiteSettingsUpdateInput = z.infer<typeof siteSettingsUpdateSchema>;
