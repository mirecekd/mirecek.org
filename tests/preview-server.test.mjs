// tests/preview-server.test.mjs
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { request } from 'node:http';
import test from 'node:test';

 test('preview serves only explicit public routes', { timeout: 10000 }, async () => {
  const child = spawn(process.execPath, [new URL('../scripts/preview-server.mjs', import.meta.url).pathname], { stdio: ['ignore', 'pipe', 'inherit'] });
  try {
    const [output] = await once(child.stdout, 'data');
    const port = Number(output.toString().match(/0\.0\.0\.0:(\d+)/)[1]);
    for (const [path, expected] of [
      ['/', 200], ['/favicon.svg', 200], ['/home', 302], ['/home/', 200],
      ['/memory-bank/projectBrief.md', 404], ['/.git/config', 404],
      ['/../memory-bank/projectBrief.md', 404], ['/README.md', 404],
      ['/%2e%2e/memory-bank/projectBrief.md', 404],
    ]) {
      const status = await new Promise((resolve, reject) => {
        const req = request({ host: '127.0.0.1', port, path }, (res) => {
          res.resume();
          resolve(res.statusCode);
        });
        req.on('error', reject);
        req.end();
      });
      assert.equal(status, expected, path);
    }
    const response = await fetch(`http://127.0.0.1:${port}/`, { method: 'POST' });
    assert.equal(response.status, 405);
  } finally {
    const exit = once(child, 'exit');
    child.kill();
    await exit;
  }
});
