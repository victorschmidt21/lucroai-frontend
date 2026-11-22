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
