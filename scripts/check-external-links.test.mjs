// Tests for scripts/check-external-links.mjs: which links it checks, and that
// only a link that is certainly gone counts as broken.
//
// Run: pnpm run test:scripts
import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { externalLinks, classify, fetchStatus } from "./check-external-links.mjs";

const OWN = ["https://odal-node.io", "https://docs.odal-node.io"];

test("only links that leave both sites are collected", () => {
  const html = `
    <a href="https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1781&amp;from=EN#art4">ESPR</a>
    <a class="x" href="https://github.com/odal-node/dpp-core">core</a>
    <a href="https://docs.odal-node.io/api">own docs</a>
    <a href="https://odal-node.io/verify">own landing</a>
    <a href="https://staging.odal-node-docs.pages.dev/">preview</a>
    <a href="/roadmap">relative</a>
    <a href="mailto:contact@odal-node.io">mail</a>
    <link rel="canonical" href="https://example.org/not-a-link">
    <!-- <a href="https://example.org/commented-out">gone</a> -->`;
  assert.deepEqual([...externalLinks(html, OWN)].sort(), [
    "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1781&from=EN",
    "https://github.com/odal-node/dpp-core",
  ]);
});

test("only 404 and 410 are broken; refusals, limits and failures are unsure", () => {
  for (const s of [200, 204, 301, 308]) assert.equal(classify(s), "ok", `HTTP ${s}`);
  for (const s of [404, 410]) assert.equal(classify(s), "broken", `HTTP ${s}`);
  for (const s of [401, 403, 429, 500, 503]) assert.equal(classify(s), "unsure", `HTTP ${s}`);
  assert.equal(classify(new Error("timeout")), "unsure");
});

test("a real request: redirects are followed, a missing page is a 404, a stalled host times out", async () => {
  const server = createServer((req, res) => {
    if (req.url === "/moved") return res.writeHead(301, { Location: "/ok" }).end();
    if (req.url === "/ok") return res.writeHead(200).end("fine");
    if (req.url === "/stall") return; // never answers
    res.writeHead(404).end();
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    assert.equal(await fetchStatus(`${base}/moved`), 200);
    assert.equal(await fetchStatus(`${base}/nowhere`), 404);
    const stalled = await fetchStatus(`${base}/stall`, { timeoutMs: 300 });
    assert.ok(stalled instanceof Error);
    assert.equal(classify(stalled), "unsure");
  } finally {
    server.closeAllConnections();
    server.close();
  }
});
