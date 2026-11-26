import { z } from 'zod';
import type {
  CreateReceitaBody,
  Receita,
  UpdateReceitaBody,
} from '@/shared/api/contracts/recipe';
import { unidadeMedidaSchema } from '@/shared/api/contracts/enums';
import { ApiError } from '@/shared/api/errors';
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
const RECEITA_REPETIDA = 'Receita repetida';

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
  /** `false`: só vai dentro de outras receitas, sem preço (BE-39). */
  vendavel: z.boolean(),
  /** Receitas usadas dentro desta (BE-39), um nível só. */
  receitas: z
    .array(
      z.object({
        receita_id: z.number().int().positive(),
        /** Na unidade do rendimento da receita usada; `@IsPositive` no backend. */
        quantidade: numeroBR(z.number({ error: INVALIDO }).positive(INVALIDO)),
      }),
    )
    // O diálogo só oferece receitas fora desta; isto é a garantia final.
    .superRefine((receitas, ctx) => {
      const vistas = new Set<number>();
      receitas.forEach(({ receita_id }, indice) => {
        if (vistas.has(receita_id)) {
          ctx.addIssue({
            code: 'custom',
            message: RECEITA_REPETIDA,
            path: [indice, 'receita_id'],
          });
        }
        vistas.add(receita_id);
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
  vendavel: true,
  receitas: [],
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
    vendavel: receita.vendavel,
    receitas: receita.receitas.map((item) => ({
      receita_id: item.receitaId,
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
    vendavel: values.vendavel,
    insumos: values.insumos,
    receitas: values.receitas,
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

/** Diálogo "Adicionar receita": receita escolhida e quantidade > 0. */
export const novaReceitaSchema = z.object({
  receita_id: z
    .string({ error: OBRIGATORIO })
    .regex(/^\d+$/, OBRIGATORIO)
    .transform(Number),
  quantidade: numeroBR(z.number({ error: OBRIGATORIO }).positive(OBRIGATORIO)),
});

export type NovaReceitaInput = z.input<typeof novaReceitaSchema>;

const MENSAGENS_DOS_ERROS_DA_RECEITA: Record<string, string> = {
  RECEITA_USA_ELA_MESMA: 'Uma receita não pode ir dentro dela mesma.',
  RECEITA_DENTRO_DE_RECEITA_COM_RECEITA:
    'Só dá para pôr dentro uma receita feita só de ingredientes. E uma receita que já vai dentro de outra não pode levar receitas.',
  // No formulário, o 409 só vem da troca da unidade do rendimento (BE-39).
  RECEITA_EM_USO:
    'Esta receita já vai dentro de outra, então a unidade do rendimento não pode mudar.',
};

/**
 * Troca a mensagem dos erros da receita dentro de receita (BE-39) por uma em
 * linguagem simples, decidindo pelo `code`. Os outros erros passam como estão.
 */
export function traduzirErroDaReceita(error: unknown): unknown {
  if (!(error instanceof ApiError) || !error.code) return error;
  const mensagem = MENSAGENS_DOS_ERROS_DA_RECEITA[error.code];
  if (!mensagem) return error;
  return new ApiError({
    statusCode: error.statusCode,
    message: mensagem,
    mensagens: error.mensagens,
    code: error.code,
    details: error.details,
  });
}
