// Servidor estático só para desenvolvimento. Em produção o site é publicado
// como arquivos estáticos (Cloudflare Pages / GitHub Pages) e não roda nada.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';

const PORTA = Number(process.env.PORTA ?? 4173);
const RAIZ = process.cwd();

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

createServer(async (req, res) => {
  const caminhoPedido = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const arquivo = resolve(join(RAIZ, caminhoPedido === '/' ? '/index.html' : caminhoPedido));

  // Impede escapar da raiz do projeto via ../
  if (arquivo !== RAIZ && !arquivo.startsWith(RAIZ + sep)) {
    res.writeHead(403).end('403');
    return;
  }

  try {
    const conteudo = await readFile(arquivo);
    res.writeHead(200, { 'content-type': TIPOS[extname(arquivo)] ?? 'application/octet-stream' });
    res.end(conteudo);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('404');
  }
}).listen(PORTA, () => {
  console.log(`http://localhost:${PORTA}`);
});
