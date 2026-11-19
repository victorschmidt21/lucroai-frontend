import { z } from 'zod';
import { apiFetch } from '@/shared/api/client';
import {
  insumoSchema,
  type CreateInsumoBody,
  type UpdateInsumoBody,
} from '@/shared/api/contracts/catalog';
import { unwrap } from '@/shared/api/request';

// catalog-service: `services/catalog-service/src/modules/insumos/infra/controllers/insumos.controller.ts`.

export async function listInsumos(signal?: AbortSignal) {
  const corpo = await apiFetch('catalog', '/insumos', { signal });
  return unwrap(corpo, z.array(insumoSchema));
}

export async function getInsumo(id: number, signal?: AbortSignal) {
  const corpo = await apiFetch('catalog', `/insumos/${id}`, { signal });
  return unwrap(corpo, insumoSchema);
}

export async function createInsumo(body: CreateInsumoBody) {
  const corpo = await apiFetch('catalog', '/insumos', { method: 'POST', body });
  return unwrap(corpo, insumoSchema);
}

export async function updateInsumo({
  id,
  body,
}: {
  id: number;
  body: UpdateInsumoBody;
}) {
  const corpo = await apiFetch('catalog', `/insumos/${id}`, {
    method: 'PATCH',
    body,
  });
  return unwrap(corpo, insumoSchema);
}

/** Responde 204 sem corpo: não há o que desembrulhar. */
export async function deleteInsumo(id: number) {
  await apiFetch('catalog', `/insumos/${id}`, { method: 'DELETE' });
}
