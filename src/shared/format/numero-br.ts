import { z } from 'zod';
import { normalizarEspacos } from './texto';

// Leitura de números digitados (docs/business-rules.md#leitura-de-números-digitados).
// O mobile troca `,` por `.` e usa `double.tryParse` (`_parseDouble` de
// insumos_page.dart, `_parseBR` de calculo_real_screen.dart). A web aceita também
// o separador de milhar: com vírgula, os pontos são milhar; sem vírgula, o ponto é
// o decimal, como no mobile.
const COM_VIRGULA = /^-?(?:\d{1,3}(?:\.\d{3})+|\d*),\d*$/;
const SEM_VIRGULA = /^-?\d*\.?\d*$/;
const SO_DIGITOS = /^\d+$/;

/**
 * `1.234,56`, `1234,56` e `1234.56` viram `1234.56`. Vazio, letras ou separadores
 * fora do lugar (`1,2,3`, `1.23,4`) viram `null`: o schema decide a mensagem.
 */
export function parseNumeroBR(texto: string | null | undefined): number | null {
  const limpo = texto?.trim() ?? '';

  // Só sinal ou só separador ("-", ",", ".") não é número.
  if (!/\d/.test(limpo)) return null;

  let normalizado: string;

  if (COM_VIRGULA.test(limpo)) {
    normalizado = limpo.replaceAll('.', '').replace(',', '.');
  } else if (SEM_VIRGULA.test(limpo)) {
    normalizado = limpo;
  } else {
    return null;
  }

  const numero = Number(normalizado);

  // `Number('-0')` é -0; a tela não distingue.
  return Number.isFinite(numero) ? numero + 0 : null;
}

/** Rendimento, lotes, quantidade vendida e volume: só dígitos. */
export function parseInteiroBR(
  texto: string | null | undefined,
): number | null {
  const limpo = texto?.trim() ?? '';

  return SO_DIGITOS.test(limpo) ? Number(limpo) : null;
}

const editaveis = new Map<string, Intl.NumberFormat>();

function formatadorEditavel(casas: number | undefined) {
  const chave = String(casas);
  let atual = editaveis.get(chave);

  if (!atual) {
    atual = new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: casas ?? 0,
      // Sem `casas`, não arredonda o que a pessoa digitou ou o que veio da API.
      maximumFractionDigits: casas ?? 10,
    });
    editaveis.set(chave, atual);
  }

  return atual;
}

/**
 * Valor que volta para dentro de um campo: `1234.56` vira `1.234,56` e `3000`
 * vira `3000` (sem milhar, que o ponto sem vírgula é decimal). Sem valor,
 * devolve `''` (campo vazio, e não `—`). `casas` fixa as decimais (2 no dinheiro).
 */
export function formatNumeroEditavel(
  valor: number | null | undefined,
  casas?: number,
) {
  if (valor === null || valor === undefined || !Number.isFinite(valor)) {
    return '';
  }

  const texto = normalizarEspacos(formatadorEditavel(casas).format(valor + 0));

  // Sem vírgula, `parseNumeroBR` lê o ponto como decimal (`1.000` seria 1):
  // inteiros saem sem o separador de milhar, para o campo devolver o mesmo número.
  return texto.includes(',') ? texto : texto.replaceAll('.', '');
}

type SchemaNumerico = z.ZodType<unknown, number>;

/**
 * Campo numérico obrigatório: recebe o texto digitado e entrega o número ao
 * `schema`. Vazio ou inválido chega ao `schema` como valor ausente, e a mensagem
 * é a do `error` do `z.number()`:
 *
 * ```ts
 * numeroBR(z.number({ error: 'Informe um valor maior que zero' }).positive('Informe um valor maior que zero'))
 * ```
 */
export function numeroBR<S extends SchemaNumerico>(schema: S) {
  return z
    .string()
    .transform((texto) => parseNumeroBR(texto) ?? undefined)
    .pipe(schema);
}

/**
 * Campo numérico opcional: vazio vira `undefined` (não é enviado) e texto
 * inválido falha no `schema`, com a mensagem do `error` do `z.number()`.
 */
export function numeroBROpcional<S extends SchemaNumerico>(schema: S) {
  return z
    .string()
    .transform((texto) =>
      texto.trim() === '' ? undefined : (parseNumeroBR(texto) ?? Number.NaN),
    )
    .pipe(schema.optional());
}

/** Campo inteiro obrigatório (rendimento, lotes, volume): só dígitos. */
export function inteiroBR<S extends SchemaNumerico>(schema: S) {
  return z
    .string()
    .transform((texto) => parseInteiroBR(texto) ?? undefined)
    .pipe(schema);
}
