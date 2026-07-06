import { Resend } from "resend";

let resend: Resend | null = null;

// Lazy so builds/environments without RESEND_API_KEY don't crash at import time.
function getResend(): Resend {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY is not set");
    }
    resend = new Resend(apiKey);
  }
  return resend;
}

interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmail({ to, subject, text, html }: SendEmailOptions) {
  const from = process.env.RESEND_FROM_EMAIL ?? "LeTs Care Portugal <onboarding@resend.dev>";
  const { data, error } = await getResend().emails.send({ from, to, subject, text, html });
  if (error) {
    throw new Error(`Failed to send email to ${to}: ${error.message}`);
  }
  return data;
}
