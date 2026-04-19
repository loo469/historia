import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { createServer } from 'node:http';

const host = process.env.HOST ?? '127.0.0.1';
const port = Number(process.env.PORT ?? 4173);
const root = process.cwd();

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
};

function resolvePath(urlPath) {
  const requestedPath = urlPath === '/' ? '/index.html' : urlPath;
  const normalizedPath = normalize(requestedPath).replace(/^([.][.][/\\])+/, '');
  return join(root, normalizedPath);
}

const server = createServer((request, response) => {
  const filePath = resolvePath(new URL(request.url, `http://${request.headers.host}`).pathname);

  if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Not found');
    return;
  }

  response.writeHead(200, {
    'content-type': MIME_TYPES[extname(filePath)] ?? 'application/octet-stream',
    'cache-control': 'no-store',
  });

  createReadStream(filePath).pipe(response);
});

server.listen(port, host, () => {
  console.log(`Historia dev server running at http://${host}:${port}`);
});
