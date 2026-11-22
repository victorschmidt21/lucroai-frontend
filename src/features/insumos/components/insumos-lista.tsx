'use client';

import { useQuery } from '@tanstack/react-query';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import type { Insumo } from '@/shared/api/contracts/catalog';
import { hrefComFiltros } from '@/shared/api/filtros';
import { formatCustoUnitario, formatMoeda } from '@/shared/format/moeda';
import { formatQuantidade } from '@/shared/format/numero';
import { Button, IconButton } from '@/shared/ui/button';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import {
  IconAdicionar,
  IconDinheiro,
  IconEditar,
  IconExcluir,
} from '@/shared/ui/icons/acoes';
import { ListPage } from '@/shared/ui/list-page';
import { useToast } from '@/shared/ui/toast';
import { insumosListOptions } from '../api/insumos.queries';
import { useDeleteInsumo } from '../hooks/use-delete-insumo';
import { InsumoDetalheDrawer } from './insumo-detalhe-drawer';
import { InsumoFormDialog } from './insumo-form-dialog';

type Formulario = { aberto: boolean; insumo?: Insumo };

/**
 * Tela de insumos. Origem: insumos_page.dart, insumo_card.dart e
 * insumos_search_bar.dart.
 */
export function InsumosLista({ abrirNovo = false }: { abrirNovo?: boolean }) {
  const query = useQuery(insumosListOptions());
  const toast = useToast();
  const excluir = useDeleteInsumo();
  const [formulario, setFormulario] = useState<Formulario>({
    aberto: abrirNovo,
  });
  const [paraExcluir, setParaExcluir] = useState<Insumo | null>(null);
  // Guarda o id: o detalhe lê o insumo da lista, que volta atualizada depois
  // de uma compra ou de um preço novo.
  const [detalheId, setDetalheId] = useState<number | null>(null);
  const detalhe = query.data?.find(({ id }) => id === detalheId);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function alternarFormulario(aberto: boolean) {
    setFormulario((atual) => ({ ...atual, aberto }));
    // `?novo=1` (ação rápida do painel) abre a criação uma vez; ao fechar, sai da URL.
    if (!aberto && searchParams.has('novo')) {
      router.replace(hrefComFiltros(pathname, searchParams, { novo: null }), {
        scroll: false,
      });
    }
  }

  const novoInsumo = (
    <Button onClick={() => setFormulario({ aberto: true })}>
      <IconAdicionar className="size-5" />
      Novo insumo
    </Button>
  );

  return (
    <>
      <ListPage
        title="Insumos"
        subtitle="Gerencie quantidade, valor pago e custo unitário"
        actions={novoInsumo}
        label="Insumos"
        query={query}
        searchField="nome"
        searchPlaceholder="Buscar insumo"
        itemLabel={{ singular: 'insumo', plural: 'insumos' }}
        emptyTitle="Nenhum insumo encontrado."
        emptyAction={novoInsumo}
        errorTitle="Não foi possível carregar os insumos."
        getRowKey={(insumo) => insumo.id}
        columns={[
          { id: 'nome', header: 'Nome', cell: (insumo) => insumo.nome },
          {
            id: 'quantidade',
            header: 'Quantidade',
            align: 'right',
            cell: (insumo) =>
              formatQuantidade(insumo.quantidadeBaseCusto, insumo.unidade),
          },
          {
            id: 'valorPago',
            header: 'Valor pago',
            align: 'right',
            cell: (insumo) => formatMoeda(insumo.valorPago),
          },
          {
            id: 'custoUnitario',
            // `custoUnitario` é o preço de hoje (`custoReposicao`, BE-29).
            header: 'Preço de hoje',
            align: 'right',
            // O valor gravado pelo backend, sem recalcular na tela.
            cell: (insumo) =>
              formatCustoUnitario(insumo.custoUnitario, insumo.unidade),
          },
          {
            id: 'acoes',
            header: 'Ações',
            acoes: true,
            cell: (insumo) => (
              <>
                <IconButton
                  aria-label={`Compras e preços de ${insumo.nome}`}
                  onClick={() => setDetalheId(insumo.id)}
                >
                  <IconDinheiro />
                </IconButton>
                <IconButton
                  aria-label={`Editar ${insumo.nome}`}
                  onClick={() => setFormulario({ aberto: true, insumo })}
                >
                  <IconEditar />
                </IconButton>
                <IconButton
                  aria-label={`Excluir ${insumo.nome}`}
                  onClick={() => setParaExcluir(insumo)}
                >
                  <IconExcluir />
                </IconButton>
              </>
            ),
          },
        ]}
      />

      <InsumoFormDialog
        // A key recria o formulário com os valores do insumo escolhido.
        key={formulario.insumo?.id ?? 'novo'}
        open={formulario.aberto}
        onOpenChange={alternarFormulario}
        insumo={formulario.insumo}
      />

      {detalhe ? (
        <InsumoDetalheDrawer
          open
          onOpenChange={(aberto) => {
            if (!aberto) setDetalheId(null);
          }}
          insumo={detalhe}
        />
      ) : null}

      <ConfirmDialog
        open={paraExcluir !== null}
        onOpenChange={(aberto) => {
          if (!aberto) setParaExcluir(null);
        }}
        title="Excluir insumo"
        description={`Deseja excluir "${paraExcluir?.nome ?? ''}"?`}
        confirmLabel="Excluir"
        // Rejeitar mantém o diálogo aberto, com a mensagem do backend.
        onConfirm={async () => {
          if (!paraExcluir) return;
          await excluir.mutateAsync(paraExcluir.id);
          toast.success('Insumo excluído com sucesso.');
          setParaExcluir(null);
        }}
      />
    </>
  );
}
