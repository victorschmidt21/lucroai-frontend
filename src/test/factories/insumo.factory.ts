import type { Insumo } from '@/shared/api/contracts/catalog';

/** Farinha de Trigo do seed "Padaria Pão Feliz" (5 kg por R$ 15,00, custo 3/kg). */
export function makeInsumo(overrides: Partial<Insumo> = {}): Insumo {
  return {
    id: 1,
    empresaId: 1,
    nome: 'Farinha de Trigo',
    quantidadeBaseCusto: 5,
    quantidadeDisponivel: 10,
    unidade: 'KG',
    valorPago: 15,
    custoUnitario: 3,
    precoUnitario: 3,
    dataCriacao: '2026-06-01T10:00:00.000Z',
    ...overrides,
  };
}

// `services/catalog-service/prisma/seed.ts`, na ordem de inserção (ids 1 a 12):
// nome, quantidade base, unidade, valor pago e estoque inicial.
const SEED: [string, number, Insumo['unidade'], number, number][] = [
  ['Farinha de Trigo', 5, 'KG', 15, 10],
  ['Açúcar Cristal', 2, 'KG', 8.8, 4],
  ['Manteiga sem Sal', 500, 'G', 12, 1000],
  ['Ovos', 12, 'UN', 9, 60],
  ['Leite Integral', 1, 'L', 5, 3],
  ['Fermento Biológico Seco', 500, 'G', 8.5, 1000],
  ['Cacau em Pó 100%', 200, 'G', 9, 500],
  ['Sal', 1, 'KG', 2.5, 2],
  ['Creme de Leite', 200, 'ML', 5.5, 600],
  ['Chocolate ao Leite Gotas', 1, 'KG', 35, 2],
  ['Coco Ralado', 100, 'G', 4.5, 300],
  ['Granulado de Chocolate', 100, 'G', 3.5, 300],
];

/** Os 12 insumos do seed, com o custo unitário calculado como o backend. */
export function makeInsumosDoSeed(): Insumo[] {
  return SEED.map(
    ([nome, quantidadeBaseCusto, unidade, valorPago, disponivel], indice) => {
      const custoUnitario = valorPago / quantidadeBaseCusto;

      return makeInsumo({
        id: indice + 1,
        nome,
        quantidadeBaseCusto,
        unidade,
        valorPago,
        quantidadeDisponivel: disponivel,
        custoUnitario,
        precoUnitario: custoUnitario,
      });
    },
  );
}
