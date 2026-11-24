'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { canaisOptions } from '@/features/configuracoes/api/configuracoes.queries';
import { receitasListOptions } from '@/features/receitas/api/receitas.queries';
import type { Venda } from '@/shared/api/contracts/sales';
import { getErrorMessage, isEstoqueInsuficiente } from '@/shared/api/errors';
import { formatMoeda } from '@/shared/format/moeda';
import { formatQuantidade } from '@/shared/format/numero';
import { Alert } from '@/shared/ui/alert';
import { StatusVendaBadge } from '@/shared/ui/badge';
import { Button, buttonClasses } from '@/shared/ui/button';
import { Dialog, ResponsiveDialog } from '@/shared/ui/dialog';
import { useToast } from '@/shared/ui/toast';
import { useAtualizarStatusVenda } from '../hooks/use-atualizar-status-venda';
import { vendasListOptions } from '../api/vendas.queries';
import { useVerificarEstoqueParaVenda } from '../hooks/use-verificar-estoque-para-venda';
import {
  descreverLucroReal,
  mensagemVendaAnotada,
  nomeDoCanal,
  resumirVendas,
  subtotalItem,
} from '../vendas.calculos';

type Props = {
  /** Venda a confirmar; `null` fecha. Aberta ao registrar (FE-16) e pelo histórico (FE-18). */
  venda: Venda | null;
  onFechar: () => void;
  /** A venda foi concluída (anotada): a tela mostra a dica da taxa do canal (FE-68). */
  onConcluida?: (venda: Venda) => void;
};

/**
 * "Confirmar venda": concluir (com a conferência do estoque de produto acabado),
 * cancelar ou fechar, mantendo a venda pendente. Origem: `_ConfirmacaoSheet` de
 * vendas_page.dart. Drawer de baixo no celular e Dialog a partir de `md`.
 */
export function ConfirmacaoVenda({ venda, onFechar, onConcluida }: Props) {
  const [ocupado, setOcupado] = useState(false);

  return (
    <ResponsiveDialog
      title="Confirmar venda"
      description="Revise os itens antes de concluir"
      open={venda !== null}
      onOpenChange={(aberto) => {
        if (!aberto && !ocupado) onFechar();
      }}
    >
      {venda ? (
        <Conteudo
          key={venda.id}
          venda={venda}
          onFechar={onFechar}
          onOcupado={setOcupado}
          onConcluida={onConcluida}
        />
      ) : null}
    </ResponsiveDialog>
  );
}

