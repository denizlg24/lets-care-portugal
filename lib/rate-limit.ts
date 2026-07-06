import { connectMongoose } from "@/lib/db/mongoose";
import { RateLimit } from "@/models/RateLimit";

export interface RateLimitOptions {
  maxRequests?: number;
  windowMs?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetMs: number;
}

/**
 * Sliding-window rate limiter backed by MongoDB, so it works across
 * serverless invocations. Keys should be scoped per feature, e.g.
 * `comment:<ip>` or `contact:<ip>`.
 */
export async function checkRateLimit(
  key: string,
  { maxRequests = 20, windowMs = 60_000 }: RateLimitOptions = {},
): Promise<RateLimitResult> {
  await connectMongoose();

  const now = new Date();
  const windowStart = new Date(now.getTime() - windowMs);

  // Atomically drop timestamps outside the window and append the current one.
  const doc = await RateLimit.findOneAndUpdate(
    { key },
    [
      {
        $set: {
          timestamps: {
            $concatArrays: [
              {
                $filter: {
                  input: { $ifNull: ["$timestamps", []] },
                  as: "t",
                  cond: { $gt: ["$$t", windowStart] },
                },
              },
              [now],
            ],
          },
        },
      },
    ],
    { upsert: true, returnDocument: "after", updatePipeline: true },
  );

  const count = doc?.timestamps?.length ?? 1;

  if (count > maxRequests) {
    // Remove the timestamp we just appended so blocked retries don't extend
    // the window indefinitely.
    await RateLimit.updateOne({ key }, { $pop: { timestamps: 1 } });

    const oldest = doc?.timestamps?.[0];
    const resetMs = oldest ? oldest.getTime() + windowMs - now.getTime() : windowMs;

    return { allowed: false, remaining: 0, resetMs: Math.max(resetMs, 0) };
  }

  return { allowed: true, remaining: maxRequests - count, resetMs: windowMs };
}
