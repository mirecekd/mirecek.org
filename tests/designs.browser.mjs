// tests/designs.browser.mjs
// Optional real-browser check: node tests/designs.browser.mjs (local Chrome required).
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';

const profile = await mkdtemp(join(tmpdir(), 'design-browser-'));
const chrome = spawn(process.env.CHROME ?? '/usr/bin/google-chrome', [
  '--headless', '--no-sandbox', '--disable-gpu', '--remote-debugging-port=0',
  `--user-data-dir=${profile}`, 'about:blank',
], { stdio: 'ignore' });
let socket;
try {
  let port;
  for (let i = 0; i < 60; i++) {
    try { port = (await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]; break; }
    catch { await delay(100); }
  }
  assert(port, 'Chrome did not start');
  const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
  socket = new WebSocket(targets.find((target) => target.type === 'page').webSocketDebuggerUrl);
  await once(socket, 'open');
  let id = 0;
  const pending = new Map();
  const errors = [];
  socket.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data);
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);
    if (pending.has(message.id)) {
      const { resolve, reject, timeout } = pending.get(message.id);
      clearTimeout(timeout);
      pending.delete(message.id);
      if (message.error) reject(new Error(JSON.stringify(message.error)));
      else resolve(message.result);
    }
  });
  function command(method, params = {}) {
    return new Promise((resolve, reject) => {
      const key = ++id;
      const timeout = setTimeout(() => { pending.delete(key); reject(new Error(`CDP timeout: ${method}`)); }, 10000);
      pending.set(key, { resolve, reject, timeout });
      socket.send(JSON.stringify({ id: key, method, params }));
    });
  }
  async function evaluate(expression) {
    const result = await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    assert(!result.exceptionDetails, JSON.stringify(result.exceptionDetails));
    return result.result.value;
  }
  await command('Runtime.enable');
  await command('Page.enable');
  const base = process.env.PREVIEW_URL ?? 'http://127.0.0.1:46765';
  const designs = ['copper', 'organic', 'terminal', 'aurora', 'orbit'];
  const screenshots = new URL('../preview/designs/', import.meta.url);
  await mkdir(screenshots, { recursive: true });
  for (const width of [1440, 390]) {
    await command('Emulation.setDeviceMetricsOverride', { width, height: 1100, deviceScaleFactor: 1, mobile: false });
    for (const design of designs) {
      await command('Page.navigate', { url: `${base}/?design=${design}` });
      let ready = false;
      for (let i = 0; i < 60; i++) {
        ready = await evaluate(`document.readyState === 'complete' && document.documentElement.dataset.design === '${design}'`);
        if (ready) break;
        await delay(50);
      }
      assert(ready, `${design} did not initialize`);
      await delay(500);
      const state = await evaluate(`({
        design: document.documentElement.dataset.design,
        width: innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        name: document.querySelector('.brand').textContent,
        overflow: [...document.querySelectorAll('.shell *')].filter(e => {const r=e.getBoundingClientRect(); return r.width && (r.right > innerWidth+1 || r.left < -1) && !e.closest('.lab')}).map(e=>e.className).slice(0,8),
        visibleName: document.querySelector('.brand').getBoundingClientRect().width > 0,
        availability: document.querySelector('#kontakt').textContent,
        headerNotice: document.querySelector('.hero .availability') !== null,
        commandBackground: getComputedStyle(document.querySelector('.terminal')).backgroundColor,
        selectorCount: document.querySelectorAll('.design-picker, .design-tabs, #design-select, a[href*="?design="]').length
      })`);
      assert.equal(state.name, 'Miroslav Dvořák.');
      assert(state.visibleName);
      assert.equal(state.selectorCount, 0);
      assert.equal(state.headerNotice, false);
      assert.equal(state.commandBackground, 'rgba(0, 0, 0, 0)');
      assert(state.scrollWidth <= width, `${design}/${width}: horizontal page overflow ${JSON.stringify(state)}`);
      assert.equal(state.overflow.length, 0, `${design}/${width}: overflow ${JSON.stringify(state.overflow)}`);
      assert(state.availability.includes('Pracovně mám momentálně plnou kapacitu'));
      const shot = await command('Page.captureScreenshot', { format: 'png' });
      await writeFile(new URL(`${design}-${width}.png`, screenshots), Buffer.from(shot.data, 'base64'));
      console.log(`PASS ${design} ${width}px`);
    }
  }
  for (const query of ['', '?design=invalid', '?design=studio', '?design=prism']) {
    await command('Page.navigate', { url: `${base}/${query}` });
    await delay(350);
    assert.equal(await evaluate('document.documentElement.dataset.design'), 'copper');
  }
  await command('Emulation.setScriptExecutionDisabled', { value: true });
  await command('Page.navigate', { url: base });
  await delay(350);
  assert.equal(await evaluate('document.documentElement.dataset.design'), 'copper');
  await command('Emulation.setScriptExecutionDisabled', { value: false });
  await command('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('.hero-copy')).animationName`), 'none');
  assert.deepEqual(errors, []);
  console.log('PASS Copper default, removed/invalid design fallback, no-JS default, reduced motion and JS error checks');
} finally {
  socket?.close();
  const exit = once(chrome, 'exit');
  chrome.kill();
  await exit;
  await rm(profile, { recursive: true, force: true });
}
