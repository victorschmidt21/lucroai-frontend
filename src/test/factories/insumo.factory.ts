import type {
  Alertas,
  CompraInsumo,
  Insumo,
} from '@/shared/api/contracts/catalog';

/** Farinha de Trigo do seed "Padaria Pão Feliz" (5 kg por R$ 15,00, custo 3/kg). */
export function makeInsumo(overrides: Partial<Insumo> = {}): Insumo {
  return {
    id: 1,
    empresaId: 1,
    nome: 'Farinha de Trigo',
    quantidadeBaseCusto: 5,
    quantidadeDisponivel: 10,
    quantidadeMinima: 2,
    estoqueNegativo: false,
    unidade: 'KG',
    valorPago: 15,
    custoUnitario: 3,
    precoUnitario: 3,
    custoMedio: 3,
    ultimoCusto: 3,
    custoReposicao: 3,
    precoMercado: null,
    precoMercadoData: null,
    dataCriacao: '2026-06-01T10:00:00.000Z',
    ...overrides,
  };
}

// Seed do backend, na ordem de inserção (ids 1 a 12):
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
        custoMedio: custoUnitario,
        ultimoCusto: custoUnitario,
        custoReposicao: custoUnitario,
      });
    },
  );
}

/** Compra da farinha: 5 kg por R$ 15,00 (custo 3/kg). */
export function makeCompraInsumo(
  overrides: Partial<CompraInsumo> = {},
): CompraInsumo {
  return {
    id: 1,
    insumoId: 1,
    quantidade: 5,
    valorTotal: 15,
    custoUnitario: 3,
    observacao: null,
    dataCompra: '2026-06-01T10:00:00.000Z',
    ...overrides,
  };
}

/**
 * `GET /alertas` (BE-32): a farinha com saldo negativo e a manteiga 25% mais
 * cara; sem receita com estoque pronto negativo (`produtosNegativos`, BE-41)
 * e com o valor da hora preenchido (`valorHoraVazio`, BE-47).
 */
export function makeAlertas(overrides: Partial<Alertas> = {}): Alertas {
  return {
    estoqueNegativo: [
      { id: 1, nome: 'Farinha de Trigo', saldo: -0.5, unidade: 'KG' },
    ],
    precoDefasado: [
      {
        id: 3,
        nome: 'Manteiga sem Sal',
        unidade: 'G',
        custoMedio: 0.024,
        custoReposicao: 0.03,
        aumentoPercentual: 0.25,
        receitas: [
          {
            id: 1,
            nome: 'Bolo de Chocolate',
            precoSugerido: 3.0385,
            precoComCustoMedio: 2.9662,
          },
        ],
      },
    ],
    produtosNegativos: [],
    valorHoraVazio: false,
    ...overrides,
  };
}
