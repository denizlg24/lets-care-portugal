import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ADMIN_ROLE, PENDING_ADMIN_ROLE } from "@/lib/admin/constants";
import { AdminAccessError, applyAdminAccessAction, listAdminAccessUsers } from "@/lib/admin/users";
import { requireRootAdmin } from "@/lib/api/admin";
import { apiError, apiValidationError, handleRouteError } from "@/lib/api/responses";

const actionSchema = z.object({
  userId: z.string().min(1),
  action: z.enum(["approve", "deny", "revoke", "suspend", "restore"]),
});

function hasRole(roleList: string, role: string): boolean {
  return roleList
    .split(",")
    .map((item) => item.trim())
    .includes(role);
}

export async function GET(request: NextRequest) {
  const { response } = await requireRootAdmin(request);
  if (response) return response;

  try {
    const users = await listAdminAccessUsers();
    return NextResponse.json({
      pending: users.filter((user) => user.role === PENDING_ADMIN_ROLE),
      admins: users.filter((user) => hasRole(user.role, ADMIN_ROLE)),
    });
  } catch (error) {
    return handleRouteError("admin/access:GET", error);
  }
}

export async function POST(request: NextRequest) {
  const { session, response } = await requireRootAdmin(request);
  if (response) return response;

  try {
    const body = await request.json().catch(() => null);
    if (body === null) return apiError(400, "Corpo JSON inválido");

    const parsed = actionSchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    await applyAdminAccessAction(parsed.data.action, parsed.data.userId, session);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return apiError(error.status, error.message);
    }
    return handleRouteError("admin/access:POST", error);
  }
}
