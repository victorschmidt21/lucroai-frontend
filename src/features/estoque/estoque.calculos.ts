import type { UnidadeMedida } from '@/shared/api/contracts/enums';
import type { EstoqueProduto } from '@/shared/api/contracts/operations';
import type { Receita } from '@/shared/api/contracts/recipe';

/** Uma receita no estoque pronto (FE-72). */
export type ItemEstoquePronto = {
  receitaId: number;
  /** Nome da receita, ou "Receita #<id>" se ela não veio na lista. */
  nome: string;
  quantidade: number;
  /** `un` na receita vendida; a unidade do rendimento (g, ml) na que só vai dentro de outras. */
  unidade: UnidadeMedida;
  estoqueNegativo: boolean;
};

/**
 * Junta o saldo pronto (`GET /estoque/produtos`) com o nome e a unidade da
 * receita. Os negativos vêm primeiro (pedem a produção), depois por nome.
 */
export function montarEstoquePronto(
  saldos: readonly EstoqueProduto[],
  receitas: readonly Pick<
    Receita,
    'id' | 'nome' | 'vendavel' | 'unidadeRendimento'
  >[],
): ItemEstoquePronto[] {
  return saldos
    .map((saldo) => {
      const receita = receitas.find((atual) => atual.id === saldo.receitaId);
      const vendavel = receita?.vendavel ?? saldo.vendavel;

      return {
        receitaId: saldo.receitaId,
        nome: receita?.nome ?? `Receita #${saldo.receitaId}`,
        quantidade: saldo.quantidadeDisponivel,
        unidade:
          !vendavel && receita ? receita.unidadeRendimento : ('UN' as const),
        estoqueNegativo:
          saldo.estoqueNegativo || saldo.quantidadeDisponivel < 0,
      };
    })
    .toSorted(
      (a, b) =>
        Number(b.estoqueNegativo) - Number(a.estoqueNegativo) ||
        a.nome.localeCompare(b.nome, 'pt-BR'),
    );
}
