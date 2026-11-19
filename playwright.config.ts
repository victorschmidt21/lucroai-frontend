import { defineConfig, devices } from '@playwright/test';

const baseURL = 'http://localhost:3000';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
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
  // Os testes não dependem do backend: com os serviços fora do ar, o
  // /api/health continua respondendo 200 e os marca como inacessíveis.
  webServer: {
    command: 'npm run dev',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    env: {
      AUTH_API_URL: 'http://localhost:3001',
      CATALOG_API_URL: 'http://localhost:3002',
      RECIPE_API_URL: 'http://localhost:3003',
      OPERATIONS_API_URL: 'http://localhost:3004',
      SALES_API_URL: 'http://localhost:3005',
      NEXT_PUBLIC_APP_URL: baseURL,
    },
  },
});
