import { z } from 'zod';
import { apiFetch } from '@/shared/api/client';
import {
  producaoSchema,
  type CreateProducaoBody,
  type ListProducoesQuery,
} from '@/shared/api/contracts/operations';
import { unwrap } from '@/shared/api/request';

// operations-service: `services/operations-service/src/modules/producoes/infra/controllers/producoes.controller.ts`.

/** Já vem da mais recente para a mais antiga (`orderBy: dataProducao desc`). */
export async function listProducoes(
  filtros: ListProducoesQuery = {},
  signal?: AbortSignal,
) {
  const corpo = await apiFetch('operations', '/producoes', {
    query: { receitaId: filtros.receitaId },
    signal,
  });
  return unwrap(corpo, z.array(producaoSchema));
}

export async function getProducao(id: number, signal?: AbortSignal) {
  const corpo = await apiFetch('operations', `/producoes/${id}`, { signal });
  return unwrap(corpo, producaoSchema);
}

/** Baixa os insumos e credita o produto acabado. Devolve a produção com os rateios. */
export async function createProducao(body: CreateProducaoBody) {
  const corpo = await apiFetch('operations', '/producoes', {
    method: 'POST',
    body,
  });
  return unwrap(corpo, producaoSchema);
}
