import { randomBytes } from "node:crypto";
import { getRequestMeta } from "@/lib/api/request-meta";
import { connectMongoose } from "@/lib/db/mongoose";
import { sendEmail } from "@/lib/email/resend";
import { siteUrl } from "@/lib/site";
import {
  ContactTicket,
  type IContactTicket,
  type IContactTicketMeta,
  type ILeanContactTicket,
  type TicketStatus,
} from "@/models/ContactTicket";
import type { ContactCreateInput } from "./schemas";

// Unambiguous alphabet (no 0/O/1/I). 32 chars, so `byte % 32` is unbiased.
const TICKET_ID_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const TICKET_ID_LENGTH = 8;
const MAX_TICKET_ID_ATTEMPTS = 5;

function generateTicketId(): string {
  const bytes = randomBytes(TICKET_ID_LENGTH);
  let suffix = "";
  for (const byte of bytes) {
    suffix += TICKET_ID_ALPHABET[byte % TICKET_ID_ALPHABET.length];
  }
  return `LTC-${suffix}`;
}

function isDuplicateTicketIdError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as { code?: number; keyPattern?: Record<string, unknown> };
  return err.code === 11000 && err.keyPattern?.ticketId !== undefined;
}

function isObjectId(value: string): boolean {
  return /^[a-fA-F0-9]{24}$/.test(value);
}

/** Accepts either a Mongo _id or a human-readable ticketId (LTC-...). */
function ticketFilter(idOrTicketId: string): Record<string, unknown> {
  return isObjectId(idOrTicketId)
    ? { _id: idOrTicketId }
    : { ticketId: idOrTicketId.toUpperCase() };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function serializeTicket(doc: { _id: unknown }): ILeanContactTicket {
  return { ...doc, _id: String(doc._id) } as unknown as ILeanContactTicket;
}

/** Builds the analytics meta stored on the ticket. Never includes the IP. */
export function ticketMetaFromRequest(request: Request): IContactTicketMeta {
  const { country, region, city, userAgent, referer } = getRequestMeta(request);
  const locale = request.headers.get("accept-language")?.split(",")[0]?.trim().slice(0, 35);
  return { country, region, city, userAgent, referer, locale: locale || undefined };
}

export async function createTicket(
  input: ContactCreateInput,
  meta: IContactTicketMeta,
): Promise<IContactTicket> {
  await connectMongoose();

  for (let attempt = 1; attempt <= MAX_TICKET_ID_ATTEMPTS; attempt++) {
    try {
      return await ContactTicket.create({
        ...input,
        ticketId: generateTicketId(),
        meta,
      });
    } catch (error) {
      if (!isDuplicateTicketIdError(error) || attempt === MAX_TICKET_ID_ATTEMPTS) {
        throw error;
      }
    }
  }

  throw new Error("Could not generate a unique ticket ID");
}

/**
 * Sends the confirmation email for a newly created ticket and stamps
 * `confirmationEmailSentAt` on success. Throws when sending fails so the
 * caller can decide how to degrade (the ticket is already stored).
 */
export async function sendTicketConfirmation(ticket: IContactTicket): Promise<void> {
  const { ticketId, name, email } = ticket;
  const safeName = escapeHtml(name);

  const text = [
    `Olá ${name},`,
    "",
    `Obrigado por contactar a LeTs-Care Portugal. Recebemos a sua mensagem e abrimos o pedido ${ticketId}.`,
    "",
    `A nossa equipa responderá para ${email} assim que possível. Indique ${ticketId} em qualquer seguimento para encontrarmos o seu pedido rapidamente.`,
    "",
    "Com os melhores cumprimentos,",
    "A equipa LeTs-Care Portugal",
    "",
    `Este email foi enviado automaticamente — por favor não responda. Se quiser enviar-nos outra mensagem, escreva para aslopes@letras.up.pt indicando o pedido ${ticketId}.`,
  ].join("\n");

  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; color: #1f2937; max-width: 560px;">
      <h2 style="color: #05254a;">Recebemos a sua mensagem</h2>
      <p>Olá ${safeName},</p>
      <p>
        Obrigado por contactar a <strong>LeTs-Care Portugal</strong>. Recebemos a sua
        mensagem e abrimos o pedido <strong>${ticketId}</strong>.
      </p>
      <p>
        A nossa equipa responderá para <strong>${email}</strong> assim que possível.
        Indique <strong>${ticketId}</strong> em qualquer seguimento para encontrarmos o
        seu pedido rapidamente.
      </p>
      <p>
        Com os melhores cumprimentos,<br />
        <strong>A equipa LeTs-Care Portugal</strong>
      </p>
      <p style="margin-top: 24px; padding-top: 12px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; margin-bottom: 0;">
        Este email foi enviado automaticamente — por favor não responda. Se quiser
        enviar-nos outra mensagem, escreva para
        <a
          href="mailto:aslopes@letras.up.pt?subject=${encodeURIComponent(`Pedido ${ticketId}`)}"
          style="color: #6b7280;"
        >aslopes@letras.up.pt</a>
        indicando o pedido <strong>${ticketId}</strong>.
      </p>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: `Recebemos a sua mensagem [${ticketId}]`,
    text,
    html,
  });

  await connectMongoose();
  await ContactTicket.updateOne(
    { _id: ticket._id },
    { $set: { confirmationEmailSentAt: new Date() } },
  );
}

