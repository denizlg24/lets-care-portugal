import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins/admin";
import { adminAc, userAc } from "better-auth/plugins/admin/access";
import { ADMIN_ROLE, PENDING_ADMIN_ROLE, USER_ROLE } from "@/lib/admin/constants";
import { client, db } from "@/lib/db/client";
import { sendEmail } from "@/lib/email/resend";

const roles = {
  [ADMIN_ROLE]: adminAc,
  [USER_ROLE]: userAc,
  [PENDING_ADMIN_ROLE]: userAc,
} as const;

export const auth = betterAuth({
  appName: "LeTs-Care Portugal",
  baseURL: process.env.BETTER_AUTH_URL,
  database: mongodbAdapter(db, { client }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Reponha a sua palavra-passe da LeTs-Care Portugal",
        text: `Olá ${user.name},\n\nClique na ligação abaixo para repor a sua palavra-passe:\n${url}\n\nSe não pediu esta alteração, pode ignorar este email em segurança.`,
      });
    },
  },
  // nextCookies must be the last plugin so it can set cookies from server actions.
  plugins: [admin({ roles }), nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
