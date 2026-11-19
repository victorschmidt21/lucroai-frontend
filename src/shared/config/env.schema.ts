import { z } from 'zod';

function requiredHttpUrl(name: string) {
  return z.url({
    protocol: /^https?$/,
    error: `${name} é obrigatória e deve ser uma URL http(s) válida`,
  });
}

/**
 * Variáveis disponíveis somente no servidor: uma URL base por microsserviço do
 * backend (`lucroai-backend`), que não usa prefixo de versão nas rotas.
 */
export const serverEnvSchema = z.object({
  /** auth-service: empresas, usuários e login (porta 3001). */
  AUTH_API_URL: requiredHttpUrl('AUTH_API_URL'),
  /** catalog-service: insumos e gastos indiretos (porta 3002). */
  CATALOG_API_URL: requiredHttpUrl('CATALOG_API_URL'),
  /** recipe-service: receitas, custos e simulação (porta 3003). */
  RECIPE_API_URL: requiredHttpUrl('RECIPE_API_URL'),
  /** operations-service: estoque e produções (porta 3004). */
  OPERATIONS_API_URL: requiredHttpUrl('OPERATIONS_API_URL'),
  /** sales-service: vendas e painel de vendas (porta 3005). */
  SALES_API_URL: requiredHttpUrl('SALES_API_URL'),
});

/** Variáveis expostas ao navegador (incorporadas ao bundle no build). */
export const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: requiredHttpUrl('NEXT_PUBLIC_APP_URL'),
});

/** Todas as variáveis, conferidas de uma vez na inicialização do servidor. */
export const envSchema = serverEnvSchema.extend(publicEnvSchema.shape);

export type ServerEnv = z.output<typeof serverEnvSchema>;

export function parseEnv<Schema extends z.ZodType>(
  schema: Schema,
  source: Record<string, string | undefined>,
): z.output<Schema> {
  const result = schema.safeParse(source);

  if (!result.success) {
    throw new Error(
      `Variáveis de ambiente inválidas. Confira o .env.example.\n${z.prettifyError(result.error)}`,
    );
  }

  return result.data;
}
