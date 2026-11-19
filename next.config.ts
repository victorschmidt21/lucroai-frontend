import type { NextConfig } from 'next';

const watchPollIntervalMs = Number(process.env.WATCH_POLL_INTERVAL_MS);

const isDev = process.env.NODE_ENV === 'development';

// CSP sem nonce (node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md):
// o App Router injeta scripts inline, por isso 'unsafe-inline'; o `next dev`
// precisa também de 'unsafe-eval'. O navegador só fala com o próprio Next (BFF),
// então tudo é 'self'. Sem `upgrade-insecure-requests`, para os e2e em http.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
];

const nextConfig: NextConfig = {
  output: 'standalone',
  // Embaixo, o indicador do `next dev` cobriria a barra inferior fixa do celular
  // (FE-08). Em cima à esquerda, cobre só a logo, que repete o item Home.
  devIndicators: { position: 'top-left' },
  // Cabeçalhos de segurança da FE-24 (docs/security.md).
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
  // Eventos de arquivo não atravessam bind mounts no Docker Desktop (Windows/macOS).
  ...(watchPollIntervalMs > 0 && {
    watchOptions: { pollIntervalMs: watchPollIntervalMs },
  }),
};

export default nextConfig;
