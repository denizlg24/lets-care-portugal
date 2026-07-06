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
  if (cache.conn) {
    return cache.conn;
  }
  if (!cache.promise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error("MONGODB_URI is not set");
    }
    cache.promise = mongoose.connect(uri, { bufferCommands: false });
  }
  try {
    cache.conn = await cache.promise;
  } catch (error) {
    cache.promise = null;
    throw error;
  }
  return cache.conn;
}
