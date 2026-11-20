import { z } from 'zod';
import { apiFetch } from '@/shared/api/client';
import {
  vendaSchema,
  type CreateVendaBody,
  type ListVendasQuery,
  type UpdateVendaStatusBody,
} from '@/shared/api/contracts/sales';
import { unwrap } from '@/shared/api/request';

// sales-service: `services/sales-service/src/modules/vendas/infra/controllers/vendas.controller.ts`.

/** Já vem da mais recente para a mais antiga (`orderBy: dataVenda desc`). */
export async function listVendas(
  filtros: ListVendasQuery = {},
  signal?: AbortSignal,
) {
  const corpo = await apiFetch('/vendas', {
    query: {
      status: filtros.status,
      dataInicio: filtros.dataInicio,
      dataFim: filtros.dataFim,
    },
    signal,
  });
  return unwrap(corpo, z.array(vendaSchema));
}

export async function getVenda(id: number, signal?: AbortSignal) {
  const corpo = await apiFetch(`/vendas/${id}`, { signal });
  return unwrap(corpo, vendaSchema);
}

/** Cria a venda como `PENDENTE`, com o `total` e o custo de cada item gravados pelo backend. */
export async function createVenda(body: CreateVendaBody) {
  const corpo = await apiFetch('/vendas', { method: 'POST', body });
  return unwrap(corpo, vendaSchema);
}

/**
 * Só `PENDENTE` muda de status (400 "Venda já finalizada não pode ser alterada").
 * Concluir publica `venda_concluida`: a baixa do produto acabado é assíncrona.
 */
export async function updateVendaStatus(
  id: number,
  body: UpdateVendaStatusBody,
) {
  const corpo = await apiFetch(`/vendas/${id}/status`, {
    method: 'PATCH',
    body,
  });
  return unwrap(corpo, vendaSchema);
}
