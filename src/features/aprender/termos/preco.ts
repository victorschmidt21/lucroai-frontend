import { definirTermo } from '../aprender.schema';
import {
  exemploMargem,
  exemploPrecoSugerido,
  exemploTaxaDoCanal,
} from '../exemplos';

export const TERMOS_PRECO = [
  definirTermo({
    id: 'preco-sugerido',
    exemplo: exemploPrecoSugerido,
    titulo: 'Preço sugerido',
    assunto: 'preco',
    sinonimos: ['preço ideal', 'quanto cobrar', 'preço certo'],
    curto: 'Quanto cobrar para pagar tudo e sobrar o lucro que você escolheu.',
    explicacao:
      'O app parte do custo de 1 unidade e reserva no preço o imposto, a taxa do canal e o seu lucro. Cada canal de venda tem o seu preço sugerido.',
    porQueImporta:
      'É um ponto de partida: você pode cobrar mais, mas não menos que o custo.',
    acao: { rotulo: 'Ver Receitas', href: '/receitas' },
    relacionados: [
      'custo-por-unidade',
      'lucro-desejado',
      'taxa-do-canal',
      'canal-de-venda',
    ],
  }),
  definirTermo({
    id: 'lucro-desejado',
    titulo: 'Lucro que você quer',
    assunto: 'preco',
    sinonimos: ['lucro padrão', 'quanto quero ganhar', 'porcentagem de lucro'],
    curto: 'A parte do preço que você quer que fique com você.',
    explicacao:
      'Você escolhe nos Ajustes de preço e pode mudar em cada receita. Lucro de 30% quer dizer que, de cada R$ 100 vendidos, R$ 30 ficam com você.',
    porQueImporta:
      'É você quem decide o lucro; o app calcula o preço para chegar nele.',
    acao: { rotulo: 'Ver Ajustes de preço', href: '/configuracoes' },
    relacionados: ['preco-sugerido', 'margem'],
  }),
  definirTermo({
    id: 'margem',
    exemplo: exemploMargem,
    titulo: 'Margem',
    assunto: 'preco',
    sinonimos: ['lucro em porcentagem', 'sobra', 'quanto fica'],
    curto:
      'A parte do preço que fica com você depois de pagar o que o produto gastou.',
    explicacao:
      'É o lucro dito em porcentagem do preço. Margem de 29% quer dizer que, de cada R$ 100 vendidos, R$ 29 ficam com você.',
    porQueImporta:
      'Margem baixa deixa pouco espaço quando um ingrediente fica mais caro.',
    acao: { rotulo: 'Simular outro preço', href: '/simulacao' },
    relacionados: ['lucro-desejado', 'lucro-real'],
  }),
  definirTermo({
    id: 'canal-de-venda',
    titulo: 'Canal de venda',
    assunto: 'preco',
    sinonimos: ['onde vendeu', 'forma de venda', 'iFood', 'WhatsApp', 'balcão'],
    curto: 'Onde a venda acontece: balcão, WhatsApp, app de entrega.',
    explicacao:
      'Cada canal pode ter uma taxa diferente, por isso o mesmo bolo tem um preço sugerido para cada canal.',
    porQueImporta:
      'Vender pelo mesmo preço em todo canal pode dar prejuízo no app de entrega.',
    acao: { rotulo: 'Ver Ajustes de preço', href: '/configuracoes' },
    relacionados: ['taxa-do-canal', 'preco-sugerido'],
  }),
  definirTermo({
    id: 'taxa-do-canal',
    exemplo: exemploTaxaDoCanal,
    titulo: 'Taxa do canal',
    assunto: 'preco',
    sinonimos: ['comissão', 'taxa do iFood', 'taxa da maquininha'],
    curto: 'O que o app de entrega ou a maquininha cobra de cada venda.',
    explicacao:
      'É uma porcentagem do preço que fica com eles. O app já reserva essa parte no preço sugerido do canal.',
    porQueImporta: 'Taxa esquecida é o lucro que fica com o app de entrega.',
    acao: { rotulo: 'Ver Ajustes de preço', href: '/configuracoes' },
    relacionados: ['canal-de-venda', 'preco-sugerido'],
  }),
  definirTermo({
    id: 'preco-que-precisa-subir',
    titulo: 'Preço que precisa subir',
    assunto: 'preco',
    sinonimos: ['preço defasado', 'ingrediente mais caro', 'aumento'],
    curto:
      'Quando um ingrediente fica mais caro, o preço antigo passa a deixar menos lucro.',
    explicacao:
      'O app compara o custo de hoje com o custo de quando o preço foi definido e avisa quando a diferença come o seu lucro.',
    porQueImporta:
      'Repassar o aumento cedo evita trabalhar de graça sem perceber.',
    acao: { rotulo: 'Ver Receitas', href: '/receitas' },
    relacionados: ['custo-medio', 'preco-sugerido', 'margem'],
  }),
];
