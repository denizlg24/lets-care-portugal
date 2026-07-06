import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requestAdminAccess } from "@/lib/admin/users";
import { getClientIp } from "@/lib/api/request-meta";
import {
  apiError,
  apiRateLimited,
  apiValidationError,
  handleRouteError,
} from "@/lib/api/responses";
import { checkRateLimit } from "@/lib/rate-limit";

const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8).max(128),
});

export async function POST(request: NextRequest) {
  try {
    const { allowed, resetMs } = await checkRateLimit(`admin-register:${getClientIp(request)}`, {
      maxRequests: 5,
      windowMs: 60 * 60_000,
    });
    if (!allowed) return apiRateLimited(resetMs);

    const body = await request.json().catch(() => null);
    if (body === null) return apiError(400, "Corpo JSON inválido");

    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    await requestAdminAccess(parsed.data);

    return NextResponse.json(
      {
        message:
          "Acesso de administração solicitado. Um administrador principal tem de aprovar o pedido antes do início de sessão.",
      },
      { status: 201 },
    );
  } catch (error) {
    return handleRouteError("admin/auth/register", error);
  }
}
