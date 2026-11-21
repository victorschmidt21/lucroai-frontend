import { z } from 'zod';
import { apiFetch } from '@/shared/api/client';
import {
  estoqueProdutoSchema,
  estoqueSchema,
  movimentacaoEstoqueSchema,
  type AtualizarMinimoEstoqueBody,
  type RegistrarEntradaEstoqueBody,
} from '@/shared/api/contracts/operations';
import { unwrap } from '@/shared/api/request';

// Monolito: `src/modules/estoque/infra/controllers/`.

/** Saldo de todos os insumos da empresa, em ordem de `insumoId` (lacuna 5, resolvida). */
export async function listEstoqueInsumos(signal?: AbortSignal) {
  const corpo = await apiFetch('/estoque/insumos', { signal });
  return unwrap(corpo, z.array(estoqueSchema));
}

/** Entrada manual (origem Compra), com observação opcional. Devolve o saldo atualizado. */
export async function registrarEntradaEstoque({
  insumoId,
  body,
}: {
  insumoId: number;
  body: RegistrarEntradaEstoqueBody;
}) {
  const corpo = await apiFetch(`/estoque/insumos/${insumoId}/entrada`, {
    method: 'POST',
    body,
  });
  return unwrap(corpo, estoqueSchema);
}

/** Define o estoque mínimo, sem movimentação (lacuna 14, resolvida). */
export async function atualizarEstoqueMinimo({
  insumoId,
  body,
}: {
  insumoId: number;
  body: AtualizarMinimoEstoqueBody;
}) {
  const corpo = await apiFetch(`/estoque/insumos/${insumoId}/minimo`, {
    method: 'PATCH',
    body,
  });
  return unwrap(corpo, estoqueSchema);
}

/** Já vem da mais recente para a mais antiga. */
export async function listMovimentacoes(
  insumoId: number,
  signal?: AbortSignal,
) {
  const corpo = await apiFetch(`/estoque/insumos/${insumoId}/movimentacoes`, {
    signal,
  });
  return unwrap(corpo, z.array(movimentacaoEstoqueSchema));
}

/** Saldo de produto acabado, um por receita que já teve produção (lacuna 6, resolvida). */
export async function listEstoqueProdutos(signal?: AbortSignal) {
  const corpo = await apiFetch('/estoque/produtos', { signal });
  return unwrap(corpo, z.array(estoqueProdutoSchema));
}
