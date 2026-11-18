import type { NextConfig } from 'next';

const watchPollIntervalMs = Number(process.env.WATCH_POLL_INTERVAL_MS);

const nextConfig: NextConfig = {
  output: 'standalone',
  // Embaixo, o indicador do `next dev` cobriria a barra inferior fixa do celular
  // (FE-08). Em cima à esquerda, cobre só a logo, que repete o item Home.
  devIndicators: { position: 'top-left' },
  // Eventos de arquivo não atravessam bind mounts no Docker Desktop (Windows/macOS).
  ...(watchPollIntervalMs > 0 && {
    watchOptions: { pollIntervalMs: watchPollIntervalMs },
  }),
};

export default nextConfig;
