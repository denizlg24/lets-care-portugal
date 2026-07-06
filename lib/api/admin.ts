import type { NextResponse } from "next/server";
import { apiError } from "@/lib/api/responses";
import { auth, type Session } from "@/lib/auth";

/**
 * Resolves the Better Auth session from the request cookies and returns it
 * only when the user has the admin role (assigned by the admin plugin /
 * seed script). Returns null for anonymous or non-admin users.
 */
export async function getAdminSession(request: Request): Promise<Session | null> {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session || session.user.role !== "admin" || session.user.banned) {
    return null;
  }
  return session;
}

type AdminGuard = { session: Session; response: null } | { session: null; response: NextResponse };

/**
 * Route-handler guard for admin-only endpoints.
 *
 * Usage:
 *   const { session, response } = await requireAdmin(request);
 *   if (response) return response;
 */
export async function requireAdmin(request: Request): Promise<AdminGuard> {
  const session = await getAdminSession(request);
  if (!session) {
    return { session: null, response: apiError(401, "Unauthorized") };
  }
  return { session, response: null };
}
