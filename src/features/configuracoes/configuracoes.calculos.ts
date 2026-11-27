import { arredondarCentavos } from '@/shared/format/moeda';
import {
  fracaoParaPercentual,
  formatQuantidade,
  percentualParaFracao,
} from '@/shared/format/numero';
import { formatNumeroEditavel } from '@/shared/format/numero-br';

// A tela mostra percentuais (`15,2%`); a API guarda a fração do preço de venda
// (`0.152`, de 0 a 1), sem arredondar (BE-24, BE-25).

/** Fração da API (`0.0136`) no texto do campo (`1,36`), sem perder casas. */
export function percentualDaApi(fracao: number) {
  return formatNumeroEditavel(fracaoParaPercentual(fracao));
}

/** Percentual digitado (`1.36`) na fração da API (`0.0136`). */
export function percentualDaTela(pontos: number) {
  return percentualParaFracao(pontos);
}

/** Comissão na lista de canais: até 3 casas, sem zeros à direita (`15,2%`, `0%`). */
export function formatComissao(fracao: number) {
  return `${formatQuantidade(fracaoParaPercentual(fracao))}%`;
}

export type ContaDoValorHora =
  { valor: number; motivo?: undefined } | { valor?: undefined; motivo: string };

/**
 * "Não sabe? Faça a conta" (FE-76): ganho do mês ÷ horas de produção no mês,
 * com 2 casas (R$ 1.500 ÷ 80 h = R$ 18,75). Sem ganho ou sem horas, devolve o
 * motivo de não calcular, para a tela mostrar.
 */
export function calcularValorHora(
  ganhoMensal: number | null,
  horasMensais: number | null,
): ContaDoValorHora {
  if (ganhoMensal === null || ganhoMensal < 0) {
    return {
      motivo: 'Diga quanto você quer ganhar por mês para fazer a conta.',
    };
  }
  if (horasMensais === null) {
    return { motivo: 'Diga quantas horas por mês você passa produzindo.' };
  }
  if (horasMensais <= 0) {
    return {
      motivo:
        'Com 0 horas não dá para fazer a conta. Conte as horas em que você está produzindo.',
    };
  }

  return { valor: arredondarCentavos(ganhoMensal / horasMensais) };
}
