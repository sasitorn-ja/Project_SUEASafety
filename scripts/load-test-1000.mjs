const baseUrl = process.env.LOAD_TEST_BASE_URL || process.argv[2] || "https://safety.cipcloud.net";
const totalRequests = Number(process.env.LOAD_TEST_REQUESTS || process.argv[3] || 1000);
const concurrency = Number(process.env.LOAD_TEST_CONCURRENCY || process.argv[4] || 1000);
const timeoutMs = Number(process.env.LOAD_TEST_TIMEOUT_MS || 15000);

const paths = [
  { path: "/", okStatuses: [200] },
  { path: "/api/health", okStatuses: [200] },
  { path: "/api/safety-culture/posts?limit=15&scope=all", okStatuses: [200, 401] },
  { path: "/api/notifications?limit=30", okStatuses: [200, 401] },
  { path: "/api/safety-effort/submissions/me?pageSize=1", okStatuses: [200, 401] },
];

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];
}

async function hit(index) {
  const target = paths[index % paths.length];
  const url = new URL(target.path, baseUrl);
  const startedAt = performance.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      credentials: "include",
      cache: "no-store",
      signal: controller.signal,
      headers: { "user-agent": "cpac-safety-load-test/1.0" },
    });
    await response.arrayBuffer().catch(() => null);
    return { path: target.path, ok: target.okStatuses.includes(response.status), status: response.status, durationMs: performance.now() - startedAt };
  } catch (error) {
    return { path: target.path, ok: false, status: error?.name || "ERROR", durationMs: performance.now() - startedAt };
  } finally {
    clearTimeout(timeout);
  }
}

async function main() {
  const results = [];
  let next = 0;
  async function worker() {
    while (next < totalRequests) {
      const index = next;
      next += 1;
      results.push(await hit(index));
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, totalRequests) }, worker));

  const durations = results.map((result) => result.durationMs);
  const failures = results.filter((result) => !result.ok);
  const byStatus = results.reduce((acc, result) => {
    const key = String(result.status);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  console.log(JSON.stringify({
    baseUrl,
    totalRequests,
    concurrency,
    ok: failures.length === 0,
    failures: failures.length,
    byStatus,
    latencyMs: {
      min: Math.round(Math.min(...durations)),
      p50: Math.round(percentile(durations, 50)),
      p95: Math.round(percentile(durations, 95)),
      p99: Math.round(percentile(durations, 99)),
      max: Math.round(Math.max(...durations)),
    },
  }, null, 2));
  if (failures.length) process.exitCode = 1;
}

main();
