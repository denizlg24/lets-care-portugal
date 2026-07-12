import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/admin";
import { apiError, apiValidationError, handleRouteError } from "@/lib/api/responses";
import { revalidateMediaPaths } from "@/lib/news-media/revalidate";
import { webinarCreateSchema } from "@/lib/news-media/schemas";
import { createWebinar, listWebinars } from "@/lib/news-media/service";
import { extractYouTubeId, fetchYouTubeTitle } from "@/lib/news-media/youtube";

export async function GET(request: NextRequest) {
  const { response } = await requireAdmin(request);
  if (response) return response;

  try {
    return NextResponse.json({ items: await listWebinars() });
  } catch (error) {
    return handleRouteError("admin/news-media/webinars:GET", error);
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
    const parsed = webinarCreateSchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    const youtubeId = extractYouTubeId(parsed.data.youtubeUrl);
    if (!youtubeId) return apiError(400, "Link do YouTube inválido");

    const title = parsed.data.title ?? (await fetchYouTubeTitle(youtubeId));
    if (!title) {
      return apiError(
        400,
        "Não foi possível obter o título do vídeo. Preencha o título manualmente.",
      );
    }

    const item = await createWebinar({
      youtubeId,
      title,
      publishedAt: parsed.data.publishedAt,
      visible: parsed.data.visible,
    });
    if (item.visible) revalidateMediaPaths();
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    return handleRouteError("admin/news-media/webinars:POST", error);
  }
}
