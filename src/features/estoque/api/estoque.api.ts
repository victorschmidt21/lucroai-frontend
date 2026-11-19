import { z } from 'zod';
import { apiFetch } from '@/shared/api/client';
import {
  estoqueSchema,
  movimentacaoEstoqueSchema,
  type RegistrarEntradaEstoqueBody,
} from '@/shared/api/contracts/operations';
import { unwrap } from '@/shared/api/request';

// operations-service: `services/operations-service/src/modules/estoque/infra/controllers/estoque.controller.ts`.

/** Saldo de um insumo. Não há listagem de estoque (lacuna 5). */
export async function getEstoqueDoInsumo(
  insumoId: number,
  signal?: AbortSignal,
) {
  const corpo = await apiFetch('operations', `/estoque/insumos/${insumoId}`, {
    signal,
  });
  return unwrap(corpo, estoqueSchema);
}

/** Entrada manual (origem Compra). Devolve o saldo atualizado. */
export async function registrarEntradaEstoque({
  insumoId,
  body,
}: {
  insumoId: number;
  body: RegistrarEntradaEstoqueBody;
}) {
  const corpo = await apiFetch(
    'operations',
    `/estoque/insumos/${insumoId}/entrada`,
    { method: 'POST', body },
  );
  return unwrap(corpo, estoqueSchema);
}

/** Já vem da mais recente para a mais antiga (`orderBy: dataMovimentacao desc`). */
export async function listMovimentacoes(
  insumoId: number,
  signal?: AbortSignal,
) {
  const corpo = await apiFetch(
    'operations',
    `/estoque/insumos/${insumoId}/movimentacoes`,
    { signal },
  );
  return unwrap(corpo, z.array(movimentacaoEstoqueSchema));
}
