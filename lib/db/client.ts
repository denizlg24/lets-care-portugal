import { MongoClient } from "mongodb";

function getMongoUri(): string {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set");
  }
  return uri;
}

// Reuse the client across hot reloads in development to avoid
// exhausting the connection pool.
const globalForMongo = globalThis as unknown as { mongoClient?: MongoClient };

export const client = globalForMongo.mongoClient ?? new MongoClient(getMongoUri());

if (process.env.NODE_ENV !== "production") {
  globalForMongo.mongoClient = client;
}

export const db = client.db();
