import { definirTermo } from '../aprender.schema';

export const TERMOS_ESTOQUE = [
  definirTermo({
    id: 'fornada',
    titulo: 'Fornada',
    assunto: 'estoque',
    sinonimos: ['produção', 'lote', 'assada'],
    curto: 'Uma ida ao forno.',
    explicacao:
      'Ao registrar uma fornada, o app tira os ingredientes do estoque, guarda os produtos prontos e soma a parte das contas do mês.',
    porQueImporta: 'Registrar as fornadas mantém o estoque e o custo certos.',
    acao: { rotulo: 'Ver Fornadas', href: '/producoes' },
    relacionados: [
      'fornadas-por-mes',
      'divisao-das-contas',
      'estoque-negativo',
    ],
  }),
  definirTermo({
    id: 'estoque-negativo',
    titulo: 'Estoque negativo',
    assunto: 'estoque',
    sinonimos: ['saldo negativo', 'estoque abaixo de zero'],
    curto: 'Quando o app registrou mais uso do que compra de um ingrediente.',
    explicacao:
      'Costuma ser uma compra que não foi anotada. Registre a compra para acertar o saldo e o custo.',
    porQueImporta:
      'Com estoque negativo, o custo médio fica errado e o preço também.',
    acao: { rotulo: 'Ver Estoque', href: '/estoque' },
    relacionados: ['custo-medio', 'fornada'],
  }),
];
