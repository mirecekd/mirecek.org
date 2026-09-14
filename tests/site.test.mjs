// tests/site.test.mjs
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, lstatSync } from 'node:fs';
import { dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = fileURLToPath(new URL('../', import.meta.url));
const site = resolve(root, 'site');
const read = (path) => readFileSync(resolve(root, path), 'utf8');
const publicFiles = ['designs.css', 'designs.js', 'favicon.svg', 'home/index.html', 'index.html'];
const projects = ['sonic2life', 'clitka', 'diktatOR', 'atoms-for-girls', 'teskitty'];
const allowedLinks = new Set([
  'https://github.com/mirecekd',
  'https://github.com/mirecekd?tab=repositories',
  'https://www.linkedin.com/in/mirecekd/',
  'https://devpost.com/mirecekd',
  'https://www.credly.com/users/mirecekd',
  ...projects.map((name) => `https://github.com/mirecekd/${name}`),
]);

// Deliberately bounded to this hand-written static site, not a general HTML validator.
test('deployment directory contains only reviewed files and no symlinks', () => {
  const files = readdirSync(site, { recursive: true }).filter((path) => {
    const entry = lstatSync(resolve(site, path));
    assert(!entry.isSymbolicLink(), `Symlink in site: ${path}`);
    return entry.isFile();
  }).sort();
  assert.deepEqual(files, publicFiles);
});

test('HTML has valid local links, unique IDs and no embedded services', () => {
  for (const path of publicFiles.filter((path) => path.endsWith('.html'))) {
    const html = read(`site/${path}`);
    assert.match(html, /<html lang="cs"(?: data-design="copper")?>/);
    assert.match(html, /name="viewport"/);
    assert.equal([...html.matchAll(/<h1\b/g)].length, 1);
    assert.doesNotMatch(html, /<(iframe|form|object|embed)\b/i);
    const scripts = [...html.matchAll(/<script\b[^>]*>[\s\S]*?<\/script>/g)].map((m) => m[0]);
    assert.deepEqual(scripts, path === 'index.html' ? ['<script src="./designs.js" defer></script>'] : []);
    assert.doesNotMatch(html, /\bon\w+\s*=/i);
    assert.doesNotMatch(html, /@import|url\(\s*["']?https?:|\bsrc\s*=\s*["']https?:/i);
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
    assert.equal(ids.length, new Set(ids).size, `Duplicate ID in ${path}`);
    for (const [, href] of html.matchAll(/\bhref="([^"]+)"/g)) {
      if (href.startsWith('https:')) {
        assert(allowedLinks.has(href), `Unreviewed external link: ${href}`);

      } else if (href.startsWith('#')) {
        assert(ids.includes(href.slice(1)), `Missing anchor: ${href}`);
      } else {
        assert(!href.startsWith('/') && !href.includes(':'), `Nonportable link: ${href}`);
        const target = resolve(site, dirname(path), href);
        assert(!relative(site, target).startsWith('..'), `Link escapes site: ${href}`);
        assert(lstatSync(target), `Missing file: ${href}`);
      }
    }
  }
});

test('portfolio keeps the selected projects and accessibility basics', () => {
  const html = read('site/index.html');
  for (const name of projects) assert(html.includes(`https://github.com/mirecekd/${name}`));
  assert.match(html, /class="skip" href="#main"/);
  assert.match(html, /:focus-visible/);
  assert.match(html, /prefers-reduced-motion/);
  assert.match(html, /pre-alpha/);
  assert.match(html, /Hackathonový projekt/);
  assert.match(html, /hlasová verze zatím není ověřená v autě/);
  assert.match(html, /Miroslav Dvořák/);
  assert.doesNotMatch(html, /Mireček|Miroslav Dvorak|VOCAS|humanizer-cz/i);
  assert.doesNotMatch(html, /class="availability"|Momentálně jsem pracovně plně vytížený/);
  assert.match(html, /Pracovně mám momentálně plnou kapacitu/);
  assert.match(html, /několik hackathonů/);
  assert.match(html, /AWS Golden Jacket/);
  assert.match(html, /ITIL 4 Managing Professional/);
  assert.match(html, /přes 30 let/);
  const visibleText = html.replace(/<style>[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, '');
  assert.doesNotMatch(visibleText, /\blab\b|Trask|Trustsoft|milion|nejlepší|první v ČR/i);
  assert.equal([...html.matchAll(/<a[^>]+data-design="/g)].length, 0);
  assert.doesNotMatch(html, /design-picker|design-select|design-tabs|href="\?design=/);
  assert.doesNotMatch(html, /AI &amp; hlas|Voice AI|zkušenost s výukou ITIL/);
  assert.match(html, /<h3>AWS Golden Jacket<\/h3>/);
});

test('preview remains noindex until an explicit production cutover', () => {
  for (const path of ['site/index.html', 'site/home/index.html']) {
    assert.match(read(path), /name="robots" content="noindex, nofollow"/);
  }
  assert.match(read('site/home/index.html'), /content="0; url=\.\.\/"/);
});

test('private directories stay ignored and only main can deploy site', () => {
  for (const path of ['.gitignore', '.dockerignore']) {
    const lines = read(path).split('\n');
    assert(lines.includes('memory-bank/'));
    assert(lines.includes('preview/'));
  }
  const workflow = read('.github/workflows/pages.yml');
  assert.match(workflow, /path: site\n/);
  assert.match(workflow, /needs: check/);
  assert.match(workflow, /github\.event_name != 'pull_request'/);
  assert.match(workflow, /github\.ref == 'refs\/heads\/main'/);
  assert.match(workflow, /vars\.PAGES_ENABLED == 'true'/);
  assert.match(workflow, /pages: write/);
  assert.match(workflow, /id-token: write/);
  assert.doesNotMatch(workflow, /pull_request_target|secrets\./);
});
