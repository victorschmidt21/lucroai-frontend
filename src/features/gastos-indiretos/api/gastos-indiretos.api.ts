import { z } from 'zod';
import { apiFetch } from '@/shared/api/client';
import {
  gastoIndiretoSchema,
  type CreateGastoIndiretoBody,
  type UpdateGastoIndiretoBody,
} from '@/shared/api/contracts/catalog';
import { unwrap } from '@/shared/api/request';

// catalog-service: `services/catalog-service/src/modules/gastos-indiretos/infra/controllers/gastos-indiretos.controller.ts`.

export async function listGastosIndiretos(signal?: AbortSignal) {
  const corpo = await apiFetch('catalog', '/gastos-indiretos', { signal });
  return unwrap(corpo, z.array(gastoIndiretoSchema));
}

export async function createGastoIndireto(body: CreateGastoIndiretoBody) {
  const corpo = await apiFetch('catalog', '/gastos-indiretos', {
    method: 'POST',
    body,
  });
  return unwrap(corpo, gastoIndiretoSchema);
}

export async function updateGastoIndireto({
  id,
  body,
}: {
  id: number;
  body: UpdateGastoIndiretoBody;
}) {
  const corpo = await apiFetch('catalog', `/gastos-indiretos/${id}`, {
    method: 'PUT',
    body,
  });
  return unwrap(corpo, gastoIndiretoSchema);
}

/** Responde 204 sem corpo: não há o que desembrulhar. */
export async function deleteGastoIndireto(id: number) {
  await apiFetch('catalog', `/gastos-indiretos/${id}`, { method: 'DELETE' });
}
