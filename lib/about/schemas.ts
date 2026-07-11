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

export const aboutSectionSchema = z.object({
  title: z.string().trim().min(1, "O título é obrigatório").max(160),
  body: z.string().trim().min(1, "O conteúdo é obrigatório").max(20000),
  image: z.string().trim().max(500).optional(),
  imageAlt: z.string().trim().max(160).optional(),
});

export type AboutSectionInput = z.infer<typeof aboutSectionSchema>;

export const aboutSettingsUpdateSchema = z.object({
  sections: z.array(aboutSectionSchema).min(1, "Adicione pelo menos uma secção").max(20),
  team: z.array(teamMemberSchema).max(40),
});

export type AboutSettingsUpdateInput = z.infer<typeof aboutSettingsUpdateSchema>;