/**
 * Notifies each internal recipient that a new ticket arrived. Best-effort: sends
 * are independent (one per recipient, per the admin setting) and a failure to
 * one address is logged without blocking the others or the request. No-op when
 * the recipient list is empty.
 */
export async function sendTicketNotification(
  ticket: IContactTicket,
  recipients: string[],
): Promise<void> {
  if (recipients.length === 0) return;

  const { ticketId, name, email, subject, message, affiliation, position } = ticket;
  const adminUrl = `${siteUrl}/admin/contacts/${ticketId}`;
  const subjectLine = subject?.trim() ? subject.trim() : "(sem assunto)";

  const detailLines = [
    `Nome: ${name}`,
    `Email: ${email}`,
    affiliation?.trim() ? `Afiliação: ${affiliation.trim()}` : null,
    position?.trim() ? `Cargo: ${position.trim()}` : null,
    `Assunto: ${subjectLine}`,
  ].filter((line): line is string => line !== null);

  const text = [
    `Novo contacto recebido (${ticketId}).`,
    "",
    ...detailLines,
    "",
    "Mensagem:",
    message,
    "",
    `Abrir no painel: ${adminUrl}`,
  ].join("\n");

  const detailRows = [
    ["Nome", escapeHtml(name)],
    ["Email", escapeHtml(email)],
    affiliation?.trim() ? ["Afiliação", escapeHtml(affiliation.trim())] : null,
    position?.trim() ? ["Cargo", escapeHtml(position.trim())] : null,
    ["Assunto", escapeHtml(subjectLine)],
  ]
    .filter((row): row is [string, string] => row !== null)
    .map(
      ([label, value]) =>
        `<tr><td style="padding: 2px 12px 2px 0; color: #6b7280;">${label}</td><td style="padding: 2px 0;">${value}</td></tr>`,
    )
    .join("");

  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; color: #1f2937; max-width: 560px;">
      <h2 style="color: #05254a;">Novo contacto recebido</h2>
      <p>Foi recebido um novo contacto (<strong>${ticketId}</strong>).</p>
      <table style="font-size: 14px; border-collapse: collapse;">${detailRows}</table>
      <p style="margin-top: 16px;"><strong>Mensagem</strong></p>
      <p style="white-space: pre-wrap;">${escapeHtml(message)}</p>
      <p style="margin-top: 16px;">
        <a href="${adminUrl}" style="color: #05254a; font-weight: bold;">Abrir no painel de administração</a>
      </p>
    </div>
  `;

  const results = await Promise.allSettled(
    recipients.map((to) =>
      sendEmail({ to, subject: `Novo contacto: ${subjectLine} [${ticketId}]`, text, html }),
    ),
  );

  results.forEach((result, index) => {
    if (result.status === "rejected") {
      console.error(
        `[contact] falha ao notificar ${recipients[index]} sobre ${ticketId}:`,
        result.reason,
      );
    }
  });
}

export const TICKET_SORT_KEYS = ["createdAt", "name", "status"] as const;
export type TicketSortKey = (typeof TICKET_SORT_KEYS)[number];
export type TicketSortDirection = "asc" | "desc";

export interface ListTicketsOptions {
  status?: TicketStatus;
  q?: string;
  sort?: TicketSortKey;
  direction?: TicketSortDirection;
  cursor?: string;
  limit?: number;
}

export interface ListTicketsResult {
  tickets: ILeanContactTicket[];
  total: number;
  nextCursor: string | null;
}

interface TicketCursor {
  v: string;
  id: string;
}

/** Opaque cursor: the last row's sort value + _id, so pagination stays stable
 * while new tickets arrive (unlike skip/limit). Dates travel as ISO strings. */
function encodeTicketCursor(ticket: ILeanContactTicket, sort: TicketSortKey): string {
  const value =
    sort === "createdAt" ? new Date(ticket.createdAt).toISOString() : String(ticket[sort] ?? "");
  const cursor: TicketCursor = { v: value, id: ticket._id };
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

function decodeTicketCursor(cursor: string): TicketCursor | null {
  try {
    const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as TicketCursor;
    if (typeof parsed?.v !== "string" || typeof parsed?.id !== "string" || !isObjectId(parsed.id)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function listTickets({
  status,
  q,
  sort = "createdAt",
  direction,
  cursor,
  limit = 20,
}: ListTicketsOptions = {}): Promise<ListTicketsResult> {
  await connectMongoose();

  const dir: TicketSortDirection = direction ?? (sort === "createdAt" ? "desc" : "asc");
  const dirNum = dir === "asc" ? 1 : -1;
  const comparator = dir === "asc" ? "$gt" : "$lt";

  const conditions: Record<string, unknown>[] = [];
  if (status) conditions.push({ status });
  if (q) {
    const rx = new RegExp(escapeRegExp(q), "i");
    conditions.push({ $or: [{ name: rx }, { email: rx }, { subject: rx }, { ticketId: rx }] });
  }

  const pageConditions = [...conditions];
  const decoded = cursor ? decodeTicketCursor(cursor) : null;
  if (decoded) {
    const value = sort === "createdAt" ? new Date(decoded.v) : decoded.v;
    pageConditions.push({
      $or: [
        { [sort]: { [comparator]: value } },
        { [sort]: value, _id: { [comparator]: decoded.id } },
      ],
    });
  }

  const safeLimit = Math.min(Math.max(limit, 1), 100);

  const [rows, total] = await Promise.all([
    ContactTicket.find(pageConditions.length > 0 ? { $and: pageConditions } : {})
      .sort({ [sort]: dirNum, _id: dirNum })
      .limit(safeLimit + 1)
      .lean(),
    ContactTicket.countDocuments(conditions.length > 0 ? { $and: conditions } : {}),
  ]);

  const hasMore = rows.length > safeLimit;
  const tickets = rows.slice(0, safeLimit).map(serializeTicket);
  const last = tickets.at(-1);
  const nextCursor = hasMore && last ? encodeTicketCursor(last, sort) : null;

  return { tickets, total, nextCursor };
}

export async function getTicket(idOrTicketId: string): Promise<ILeanContactTicket | null> {
  await connectMongoose();
  const ticket = await ContactTicket.findOne(ticketFilter(idOrTicketId)).lean();
  return ticket ? serializeTicket(ticket) : null;
}

export async function updateTicket(
  idOrTicketId: string,
  { status, assignedTo }: { status?: TicketStatus; assignedTo?: string | null },
): Promise<ILeanContactTicket | null> {
  await connectMongoose();

  const set: Record<string, unknown> = {};
  const unset: Record<string, unknown> = {};
  if (status !== undefined) set.status = status;
  if (assignedTo !== undefined) {
    if (assignedTo === null) unset.assignedTo = "";
    else set.assignedTo = assignedTo;
  }

  const update: Record<string, unknown> = {};
  if (Object.keys(set).length > 0) update.$set = set;
  if (Object.keys(unset).length > 0) update.$unset = unset;

  const ticket = await ContactTicket.findOneAndUpdate(ticketFilter(idOrTicketId), update, {
    returnDocument: "after",
    runValidators: true,
  }).lean();

  return ticket ? serializeTicket(ticket) : null;
}

export async function addTicketNote(
  idOrTicketId: string,
  authorId: string,
  content: string,
): Promise<ILeanContactTicket | null> {
  await connectMongoose();

  const ticket = await ContactTicket.findOneAndUpdate(
    ticketFilter(idOrTicketId),
    { $push: { notes: { authorId, content, createdAt: new Date() } } },
    { returnDocument: "after", runValidators: true },
  ).lean();

  return ticket ? serializeTicket(ticket) : null;
}

export async function deleteTicket(idOrTicketId: string): Promise<boolean> {
  await connectMongoose();
  const result = await ContactTicket.deleteOne(ticketFilter(idOrTicketId));
  return result.deletedCount > 0;
}

export interface TicketStats {
  total: number;
  byStatus: Record<string, number>;
  topCountries: { country: string; count: number }[];
  topAffiliations: { affiliation: string; count: number }[];
  perDay: { date: string; count: number }[];
}

export async function getTicketStats(): Promise<TicketStats> {
  await connectMongoose();

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [result] = await ContactTicket.aggregate<{
    total: { count: number }[];
    byStatus: { _id: string; count: number }[];
    topCountries: { _id: string; count: number }[];
    topAffiliations: { _id: string; count: number }[];
    perDay: { _id: string; count: number }[];
  }>([
    {
      $facet: {
        total: [{ $count: "count" }],
        byStatus: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
        topCountries: [
          { $match: { "meta.country": { $nin: [null, ""] } } },
          { $group: { _id: "$meta.country", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ],
        topAffiliations: [
          { $match: { affiliation: { $nin: [null, ""] } } },
          { $group: { _id: "$affiliation", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ],
        perDay: [
          { $match: { createdAt: { $gte: thirtyDaysAgo } } },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ],
      },
    },
  ]);

  const byStatus: Record<string, number> = {};
  for (const entry of result?.byStatus ?? []) {
    byStatus[entry._id] = entry.count;
  }

  return {
    total: result?.total?.[0]?.count ?? 0,
    byStatus,
    topCountries: (result?.topCountries ?? []).map((e) => ({ country: e._id, count: e.count })),
    topAffiliations: (result?.topAffiliations ?? []).map((e) => ({
      affiliation: e._id,
      count: e.count,
    })),
    perDay: (result?.perDay ?? []).map((e) => ({ date: e._id, count: e.count })),
  };
}
