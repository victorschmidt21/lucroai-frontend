import type { ItemVenda, Venda } from '@/shared/api/contracts/sales';

/** 50 pãezinhos a R$ 0,50 (custo 0,07, margem 0,86), do seed. */
export function makeItemVenda(overrides: Partial<ItemVenda> = {}): ItemVenda {
  return {
    id: 1,
    vendaId: 1,
    receitaId: 1,
    quantidade: 50,
    precoUnitarioReal: 0.5,
    custoUnitario: 0.07,
    margemRealizada: 0.86,
    ...overrides,
  };
}

/** Primeira venda do seed: 50 pãezinhos e 20 brigadeiros, R$ 45,00, concluída. */
export function makeVenda(overrides: Partial<Venda> = {}): Venda {
  const id = overrides.id ?? 1;

  return {
    id,
    empresaId: 1,
    total: 45,
    status: 'CONCLUIDA',
    dataVenda: '2026-06-06T13:00:00.000Z',
    itens: [
      makeItemVenda({ id: 1, vendaId: id }),
      makeItemVenda({
        id: 2,
        vendaId: id,
        receitaId: 3,
        quantidade: 20,
        precoUnitarioReal: 1,
        custoUnitario: 0.39,
        margemRealizada: 0.61,
      }),
    ],
    ...overrides,
  };
}
