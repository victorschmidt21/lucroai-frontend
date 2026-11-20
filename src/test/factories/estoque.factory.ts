import type {
  Estoque,
  EstoqueProduto,
  MovimentacaoEstoque,
} from '@/shared/api/contracts/operations';

/** Estoque da Farinha de Trigo no seed (10 kg, mínimo 2 kg). */
export function makeEstoque(overrides: Partial<Estoque> = {}): Estoque {
  return {
    id: 1,
    insumoId: 1,
    quantidadeDisponivel: 10,
    quantidadeMinima: 2,
    dataAlteracao: '2026-06-01T09:00:00.000Z',
    ...overrides,
  };
}

/** Entrada inicial do seed (compra de 10 kg de farinha). */
export function makeMovimentacaoEstoque(
  overrides: Partial<MovimentacaoEstoque> = {},
): MovimentacaoEstoque {
  return {
    id: 1,
    insumoId: 1,
    tipo: 'ENTRADA',
    origem: 'COMPRA',
    quantidade: 10,
    referenciaId: null,
    observacao: null,
    dataMovimentacao: '2026-06-01T09:00:00.000Z',
    ...overrides,
  };
}

/** Saldo de produto acabado do Pão Francês (3 lotes de 50 unidades). */
export function makeEstoqueProduto(
  overrides: Partial<EstoqueProduto> = {},
): EstoqueProduto {
  return {
    receitaId: 1,
    quantidadeDisponivel: 150,
    dataAlteracao: '2026-06-02T10:00:00.000Z',
    ...overrides,
  };
}
