import { z } from 'zod';
import type { Insumo, UpdateInsumoBody } from '@/shared/api/contracts/catalog';
import { formatNumeroEditavel, numeroBR } from '@/shared/format/numero-br';
import { calcularCustoUnitario } from '../insumos.calculos';

// "Já sei que o preço mudou": a pessoa informa quanto custa hoje uma quantidade
// (como no cadastro), e a web envia o `precoMercado` por unidade do insumo
// (`PATCH /insumos/:id`, BE-29, `@Min(0)`). Como no cadastro, pede valor > 0.
const QUANTIDADE = 'Informe uma quantidade maior que zero';
const VALOR = 'Informe um valor maior que zero';

export const precoMercadoSchema = z.object({
  valor: numeroBR(z.number({ error: VALOR }).positive(VALOR)),
  quantidade: numeroBR(z.number({ error: QUANTIDADE }).positive(QUANTIDADE)),
});

export type PrecoMercadoInput = z.input<typeof precoMercadoSchema>;
export type PrecoMercadoValues = z.output<typeof precoMercadoSchema>;

/** Começa com a quantidade do último preço (a da última compra ou do cadastro). */
export function toPrecoMercadoInput(insumo: Insumo): PrecoMercadoInput {
  return {
    valor: '',
    quantidade: formatNumeroEditavel(insumo.quantidadeBaseCusto),
  };
}

/** Só o `precoMercado`: o custo médio e o estoque não mudam. */
export function toPrecoMercadoBody(
  values: PrecoMercadoValues,
): UpdateInsumoBody {
  return {
    precoMercado: calcularCustoUnitario(values.valor, values.quantidade),
  };
}

/** `null` apaga o preço informado: o preço de hoje volta ao da última compra. */
export const VOLTAR_AO_ULTIMO_CUSTO: UpdateInsumoBody = { precoMercado: null };
