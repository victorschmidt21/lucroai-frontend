import { queryOptions } from '@tanstack/react-query';
import {
  listEstoqueInsumos,
  listEstoqueProdutos,
  listMovimentacoes,
} from './estoque.api';

export const estoqueKeys = {
  all: ['estoque'] as const,
  insumos: () => [...estoqueKeys.all, 'insumos'] as const,
  movimentacoes: (insumoId: number) =>
    [...estoqueKeys.all, 'movimentacoes', insumoId] as const,
  produtos: () => [...estoqueKeys.all, 'produtos'] as const,
};

/** Saldo e mínimo de todos os insumos (`GET /estoque/insumos`); o painel (FE-22) também usa. */
export function estoqueInsumosOptions() {
  return queryOptions({
    queryKey: estoqueKeys.insumos(),
    queryFn: ({ signal }) => listEstoqueInsumos(signal),
  });
}

/** Histórico de entradas e saídas de um insumo (FE-14). */
export function movimentacoesOptions(insumoId: number) {
  return queryOptions({
    queryKey: estoqueKeys.movimentacoes(insumoId),
    queryFn: ({ signal }) => listMovimentacoes(insumoId, signal),
  });
}

/** Saldo de produto acabado por receita (`GET /estoque/produtos`), usado ao concluir a venda (FE-17). */
export function estoqueProdutosOptions() {
  return queryOptions({
    queryKey: estoqueKeys.produtos(),
    queryFn: ({ signal }) => listEstoqueProdutos(signal),
  });
}
