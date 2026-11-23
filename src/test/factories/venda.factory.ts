import type {
  ItemVenda,
  ResumoVendas,
  Venda,
} from '@/shared/api/contracts/sales';

/** 50 pãezinhos a R$ 0,50 (custo 0,07, lucro real 0,86 no Balcão), do seed. */
export function makeItemVenda(overrides: Partial<ItemVenda> = {}): ItemVenda {
  return {
    id: 1,
    vendaId: 1,
    receitaId: 1,
    quantidade: 50,
    precoUnitarioReal: 0.5,
    custoUnitario: 0.07,
    lucroReal: 0.86,
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
    canalId: 1,
    itens: [
      makeItemVenda({ id: 1, vendaId: id }),
      makeItemVenda({
        id: 2,
        vendaId: id,
        receitaId: 3,
        quantidade: 20,
        precoUnitarioReal: 1,
        custoUnitario: 0.39,
        lucroReal: 0.61,
      }),
    ],
    ...overrides,
  };
}

/** `GET /vendas/resumo` do seed: 2 vendas nos últimos 30 dias (BE-31). */
export function makeResumoVendas(
  overrides: Partial<ResumoVendas> = {},
): ResumoVendas {
  return {
    dias: 30,
    dataInicio: '2026-10-23T19:41:17.361Z',
    vendas: 2,
    receita: 22.66,
    margemContribuicao: 12.6,
    indiceMargemContribuicao: 0.5559,
    gastosMensais: 2515,
    pontoEquilibrio: { valor: 4524.36, motivo: null },
    ...overrides,
  };
}
