// @vitest-environment node
import { afterEach, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

it('expõe a URL pública do app', async () => {
  vi.stubEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000');

  const { publicEnv } = await import('./env.public');

  expect(publicEnv).toEqual({ NEXT_PUBLIC_APP_URL: 'http://localhost:3000' });
});

it('falha ao importar sem a URL pública', async () => {
  vi.stubEnv('NEXT_PUBLIC_APP_URL', undefined);

  await expect(import('./env.public')).rejects.toThrow(
    /NEXT_PUBLIC_APP_URL é obrigatória/,
  );
});
