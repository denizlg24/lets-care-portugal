import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/admin";
import { apiError, apiValidationError, handleRouteError } from "@/lib/api/responses";
import { revalidateMediaPaths } from "@/lib/news-media/revalidate";
import { newsletterCreateSchema } from "@/lib/news-media/schemas";
import { createNewsletter, listNewsletters } from "@/lib/news-media/service";

export async function GET(request: NextRequest) {
  const { response } = await requireAdmin(request);
  if (response) return response;

  try {
    return NextResponse.json({ items: await listNewsletters() });
  } catch (error) {
    return handleRouteError("admin/news-media/newsletters:GET", error);
  }
}

export async function POST(request: NextRequest) {
  const { response } = await requireAdmin(request);
  if (response) return response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError(400, "Corpo do pedido inválido");
  }

  try {
    const parsed = newsletterCreateSchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    const item = await createNewsletter(parsed.data);
    if (item.visible) revalidateMediaPaths();
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    return handleRouteError("admin/news-media/newsletters:POST", error);
  }
}
