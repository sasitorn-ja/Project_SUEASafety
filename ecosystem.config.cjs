module.exports = {
  apps: [
    {
      name: "suea-safety",
      cwd: __dirname,
      script: "scripts/run-with-env.cjs",
      args: [
        "node",
        ".next/standalone/server.js",
      ],
      env: {
        NODE_ENV: "production",
        PORT: "3000",
        HOSTNAME: "0.0.0.0",
        NODE_OPTIONS: "--dns-result-order=ipv4first",
      },
      max_memory_restart: "512M",
      autorestart: true,
      time: true,
    },
  ],
};
