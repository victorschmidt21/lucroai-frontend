// @vitest-environment node
import { describe, expect, it } from 'vitest';
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
