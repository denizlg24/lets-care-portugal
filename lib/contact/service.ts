import { randomBytes } from "node:crypto";
import { getRequestMeta } from "@/lib/api/request-meta";
import { connectMongoose } from "@/lib/db/mongoose";
import { sendEmail } from "@/lib/email/resend";
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

/** Accepts either a Mongo _id or a human-readable ticketId (LTC-…). */
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

/** Builds the analytics meta stored on a ticket. Never includes the IP. */
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

  throw new Error("Failed to generate a unique ticket id");
}

/**
 * Sends the confirmation email for a freshly created ticket and records
 * `confirmationEmailSentAt` on success. Throws when sending fails so the
 * caller can decide how to degrade (the ticket itself is already stored).
 */
export async function sendTicketConfirmation(ticket: IContactTicket): Promise<void> {
  const { ticketId, name, email } = ticket;
  const safeName = escapeHtml(name);

  const text = [
    `Hi ${name},`,
    "",
    `Thank you for contacting LeTs-Care Portugal. We have received your message and opened ticket ${ticketId}.`,
    "",
    `Our team will get back to you at ${email} as soon as possible. Please mention ${ticketId} in any follow-up so we can find your request quickly.`,
    "",
    "— LeTs-Care Portugal",
  ].join("\n");

  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; color: #1f2937; max-width: 560px; margin: 0 auto;">
      <h2 style="color: #05254a;">We received your message</h2>
      <p>Hi ${safeName},</p>
      <p>
        Thank you for contacting <strong>LeTs-Care Portugal</strong>. We have received your
        message and opened ticket <strong>${ticketId}</strong>.
      </p>
      <p>
        Our team will get back to you at <strong>${email}</strong> as soon as possible.
        Please mention <strong>${ticketId}</strong> in any follow-up so we can find your
        request quickly.
      </p>
      <p style="color: #6b7280;">— LeTs-Care Portugal</p>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: `We received your message [${ticketId}]`,
    text,
    html,
  });

  await connectMongoose();
  await ContactTicket.updateOne(
    { _id: ticket._id },
    { $set: { confirmationEmailSentAt: new Date() } },
  );
}

export interface ListTicketsOptions {
  status?: TicketStatus;
  q?: string;
  country?: string;
  page?: number;
  limit?: number;
}

export interface ListTicketsResult {
  tickets: ILeanContactTicket[];
  total: number;
  page: number;
  pages: number;
}

export async function listTickets({
  status,
  q,
  country,
  page = 1,
  limit = 20,
}: ListTicketsOptions = {}): Promise<ListTicketsResult> {
  await connectMongoose();

  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (country) filter["meta.country"] = country;
  if (q) {
    const rx = new RegExp(escapeRegExp(q), "i");
    filter.$or = [{ name: rx }, { email: rx }, { subject: rx }, { ticketId: rx }];
  }

  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const safePage = Math.max(page, 1);

  const [tickets, total] = await Promise.all([
    ContactTicket.find(filter)
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean(),
    ContactTicket.countDocuments(filter),
  ]);

  return {
    tickets: tickets.map(serializeTicket),
    total,
    page: safePage,
    pages: Math.max(1, Math.ceil(total / safeLimit)),
  };
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
