import { envSchema, parseEnv } from '@/shared/config/env.schema';

/**
 * Encerra o processo explicitamente: o servidor standalone apenas registra um
 * erro lançado em `register()` e continua no ar, atendendo sem configuração.
 */
export function validateEnvOrExit() {
  try {
    parseEnv(envSchema, {
      ...process.env,
      // Citada por extenso para o Next.js incorporar o valor do build.
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    });
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
