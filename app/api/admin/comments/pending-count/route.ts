import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/admin";
import { handleRouteError } from "@/lib/api/responses";
import { getPendingCommentCount } from "@/lib/blog/comments";

export async function GET(request: NextRequest) {
  const { response } = await requireAdmin(request);
  if (response) return response;

  try {
    const pending = await getPendingCommentCount();
    return NextResponse.json({ pending });
  } catch (error) {
    return handleRouteError("admin/comments/pending-count:GET", error);
  }
}
