// Primeiros passos no Início (FE-66, docs/aprender.md#primeiros-passos): os 5
// passos até o primeiro preço justo, com o `feito` derivado dos dados da conta
// (nada é marcado à mão).

/**
 * Capacidade mensal de uma empresa nova no backend (`CONFIGURACAO_CUSTOS_PADRAO`
 * do monolito, BE-24). A API não diz se a configuração foi salva pela pessoa,
 * então o passo 3 conta como feito quando a capacidade é diferente desta.
 */
export const CAPACIDADE_MENSAL_PADRAO = 40;

export type DadosDosPassos = {
  insumos: readonly unknown[];
  gastos: readonly { tipo: string }[];
  configuracao: { capacidadeMensal: number };
  receitas: readonly unknown[];
  vendas: readonly { status: string }[];
};

export type PassoInicial = {
  id: 'ingredientes' | 'contas' | 'fornadas' | 'receita' | 'venda';
  titulo: string;
  apoio: string;
  botao: string;
  href: string;
  feito: boolean;
};

export function passosIniciais(dados: DadosDosPassos): PassoInicial[] {
  return [
    {
      id: 'ingredientes',
      titulo: 'Cadastrar 3 ingredientes',
      apoio: 'Comece pelos que você mais usa.',
      botao: 'Adicionar ingrediente',
      href: '/insumos',
      feito: dados.insumos.length >= 3,
    },
    {
      id: 'contas',
      titulo: 'Anotar as contas do mês',
      apoio: 'Gás, luz, internet, DAS: o que você paga todo mês.',
      botao: 'Adicionar conta',
      href: '/gastos-indiretos',
      feito: dados.gastos.some((g) => g.tipo === 'MENSAL'),
    },
    {
      id: 'fornadas',
      titulo: 'Dizer quantas fornadas cabem no mês',
      apoio: 'Assim dividimos as contas do mês entre os produtos.',
      botao: 'Responder',
      href: '/configuracoes',
      feito: dados.configuracao.capacidadeMensal !== CAPACIDADE_MENSAL_PADRAO,
    },
    {
      id: 'receita',
      titulo: 'Criar a primeira receita',
      apoio: 'Você vai ver quanto custa e quanto cobrar.',
      botao: 'Criar receita',
      href: '/receitas/nova',
      feito: dados.receitas.length >= 1,
    },
    {
      id: 'venda',
      titulo: 'Anotar a primeira venda',
      apoio: 'Para ver quanto sobrou pra você.',
      botao: 'Anotar venda',
      href: '/vendas',
      feito: dados.vendas.some((v) => v.status === 'CONCLUIDA'),
    },
  ];
}
