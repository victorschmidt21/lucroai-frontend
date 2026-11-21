import { useQueryClient } from '@tanstack/react-query';
import { estoqueProdutosOptions } from '@/features/estoque/api/estoque.queries';
import { receitasListOptions } from '@/features/receitas/api/receitas.queries';
import type { Venda } from '@/shared/api/contracts/sales';
import { formatNumero } from '@/shared/format/numero';
import {
  estoqueDisponivelDaReceita,
  quantidadesPorReceita,
} from '../vendas.calculos';

/** Dados sempre frescos e sem as 3 tentativas: a falha libera a conclusão. */
const CONSULTA = { staleTime: 0, retry: false } as const;

/** Texto do diálogo "Estoque insuficiente" (docs/business-rules.md). */
export function mensagemEstoqueInsuficiente(
  nome: string,
  disponivel: number,
  solicitado: number,
) {
  return (
    `Estoque insuficiente para "${nome}": ` +
    `disponível ${formatNumero(disponivel)}, ` +
    `solicitado ${formatNumero(solicitado)}. ` +
    'Registre uma produção antes de concluir.'
  );
}

/**
 * Origem: `verificarEstoqueParaVenda` de vendas_cubit.dart. Confere o saldo de
 * produto acabado da API (`GET /estoque/produtos`) e devolve a mensagem do
 * primeiro item sem estoque, ou `null` para concluir. Se a consulta falhar,
 * devolve `null`: a API confere de novo e responde 422 `ESTOQUE_INSUFICIENTE`.
 */
export function useVerificarEstoqueParaVenda() {
  const queryClient = useQueryClient();

  return async function verificar(venda: Venda): Promise<string | null> {
    try {
      const [receitas, estoques] = await Promise.all([
        queryClient.fetchQuery({ ...receitasListOptions(), ...CONSULTA }),
        queryClient.fetchQuery({ ...estoqueProdutosOptions(), ...CONSULTA }),
      ]);

      for (const [receitaId, solicitado] of quantidadesPorReceita(
        venda.itens,
      )) {
        const disponivel = estoqueDisponivelDaReceita(receitaId, estoques);

        if (disponivel < solicitado) {
          const nome =
            receitas.find((r) => r.id === receitaId)?.nome ??
            `Receita #${receitaId}`;

          return mensagemEstoqueInsuficiente(nome, disponivel, solicitado);
        }
      }
    } catch {
      // A consulta falhou: segue com a conclusão e a API valida.
    }

    return null;
  };
}
