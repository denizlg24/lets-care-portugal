// PM2 process definition. Runs the Next.js production server via npm (Node runtime).
// Start with:  pm2 start deploy/ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: "lets-care",
      script: "node_modules/next/dist/bin/next",
      args: "start -H 127.0.0.1 -p 3000",
      cwd: "/opt/lets-care-portugal",
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
