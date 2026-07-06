import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { ADMIN_ROLE } from "@/lib/admin/constants";
import { isRootAdminSession } from "@/lib/admin/root";
import { auth } from "@/lib/auth";

export const getCurrentSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

export const getCurrentAdminSession = cache(async () => {
  const session = await getCurrentSession();
  if (session?.user.role !== ADMIN_ROLE || session.user.banned) {
    return null;
  }
  return session;
});

export async function requireAdminPage() {
  const session = await getCurrentAdminSession();
  if (!session) {
    redirect("/admin/login");
  }
  return session;
}

export async function redirectAdminAwayFromAuth() {
  const session = await getCurrentAdminSession();
  if (session) {
    redirect("/admin");
  }
}

export async function getCurrentRootAdminSession() {
  const session = await getCurrentAdminSession();
  return isRootAdminSession(session) ? session : null;
}
