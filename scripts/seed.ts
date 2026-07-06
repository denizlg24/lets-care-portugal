/**
 * Seeds the root (admin) user. Runs before `next build` on Vercel — see vercel.json.
 *
 * Skips (exit 0) when ROOT_USER_EMAIL / ROOT_USER_PASSWORD / MONGODB_URI are not
 * set, so local and CI builds without secrets still succeed.
 *
 * Run manually with: bun run seed
 */
function installBunBsonV8Workaround(): () => void {
  const proc = globalThis.process as typeof process & {
    getBuiltinModule?: (name: string) => unknown;
    versions: typeof process.versions & { bun?: string };
  };

  if (!proc.versions.bun || typeof proc.getBuiltinModule !== "function") {
    return () => {};
  }

  const originalGetBuiltinModule = proc.getBuiltinModule.bind(proc);
  proc.getBuiltinModule = ((name: string) => {
    if (name === "v8" || name === "node:v8") return undefined;
    return originalGetBuiltinModule(name);
  }) as typeof proc.getBuiltinModule;

  return () => {
    proc.getBuiltinModule = originalGetBuiltinModule as typeof proc.getBuiltinModule;
  };
}

async function main() {
  const email = process.env.ROOT_USER_EMAIL;
  const password = process.env.ROOT_USER_PASSWORD;
  const rootName = process.env.ROOT_USER_NAME ?? "Root";

  if (!email || !password || !process.env.MONGODB_URI) {
    console.warn(
      "[seed] Skipping root user seed: ROOT_USER_EMAIL, ROOT_USER_PASSWORD and MONGODB_URI must all be set.",
    );
    return;
  }

  // Imported dynamically so the env guard above runs before better-auth
  // initializes (it reads MONGODB_URI and BETTER_AUTH_SECRET at import time).
  const restoreBunBsonV8Workaround = installBunBsonV8Workaround();
  try {
    const { auth } = await import("@/lib/auth");
    const { client, db } = await import("@/lib/db/client");
    try {
      const users = db.collection("user");
      const existing = await users.findOne({ email });

      if (existing) {
        console.log(`[seed] Root user ${email} already exists.`);
      } else {
        // Sign-up through better-auth so the password hash matches its scheme.
        await auth.api.signUpEmail({ body: { email, password, name: rootName } });
        console.log(`[seed] Created root user ${email}.`);
      }

      await users.updateOne({ email }, { $set: { role: "admin", emailVerified: true } });
      console.log("[seed] Ensured root user has role=admin and a verified email.");
    } finally {
      await client.close();
    }
  } finally {
    restoreBunBsonV8Workaround();
  }
}

await main();
process.exit(0);

export {};
