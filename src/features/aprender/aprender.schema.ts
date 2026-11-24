import { z } from 'zod';

export const ASSUNTOS = ['custos', 'preco', 'vendas', 'estoque'] as const;

export type Assunto = (typeof ASSUNTOS)[number];

export const LIMITES = {
  curto: { caracteres: 140, frases: 1 },
  explicacao: { caracteres: 360, frases: 3 },
  porQueImporta: { caracteres: 160, frases: 1 },
} as const;

/** Conta as frases pelo ponto final, de interrogação ou de exclamação. */
export function contarFrases(texto: string): number {
  return texto.match(/[.!?](\s|$)/g)?.length ?? 0;
}

function textoLimitado(campo: keyof typeof LIMITES) {
  const { caracteres, frases } = LIMITES[campo];
  return z
    .string()
    .trim()
    .min(1)
    .max(caracteres)
    .refine((texto) => contarFrases(texto) <= frases, {
      message: `Use no máximo ${frases} ${frases === 1 ? 'frase' : 'frases'}`,
    });
}

const ID_KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export const termoSchema = z.object({
  id: z.string().regex(ID_KEBAB, 'Use kebab-case'),
  titulo: z.string().trim().min(1),
  assunto: z.enum(ASSUNTOS),
  sinonimos: z.array(z.string().trim().min(1)),
  curto: textoLimitado('curto'),
  explicacao: textoLimitado('explicacao'),
  porQueImporta: textoLimitado('porQueImporta'),
  acao: z
    .object({
      rotulo: z.string().trim().min(1),
      href: z.string().startsWith('/'),
    })
    .optional(),
  relacionados: z.array(z.string().regex(ID_KEBAB)),
});

/**
 * Exemplo com os números da pessoa (FE-65): função pura que recebe o que a tela
 * já carregou e devolve a frase do bloco "No seu caso", ou `null` quando faltam
 * dados (aí o bloco não aparece).
 */
export type Exemplo<Dados> = (dados: Dados) => string | null;

/**
 * O termo da base. O `exemplo` fica fora do `termoSchema` (é uma função, e o
 * schema confere só o texto); o tipo dos dados de cada termo vem do `exemplo`.
 */
export type Termo = z.infer<typeof termoSchema> & {
  exemplo?: Exemplo<never>;
};

/**
 * Declara um termo, mantendo o `id` literal (para o tipo `TermoId`) e o tipo dos
 * dados do `exemplo` (para o `<Termo dados>`). Valida o texto com o schema em
 * desenvolvimento e nos testes; no build de produção só devolve o termo.
 */
export function definirTermo<const Id extends string, Dados = never>(
  termo: z.infer<typeof termoSchema> & { id: Id; exemplo?: Exemplo<Dados> },
): z.infer<typeof termoSchema> & { id: Id; exemplo?: Exemplo<Dados> } {
  if (process.env.NODE_ENV !== 'production') {
    termoSchema.parse(termo);
  }
  return termo;
}
