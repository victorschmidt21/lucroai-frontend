// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  envSchema,
  parseEnv,
  publicEnvSchema,
  serverEnvSchema,
} from './env.schema';

const serverEnv = {
  AUTH_API_URL: 'http://localhost:3001',
  CATALOG_API_URL: 'http://localhost:3002',
  RECIPE_API_URL: 'http://localhost:3003',
  OPERATIONS_API_URL: 'http://localhost:3004',
  SALES_API_URL: 'http://localhost:3005',
};

const validEnv = {
  ...serverEnv,
  NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
};

const serverVariables = Object.keys(serverEnv);

describe('parseEnv', () => {
  it('retorna as variáveis quando são válidas', () => {
    expect(parseEnv(envSchema, validEnv)).toEqual(validEnv);
  });

  it('aceita URLs https', () => {
    const env = { ...serverEnv, SALES_API_URL: 'https://vendas.exemplo.com' };

    expect(parseEnv(serverEnvSchema, env)).toEqual(env);
  });

  it.each(serverVariables)(
    'gera erro nomeando a variável de servidor ausente %s',
    (name) => {
      const env: Record<string, string | undefined> = {
        ...serverEnv,
        [name]: undefined,
      };

      expect(() => parseEnv(serverEnvSchema, env)).toThrow(
        new RegExp(`${name} é obrigatória`),
      );
    },
  );

  it('gera erro nomeando a variável pública ausente', () => {
    expect(() => parseEnv(publicEnvSchema, {})).toThrow(
      /NEXT_PUBLIC_APP_URL é obrigatória/,
    );
  });

  it('informa todas as variáveis ausentes de uma vez', () => {
    let message = '';
    try {
      parseEnv(envSchema, {});
    } catch (error) {
      message = error instanceof Error ? error.message : '';
    }

    expect(message).toMatch(/^Variáveis de ambiente inválidas/);
    for (const name of [...serverVariables, 'NEXT_PUBLIC_APP_URL']) {
      expect(message).toContain(name);
    }
  });

  it.each(['', 'nao-e-url', 'ftp://localhost:3001', 'localhost:3001'])(
    'rejeita o valor inválido "%s"',
    (value) => {
      expect(() =>
        parseEnv(serverEnvSchema, { ...serverEnv, AUTH_API_URL: value }),
      ).toThrow(/AUTH_API_URL/);
    },
  );

  it('descarta variáveis que o schema não declara', () => {
    expect(
      parseEnv(serverEnvSchema, { ...serverEnv, JWT_SECRET: 'segredo' }),
    ).toEqual(serverEnv);
  });

  it('não expõe variáveis de servidor no schema público', () => {
    expect(parseEnv(publicEnvSchema, validEnv)).toEqual({
      NEXT_PUBLIC_APP_URL: validEnv.NEXT_PUBLIC_APP_URL,
    });
  });
});

describe('https em produção', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('rejeita http fora de localhost quando NODE_ENV é production', () => {
    vi.stubEnv('NODE_ENV', 'production');

    expect(() =>
      parseEnv(serverEnvSchema, {
        ...serverEnv,
        SALES_API_URL: 'http://vendas.exemplo.com',
      }),
    ).toThrow(/SALES_API_URL deve usar https em produção/);
    expect(() =>
      parseEnv(publicEnvSchema, {
        NEXT_PUBLIC_APP_URL: 'http://app.exemplo.com',
      }),
    ).toThrow(/NEXT_PUBLIC_APP_URL deve usar https em produção/);
  });

  it('aceita https e http em localhost, 127.0.0.1 e [::1] em produção', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const env = {
      AUTH_API_URL: 'https://auth.exemplo.com',
      CATALOG_API_URL: 'http://localhost:3002',
      RECIPE_API_URL: 'http://127.0.0.1:3999',
      OPERATIONS_API_URL: 'http://[::1]:3004',
      SALES_API_URL: 'https://vendas.exemplo.com',
    };

    expect(parseEnv(serverEnvSchema, env)).toEqual(env);
  });

  it('aceita http fora de localhost em desenvolvimento', () => {
    vi.stubEnv('NODE_ENV', 'development');
    const env = {
      ...serverEnv,
      AUTH_API_URL: 'http://host.docker.internal:3001',
    };

    expect(parseEnv(serverEnvSchema, env)).toEqual(env);
  });

  it('não repete o erro de https quando a URL é inválida', () => {
    vi.stubEnv('NODE_ENV', 'production');
    let message = '';
    try {
      parseEnv(serverEnvSchema, { ...serverEnv, AUTH_API_URL: 'nao-e-url' });
    } catch (error) {
      message = error instanceof Error ? error.message : '';
    }

    expect(message).toContain('AUTH_API_URL é obrigatória');
    expect(message).not.toContain('https em produção');
  });
});
