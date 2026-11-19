'use client';

import { useQuery } from '@tanstack/react-query';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { gastosIndiretosListOptions } from '@/features/gastos-indiretos/api/gastos-indiretos.queries';
import { receitasListOptions } from '@/features/receitas/api/receitas.queries';
import type { Producao } from '@/shared/api/contracts/operations';
import { hrefComFiltros } from '@/shared/api/filtros';
import { formatMoeda } from '@/shared/format/moeda';
import { Button, IconButton } from '@/shared/ui/button';
import { IconAdicionar, IconMostrar } from '@/shared/ui/icons/acoes';
import { ListPage } from '@/shared/ui/list-page';
import { Select } from '@/shared/ui/select';
import { producoesListOptions } from '../api/producoes.queries';
import { ProducaoDetalheDrawer } from './producao-detalhe-drawer';
import { ProducaoFormDialog } from './producao-form-dialog';
import { descricaoDosLotes, formatCustoPorUnidade } from './producoes-texto';

type Props = {
  /** Filtro `receitaId` da URL, já validado pela página. */
  receitaId?: number;
  abrirNovo?: boolean;
};

/** Tela de produções. Origem: producoes_page.dart. */
export function ProducoesLista({ receitaId, abrirNovo = false }: Props) {
  const query = useQuery(producoesListOptions({ receitaId }));
  const receitas = useQuery(receitasListOptions());
  const gastos = useQuery(gastosIndiretosListOptions());
  const [formularioAberto, setFormularioAberto] = useState(abrirNovo);
  const [detalhe, setDetalhe] = useState<Producao | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const nomes = new Map((receitas.data ?? []).map((r) => [r.id, r.nome]));
  const nomeDaReceita = (id: number) => nomes.get(id) ?? `Receita #${id}`;

  function alterarFiltro(mudancas: Record<string, string | null>) {
    router.replace(hrefComFiltros(pathname, searchParams, mudancas), {
      scroll: false,
    });
  }

  function alternarFormulario(aberto: boolean) {
    setFormularioAberto(aberto);
    // `?novo=1` (ação rápida do painel) abre o registro uma vez; ao fechar, sai da URL.
    if (!aberto && searchParams.has('novo')) alterarFiltro({ novo: null });
  }

  const novaProducao = (
    <Button onClick={() => setFormularioAberto(true)}>
      <IconAdicionar className="size-5" />
      Nova Produção
    </Button>
  );

  return (
    <>
      <ListPage
        title="Produções"
        subtitle="Registre e acompanhe suas produções"
        actions={novaProducao}
        label="Produções"
        query={query}
        itemLabel={{ singular: 'produção', plural: 'produções' }}
        summary={
          <Select
            label="Receita"
            value={receitaId ? String(receitaId) : ''}
            onChange={(event) =>
              alterarFiltro({ receitaId: event.target.value || null })
            }
            className="sm:max-w-xs"
          >
            <option value="">Todas as receitas</option>
            {(receitas.data ?? []).map((receita) => (
              <option key={receita.id} value={String(receita.id)}>
                {receita.nome}
              </option>
            ))}
          </Select>
        }
        emptyTitle={
          receitaId
            ? 'Nenhuma produção registrada para esta receita'
            : 'Nenhuma produção registrada'
        }
        emptyDescription="Registre sua primeira produção"
        emptyAction={novaProducao}
        errorTitle="Erro ao carregar produções"
        getRowKey={(producao) => producao.id}
        columns={[
          {
            id: 'receita',
            header: 'Receita',
            cell: (producao) => nomeDaReceita(producao.receitaId),
          },
          {
            id: 'lotes',
            header: 'Produção',
            cell: descricaoDosLotes,
          },
          {
            id: 'custoTotal',
            header: 'Custo total',
            align: 'right',
            cell: (producao) => (
              <span className="font-semibold text-accent">
                {formatMoeda(producao.custoTotal)}
              </span>
            ),
          },
          {
            id: 'custoUnitario',
            header: 'Custo unitário',
            align: 'right',
            cell: (producao) => formatCustoPorUnidade(producao.custoUnitario),
          },
          {
            id: 'acoes',
            header: 'Ações',
            acoes: true,
            cell: (producao) => (
              <IconButton
                aria-label={`Ver detalhes da produção de ${nomeDaReceita(producao.receitaId)}, ${descricaoDosLotes(producao)}`}
                onClick={() => setDetalhe(producao)}
              >
                <IconMostrar />
              </IconButton>
            ),
          },
        ]}
      />

      <ProducaoFormDialog
        // A key recria o formulário com a receita do filtro atual.
        key={receitaId ?? 'todas'}
        open={formularioAberto}
        onOpenChange={alternarFormulario}
        receitaIdInicial={receitaId}
      />

      {detalhe ? (
        <ProducaoDetalheDrawer
          open
          onOpenChange={(aberto) => {
            if (!aberto) setDetalhe(null);
          }}
          producao={detalhe}
          receita={receitas.data?.find((r) => r.id === detalhe.receitaId)}
          gastos={gastos.data ?? []}
        />
      ) : null}
    </>
  );
}
