import type { StatusVenda } from '@/shared/api/contracts/enums';
import { isBaixoEstoque } from '@/shared/domain/estoque';
import { isFaturavel, totalDaVenda } from '@/shared/domain/vendas';
import { formatPercentual } from '@/shared/format/numero';

/*
 * Painel (docs/business-rules.md#painel). Origem: dashboard_page.dart
 * (`_DashboardData.fromStates`, `_calculateVendaProfit`, `_buildMonthlyValues`,
 * `_buildMonthLabels`, `_buildTrendLabel` e `_buildTopProducts`). Não há rota de
 * painel no backend (lacuna 4): tudo é calculado das vendas, receitas e estoques.
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
  precoSugerido?: number;
  /** Fração (`0.6` = 60%). */
  margemLucro?: number;
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

/** Insumos abaixo do mínimo (o status Crítico do estoque). */
export function contarEstoqueBaixo(
  saldos: readonly { quantidadeDisponivel: number; quantidadeMinima: number }[],
) {
  return saldos.filter(isBaixoEstoque).length;
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
 * itens por receita; sem vendas, usa as receitas com `precoSugerido −
 * custoUnitario > 0`. O mobile agrupa pelo nome do produto.
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
      : receitas
          .map((receita) => {
            const preco = receita.precoSugerido ?? 0;
            const lucro = preco - (receita.custoUnitario ?? 0);
            return {
              receitaId: receita.id,
              nome: receita.nome,
              quantidade: null,
              lucro,
              margem:
                preco === 0
                  ? (receita.margemLucro ?? 0) * 100
                  : (lucro / preco) * 100,
            };
          })
          .filter((produto) => produto.lucro > 0);

  return produtos.toSorted((a, b) => b.lucro - a.lucro).slice(0, 3);
}
