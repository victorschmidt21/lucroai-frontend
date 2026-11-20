import { getServerEnv } from '@/shared/config/env.server';

const API_TIMEOUT_MS = 2000;

/** `GET /health` da API é pública e responde `{ status, database }`. */
const PROBE_PATH = '/health';

export type HealthResponse = {
  status: 'ok';
  api: { reachable: boolean };
};

/** Qualquer resposta HTTP conta: um 404 ou 503 ainda prova que a API foi alcançada. */
async function isReachable(baseUrl: string) {
  try {
    await fetch(new URL(PROBE_PATH, baseUrl), {
      cache: 'no-store',
      signal: AbortSignal.timeout(API_TIMEOUT_MS),
    });
    return true;
  } catch {
    return false;
  }
}

/** Responde 200 mesmo com a API fora do ar: o front está no ar e informa o estado dela. */
export async function GET() {
  const { API_URL } = getServerEnv();
  const body: HealthResponse = {
    status: 'ok',
    api: { reachable: await isReachable(API_URL) },
  };

  return Response.json(body);
}
