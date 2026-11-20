// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { GET } from './route';

vi.mock('server-only', () => ({}));

const API_URL = 'http://api.test:3100';

beforeEach(() => {
  vi.stubEnv('API_URL', API_URL);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

it('informa a API no ar quando ela responde', async () => {
  const fetchMock = vi
    .fn<typeof fetch>()
    .mockImplementation(async () => new Response('{}'));
  vi.stubGlobal('fetch', fetchMock);

  const response = await GET();

  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toEqual({
    status: 'ok',
    api: { reachable: true },
  });
  expect(fetchMock.mock.calls.map(([input]) => String(input))).toEqual([
    `${API_URL}/health`,
  ]);
});

it('considera a API alcançada mesmo quando ela responde com erro', async () => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn<typeof fetch>()
      .mockImplementation(async () => new Response(null, { status: 503 })),
  );

  const response = await GET();

  await expect(response.json()).resolves.toEqual({
    status: 'ok',
    api: { reachable: true },
  });
});

it('continua respondendo 200 e marca a API fora do ar quando ela não responde', async () => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn<typeof fetch>()
      .mockRejectedValue(new DOMException('timeout', 'TimeoutError')),
  );

  const response = await GET();

  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toEqual({
    status: 'ok',
    api: { reachable: false },
  });
});
