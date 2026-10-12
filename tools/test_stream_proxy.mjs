/**
 * Runs the shared /api/stream cases (tools/fixtures/stream_cases.json) against functions/api/stream.js with a fake
 * global fetch: no network. Prints one JSON observation per case (status, response headers, body, upstream calls);
 * tools/test_stream_proxy.py judges them together with the Python implementation.
 *
 *   node tools/test_stream_proxy.mjs          (JSON on stdout; normally started by test_stream_proxy.py)
 */
import { readFileSync } from "node:fs";

const fixtures = JSON.parse(readFileSync(new URL("./fixtures/stream_cases.json", import.meta.url), "utf8"));
const proxy = await import(new URL("../functions/api/stream.js", import.meta.url));
const BASE = "http://127.0.0.1:8787/api/stream";

function upstreamBody(up) {
  if (up.body_hex) return Buffer.from(up.body_hex, "hex");
  if (up.body_repeat) return up.body_repeat.text.repeat(up.body_repeat.times);
  return up.body ?? "";
}

const observations = [];
for (const testCase of fixtures.cases) {
  const calls = [];
  const up = testCase.upstream || {};
  globalThis.fetch = async (input, init = {}) => {
    const url = String(input && input.url ? input.url : input);
    calls.push({ url, headers: Object.fromEntries(new Headers(init.headers || {})) });
    if (up.throw) throw new Error(up.throw);
    // A redirect: answered hop by hop when the caller follows redirects itself
    if (up.final_url && url !== up.final_url && init.redirect === "manual") {
      return new Response(null, { status: 302, headers: { Location: up.final_url } });
    }
    const response = new Response(up.status === 204 ? null : upstreamBody(up), { status: up.status || 200, headers: up.headers || {} });
    Object.defineProperty(response, "url", { value: up.final_url || String(input) });
    Object.defineProperty(response, "redirected", { value: Boolean(up.final_url) });
    return response;
  };

  const method = (testCase.request.method || "GET").toUpperCase();
  const query = new URLSearchParams(testCase.request.query || {}).toString();
  const request = new Request(`${BASE}${query ? "?" + query : ""}`, { method, headers: testCase.request.headers || {} });
  const observation = { name: testCase.name };
  try {
    const handler = method === "HEAD" && proxy.onRequestHead ? proxy.onRequestHead : proxy.onRequestGet;
    const res = await handler({ request, env: {} });
    observation.status = res.status;
    observation.headers = Object.fromEntries(res.headers);
    observation.body = method === "HEAD" ? "" : await res.text();
  } catch (err) {
    observation.error = String(err && err.message || err);
  }
  observation.upstream_calls = calls;
  observations.push(observation);
}
process.stdout.write(JSON.stringify(observations));
