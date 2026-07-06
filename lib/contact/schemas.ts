import { z } from "zod";
import { TICKET_STATUSES } from "@/models/ContactTicket";

/** Public contact-form payload. Analytics meta is collected server-side. */
export const contactCreateSchema = z.object({
  name: z.string().trim().min(1, "O nome é obrigatório").max(120),
  email: z.email("É necessário um email válido").max(254),
  subject: z.string().trim().max(200).optional(),
  message: z.string().trim().min(10, "A mensagem tem de ter pelo menos 10 caracteres").max(5000),
  affiliation: z.string().trim().max(200).optional(),
  position: z.string().trim().max(120).optional(),
});

export type ContactCreateInput = z.infer<typeof contactCreateSchema>;

/** Admin ticket update: status/assignee changes and/or an internal note. */
export const ticketUpdateSchema = z
  .object({
    status: z.enum(TICKET_STATUSES).optional(),
    assignedTo: z.string().trim().min(1).max(128).nullable().optional(),
    note: z.string().trim().min(1).max(2000).optional(),
  })
  .refine(
    (data) => data.status !== undefined || data.assignedTo !== undefined || data.note !== undefined,
    { message: "É obrigatório indicar pelo menos status, assignedTo ou note" },
  );

export type TicketUpdateInput = z.infer<typeof ticketUpdateSchema>;
