module.exports = {
  apps: [
    {
      name: "suea-safety",
      cwd: __dirname,
      script: "scripts/run-with-env.cjs",
      args: [
        "node",
        "frontend/.next/standalone/server.js",
      ],
      env: {
        NODE_ENV: "production",
        PORT: "3000",
        HOSTNAME: "0.0.0.0",
        NODE_OPTIONS: "--dns-result-order=ipv4first",
        UPLOAD_DIR: ".data/uploads",
      },
      max_memory_restart: "512M",
      autorestart: true,
      time: true,
    },
  ],
};
