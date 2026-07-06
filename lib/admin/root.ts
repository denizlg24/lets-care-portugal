import type { Session } from "@/lib/auth";

export function getRootAdminEmail(): string | null {
  const email = process.env.ROOT_USER_EMAIL?.trim().toLowerCase();
  return email || null;
}

export function isRootAdminEmail(email?: string | null): boolean {
  const rootEmail = getRootAdminEmail();
  return Boolean(rootEmail && email?.toLowerCase() === rootEmail);
}

export function isRootAdminSession(session: Session | null): boolean {
  return isRootAdminEmail(session?.user.email);
}
