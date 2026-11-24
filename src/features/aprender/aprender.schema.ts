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

export type Termo = z.infer<typeof termoSchema>;

/**
 * Declara um termo, mantendo o `id` literal (para o tipo `TermoId`).
 * Valida com o schema em desenvolvimento e nos testes; no build de produção só devolve o termo.
 */
export function definirTermo<const Id extends string>(
  termo: Termo & { id: Id },
): Termo & { id: Id } {
  if (process.env.NODE_ENV !== 'production') {
    termoSchema.parse(termo);
  }
  return termo;
}
