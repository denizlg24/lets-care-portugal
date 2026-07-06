import { NextResponse } from "next/server";
import { isRootAdminSession } from "@/lib/admin/root";
import { requireAdmin } from "@/lib/api/admin";

export async function GET(request: Request) {
  const { session, response } = await requireAdmin(request);
  if (response) return response;

  return NextResponse.json({
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: session.user.role,
      isRoot: isRootAdminSession(session),
    },
  });
}
