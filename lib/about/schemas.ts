import { z } from "zod";

export const teamLinkSchema = z.object({
  icon: z.string().trim().min(1, "O ícone é obrigatório").max(64),
  label: z.string().trim().min(1, "A etiqueta é obrigatória").max(80),
  href: z
    .string()
    .trim()
    .min(1, "A ligação é obrigatória")
    .max(500)
    .regex(/^(https?:\/\/|mailto:|tel:)/, "A ligação tem de começar por https://, mailto: ou tel:"),
});

export type TeamLinkInput = z.infer<typeof teamLinkSchema>;

export const teamMemberSchema = z.object({
  image: z.string().trim().max(500).optional(),
  name: z.string().trim().min(1, "O nome é obrigatório").max(120),
  abstract: z.string().trim().max(500).optional(),
  links: z.array(teamLinkSchema).max(10),
});

export type TeamMemberInput = z.infer<typeof teamMemberSchema>;

// Empty `image` keeps the bundled default for that collage slot.
export const missionImageSchema = z.object({
  image: z.string().trim().max(500),
  alt: z.string().trim().max(160).optional(),
});

export type MissionImageInput = z.infer<typeof missionImageSchema>;

export const aboutSettingsUpdateSchema = z.object({
  mission: z.string().trim().max(5000),
  missionImages: z.array(missionImageSchema).max(4),
  team: z.array(teamMemberSchema).max(40),
});

export type AboutSettingsUpdateInput = z.infer<typeof aboutSettingsUpdateSchema>;
