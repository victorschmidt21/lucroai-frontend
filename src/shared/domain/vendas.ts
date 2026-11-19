import type { StatusVenda } from '@/shared/api/contracts/enums';

/**
 * Só vendas `CONCLUIDA` entram no faturamento: `PENDENTE` ainda não é receita e
 * `CANCELADA` nunca conta. Origem: `isFaturavel` de venda.dart. Usado pelo
 * histórico (FE-18), pelo painel e pela simulação.
 */
export function isFaturavel(venda: { status: StatusVenda }) {
  return venda.status === 'CONCLUIDA';
}
