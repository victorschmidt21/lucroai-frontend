import type { GastoIndireto } from '@/shared/api/contracts/catalog';
import { calcularTotalContasDoMes } from '@/shared/domain/contas-do-mes';
import { normalizarTexto } from '@/shared/api/filtros';
import { formatMoeda } from '@/shared/format/moeda';
import { fracaoParaPercentual, formatQuantidade } from '@/shared/format/numero';

type GastoParaTotal = Pick<GastoIndireto, 'valor' | 'tipo'>;

// `calcularTotalContasDoMes` fica em `shared/domain/contas-do-mes.ts`, porque
// a fornada e a Pitada (FE-65) também usam.
export { calcularTotalContasDoMes };

/**
 * Valor com a unidade do tipo: `R$ 1.800,00 por mês`, `R$ 0,05 por unidade`
 * ou `12% da venda` (a API guarda o percentual como fração, `0.12`).
 */
export function formatValorDoGasto({ valor, tipo }: GastoParaTotal) {
  switch (tipo) {
    case 'MENSAL':
      return `${formatMoeda(valor)} por mês`;
    case 'POR_UNIDADE':
      return `${formatMoeda(valor)} por unidade`;
    case 'PERCENTUAL_VENDA':
      return `${formatQuantidade(fracaoParaPercentual(valor))}% da venda`;
  }
}

/**
 * Nomes que lembram o trabalho da dona (FE-78): o trabalho entra pelo valor da
 * sua hora, e uma conta do mês com esse nome cobraria duas vezes. Compara sem
 * acento e sem maiúscula, por **palavra inteira**: "meu" não pega "Comunicação"
 * nem "Fermento", e "Luz" não pega nada. Plural e "pro labore" com ou sem
 * hífen também valem.
 */
const NOMES_DO_SEU_TRABALHO =
  /\b(salarios?|pro[\s-]?labores?|retiradas?|meus?|minhas?)\b/;

export function lembraSeuTrabalho(descricao: string) {
  return NOMES_DO_SEU_TRABALHO.test(normalizarTexto(descricao));
}

export const AVISO_COBRANCA_DUPLA =
  'Seu trabalho agora entra pelo valor da sua hora. Tire esta conta para não cobrar duas vezes.';
