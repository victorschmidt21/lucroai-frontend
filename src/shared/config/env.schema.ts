import { z } from 'zod';

/** Hosts que podem usar `http` mesmo no build de produção (CI e e2e). */
const HOSTS_LOCAIS = new Set(['localhost', '127.0.0.1', '[::1]']);

/**
 * Em produção (`NODE_ENV=production`, que vale no `next build` e no servidor
 * standalone), só `https`, exceto para endereços locais: o CI e os e2e rodam
 * o build contra `http://localhost` e `http://127.0.0.1`.
 */
function usaHttpsSeExigido(valor: string) {
  if (process.env.NODE_ENV !== 'production') return true;
  try {
    const url = new URL(valor);
    return url.protocol === 'https:' || HOSTS_LOCAIS.has(url.hostname);
  } catch {
    // URL inválida já é apontada pela validação de formato.
    return true;
  }
}

function requiredHttpUrl(name: string) {
  return z
    .url({
      protocol: /^https?$/,
      error: `${name} é obrigatória e deve ser uma URL http(s) válida`,
    })
    .refine(usaHttpsSeExigido, {
      error: `${name} deve usar https em produção (http só para localhost)`,
    });
}

/**
 * Variáveis disponíveis somente no servidor: a URL base da API do LucroAI (o
 * monolito `lucroai-backend`), que não usa prefixo de versão nas rotas.
 */
export const serverEnvSchema = z.object({
  API_URL: requiredHttpUrl('API_URL'),
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
