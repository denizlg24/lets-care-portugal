import mongoose from "mongoose";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

const globalForMongoose = globalThis as unknown as { mongooseCache?: MongooseCache };

const cache: MongooseCache = globalForMongoose.mongooseCache ?? { conn: null, promise: null };

if (process.env.NODE_ENV !== "production") {
  globalForMongoose.mongooseCache = cache;
}

/**
 * Cached mongoose connection for app models. Better Auth uses the raw
 * MongoClient from `lib/db/client.ts`; both share the same MONGODB_URI.
 */
export async function connectMongoose(): Promise<typeof mongoose> {
  // readyState 1 = connected. A cached `conn` whose socket has since dropped
  // (e.g. an idle timeout during a long static build) must not be reused, or
  // the next query races the reconnect and throws.
  if (cache.conn && mongoose.connection.readyState === 1) {
    return cache.conn;
  }
  if (!cache.promise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error("MONGODB_URI is not set");
    }
    // Keep command buffering on (mongoose's default): if the connection is
    // still establishing or transiently reconnecting mid-build, queries queue
    // until it is ready instead of failing fast during prerendering.
    cache.promise = mongoose.connect(uri, { bufferCommands: true });
  }
  try {
    cache.conn = await cache.promise;
  } catch (error) {
    cache.promise = null;
    throw error;
  }
  return cache.conn;
}
