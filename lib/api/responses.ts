import { NextResponse } from "next/server";
import type { ZodError } from "zod";

/** Standard JSON error body: `{ error: string }`. */
export function apiError(status: number, error: string): NextResponse {
  return NextResponse.json({ error }, { status });
}

/** 400 with per-field issues from a zod validation failure. */
export function apiValidationError(error: ZodError): NextResponse {
  return NextResponse.json(
    {
      error: "Invalid request data",
      issues: error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    },
    { status: 400 },
  );
}

/** 429 with a Retry-After header derived from the rate-limit window. */
export function apiRateLimited(resetMs: number): NextResponse {
  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    {
      status: 429,
      headers: { "Retry-After": String(Math.max(1, Math.ceil(resetMs / 1000))) },
    },
  );
}

/** Logs the error under a route scope and returns a generic 500. */
export function handleRouteError(scope: string, error: unknown): NextResponse {
  console.error(`[api:${scope}]`, error);
  return apiError(500, "Internal server error");
}
