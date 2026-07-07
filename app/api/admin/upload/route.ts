import { type NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/api/admin";
import { uploadFileToStorage } from "@/lib/storage/api";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_IMAGE_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const ALLOWED_IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

function getFileExtension(name: string): string {
  const dotIndex = name.lastIndexOf(".");
  return dotIndex >= 0 ? name.slice(dotIndex).toLowerCase() : "";
}

export async function POST(request: NextRequest) {
  const { response } = await requireAdmin(request);
  if (response) return response;

  try {
    const data = await request.formData();
    const fileEntry = data.get("file");

    if (!(fileEntry instanceof File) || fileEntry.size === 0) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (
      !ALLOWED_IMAGE_TYPES.has(fileEntry.type) ||
      !ALLOWED_IMAGE_EXTENSIONS.has(getFileExtension(fileEntry.name))
    ) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    if (fileEntry.size > MAX_IMAGE_UPLOAD_BYTES) {
      return NextResponse.json({ error: "File is too large" }, { status: 400 });
    }

    const uploaded = await uploadFileToStorage(fileEntry, "image");

    return NextResponse.json({ url: uploaded.publicUrl, hash: uploaded.id }, { status: 200 });
  } catch (error) {
    const err = error as Error;
    console.error("Error uploading file:", err);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}
