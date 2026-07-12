import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/admin";
import { handleRouteError } from "@/lib/api/responses";
import { listLegalPages } from "@/lib/legal/service";

export async function GET(request: NextRequest) {
  const { response } = await requireAdmin(request);
  if (response) return response;

  try {
    return NextResponse.json({ items: await listLegalPages() });
  } catch (error) {
    return handleRouteError("admin/legal:GET", error);
  }
}