function Conteudo({
  venda: inicial,
  onFechar,
  onOcupado,
  onConcluida,
}: {
  venda: Venda;
  onFechar: () => void;
  onOcupado: (ocupado: boolean) => void;
  onConcluida?: (venda: Venda) => void;
}) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const receitas = useQuery(receitasListOptions());
  const canais = useQuery(canaisOptions());
  const atualizar = useAtualizarStatusVenda();
  const verificarEstoque = useVerificarEstoqueParaVenda();
  // Depois de concluir ou cancelar, mostra a venda devolvida pelo backend.
  const [venda, setVenda] = useState(inicial);
  const [verificando, setVerificando] = useState(false);
  const [estoqueInsuficiente, setEstoqueInsuficiente] = useState<string | null>(
    null,
  );
  const ocupado = verificando || atualizar.isPending;
  const pendente = venda.status === 'PENDENTE';

  function nomeDoItem(receitaId: number) {
    return (
      receitas.data?.find((r) => r.id === receitaId)?.nome ??
      `Produto #${receitaId}`
    );
  }

  /** Total das vendas concluídas do mês, para o toast; `null` se a busca falhar. */
  async function totalDoMes() {
    const hoje = new Date();
    const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    try {
      const doMes = await queryClient.fetchQuery(
        vendasListOptions({ dataInicio: inicio.toISOString() }),
      );
      return resumirVendas(doMes).totalVendido;
    } catch {
      return null;
    }
  }

  async function mudarStatus(
    status: 'CONCLUIDA' | 'CANCELADA',
    mensagem: () => Promise<string> | string,
  ) {
    try {
      // A API baixa o produto acabado na mesma transação: o status devolvido é o real.
      const atualizada = await atualizar.mutateAsync({ id: venda.id, status });
      toast.success(await mensagem());
      setVenda(atualizada);
      if (atualizada.status === 'CONCLUIDA') onConcluida?.(atualizada);
    } catch (error) {
      // 422 `ESTOQUE_INSUFICIENTE`: a venda continua pendente e abre o mesmo
      // diálogo da conferência. Os outros erros ficam em `atualizar.error`.
      if (isEstoqueInsuficiente(error)) {
        setEstoqueInsuficiente(
          `${getErrorMessage(error)}. Anote uma fornada antes de concluir.`,
        );
      }
    }
  }

  async function concluir() {
    setVerificando(true);
    onOcupado(true);
    try {
      const erro = await verificarEstoque(venda);
      if (erro) {
        setEstoqueInsuficiente(erro);
        return;
      }
      await mudarStatus('CONCLUIDA', async () =>
        mensagemVendaAnotada(await totalDoMes()),
      );
    } finally {
      setVerificando(false);
      onOcupado(false);
    }
  }

  async function cancelar() {
    onOcupado(true);
    try {
      await mudarStatus('CANCELADA', () => 'Venda cancelada.');
    } finally {
      onOcupado(false);
    }
  }

  return (
    <>
      <p className="flex items-center justify-between gap-3 text-body text-ink-muted">
        <span>{`Venda #${venda.id}`}</span>
        <StatusVendaBadge status={venda.status} />
      </p>
      <p className="flex items-center justify-between gap-3 text-body text-ink-muted">
        <span>Onde vendeu</span>
        <span className="font-semibold text-ink">
          {nomeDoCanal(venda.canalId, canais.data ?? [])}
        </span>
      </p>

      <ul aria-label="Itens da venda" className="flex flex-col gap-3">
        {venda.itens.map((item) => (
          <li key={item.id} className="flex items-center gap-3">
            <div className="flex min-w-0 grow flex-col">
              <span className="truncate text-body">
                {nomeDoItem(item.receitaId)}
              </span>
              <span className="flex flex-wrap gap-x-2 text-small tabular-nums">
                <span className="text-ink-muted">
                  {`${formatQuantidade(item.quantidade)} × ${formatMoeda(item.precoUnitarioReal)}`}
                </span>
                {item.lucroReal !== null ? (
                  <LucroRealDoItem lucroReal={item.lucroReal} />
                ) : null}
              </span>
            </div>
            <span className="shrink-0 text-body font-semibold text-accent tabular-nums">
              {formatMoeda(
                subtotalItem({
                  quantidade: item.quantidade,
                  precoUnitario: item.precoUnitarioReal,
                }),
              )}
            </span>
          </li>
        ))}
      </ul>

      <p className="flex items-center justify-between gap-3 border-t border-border pt-3">
        <span className="text-body font-semibold">Total</span>
        <span className="text-title text-accent tabular-nums">
          {formatMoeda(venda.total)}
        </span>
      </p>

      {atualizar.error && !isEstoqueInsuficiente(atualizar.error) ? (
        <Alert>{getErrorMessage(atualizar.error)}</Alert>
      ) : null}

      <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secundario" disabled={ocupado} onClick={onFechar}>
          Fechar
        </Button>
        {pendente ? (
          <>
            <Button
              variant="perigo"
              disabled={ocupado}
              loading={atualizar.isPending && !verificando}
              onClick={() => void cancelar()}
            >
              Cancelar venda
            </Button>
            <Button
              disabled={ocupado}
              loading={verificando}
              onClick={() => void concluir()}
            >
              Concluir venda
            </Button>
          </>
        ) : null}
      </div>

      <Dialog
        title="Estoque insuficiente"
        description={estoqueInsuficiente ?? undefined}
        open={estoqueInsuficiente !== null}
        onOpenChange={(aberto) => {
          if (!aberto) setEstoqueInsuficiente(null);
        }}
        footer={
          <>
            <Link href="/producoes" className={buttonClasses('secundario')}>
              Ir para Fornadas
            </Link>
            <Button onClick={() => setEstoqueInsuficiente(null)}>
              Entendido
            </Button>
          </>
        }
      />
    </>
  );
}

/** "Lucro real X%" (FE-46); negativo em cor de alerta e com "(prejuízo)". */
function LucroRealDoItem({ lucroReal }: { lucroReal: number }) {
  const { texto, prejuizo } = descreverLucroReal(lucroReal);
  return (
    <span className={prejuizo ? 'font-semibold text-danger' : 'text-success'}>
      {`Lucro real ${texto}`}
    </span>
  );
}
