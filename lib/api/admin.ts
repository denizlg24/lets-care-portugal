import type { NextResponse } from "next/server";
import { getRootAdminEmail, isRootAdminSession } from "@/lib/admin/root";
import { apiError } from "@/lib/api/responses";
import { auth, type Session } from "@/lib/auth";

/**
 * Resolves the Better Auth session from the request cookies and returns it
 * only when the user has the admin role (assigned by the admin plugin /
 * seed script). Returns null for anonymous or non-admin users.
 */
export async function getAdminSession(request: Request): Promise<Session | null> {
  const session = await auth.api.getSession({ headers: request.headers });
  if (session?.user.role !== "admin" || session.user.banned) {
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
    return { session: null, response: apiError(401, "Não autorizado") };
  }
  return { session, response: null };
}

/**
 * Route handler guard for root-admin-only mutations. The root admin is the
 * seeded account identified by ROOT_USER_EMAIL.
 */
export async function requireRootAdmin(request: Request): Promise<AdminGuard> {
  const rootEmail = getRootAdminEmail();
  if (!rootEmail) {
    return {
      session: null,
      response: apiError(500, "O email do administrador principal não está configurado"),
    };
  }

  const session = await getAdminSession(request);
  if (!session) {
    return { session: null, response: apiError(401, "Não autorizado") };
  }

  if (!isRootAdminSession(session)) {
    return {
      session: null,
      response: apiError(403, "É necessário acesso de administrador principal"),
    };
  }

  return { session, response: null };
}
