import { defineConfig, devices } from '@playwright/test';

const baseURL = 'http://localhost:3000';
const port = new URL(baseURL).port;

/** API falsa (`e2e/support/fake-api.mjs`): uma porta atende os cinco serviços. */
const FAKE_API_URL = 'http://127.0.0.1:3999';

// `E2E_API_REAL=true` roda contra o backend local com o seed (portas 3001 a
// 3005) em vez da API falsa.
const apiReal = process.env.E2E_API_REAL === 'true';
const serviceUrls = apiReal
  ? {
      AUTH_API_URL: 'http://localhost:3001',
      CATALOG_API_URL: 'http://localhost:3002',
      RECIPE_API_URL: 'http://localhost:3003',
      OPERATIONS_API_URL: 'http://localhost:3004',
      SALES_API_URL: 'http://localhost:3005',
    }
  : {
      AUTH_API_URL: FAKE_API_URL,
      CATALOG_API_URL: FAKE_API_URL,
      RECIPE_API_URL: FAKE_API_URL,
      OPERATIONS_API_URL: FAKE_API_URL,
      SALES_API_URL: FAKE_API_URL,
    };

// `E2E_USAR_BUILD=true` (o CI usa) serve o build de produção em vez do
// `next dev`; exige `npm run build` antes.
const usarBuild = process.env.E2E_USAR_BUILD === 'true';

// Reaproveitar um servidor já aberto é opcional: um `npm run dev` com o .env
// apontando para outro backend faria os testes falharem sem motivo aparente.
const reutilizar = !process.env.CI && process.env.E2E_REUSE_SERVERS === 'true';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    ...(apiReal
      ? []
      : [
          {
            command: 'node e2e/support/fake-api.mjs',
            url: `${FAKE_API_URL}/health`,
            reuseExistingServer: reutilizar,
          },
        ]),
    {
      command: usarBuild
        ? 'node e2e/support/servir-build.mjs'
        : `npx next dev --port ${port}`,
      url: baseURL,
      reuseExistingServer: reutilizar,
      env: {
        ...serviceUrls,
        NEXT_PUBLIC_APP_URL: baseURL,
        PORT: port,
      },
    },
  ],
});
