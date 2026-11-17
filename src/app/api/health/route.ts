import { getServerEnv } from '@/shared/config/env.server';
import type { ServerEnv } from '@/shared/config/env.schema';

const SERVICE_TIMEOUT_MS = 2000;

/**
 * Os serviços do backend não têm rota de health; o JSON do Swagger existe em
 * todos e não exige autenticação.
 */
const PROBE_PATH = '/docs-json';

const SERVICES = {
  auth: 'AUTH_API_URL',
  catalog: 'CATALOG_API_URL',
  recipe: 'RECIPE_API_URL',
  operations: 'OPERATIONS_API_URL',
  sales: 'SALES_API_URL',
} as const satisfies Record<string, keyof ServerEnv>;

type ServiceName = keyof typeof SERVICES;

export type HealthResponse = {
  status: 'ok';
  services: Record<ServiceName, { reachable: boolean }>;
};

/** Qualquer resposta HTTP conta: um 404 ou 503 ainda prova que o serviço foi alcançado. */
async function isReachable(baseUrl: string) {
  try {
    await fetch(new URL(PROBE_PATH, baseUrl), {
      cache: 'no-store',
      signal: AbortSignal.timeout(SERVICE_TIMEOUT_MS),
    });
    return true;
  } catch {
    return false;
  }
}

/** Responde 200 mesmo com serviços fora do ar: o front está no ar e informa o estado de cada um. */
export async function GET() {
  const env = getServerEnv();
  const names = Object.keys(SERVICES) as ServiceName[];
  const results = await Promise.all(
    names.map((name) => isReachable(env[SERVICES[name]])),
  );

  const body: HealthResponse = {
    status: 'ok',
    services: Object.fromEntries(
      names.map((name, index) => [name, { reachable: results[index] }]),
    ) as HealthResponse['services'],
  };

  return Response.json(body);
}
