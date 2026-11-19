import { z } from 'zod';
import type {
  CreateReceitaBody,
  Receita,
  UpdateReceitaBody,
} from '@/shared/api/contracts/recipe';
import { unidadeMedidaSchema } from '@/shared/api/contracts/enums';
import {
  formatNumeroEditavel,
  inteiroBR,
  numeroBR,
  numeroBROpcional,
} from '@/shared/format/numero-br';
import {
  fracaoParaPercentual,
  percentualParaFracao,
} from '@/shared/format/numero';

// docs/business-rules.md#receitas-formulário-e-custo. Origem: `_openReceitaForm`
// e `_showAddInsumoDialog` de receitas_page.dart; limites de `create-receita.dto.ts`.

const NOME_OBRIGATORIO = 'Informe o nome';
const NOME_LONGO = 'Use até 80 caracteres';
const OBRIGATORIO = 'Obrigatório';
const VALOR_INVALIDO = 'Valor inválido';
const INVALIDO = 'Inválido';
const INSUMO_REPETIDO = 'Insumo repetido';

/** `@MaxLength(80)` de `create-receita.dto.ts`. */
export const NOME_MAX = 80;

/** `@Min(0.001)` da quantidade do item (`CreateItemReceitaDto`). */
const QUANTIDADE_MIN = 0.001;

export const receitaFormSchema = z.object({
  nome: z.string().trim().min(1, NOME_OBRIGATORIO).max(NOME_MAX, NOME_LONGO),
  // O backend exige inteiro (`@IsInt @IsPositive`); o mobile aceitava decimal.
  rendimento: inteiroBR(z.number({ error: OBRIGATORIO }).positive(OBRIGATORIO)),
  unidadeRendimento: unidadeMedidaSchema,
  /** Em pontos percentuais (`60`); vazio não é enviado. */
  margem_lucro: numeroBROpcional(
    z.number({ error: VALOR_INVALIDO }).min(0, VALOR_INVALIDO),
  ),
  insumos: z
    .array(
      z.object({
        insumo_id: z.number().int().positive(),
        /** Na unidade do insumo. */
        quantidade: numeroBR(
          z.number({ error: INVALIDO }).min(QUANTIDADE_MIN, INVALIDO),
        ),
      }),
    )
    // O diálogo só oferece insumos fora da receita; isto é a garantia final.
    .superRefine((insumos, ctx) => {
      const vistos = new Set<number>();
      insumos.forEach(({ insumo_id }, indice) => {
        if (vistos.has(insumo_id)) {
          ctx.addIssue({
            code: 'custom',
            message: INSUMO_REPETIDO,
            path: [indice, 'insumo_id'],
          });
        }
        vistos.add(insumo_id);
      });
    }),
});

export type ReceitaFormInput = z.input<typeof receitaFormSchema>;
export type ReceitaFormValues = z.output<typeof receitaFormSchema>;

/** A unidade padrão é `UN`, como no mobile (`InsumoUnidadeMedida.unidades`). */
export const receitaFormVazio: ReceitaFormInput = {
  nome: '',
  rendimento: '',
  unidadeRendimento: 'UN',
  margem_lucro: '',
  insumos: [],
};

/** Margem `null`, ausente ou ≤ 0 aparece vazia (mobile: `(margemLucro ?? 0) <= 0`). */
export function margemParaCampo(margemLucro: number | undefined) {
  return margemLucro === undefined || margemLucro <= 0
    ? ''
    : formatNumeroEditavel(fracaoParaPercentual(margemLucro));
}

export function toReceitaFormInput(receita: Receita): ReceitaFormInput {
  return {
    nome: receita.nome,
    rendimento: String(receita.rendimento),
    unidadeRendimento: receita.unidadeRendimento,
    margem_lucro: margemParaCampo(receita.margemLucro),
    insumos: receita.itens.map((item) => ({
      insumo_id: item.insumoId,
      quantidade: formatNumeroEditavel(item.quantidade),
    })),
  };
}

export function toCreateReceitaBody(
  values: ReceitaFormValues,
): CreateReceitaBody {
  return {
    nome: values.nome,
    rendimento: values.rendimento,
    unidadeRendimento: values.unidadeRendimento,
    ...(values.margem_lucro === undefined
      ? {}
      : { margem_lucro: percentualParaFracao(values.margem_lucro) }),
    insumos: values.insumos,
  };
}

/**
 * O PUT aceita campos opcionais; a web envia todos, como o mobile. Margem vazia
 * não é enviada, e o backend mantém a salva (docs/api-integration.md, lacuna 21).
 */
export function toUpdateReceitaBody(
  values: ReceitaFormValues,
): UpdateReceitaBody {
  return toCreateReceitaBody(values);
}

/** Diálogo "Adicionar insumo": insumo escolhido e quantidade > 0. */
export const novoInsumoSchema = z.object({
  insumo_id: z
    .string({ error: OBRIGATORIO })
    .regex(/^\d+$/, OBRIGATORIO)
    .transform(Number),
  quantidade: numeroBR(
    z.number({ error: OBRIGATORIO }).min(QUANTIDADE_MIN, OBRIGATORIO),
  ),
});

export type NovoInsumoInput = z.input<typeof novoInsumoSchema>;
