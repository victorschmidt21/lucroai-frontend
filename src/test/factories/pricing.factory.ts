import type {
  CanalVenda,
  ConfiguracaoCustos,
} from '@/shared/api/contracts/pricing';

/** Configuração da padaria do seed: 100 fornadas, maquininha de 1,36% e hora de R$ 18,75. */
export function makeConfiguracaoCustos(
  overrides: Partial<ConfiguracaoCustos> = {},
): ConfiguracaoCustos {
  return {
    empresaId: 1,
    baseRateio: 'FORNADAS',
    capacidadeMensal: 100,
    lucroPadrao: 0.15,
    impostoPercentual: 0,
    taxaMaquininha: 0.0136,
    valorHora: 18.75,
    ...overrides,
  };
}

/** Balcão do seed: o canal padrão, sem comissão. */
export function makeCanalVenda(
  overrides: Partial<CanalVenda> = {},
): CanalVenda {
  return {
    id: 1,
    empresaId: 1,
    nome: 'Balcão',
    comissaoPercentual: 0,
    ativo: true,
    balcao: true,
    ...overrides,
  };
}

/** Os 3 canais do seed, em ordem de criação (Balcão primeiro). */
export function makeCanaisDoSeed(): CanalVenda[] {
  return [
    makeCanalVenda(),
    makeCanalVenda({
      id: 2,
      nome: 'iFood',
      comissaoPercentual: 0.152,
      balcao: false,
    }),
    makeCanalVenda({
      id: 3,
      nome: 'iFood com entrega',
      comissaoPercentual: 0.262,
      ativo: false,
      balcao: false,
    }),
  ];
}
