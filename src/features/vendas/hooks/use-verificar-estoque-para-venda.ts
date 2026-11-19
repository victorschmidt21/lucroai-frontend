import { useQueryClient } from '@tanstack/react-query';
import { producoesListOptions } from '@/features/producoes/api/producoes.queries';
import { receitasListOptions } from '@/features/receitas/api/receitas.queries';
import type { Venda } from '@/shared/api/contracts/sales';
import { formatNumero } from '@/shared/format/numero';
import { vendasListOptions } from '../api/vendas.queries';
import {
  calcularEstoqueDisponivel,
  quantidadesPorReceita,
} from '../vendas.calculos';

/** Dados sempre frescos e sem as 3 tentativas: a falha libera a conclusão. */
const CONSULTA = { staleTime: 0, retry: false } as const;

/**
 * Origem: `verificarEstoqueParaVenda` de vendas_cubit.dart. Devolve a mensagem de
 * "Estoque insuficiente" do primeiro item sem estoque, ou `null` para concluir.
 * Se a consulta de receitas, produções ou vendas falhar, devolve `null` e deixa o
 * backend validar, como o mobile (docs/business-rules.md#validação-de-estoque-antes-de-concluir).
 */
export function useVerificarEstoqueParaVenda() {
  const queryClient = useQueryClient();

  return async function verificar(venda: Venda): Promise<string | null> {
    const pedidos = quantidadesPorReceita(venda.itens);

    try {
      const [receitas, vendas, ...producoesPorReceita] = await Promise.all([
        queryClient.fetchQuery({ ...receitasListOptions(), ...CONSULTA }),
        queryClient.fetchQuery({
          ...vendasListOptions({ status: 'CONCLUIDA' }),
          ...CONSULTA,
        }),
        ...[...pedidos.keys()].map((receitaId) =>
          queryClient.fetchQuery({
            ...producoesListOptions({ receitaId }),
            ...CONSULTA,
          }),
        ),
      ]);

      for (const [receitaId, solicitado] of pedidos) {
        const disponivel = calcularEstoqueDisponivel(
          receitaId,
          producoesPorReceita.flat(),
          receitas,
          vendas,
        );

        if (disponivel < solicitado) {
          const nome =
            receitas.find((r) => r.id === receitaId)?.nome ??
            `Receita #${receitaId}`;

          return (
            `Estoque insuficiente para "${nome}": ` +
            `disponível ${formatNumero(disponivel)}, ` +
            `solicitado ${formatNumero(solicitado)}. ` +
            'Registre uma produção antes de concluir.'
          );
        }
      }
    } catch {
      // A consulta falhou: segue com a conclusão e o backend valida.
    }

    return null;
  };
}
