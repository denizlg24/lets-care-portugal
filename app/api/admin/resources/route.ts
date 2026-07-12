import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/admin";
import { apiError, apiValidationError, handleRouteError } from "@/lib/api/responses";
import { revalidateResourcePaths } from "@/lib/resources/revalidate";
import { resourceCreateSchema } from "@/lib/resources/schemas";
import { createResource, listResources } from "@/lib/resources/service";

export async function GET(request: NextRequest) {
  const { response } = await requireAdmin(request);
  if (response) return response;

  try {
    return NextResponse.json({ items: await listResources() });
  } catch (error) {
    return handleRouteError("admin/resources:GET", error);
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
    const parsed = resourceCreateSchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    const item = await createResource(parsed.data);
    if (item.visible) revalidateResourcePaths();
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    return handleRouteError("admin/resources:POST", error);
  }
}
