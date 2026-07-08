const fs = require('fs');
const http = require('http');
const path = require('path');

const port = Number(process.env.UPDATE_SERVER_PORT || 8765);
const root = path.resolve(process.argv[2] || path.join(__dirname, '..', 'local-update-fixtures'));

if (!fs.existsSync(root)) {
  console.error(`Fixture directory not found: ${root}`);
  console.error('Run: npm run prepare:local-update');
  process.exit(1);
}

const server = http.createServer((req, res) => {
  const requestPath = decodeURIComponent((req.url || '/').split('?')[0]);
  const filePath = path.join(root, requestPath === '/' ? 'latest-mac.yml' : requestPath.replace(/^\//, ''));

  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end(`Not found: ${requestPath}`);
    return;
  }

  const ext = path.extname(filePath);
  const contentType = ext === '.yml' ? 'text/yaml'
    : ext === '.zip' ? 'application/zip'
      : 'application/octet-stream';

  res.writeHead(200, {
    'Content-Type': contentType,
    'Cache-Control': 'no-cache',
  });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Local update server running at http://127.0.0.1:${port}/`);
  console.log(`Serving: ${root}`);
  console.log('Files:');
  for (const name of fs.readdirSync(root)) {
    console.log(`  - ${name}`);
  }
});
