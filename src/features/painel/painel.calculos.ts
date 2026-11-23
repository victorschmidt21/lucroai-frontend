import type { StatusVenda } from '@/shared/api/contracts/enums';
import type { ResumoVendas } from '@/shared/api/contracts/sales';
import { formatMoeda } from '@/shared/format/moeda';
import { isBaixoEstoque } from '@/shared/domain/estoque';
import { isFaturavel, totalDaVenda } from '@/shared/domain/vendas';
import {
  formatNumero,
  formatPercentual,
  fracaoParaPercentual,
} from '@/shared/format/numero';

/*
 * Painel (docs/business-rules.md#painel). Origem: dashboard_page.dart
 * (`_DashboardData.fromStates`, `_calculateVendaProfit`, `_buildMonthlyValues`,
 * `_buildMonthLabels`, `_buildTrendLabel` e `_buildTopProducts`). Não há rota de
 * painel no backend (lacuna 4): tudo é calculado das vendas, receitas e estoques,
 * menos o ponto de equilíbrio da empresa (`GET /vendas/resumo`, FE-45).
 */

type ItemParaPainel = {
  receitaId: number;
  quantidade: number;
  precoUnitarioReal: number;
  /** Snapshot do custo na venda; `null` em vendas antigas. */
  custoUnitario: number | null;
};

export type VendaParaPainel = {
  status: StatusVenda;
  total: number | null;
  dataVenda: string;
  itens: readonly ItemParaPainel[];
};

export type ReceitaParaPainel = {
  id: number;
  nome: string;
  rendimento: number;
  custoUnitario?: number;
  /** Só o lucro da `composicao` de cada canal (FE-45). */
  precos: readonly {
    balcao: boolean;
    composicao: { lucro: { valor: number; fracao: number } } | null;
  }[];
};

const ROTULOS_MES = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];

const SETE_DIAS_MS = 7 * 24 * 60 * 60 * 1000;

/** Dia 1 de cinco meses atrás, à meia-noite local: o início dos seis meses do gráfico. */
export function inicioDosSeisMeses(hoje: Date) {
  return new Date(hoje.getFullYear(), hoje.getMonth() - 5, 1);
}

function mesmoMes(data: Date, ano: number, mes: number) {
  return data.getFullYear() === ano && data.getMonth() === mes;
}

/** Vendas faturáveis (`CONCLUIDA`) com `dataVenda` no mês de `hoje` (fuso local). */
export function vendasDoMes<V extends VendaParaPainel>(
  vendas: readonly V[],
  hoje: Date,
) {
  return vendas.filter(
    (venda) =>
      isFaturavel(venda) &&
      mesmoMes(new Date(venda.dataVenda), hoje.getFullYear(), hoje.getMonth()),
  );
}

function receitasPorId(receitas: readonly ReceitaParaPainel[]) {
  return new Map(receitas.map((receita) => [receita.id, receita]));
}

/**
 * Lucro do item: `quantidade × preço − custo × quantidade`. O custo é o snapshot
 * do item; sem ele, o `custoUnitario` atual da receita; sem os dois, 0. (O mobile
 * usa sempre o da receita.)
 */
export function lucroDoItem(
  item: ItemParaPainel,
  receitas: ReadonlyMap<number, ReceitaParaPainel>,
) {
  const custo =
    item.custoUnitario ?? receitas.get(item.receitaId)?.custoUnitario ?? 0;
  return item.quantidade * item.precoUnitarioReal - custo * item.quantidade;
}

export type Indicadores = {
  faturamento: number;
  lucro: number;
  /** Pontos percentuais; 0 sem faturamento. */
  margem: number;
  vendasUltimos7Dias: number;
};

/**
 * Faturamento, lucro e margem das faturáveis do mês de `hoje`; vendas dos últimos
 * 7 dias sobre todas as faturáveis carregadas (`dataVenda ≥ agora − 7 dias`).
 */
export function calcularIndicadores(
  vendas: readonly VendaParaPainel[],
  receitas: readonly ReceitaParaPainel[],
  hoje: Date,
): Indicadores {
  const porId = receitasPorId(receitas);
  const doMes = vendasDoMes(vendas, hoje);
  const faturamento = doMes.reduce((soma, v) => soma + totalDaVenda(v), 0);
  const lucro = doMes
    .flatMap((v) => v.itens)
    .reduce((soma, item) => soma + lucroDoItem(item, porId), 0);
  const limite = hoje.getTime() - SETE_DIAS_MS;

  return {
    faturamento,
    lucro,
    margem: faturamento === 0 ? 0 : (lucro / faturamento) * 100,
    vendasUltimos7Dias: vendas.filter(
      (v) => isFaturavel(v) && new Date(v.dataVenda).getTime() >= limite,
    ).length,
  };
}

/**
 * Nomes dos insumos abaixo do mínimo (o status Crítico do estoque), na ordem de
 * `GET /insumos`. Um saldo sem insumo na lista usa "Ingrediente #<id>".
 */
