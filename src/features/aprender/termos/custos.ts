import { definirTermo } from '../aprender.schema';
import {
  exemploContasDoMes,
  exemploCustoPorUnidade,
  exemploDivisaoDasContas,
  exemploFornadasPorMes,
  exemploRendimento,
} from '../exemplos';

export const TERMOS_CUSTOS = [
  definirTermo({
    id: 'custo-da-receita',
    titulo: 'Custo da receita',
    assunto: 'custos',
    sinonimos: ['custo', 'gasto', 'quanto gasta'],
    curto:
      'Tudo o que uma receita gasta: ingredientes, embalagem, perdas e uma parte das contas do mês.',
    explicacao:
      'Somamos os ingredientes, a embalagem, as perdas e a parte do gás, da luz e das outras contas que a receita usa. É o mínimo que o preço precisa pagar.',
    porQueImporta: 'Se o preço fica abaixo do custo, você paga para vender.',
    acao: { rotulo: 'Ver Receitas', href: '/receitas' },
    relacionados: [
      'rendimento',
      'custo-por-unidade',
      'ficha-tecnica',
      'contas-do-mes',
    ],
  }),
  definirTermo({
    id: 'rendimento',
    exemplo: exemploRendimento,
    titulo: 'Rendimento',
    assunto: 'custos',
    sinonimos: ['rende', 'quantas unidades', 'porções'],
    curto: 'Quantas unidades uma receita faz.',
    explicacao:
      'Se a massa dá 12 potes, o rendimento é 12. O custo da receita é dividido pelo rendimento para achar o custo de cada unidade.',
    porQueImporta:
      'Rendimento errado deixa o custo de cada unidade errado também.',
    acao: { rotulo: 'Ver Receitas', href: '/receitas' },
    relacionados: ['custo-da-receita', 'custo-por-unidade'],
  }),
  definirTermo({
    id: 'custo-por-unidade',
    exemplo: exemploCustoPorUnidade,
    titulo: 'Custo de 1 unidade',
    assunto: 'custos',
    sinonimos: ['custo unitário', 'quanto custa cada'],
    curto: 'Quanto custa fazer uma unidade do produto.',
    explicacao:
      'É o custo da receita dividido pelo rendimento, mais a embalagem e o que se perde. É desse número que sai o preço.',
    porQueImporta:
      'Saber o custo de cada unidade evita vender no prejuízo sem perceber.',
    acao: { rotulo: 'Ver Receitas', href: '/receitas' },
    relacionados: ['custo-da-receita', 'rendimento', 'preco-sugerido'],
  }),
  definirTermo({
    id: 'ficha-tecnica',
    titulo: 'Ficha técnica',
    assunto: 'custos',
    sinonimos: ['lista de ingredientes', 'receita', 'quantidades'],
    curto: 'A lista do que vai na receita, com as quantidades.',
    explicacao:
      'Cada ingrediente da ficha entra no custo pelo preço que você pagou. Quanto mais certa a quantidade, mais certo o preço.',
    porQueImporta:
      'Ingrediente esquecido na ficha é custo que o preço não paga.',
    acao: { rotulo: 'Ver Receitas', href: '/receitas' },
    relacionados: ['custo-da-receita', 'embalagem', 'custo-medio'],
  }),
  definirTermo({
    id: 'embalagem',
    titulo: 'Embalagem',
    assunto: 'custos',
    sinonimos: ['pote', 'caixa', 'saquinho', 'fita', 'etiqueta'],
    curto: 'Pote, caixa, fita e tudo o que embala o produto.',
    explicacao:
      'Cadastre a embalagem como ingrediente e coloque na receita quanto vai em cada unidade. Ela entra no custo como qualquer ingrediente.',
    porQueImporta: 'Embalagem esquecida é lucro que some sem você ver.',
    acao: { rotulo: 'Ver Ingredientes', href: '/insumos' },
    relacionados: ['ficha-tecnica', 'custo-por-unidade'],
  }),
  definirTermo({
    id: 'perda',
    titulo: 'Perda',
    assunto: 'custos',
    sinonimos: ['desperdício', 'quebra', 'sobra na tigela'],
    curto:
      'O que se perde na produção: massa na tigela, doce que quebra, bolo que não sai perfeito.',
    explicacao:
      'Você informa a perda em porcentagem na receita. O app aumenta o custo de cada unidade para o preço cobrir o que não vira produto.',
    porQueImporta:
      'Sem contar a perda, cada fornada custa mais do que o app mostra.',
    acao: { rotulo: 'Ver Receitas', href: '/receitas' },
    relacionados: ['custo-por-unidade', 'ficha-tecnica'],
  }),
  definirTermo({
    id: 'contas-do-mes',
    exemplo: exemploContasDoMes,
    titulo: 'Contas do mês',
    assunto: 'custos',
    sinonimos: [
      'gastos indiretos',
      'gastos fixos',
      'custos da casa',
      'despesas',
      'gás',
      'luz',
      'aluguel',
    ],
    curto:
      'Contas que você paga todo mês para produzir, mesmo sem vender: gás, luz, internet, aluguel, DAS.',
    explicacao:
      'Elas não entram numa receita só, mas todo produto precisa ajudar a pagar. O app divide essas contas entre as fornadas do mês.',
    porQueImporta:
      'Quem esquece as contas do mês acha que lucra mais do que lucra.',
    acao: { rotulo: 'Ver Contas do mês', href: '/gastos-indiretos' },
    relacionados: ['divisao-das-contas', 'das-do-mei', 'para-pagar-as-contas'],
  }),
  definirTermo({
    id: 'divisao-das-contas',
    exemplo: exemploDivisaoDasContas,
    titulo: 'Divisão das contas do mês',
    assunto: 'custos',
    sinonimos: ['rateio', 'rateado', 'dividir as contas'],
    curto: 'Como o app reparte as contas do mês entre o que você produz.',
    explicacao:
      'O total das contas é dividido pelas fornadas (ou minutos de forno) que cabem no mês. Cada fornada leva a sua parte, e cada unidade leva a parte da fornada dela.',
    porQueImporta:
      'É assim que o gás e a luz entram no preço sem você fazer conta.',
    acao: { rotulo: 'Ver Ajustes de preço', href: '/configuracoes' },
    relacionados: ['contas-do-mes', 'fornadas-por-mes', 'fornada'],
  }),
  definirTermo({
    id: 'fornadas-por-mes',
    exemplo: exemploFornadasPorMes,
    titulo: 'Fornadas por mês',
    assunto: 'custos',
    sinonimos: ['capacidade', 'capacidade mensal', 'minutos de forno'],
    curto:
      'Quantas fornadas (ou minutos de forno) você consegue usar num mês comum.',
    explicacao:
      'O app usa esse número para dividir as contas do mês. Pense num mês normal, nem o mais cheio nem o mais parado. Uma estimativa já serve.',
    porQueImporta:
      'Número alto demais deixa o custo baixo demais, e o preço também.',
    acao: { rotulo: 'Ver Ajustes de preço', href: '/configuracoes' },
    relacionados: ['divisao-das-contas', 'fornada'],
  }),
  definirTermo({
    id: 'custo-medio',
    titulo: 'Custo médio do ingrediente',
    assunto: 'custos',
    sinonimos: ['preço médio', 'média de preço'],
    curto:
      'O preço que o app usa quando você comprou o mesmo ingrediente por valores diferentes.',
    explicacao:
      'A cada compra, o app mistura o preço novo com o do que ainda está no estoque, pesando pela quantidade.',
    porQueImporta: 'Assim o custo acompanha o que você pagou de verdade.',
    acao: { rotulo: 'Ver Estoque', href: '/estoque' },
    relacionados: ['estoque-negativo', 'ficha-tecnica'],
  }),
  definirTermo({
    id: 'imposto',
    titulo: 'Imposto sobre as vendas',
    assunto: 'custos',
    sinonimos: ['imposto', 'nota fiscal', 'simples'],
    curto: 'Uma porcentagem do preço guardada para impostos sobre a venda.',
    explicacao:
      'Se você é informal ou MEI, deixe 0: o DAS do MEI entra em Contas do mês. Se paga imposto sobre cada venda, informe a porcentagem.',
    porQueImporta: 'Imposto fora do preço sai do seu lucro.',
    acao: { rotulo: 'Ver Ajustes de preço', href: '/configuracoes' },
    relacionados: ['das-do-mei', 'preco-sugerido'],
  }),
  definirTermo({
    id: 'das-do-mei',
    titulo: 'DAS do MEI',
    assunto: 'custos',
    sinonimos: ['MEI', 'boleto do MEI', 'guia do MEI'],
    curto: 'O boleto que o MEI paga todo mês.',
    explicacao:
      'Como é um valor fixo por mês, cadastre em Contas do mês. Ele é dividido entre as fornadas como o gás e a luz.',
    porQueImporta:
      'Esquecer o DAS é deixar de cobrar uma conta que chega todo mês.',
    acao: { rotulo: 'Ver Contas do mês', href: '/gastos-indiretos' },
    relacionados: ['contas-do-mes', 'imposto'],
  }),
];
