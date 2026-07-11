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

/**
 * Identity + footer config edited on the admin "Site" page. Metadata fields
 * are required; footer fields may be emptied to hide the matching element.
 */
export const siteConfigUpdateSchema = z.object({
  name: z.string().trim().min(1, "O nome do site é obrigatório").max(120),
  shortName: z.string().trim().min(1, "O nome curto é obrigatório").max(60),
  title: z.string().trim().min(1, "O título é obrigatório").max(200),
  description: z.string().trim().min(1, "A descrição é obrigatória").max(1000),
  consortiumText: z.string().trim().max(300),
  consortiumHref: z
    .string()
    .trim()
    .max(500)
    .regex(/^(https?:\/\/.*)?$/, "A ligação tem de começar por https://"),
  projectLine: z.string().trim().max(200),
  fundingDisclaimer: z.string().trim().max(2000),
});

export type SiteConfigUpdateInput = z.infer<typeof siteConfigUpdateSchema>;
