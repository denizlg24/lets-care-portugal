// PM2 process definition. Runs the Next.js production server under the Bun runtime.
// Start with:  pm2 start deploy/ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: "lets-care",
      // Force the Bun *runtime* (not just Bun as package manager).
      // If a native dep (sharp / pdf-to-img canvas) fails under Bun,
      // change to script: "bun" / args: "run start" to fall back to Node.
      script: "bun",
      args: "--bun run start",
      cwd: "/opt/lets-care-portugal",
      interpreter: "none", // let `bun` be the executable, don't wrap in node
      instances: 1,
      autorestart: true,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
        HOSTNAME: "127.0.0.1",
      },
    },
  ],
};
