import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/admin";
import { apiValidationError, handleRouteError } from "@/lib/api/responses";
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

  try {
    const parsed = newsletterCreateSchema.safeParse(await request.json());
    if (!parsed.success) return apiValidationError(parsed.error);

    const item = await createNewsletter(parsed.data);
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    return handleRouteError("admin/news-media/newsletters:POST", error);
  }
}
