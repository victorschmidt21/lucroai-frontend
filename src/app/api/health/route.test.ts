// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { GET } from './route';

vi.mock('server-only', () => ({}));

const urls = {
  AUTH_API_URL: 'http://auth.test:3001',
  CATALOG_API_URL: 'http://catalog.test:3002',
  RECIPE_API_URL: 'http://recipe.test:3003',
  OPERATIONS_API_URL: 'http://operations.test:3004',
  SALES_API_URL: 'http://sales.test:3005',
};

beforeEach(() => {
  for (const [name, value] of Object.entries(urls)) vi.stubEnv(name, value);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function requestedUrls(fetchMock: ReturnType<typeof vi.fn<typeof fetch>>) {
  return fetchMock.mock.calls.map(([input]) => String(input));
}

it('informa todos os serviços no ar quando todos respondem', async () => {
  const fetchMock = vi
    .fn<typeof fetch>()
    .mockImplementation(async () => new Response('{}'));
  vi.stubGlobal('fetch', fetchMock);

  const response = await GET();

  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toEqual({
    status: 'ok',
    services: {
      auth: { reachable: true },
      catalog: { reachable: true },
      recipe: { reachable: true },
      operations: { reachable: true },
      sales: { reachable: true },
    },
  });
  expect(requestedUrls(fetchMock).toSorted()).toEqual(
    Object.values(urls)
      .map((url) => `${url}/docs-json`)
      .toSorted(),
  );
});

it('considera o serviço alcançado mesmo quando ele responde com erro', async () => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn<typeof fetch>()
      .mockImplementation(async () => new Response(null, { status: 503 })),
  );

  const response = await GET();

  await expect(response.json()).resolves.toMatchObject({
    services: { auth: { reachable: true }, sales: { reachable: true } },
  });
});

it('continua respondendo 200 e marca fora do ar só os serviços que falharam', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn<typeof fetch>().mockImplementation(async (input) => {
      const url = String(input);
      if (
        url.startsWith(urls.RECIPE_API_URL) ||
        url.startsWith(urls.SALES_API_URL)
      ) {
        throw new TypeError('fetch failed');
      }
      return new Response('{}');
    }),
  );

  const response = await GET();

  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toEqual({
    status: 'ok',
    services: {
      auth: { reachable: true },
      catalog: { reachable: true },
      recipe: { reachable: false },
      operations: { reachable: true },
      sales: { reachable: false },
    },
  });
});

it('marca todos fora do ar quando nenhum serviço responde', async () => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn<typeof fetch>()
      .mockRejectedValue(new DOMException('timeout', 'TimeoutError')),
  );

  const response = await GET();

  expect(response.status).toBe(200);
  const body = (await response.json()) as {
    services: Record<string, { reachable: boolean }>;
  };
  expect(Object.values(body.services)).toEqual(
    Array.from({ length: 5 }, () => ({ reachable: false })),
  );
});
