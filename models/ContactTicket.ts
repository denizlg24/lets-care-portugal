import mongoose, { type Document, Schema } from "mongoose";

export const TICKET_STATUSES = ["new", "open", "resolved", "archived", "spam"] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

/**
 * Server-collected analytics, derived from proxy/CDN headers — never asked
 * from the visitor. The raw IP is deliberately not stored (it is only used
 * for rate limiting).
 */
export interface IContactTicketMeta {
  country?: string;
  region?: string;
  city?: string;
  userAgent?: string;
  referer?: string;
  locale?: string;
}

export interface IContactTicketNote {
  authorId: string;
  content: string;
  createdAt: Date;
}

export interface IContactTicket extends Document {
  ticketId: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
  affiliation?: string;
  position?: string;
  meta: IContactTicketMeta;
  status: TicketStatus;
  assignedTo?: string;
  notes: IContactTicketNote[];
  confirmationEmailSentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILeanContactTicket {
  _id: string;
  ticketId: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
  affiliation?: string;
  position?: string;
  meta: IContactTicketMeta;
  status: TicketStatus;
  assignedTo?: string;
  notes: IContactTicketNote[];
  confirmationEmailSentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ContactTicketMetaSchema = new Schema<IContactTicketMeta>(
  {
    country: { type: String, trim: true },
    region: { type: String, trim: true },
    city: { type: String, trim: true },
    userAgent: { type: String, trim: true },
    referer: { type: String, trim: true },
    locale: { type: String, trim: true },
  },
  { _id: false },
);

const ContactTicketNoteSchema = new Schema<IContactTicketNote>(
  {
    authorId: { type: String, required: true },
    content: { type: String, required: true, trim: true, maxlength: 2000 },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const ContactTicketSchema = new Schema<IContactTicket>(
  {
    ticketId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    subject: { type: String, trim: true, maxlength: 200 },
    message: { type: String, required: true, trim: true, maxlength: 5000 },
    affiliation: { type: String, trim: true, maxlength: 200 },
    position: { type: String, trim: true, maxlength: 120 },
    meta: { type: ContactTicketMetaSchema, default: {} },
    status: { type: String, enum: TICKET_STATUSES, required: true, default: "new" },
    assignedTo: { type: String, trim: true },
    notes: { type: [ContactTicketNoteSchema], default: [] },
    confirmationEmailSentAt: { type: Date },
  },
  { timestamps: true },
);

ContactTicketSchema.index({ status: 1, createdAt: -1 });
ContactTicketSchema.index({ email: 1 });
ContactTicketSchema.index({ "meta.country": 1 });

export const ContactTicket: mongoose.Model<IContactTicket> =
  mongoose.models.ContactTicket ||
  mongoose.model<IContactTicket>("ContactTicket", ContactTicketSchema);
