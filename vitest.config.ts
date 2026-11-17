import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      // Metas de docs/testing.md#cobertura-mínima: `test:cov` falha abaixo delas.
      thresholds: {
        'src/shared/**': { lines: 80, branches: 80 },
        'src/features/**/{api,hooks,schemas}/**': { lines: 80, branches: 80 },
      },
    },
  },
});
