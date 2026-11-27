import { z } from 'zod';
import { isTermoId } from './termos';

/** Limites dos guias (FE-67), conferidos pelo schema. */
export const LIMITES_GUIA = { passos: 5, texto: 160 } as const;

const ID_KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export const passoDoGuiaSchema = z.object({
  /** O que fazer, numa frase curta. */
  texto: z.string().trim().min(1).max(LIMITES_GUIA.texto),
  /** Termo da base que o passo explica, com link para a página dele. */
  termo: z
    .string()
    .refine(isTermoId, { message: 'Termo inexistente' })
    .optional(),
  /** A tela onde o passo é feito. */
  link: z.object({
    rotulo: z.string().trim().min(1),
    href: z.string().startsWith('/'),
  }),
});

export const guiaSchema = z.object({
  id: z.string().regex(ID_KEBAB, 'Use kebab-case'),
  titulo: z.string().trim().min(1),
  /**
   * Palavras que ela usaria na busca do Aprender (FE-78), além do título.
   * Não aparecem na tela.
   */
  palavras: z.array(z.string().trim().min(1)).optional(),
  passos: z.array(passoDoGuiaSchema).min(1).max(LIMITES_GUIA.passos),
});

export type Guia = z.infer<typeof guiaSchema>;
export type PassoDoGuia = z.infer<typeof passoDoGuiaSchema>;

/**
 * Guias curtos da página Aprender (FE-67): de 3 a 5 passos que levam à tela
 * certa. Conteúdo como código, validado pelo `guias.test.ts`.
 */
export const GUIAS: readonly Guia[] = [
  {
    id: 'preco-do-bolo',
    titulo: 'Como chegar no preço do seu bolo',
    passos: [
      {
        texto:
          'Cadastre os ingredientes e a embalagem, com o preço que você pagou.',
        termo: 'embalagem',
        link: { rotulo: 'Ver Ingredientes', href: '/insumos' },
      },
      {
        texto: 'Anote as contas do mês: gás, luz, internet, DAS do MEI.',
        termo: 'contas-do-mes',
        link: { rotulo: 'Ver Contas do mês', href: '/gastos-indiretos' },
      },
      {
        texto: 'Diga quantas fornadas cabem no seu mês.',
        termo: 'fornadas-por-mes',
        link: { rotulo: 'Ver Ajustes de preço', href: '/configuracoes' },
      },
      {
        texto:
          'Crie a receita com a ficha técnica: os ingredientes e quanto vai de cada um.',
        termo: 'ficha-tecnica',
        link: { rotulo: 'Criar receita', href: '/receitas/nova' },
      },
      {
        texto: 'Abra a receita e veja o preço sugerido de cada canal de venda.',
        termo: 'preco-sugerido',
        link: { rotulo: 'Ver Receitas', href: '/receitas' },
      },
    ],
  },
  {
    id: 'registrar-fornada',
    titulo: 'Como registrar uma fornada',
    passos: [
      {
        texto: 'Abra Fornadas e toque em “Nova fornada”.',
        termo: 'fornada',
        link: { rotulo: 'Ver Fornadas', href: '/producoes' },
      },
      {
        texto: 'Escolha a receita e quantos lotes você fez.',
        link: { rotulo: 'Anotar fornada', href: '/producoes?novo=1' },
      },
      {
        texto:
          'Confira na prévia quantas unidades saem e a parte das contas do mês que a fornada leva.',
        termo: 'divisao-das-contas',
        link: { rotulo: 'Anotar fornada', href: '/producoes?novo=1' },
      },
      {
        texto:
          'Salve. Os ingredientes de cada lote saem do Estoque: veja lá o que baixou.',
        link: { rotulo: 'Ver Estoque', href: '/estoque' },
      },
    ],
  },
  {
    id: 'ingrediente-mais-caro',
    titulo: 'O que fazer quando um ingrediente fica mais caro',
    passos: [
      {
        texto: 'Anote a compra em Ingredientes, com o preço novo.',
        termo: 'custo-medio',
        link: { rotulo: 'Ver Ingredientes', href: '/insumos' },
      },
      {
        texto:
          'Veja o aviso de preço que precisa subir: ele abre ao entrar no app e fica no sino do topo.',
        termo: 'preco-que-precisa-subir',
        link: { rotulo: 'Ir para o Início', href: '/' },
      },
      {
        texto: 'Abra a receita para ver o custo novo de 1 unidade.',
        termo: 'custo-por-unidade',
        link: { rotulo: 'Ver Receitas', href: '/receitas' },
      },
      {
        texto:
          'Ajuste o preço da receita, ou simule outro preço antes de mudar.',
        termo: 'margem',
        link: { rotulo: 'Simular outro preço', href: '/simulacao' },
      },
    ],
  },
  {
    id: 'cobrar-pelo-seu-trabalho',
    titulo: 'Como cobrar pelo seu trabalho',
    palavras: ['hora', 'valor da hora', 'salário', 'tempo', 'retirada'],
    passos: [
      {
        texto:
          'Tire seu salário das contas do mês: elas se dividem pelas fornadas, e não pelo tempo que você passa em cada receita.',
        termo: 'contas-do-mes',
        link: { rotulo: 'Ver Contas do mês', href: '/gastos-indiretos' },
      },
      {
        texto:
          'Diga quanto vale sua hora: quanto quer ganhar por mês, dividido pelas horas que passa produzindo.',
        link: { rotulo: 'Ver Ajustes de preço', href: '/configuracoes' },
      },
      {
        texto:
          'Na receita, conte o tempo em que você fica ocupada com o lote: preparar, mexer, montar, embalar. O forno sozinho não conta.',
        link: { rotulo: 'Ver Receitas', href: '/receitas' },
      },
      {
        texto:
          'Exemplo: com a hora a R$ 18,75, 40 minutos num lote de 50 brigadeiros somam R$ 0,25 em cada unidade.',
        termo: 'custo-por-unidade',
        link: { rotulo: 'Ver Receitas', href: '/receitas' },
      },
      {
        texto:
          'Seu trabalho é custo, não lucro: o lucro é o que sobra para o negócio depois de pagar tudo, inclusive você.',
        termo: 'lucro-desejado',
        link: { rotulo: 'Ver Ajustes de preço', href: '/configuracoes' },
      },
    ],
  },
];

const GUIAS_POR_ID = new Map(GUIAS.map((guia) => [guia.id, guia]));

export function buscarGuia(id: string): Guia | undefined {
  return GUIAS_POR_ID.get(id);
}
