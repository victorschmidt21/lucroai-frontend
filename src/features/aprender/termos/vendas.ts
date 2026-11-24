import { definirTermo } from '../aprender.schema';
import {
  exemploFaturamento,
  exemploLucroReal,
  exemploParaPagarAsContas,
  exemploSobrouPraVoce,
} from '../exemplos';

export const TERMOS_VENDAS = [
  definirTermo({
    id: 'faturamento',
    exemplo: exemploFaturamento,
    titulo: 'Faturamento',
    assunto: 'vendas',
    sinonimos: ['vendi', 'quanto vendeu', 'quanto entrou', 'vendas do mês'],
    curto: 'Tudo o que entrou de vendas, antes de pagar os custos.',
    explicacao:
      'Faturamento não é lucro. Do que entrou, uma parte paga os ingredientes, as contas e as taxas; só o resto é seu.',
    porQueImporta:
      'Olhar só o faturamento dá a impressão de ganhar mais do que ganha.',
    acao: { rotulo: 'Ver Vendas', href: '/vendas' },
    relacionados: ['sobrou-pra-voce', 'lucro-real'],
  }),
  definirTermo({
    id: 'lucro-real',
    exemplo: exemploLucroReal,
    titulo: 'Lucro real da venda',
    assunto: 'vendas',
    sinonimos: ['lucro da venda', 'quanto sobrou na venda'],
    curto:
      'O que sobrou de verdade numa venda, já descontados o custo e a taxa do canal.',
    explicacao:
      'O app usa o custo do produto no dia da venda e a taxa do canal onde ela aconteceu.',
    porQueImporta:
      'Mostra quais vendas valem a pena e quais quase não deixam nada.',
    acao: { rotulo: 'Ver Vendas', href: '/vendas' },
    relacionados: ['sobrou-pra-voce', 'taxa-do-canal', 'margem'],
  }),
  definirTermo({
    id: 'sobrou-pra-voce',
    exemplo: exemploSobrouPraVoce,
    titulo: 'Sobrou pra você',
    assunto: 'vendas',
    sinonimos: ['lucro', 'lucro do mês', 'lucro líquido'],
    curto:
      'O lucro do mês: o que as vendas deixaram depois de pagar o custo de cada produto vendido.',
    explicacao:
      'Somamos o lucro real de cada venda concluída no mês. As vendas pendentes e canceladas ficam de fora.',
    porQueImporta: 'É o número que diz se o mês está valendo a pena.',
    acao: { rotulo: 'Ir para o Início', href: '/' },
    relacionados: ['lucro-real', 'faturamento', 'para-pagar-as-contas'],
  }),
  definirTermo({
    id: 'para-pagar-as-contas',
    exemplo: exemploParaPagarAsContas,
    titulo: 'Para pagar as contas do mês',
    assunto: 'vendas',
    sinonimos: ['ponto de equilíbrio', 'meta do mês', 'quanto preciso vender'],
    curto:
      'Quanto vender no mês para cobrir as contas do mês; daí em diante, é lucro.',
    explicacao:
      'O app divide as contas do mês pela parte de cada venda que sobra depois do custo dos produtos. O resultado é quanto você precisa vender.',
    porQueImporta:
      'Saber esse valor ajuda a planejar a semana e as encomendas.',
    acao: { rotulo: 'Ir para o Início', href: '/' },
    relacionados: ['contas-do-mes', 'sobrou-pra-voce'],
  }),
];
