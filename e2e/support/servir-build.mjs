// Sobe o build de produção para os e2e, do mesmo jeito que a imagem Docker:
// o servidor standalone (`output: 'standalone'`), com os estáticos copiados ao
// lado. O `next start` não serve esse modo. Exige `npm run build` antes.
import { access, cp } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const standalone = resolve('.next/standalone');
const server = resolve(standalone, 'server.js');

await access(server).catch(() => {
  throw new Error(
    'Build de produção não encontrado. Rode `npm run build` antes dos e2e.',
  );
});
await cp('public', resolve(standalone, 'public'), { recursive: true });
await cp('.next/static', resolve(standalone, '.next/static'), {
  recursive: true,
});

process.env.PORT ??= '3000';
process.env.HOSTNAME ??= '127.0.0.1';
process.env.NODE_ENV = 'production';

await import(pathToFileURL(server).href);
