// Minimal dev server for frontend with SPA fallback and API proxy (TypeScript compiled to JS)
// Uses Node built-ins via require with loose typings to avoid @types/node.

/* eslint-disable @typescript-eslint/no-explicit-any */
declare var require: any;
declare var process: any;

const http = require('http') as any;
const fsp = require('fs/promises') as any;
const fscb = require('fs') as any;
const path = require('path') as any;

const FRONTEND_ROOT = path.resolve(process.cwd(), 'frontend');
const PORT = Number((process.env.FRONTEND_PORT as string) || 5173);
const BACKEND_URL = (process.env.BACKEND_URL as string) || 'http://localhost:8000';

const MIME = new Map<string, string>([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.gif', 'image/gif'],
  ['.ico', 'image/x-icon'],
  ['.map', 'application/json; charset=utf-8'],
  ['.txt', 'text/plain; charset=utf-8'],
]);

async function readIndex(): Promise<string> {
  try {
    const p = path.join(FRONTEND_ROOT, 'html', 'index.html');
    return await fsp.readFile(p, 'utf8');
  } catch (_e) {
    return '<h1>learnCJK.dev</h1><p>index.html not found.</p>';
  }
}

function proxyApi(req: any, res: any): void {
  const target = new URL(req.url || '/', BACKEND_URL);
  const options = {
    protocol: target.protocol,
    hostname: target.hostname,
    port: target.port,
    path: target.pathname + target.search,
    method: req.method,
    headers: { ...req.headers, host: target.host },
  } as any;

  const proxyReq = http.request(options, (proxyRes: any) => {
    res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
    proxyRes.pipe(res);
  });
  proxyReq.on('error', (err: any) => {
    res.statusCode = 502;
    res.end('Proxy error: ' + (err && err.message ? err.message : String(err)));
  });
  if ((req as any).readable) (req as any).pipe(proxyReq);
}

async function serveStatic(_req: any, res: any, filePath: string): Promise<void> {
  try {
    const stat = await fsp.stat(filePath);
    if (stat.isDirectory()) {
      res.statusCode = 403;
      res.end('Forbidden');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const mime = MIME.get(ext) || 'application/octet-stream';
    res.setHeader('Content-Type', mime);
    res.setHeader('Cache-Control', 'no-cache');
    fscb.createReadStream(filePath).pipe(res);
  } catch (_e) {
    res.statusCode = 404;
    res.end('Not found');
  }
}

const server = http.createServer(async (req: any, res: any) => {
  const url = req.url || '/';
  // Proxy API
  if (url.startsWith('/api/')) {
    proxyApi(req, res);
    return;
  }

  // Static mount under /static → ./frontend
  if (url.startsWith('/static/')) {
    const rel = url.replace(/^\/static\//, '');
    const filePath = path.join(FRONTEND_ROOT, rel);
    await serveStatic(req, res, filePath);
    return;
  }

  // Root: serve index
  if (url === '/' || url === '/index.html') {
    const html = await readIndex();
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.end(html);
    return;
  }

  // SPA routes: /char/* → index.html
  if (/^\/char\//.test(url)) {
    const html = await readIndex();
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.end(html);
    return;
  }

  // Try file with no /static prefix (rare). If not found, fallback to index.
  const filePath = path.join(FRONTEND_ROOT, url.replace(/^\//, ''));
  if (fscb.existsSync(filePath) && fscb.statSync(filePath).isFile()) {
    await serveStatic(req, res, filePath);
    return;
  }

  // Fallback: SPA index
  const html = await readIndex();
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.end(html);
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Frontend dev server at http://localhost:${PORT}`);
  // eslint-disable-next-line no-console
  console.log(`Proxying /api → ${BACKEND_URL}`);
});