export function ingredientesAcabando(
  saldos: readonly {
    insumoId: number;
    quantidadeDisponivel: number;
    quantidadeMinima: number;
  }[],
  insumos: readonly { id: number; nome: string }[],
) {
  const nomes = new Map(insumos.map((insumo) => [insumo.id, insumo.nome]));
  const ordem = new Map(insumos.map((insumo, indice) => [insumo.id, indice]));
  return saldos
    .filter(isBaixoEstoque)
    .toSorted(
      (a, b) =>
        (ordem.get(a.insumoId) ?? Infinity) -
        (ordem.get(b.insumoId) ?? Infinity),
    )
    .map(
      (saldo) => nomes.get(saldo.insumoId) ?? `Ingrediente #${saldo.insumoId}`,
    );
}

/** Até `limite` nomes em chip; o resto vira "+N". */
export function chipsAcabando(nomes: readonly string[], limite = 3) {
  return {
    visiveis: nomes.slice(0, limite),
    resto: Math.max(nomes.length - limite, 0),
  };
}

export type PontoMensal = { rotulo: string; ano: number; valor: number };

/** Os 6 meses até o de `hoje`, inclusive, com a soma do total das faturáveis de cada um. */
export function evolucaoMensal(
  vendas: readonly VendaParaPainel[],
  hoje: Date,
): PontoMensal[] {
  const faturaveis = vendas.filter(isFaturavel);
  return Array.from({ length: 6 }, (_, indice) => {
    const mes = new Date(hoje.getFullYear(), hoje.getMonth() - 5 + indice, 1);
    const valor = faturaveis
      .filter((v) =>
        mesmoMes(new Date(v.dataVenda), mes.getFullYear(), mes.getMonth()),
      )
      .reduce((soma, v) => soma + totalDaVenda(v), 0);
    return {
      rotulo: ROTULOS_MES[mes.getMonth()],
      ano: mes.getFullYear(),
      valor,
    };
  });
}

/**
 * Último mês sobre o anterior: `0,0%` se ambos são 0, `+100,0%` se o anterior é
 * 0, senão `(atual − anterior) / anterior × 100`, com `+` quando ≥ 0.
 */
export function tendenciaMensal(valores: readonly number[]) {
  if (valores.length < 2) return '0,0%';
  const anterior = valores[valores.length - 2];
  const atual = valores[valores.length - 1];
  if (anterior === 0 && atual === 0) return '0,0%';
  if (anterior === 0) return '+100,0%';
  const tendencia = ((atual - anterior) / anterior) * 100;
  return `${tendencia >= 0 ? '+' : ''}${formatPercentual(tendencia)}`;
}

export type ProdutoRentavel = {
  receitaId: number;
  nome: string;
  /** Unidades vendidas; `null` quando vem do cadastro (sem vendas). */
  quantidade: number | null;
  lucro: number;
  /** Pontos percentuais. */
  margem: number;
};

/**
 * Top 3 por lucro. Com vendas (as faturáveis recebidas, já do mês), agrupa os
 * itens por receita; sem vendas, usa o lucro por unidade do preço do Balcão
 * calculado pela API (`composicao.lucro`, FE-45), só os positivos. O mobile
 * agrupa pelo nome do produto.
 */
export function produtosMaisRentaveis(
  vendasMes: readonly VendaParaPainel[],
  receitas: readonly ReceitaParaPainel[],
): ProdutoRentavel[] {
  const porId = receitasPorId(receitas);
  const grupos = new Map<
    number,
    { quantidade: number; receita: number; lucro: number }
  >();

  for (const item of vendasMes.filter(isFaturavel).flatMap((v) => v.itens)) {
    const atual = grupos.get(item.receitaId) ?? {
      quantidade: 0,
      receita: 0,
      lucro: 0,
    };
    grupos.set(item.receitaId, {
      quantidade: atual.quantidade + item.quantidade,
      receita: atual.receita + item.quantidade * item.precoUnitarioReal,
      lucro: atual.lucro + lucroDoItem(item, porId),
    });
  }

  const produtos: ProdutoRentavel[] =
    grupos.size > 0
      ? [...grupos].map(([receitaId, grupo]) => ({
          receitaId,
          nome: porId.get(receitaId)?.nome ?? `Receita #${receitaId}`,
          quantidade: grupo.quantidade,
          lucro: grupo.lucro,
          margem: grupo.receita === 0 ? 0 : (grupo.lucro / grupo.receita) * 100,
        }))
      : receitas.flatMap((receita) => {
          const lucro = receita.precos.find((p) => p.balcao)?.composicao?.lucro;
          return lucro && lucro.valor > 0
            ? [
                {
                  receitaId: receita.id,
                  nome: receita.nome,
                  quantidade: null,
                  lucro: lucro.valor,
                  margem: fracaoParaPercentual(lucro.fracao),
                },
              ]
            : [];
        });

  return produtos.toSorted((a, b) => b.lucro - a.lucro).slice(0, 3);
}

