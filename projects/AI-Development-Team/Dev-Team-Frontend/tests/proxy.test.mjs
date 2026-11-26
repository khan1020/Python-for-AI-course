import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

// Runs the production Next server against a fake FastAPI. No model calls, no database.
const RUN_ID = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed';
const run = { id: RUN_ID, parent_id: null, message: 'm', created_at: '2026-11-23T10:00:00',
  result: { answer: 'a', plan: 'p', review: 'r', approved: true, attempts: 1, files: { 'a.py': 'x' } } };

test('proxy: adds the API key, validates input, hides backend errors', { timeout: 60000 }, async (t) => {
  const requests = [];
  let status = 200;
  const fixture = http.createServer(async (req, res) => {
    let raw = ''; for await (const chunk of req) raw += chunk;
    requests.push({ url: req.url, key: req.headers['x-api-key'], body: raw ? JSON.parse(raw) : null });
    if (status !== 200) { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end('{"detail":"secret-provider-token"}'); return; }
    if (req.url.endsWith('/download')) { res.writeHead(200, { 'Content-Type': 'application/zip', 'Content-Disposition': 'attachment; filename="run.zip"' }); res.end('PK-zip-bytes'); return; }
    res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(run));
  });
  await new Promise((resolve) => fixture.listen(0, '127.0.0.1', resolve));
  const probe = http.createServer();
  await new Promise((resolve) => probe.listen(0, '127.0.0.1', resolve));
  const port = probe.address().port;
  await new Promise((resolve) => probe.close(resolve));
  const base = `http://127.0.0.1:${port}`;
  const next = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', String(port)], {
    env: { ...process.env, BACKEND_URL: `http://127.0.0.1:${fixture.address().port}`, BACKEND_API_KEY: 'test-key', NEXT_TELEMETRY_DISABLED: '1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = ''; next.stdout.on('data', (d) => { output += d; }); next.stderr.on('data', (d) => { output += d; });
  t.after(async () => { next.kill('SIGTERM'); fixture.close(); });
  let ready = false;
  for (let i = 0; i < 150 && next.exitCode === null; i++) {
    try { if ((await fetch(base)).ok) { ready = true; break; } } catch { /* still starting */ }
    await delay(100);
  }
  assert.ok(ready, output);
  const post = (body) => fetch(`${base}/api/team/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

  await t.test('forwards chat with the server-side API key and only known fields', async () => {
    const res = await post({ message: '  make calc  ', parent_id: RUN_ID, extra: 'drop me' });
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), run);
    assert.deepEqual(requests.at(-1), { url: '/api/team/chat', key: 'test-key', body: { message: 'make calc', parent_id: RUN_ID } });
  });
  await t.test('gets a run and streams the zip download', async () => {
    assert.deepEqual(await (await fetch(`${base}/api/team/runs/${RUN_ID}`)).json(), run);
    const zip = await fetch(`${base}/api/team/runs/${RUN_ID}/download`);
    assert.equal(zip.headers.get('content-type'), 'application/zip');
    assert.match(zip.headers.get('content-disposition'), /attachment/);
    assert.equal(await zip.text(), 'PK-zip-bytes');
  });
  await t.test('rejects bad input before it reaches the backend', async () => {
    const count = requests.length;
    for (const body of [{ message: '' }, { message: 'x'.repeat(12001) }, { message: 'hi', parent_id: '../etc' }]) {
      assert.equal((await post(body)).status, 400);
    }
    assert.equal((await fetch(`${base}/api/team/chat`, { method: 'POST', body: '{nope' })).status, 400);
    assert.equal((await fetch(`${base}/api/team/runs/not-a-uuid`)).status, 400);
    assert.equal(requests.length, count);
  });
  await t.test('never leaks backend error details', async () => {
    for (const [code, expected] of [[500, 502], [403, 403], [404, 404], [429, 429]]) {
      status = code;
      const res = await post({ message: 'hi' });
      assert.equal(res.status, expected);
      const text = await res.text();
      assert.ok(!text.includes('secret-provider-token'));
      assert.ok(JSON.parse(text).error);
    }
  });
  await t.test('explains when FastAPI is down', async () => {
    await new Promise((resolve) => fixture.close(resolve));
    const res = await post({ message: 'hi' });
    assert.equal(res.status, 503);
    assert.match((await res.json()).error, /FastAPI/);
  });
});
