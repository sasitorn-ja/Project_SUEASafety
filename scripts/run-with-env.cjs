const { spawn } = require("child_process");
const { existsSync, readFileSync } = require("fs");
const { resolve } = require("path");

const envFile = resolve(process.cwd(), ".env.production");

if (existsSync(envFile)) {
  const content = readFileSync(envFile, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();
    if (!key) continue;

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

const [, , command, ...args] = process.argv;
if (!command) {
  console.error("Usage: node scripts/run-with-env.cjs <command> [...args]");
  process.exit(1);
}

const child = spawn(command, args, {
  env: process.env,
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
