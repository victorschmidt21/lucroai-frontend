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
// e `_showAddInsumoDialog` de receitas_page.dart; limites de `create-receita.dto.ts`
// e da ficha técnica do backend (`validarFichaTecnica`, BE-27).

const NOME_OBRIGATORIO = 'Informe o nome';
const NOME_LONGO = 'Use até 80 caracteres';
const OBRIGATORIO = 'Obrigatório';
const MAIOR_QUE_ZERO = 'Informe um valor maior que zero';
const VALOR_INVALIDO = 'Valor inválido';
export const PERCENTUAL_INVALIDO = 'Informe um percentual de 0 a 99';
const INVALIDO = 'Inválido';
const INSUMO_REPETIDO = 'Ingrediente repetido';

/** `@MaxLength(80)` de `create-receita.dto.ts`. */
export const NOME_MAX = 80;

/** `@Min(0.001)` da quantidade do item (`CreateItemReceitaDto`). */
const QUANTIDADE_MIN = 0.001;

/**
 * Perda e lucro em pontos percentuais, de 0 até menos de 100: com 100% não há
 * preço possível, e o backend recusa (fração de 0 até menos de 1).
 */
function percentualOpcional() {
  return numeroBROpcional(
    z
      .number({ error: PERCENTUAL_INVALIDO })
      .min(0, PERCENTUAL_INVALIDO)
      .lt(100, PERCENTUAL_INVALIDO),
  );
}

export const receitaFormSchema = z.object({
  nome: z.string().trim().min(1, NOME_OBRIGATORIO).max(NOME_MAX, NOME_LONGO),
  /** Unidades **boas** (vendáveis) por lote; o backend exige inteiro. */
  rendimento: inteiroBR(z.number({ error: OBRIGATORIO }).positive(OBRIGATORIO)),
  unidadeRendimento: unidadeMedidaSchema,
  /** Fornadas ou minutos de forno de 1 lote, conforme a configuração; > 0. */
  uso_por_lote: numeroBR(
    z.number({ error: MAIOR_QUE_ZERO }).positive(MAIOR_QUE_ZERO),
  ),
  /** Reais por unidade; vazio é 0. */
  embalagem_por_unidade: numeroBROpcional(
    z.number({ error: VALOR_INVALIDO }).min(0, VALOR_INVALIDO),
  ),
  /** Em pontos percentuais (`5`); vazio é 0. */
  perda_percentual: percentualOpcional(),
  /** Em pontos percentuais (`15`); vazio usa o lucro padrão da empresa. */
  lucro_percentual: percentualOpcional(),
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

/** A unidade padrão é `UN`, como no mobile; 1 lote ocupa 1 fornada (padrão do backend). */
export const receitaFormVazio: ReceitaFormInput = {
  nome: '',
  rendimento: '',
  unidadeRendimento: 'UN',
  uso_por_lote: '1',
  embalagem_por_unidade: '',
  perda_percentual: '',
  lucro_percentual: '',
  insumos: [],
};

/** Zero aparece vazio, como o campo de quem nunca preencheu. */
function campoOuVazio(valor: number) {
  return valor === 0 ? '' : formatNumeroEditavel(valor);
}

export function toReceitaFormInput(receita: Receita): ReceitaFormInput {
  return {
    nome: receita.nome,
    rendimento: String(receita.rendimento),
    unidadeRendimento: receita.unidadeRendimento,
    uso_por_lote: formatNumeroEditavel(receita.usoPorLote),
    embalagem_por_unidade: campoOuVazio(receita.embalagemPorUnidade),
    perda_percentual: campoOuVazio(
      fracaoParaPercentual(receita.perdaPercentual),
    ),
    // Omitido na resposta: a receita usa o lucro padrão da empresa.
    lucro_percentual:
      receita.lucroPercentual === undefined
        ? ''
        : formatNumeroEditavel(fracaoParaPercentual(receita.lucroPercentual)),
    insumos: receita.itens.map((item) => ({
      insumo_id: item.insumoId,
      quantidade: formatNumeroEditavel(item.quantidade),
    })),
  };
}

/**
 * Envia a ficha técnica inteira: vazio vira 0 (embalagem e perda) ou `null`
 * (lucro), que no `PUT` também volta ao lucro padrão da empresa. Os
 * percentuais vão como fração.
 */
export function toCreateReceitaBody(
  values: ReceitaFormValues,
): CreateReceitaBody {
  return {
    nome: values.nome,
    rendimento: values.rendimento,
    unidadeRendimento: values.unidadeRendimento,
    uso_por_lote: values.uso_por_lote,
    embalagem_por_unidade: values.embalagem_por_unidade ?? 0,
    perda_percentual: percentualParaFracao(values.perda_percentual ?? 0),
    lucro_percentual:
      values.lucro_percentual === undefined
        ? null
        : percentualParaFracao(values.lucro_percentual),
    insumos: values.insumos,
  };
}

/** O `PUT` aceita campos opcionais; a web envia todos, como no cadastro. */
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