export type PontoEquilibrioDoPainel = {
  titulo: string;
  /** Fração já vendida no mês (0 a 1); `null` sem o valor da API. */
  progresso: number | null;
  detalhe: string;
  tom: 'muted' | 'danger' | 'success';
};

/**
 * Bloco "Para pagar as contas do mês, venda R$ X" (FE-45, textos da FE-57,
 * FE-58): o ponto de equilíbrio da empresa, em reais por mês, como a API devolve
 * (`GET /vendas/resumo`), sem recalcular, e o quanto o faturamento do mês já
 * cobriu dele (`faturamento ÷ valor`, até 1; valor 0 conta como pago).
 */
export function pontoEquilibrioDoPainel(
  ponto: ResumoVendas['pontoEquilibrio'],
  faturamento: number,
): PontoEquilibrioDoPainel {
  if (ponto.valor !== null) {
    const progresso =
      ponto.valor <= 0
        ? 1
        : Math.min(Math.max(faturamento / ponto.valor, 0), 1);
    return {
      titulo: `Para pagar as contas do mês, venda ${formatMoeda(ponto.valor)}`,
      progresso,
      detalhe:
        progresso >= 1
          ? 'Contas do mês pagas. O que vender agora sobra pra você.'
          : `Você já vendeu ${formatMoeda(faturamento)} este mês`,
      tom: progresso >= 1 ? 'success' : 'muted',
    };
  }
  const titulo = 'Para pagar as contas do mês';
  if (ponto.motivo === 'MARGEM_NEGATIVA') {
    return {
      titulo,
      progresso: null,
      detalhe: 'Com os preços de hoje, você paga para vender.',
      tom: 'danger',
    };
  }
  return {
    titulo,
    progresso: null,
    detalhe: 'Ainda sem vendas este mês',
    tom: 'muted',
  };
}

/**
 * Margem em linguagem de cozinha (FE-57): "R$ X de cada R$ 100", com a margem
 * (em pontos percentuais) arredondada a inteiro. Margem negativa não usa a
 * frase: devolve `null`, e a tela diz que a venda ficou abaixo do custo.
 */
export function porCadaCemReais(margem: number): string | null {
  if (margem < 0) return null;
  return `R$ ${formatNumero(Math.round(margem))} de cada R$ 100`;
}

export type EstadoDoHeroi = 'positivo' | 'negativo' | 'sem-vendas';

/** Estado do herói do painel (FE-58): sem faturamento no mês, lucro < 0 ou o resto. */
export function estadoDoHeroi({
  faturamento,
  lucro,
}: Pick<Indicadores, 'faturamento' | 'lucro'>): EstadoDoHeroi {
  if (faturamento === 0) return 'sem-vendas';
  return lucro < 0 ? 'negativo' : 'positivo';
}

export type HeroiDoMes = {
  estado: EstadoDoHeroi;
  titulo: string;
  /** Chip "R$ X de cada R$ 100", só com lucro. */
  detalhe: string | null;
};

/** Textos do herói "Sobrou pra você este mês" (FE-57, FE-58). */
export function heroiDoMes(
  indicadores: Pick<Indicadores, 'faturamento' | 'lucro' | 'margem'>,
): HeroiDoMes {
  const estado = estadoDoHeroi(indicadores);
  if (estado === 'sem-vendas') {
    return { estado, titulo: 'Ainda sem vendas este mês', detalhe: null };
  }
  if (estado === 'negativo') {
    return { estado, titulo: 'Este mês ainda está no vermelho', detalhe: null };
  }
  return {
    estado,
    titulo: 'Sobrou pra você este mês',
    detalhe: porCadaCemReais(indicadores.margem),
  };
}

/** "1 ingrediente acabando" / "N ingredientes acabando" (FE-57). */
export function rotuloAcabando(quantidade: number) {
  return quantidade === 1
    ? '1 ingrediente acabando'
    : `${formatNumero(quantidade)} ingredientes acabando`;
}

/** Primeira palavra do nome do usuário; `null` sem nome. */
export function primeiroNome(nome: string | null) {
  return nome?.trim().split(/\s+/)[0] || null;
}

/** "Oi, {primeiro nome}!" ou "Oi!" (FE-58). */
export function saudacao(nome: string | null) {
  const primeiro = primeiroNome(nome);
  return primeiro ? `Oi, ${primeiro}!` : 'Oi!';
}

/** Dias de `hoje` até o último dia do mês (0 no último dia). */
export function diasParaFecharOMes(hoje: Date) {
  const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
  return ultimoDia.getDate() - hoje.getDate();
}

/** "Faltam N dias para fechar o mês", "Falta 1 dia…" ou "Último dia do mês". */
export function textoFechamentoDoMes(hoje: Date) {
  const dias = diasParaFecharOMes(hoje);
  if (dias === 0) return 'Último dia do mês';
  if (dias === 1) return 'Falta 1 dia para fechar o mês';
  return `Faltam ${dias} dias para fechar o mês`;
}
