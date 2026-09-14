// scripts/preview-server.mjs
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

// Explicit routes prevent access to the repository, private notes and dotfiles.
const routes = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/favicon.svg', ['favicon.svg', 'image/svg+xml']],
  ['/designs.css', ['designs.css', 'text/css; charset=utf-8']],
  ['/designs.js', ['designs.js', 'text/javascript; charset=utf-8']],
  ['/home/', ['home/index.html', 'text/html; charset=utf-8']],
]);
const server = createServer(async (request, response) => {
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('X-Robots-Tag', 'noindex, nofollow');
  response.setHeader('Referrer-Policy', 'no-referrer');
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return;
  }
  // Do not normalize paths: traversal-shaped and unknown URLs must stay rejected.
  const path = request.url.split('?')[0];
  if (path === '/home') {
    response.writeHead(302, { Location: '/home/' }).end();
    return;
  }
  const route = routes.get(path);
  if (!route) {
    response.writeHead(404).end();
    return;
  }
  try {
    const body = await readFile(new URL(`../site/${route[0]}`, import.meta.url));
    response.writeHead(200, { 'Content-Type': route[1], 'Content-Length': body.length });
    response.end(request.method === 'HEAD' ? undefined : body);
  } catch {
    response.writeHead(500).end();
  }
});
server.on('error', (error) => {
  console.error(`Preview server failed: ${error.message}`);
  process.exitCode = 1;
});
// Default to an available port; PORT preserves a shared preview URL on restart.
const port = Number(process.env.PORT ?? 0);
if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('Invalid PORT');
server.listen(port, '0.0.0.0', () => {
  console.log(`Preview listening on 0.0.0.0:${server.address().port}; PID ${process.pid}`);
});
