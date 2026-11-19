'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { receitasListOptions } from '@/features/receitas/api/receitas.queries';
import type { Venda } from '@/shared/api/contracts/sales';
import { getErrorMessage } from '@/shared/api/errors';
import { formatMoeda } from '@/shared/format/moeda';
import { formatMargem, formatQuantidade } from '@/shared/format/numero';
import { Alert } from '@/shared/ui/alert';
import { StatusVendaBadge } from '@/shared/ui/badge';
import { Button, buttonClasses } from '@/shared/ui/button';
import { Dialog, ResponsiveDialog } from '@/shared/ui/dialog';
import { useToast } from '@/shared/ui/toast';
import { vendaDetailOptions } from '../api/vendas.queries';
import { useAtualizarStatusVenda } from '../hooks/use-atualizar-status-venda';
import { useVerificarEstoqueParaVenda } from '../hooks/use-verificar-estoque-para-venda';
import { subtotalItem } from '../vendas.calculos';

type Props = {
  /** Venda a confirmar; `null` fecha. Aberta ao registrar (FE-16) e pelo histórico (FE-18). */
  venda: Venda | null;
  onFechar: () => void;
};

/**
 * "Confirmar venda": concluir (com a validação de estoque de produto acabado),
 * cancelar ou fechar, mantendo a venda pendente. Origem: `_ConfirmacaoSheet` de
 * vendas_page.dart. Drawer de baixo no celular e Dialog a partir de `md`.
 */
export function ConfirmacaoVenda({ venda, onFechar }: Props) {
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
        />
      ) : null}
    </ResponsiveDialog>
  );
}

function Conteudo({
  venda: inicial,
  onFechar,
  onOcupado,
}: {
  venda: Venda;
  onFechar: () => void;
  onOcupado: (ocupado: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const receitas = useQuery(receitasListOptions());
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

  async function mudarStatus(
    status: 'CONCLUIDA' | 'CANCELADA',
    mensagem: string,
  ) {
    try {
      const atualizada = await atualizar.mutateAsync({ id: venda.id, status });
      toast.success(mensagem);
      setVenda(atualizada);

      // A baixa do produto acabado é assíncrona (`venda_concluida`): refaz a
      // consulta para mostrar o status real.
      if (status === 'CONCLUIDA') {
        const real = await queryClient
          .fetchQuery({
            ...vendaDetailOptions(venda.id),
            staleTime: 0,
            retry: false,
          })
          .catch(() => atualizada);
        setVenda(real);
      }
    } catch {
      // O erro fica em `atualizar.error` e aparece no diálogo.
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
      await mudarStatus('CONCLUIDA', 'Venda concluída com sucesso.');
    } finally {
      setVerificando(false);
      onOcupado(false);
    }
  }

  async function cancelar() {
    onOcupado(true);
    try {
      await mudarStatus('CANCELADA', 'Venda cancelada.');
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
                {item.margemRealizada !== null ? (
                  <span className="text-success">
                    {`${formatMargem(item.margemRealizada)} margem`}
                  </span>
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

      {atualizar.error ? (
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
              Ir para Produções
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
