// @vitest-environment node
import { afterEach, expect, it, vi } from 'vitest';
import { validateEnvOrExit } from './instrumentation-node';

const validEnv = {
  AUTH_API_URL: 'http://localhost:3001',
  CATALOG_API_URL: 'http://localhost:3002',
  RECIPE_API_URL: 'http://localhost:3003',
  OPERATIONS_API_URL: 'http://localhost:3004',
  SALES_API_URL: 'http://localhost:3005',
  NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
};

function stubValidEnv() {
  for (const [name, value] of Object.entries(validEnv)) vi.stubEnv(name, value);
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

it('não encerra o processo quando o ambiente é válido', () => {
  stubValidEnv();
  const exit = vi.spyOn(process, 'exit').mockReturnValue(undefined as never);

  validateEnvOrExit();

  expect(exit).not.toHaveBeenCalled();
});

it('encerra o processo nomeando a variável que falta', () => {
  stubValidEnv();
  vi.stubEnv('SALES_API_URL', undefined);
  const exit = vi.spyOn(process, 'exit').mockReturnValue(undefined as never);
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});

  validateEnvOrExit();

  expect(exit).toHaveBeenCalledWith(1);
  expect(log).toHaveBeenCalledWith(
    expect.stringMatching(/SALES_API_URL é obrigatória/),
  );
});
