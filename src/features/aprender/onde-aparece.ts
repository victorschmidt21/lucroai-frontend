import type { TermoId } from './termos';

type TelaComTermos = {
  nome: string;
  href: string;
  termos: readonly TermoId[];
};

/**
 * As telas que têm a Pitada de cada termo (tabela da FE-64 em
 * docs/aprender.md#pitada-no-termo), para o "Onde aparece no app" da página do
 * termo. Ao pôr um `<Termo>` numa tela nova, acrescente aqui.
 */
const TELAS: readonly TelaComTermos[] = [
  {
    nome: 'Início',
    href: '/',
    termos: ['sobrou-pra-voce', 'faturamento', 'para-pagar-as-contas'],
  },
  {
    nome: 'Receitas, na página de cada receita',
    href: '/receitas',
    termos: [
      'custo-por-unidade',
      'ficha-tecnica',
      'divisao-das-contas',
      'embalagem',
      'perda',
      'rendimento',
      'lucro-desejado',
      'preco-sugerido',
      'canal-de-venda',
    ],
  },
  {
    nome: 'Nova receita',
    href: '/receitas/nova',
    termos: [
      'rendimento',
      'ficha-tecnica',
      'divisao-das-contas',
      'embalagem',
      'perda',
      'lucro-desejado',
    ],
  },
  {
    nome: 'Simular outro preço',
    href: '/simulacao',
    termos: ['margem', 'custo-por-unidade', 'preco-sugerido'],
  },
  {
    nome: 'Custos',
    href: '/custos',
    termos: ['contas-do-mes', 'custo-da-receita'],
  },
  {
    nome: 'Vendas',
    href: '/vendas',
    termos: ['canal-de-venda', 'lucro-real'],
  },
  {
    nome: 'Contas do mês',
    href: '/gastos-indiretos',
    termos: ['das-do-mei', 'contas-do-mes'],
  },
  {
    nome: 'Ajustes de preço',
    href: '/configuracoes',
    termos: [
      'divisao-das-contas',
      'fornadas-por-mes',
      'lucro-desejado',
      'imposto',
      'taxa-do-canal',
    ],
  },
  {
    nome: 'Ingredientes',
    href: '/insumos',
    termos: ['estoque-negativo', 'custo-medio'],
  },
  { nome: 'Estoque', href: '/estoque', termos: ['estoque-negativo'] },
  {
    nome: 'Fornadas',
    href: '/producoes',
    termos: ['fornada', 'divisao-das-contas'],
  },
];

/** As telas onde o termo aparece com a Pitada, na ordem do menu. */
export function telasDoTermo(id: string): { nome: string; href: string }[] {
  return TELAS.filter((tela) => tela.termos.some((termo) => termo === id)).map(
    ({ nome, href }) => ({ nome, href }),
  );
}
