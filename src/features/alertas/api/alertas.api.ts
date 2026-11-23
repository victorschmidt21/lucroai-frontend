import { apiFetch } from '@/shared/api/client';
import { alertasSchema } from '@/shared/api/contracts/catalog';
import { unwrap } from '@/shared/api/request';

// Monolito: `src/modules/alertas/infra/controllers/alertas.controller.ts` (BE-32).

/** Insumos com estoque negativo e com preço defasado. Só lê. */
export async function getAlertas(signal?: AbortSignal) {
  const corpo = await apiFetch('/alertas', { signal });
  return unwrap(corpo, alertasSchema);
}
