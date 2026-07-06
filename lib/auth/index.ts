import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins/admin";
import { client, db } from "@/lib/db/client";
import { sendEmail } from "@/lib/email/resend";

export const auth = betterAuth({
  appName: "LeTs Care Portugal",
  baseURL: process.env.BETTER_AUTH_URL,
  database: mongodbAdapter(db, { client }),
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Reset your LeTs Care Portugal password",
        text: `Hi ${user.name},\n\nClick the link below to reset your password:\n${url}\n\nIf you did not request this, you can safely ignore this email.`,
      });
    },
  },
  // nextCookies must be the last plugin so it can set cookies from server actions.
  plugins: [admin(), nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
