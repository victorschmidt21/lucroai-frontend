import { z } from 'zod';
import { apiFetch } from '@/shared/api/client';
import {
  compraInsumoSchema,
  insumoSchema,
  type CreateCompraInsumoBody,
  type CreateInsumoBody,
  type UpdateInsumoBody,
} from '@/shared/api/contracts/catalog';
import { unwrap } from '@/shared/api/request';

// Monolito: `src/modules/insumos/infra/controllers/insumos.controller.ts` e
// `compras-insumo.controller.ts` (BE-29).

export async function listInsumos(signal?: AbortSignal) {
  const corpo = await apiFetch('/insumos', { signal });
  return unwrap(corpo, z.array(insumoSchema));
}

export async function getInsumo(id: number, signal?: AbortSignal) {
  const corpo = await apiFetch(`/insumos/${id}`, { signal });
  return unwrap(corpo, insumoSchema);
}

export async function createInsumo(body: CreateInsumoBody) {
  const corpo = await apiFetch('/insumos', { method: 'POST', body });
  return unwrap(corpo, insumoSchema);
}

export async function updateInsumo({
  id,
  body,
}: {
  id: number;
  body: UpdateInsumoBody;
}) {
  const corpo = await apiFetch(`/insumos/${id}`, {
    method: 'PATCH',
    body,
  });
  return unwrap(corpo, insumoSchema);
}

/** Responde 204 sem corpo: não há o que desembrulhar. */
export async function deleteInsumo(id: number) {
  await apiFetch(`/insumos/${id}`, { method: 'DELETE' });
}

/** Compras do insumo, a mais recente primeiro (BE-29). */
export async function listComprasInsumo(
  insumoId: number,
  signal?: AbortSignal,
) {
  const corpo = await apiFetch(`/insumos/${insumoId}/compras`, { signal });
  return unwrap(corpo, z.array(compraInsumoSchema));
}

/** Dá entrada no estoque e recalcula o custo médio e o preço de hoje (BE-29). */
export async function createCompraInsumo({
  insumoId,
  body,
}: {
  insumoId: number;
  body: CreateCompraInsumoBody;
}) {
  const corpo = await apiFetch(`/insumos/${insumoId}/compras`, {
    method: 'POST',
    body,
  });
  return unwrap(corpo, compraInsumoSchema);
}
