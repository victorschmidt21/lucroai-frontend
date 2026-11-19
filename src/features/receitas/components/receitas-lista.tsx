'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import type { Receita } from '@/shared/api/contracts/recipe';
import { formatMoeda } from '@/shared/format/moeda';
import { formatMargem, formatQuantidade } from '@/shared/format/numero';
import { buttonClasses, IconButton } from '@/shared/ui/button';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import {
  IconAdicionar,
  IconEditar,
  IconExcluir,
  IconSimular,
} from '@/shared/ui/icons/acoes';
import { ListPage } from '@/shared/ui/list-page';
import { useToast } from '@/shared/ui/toast';
import { receitasListOptions } from '../api/receitas.queries';
import { useDeleteReceita } from '../hooks/use-delete-receita';

const ACAO_DE_LINHA = buttonClasses('fantasma', undefined, 'icone');

/**
 * Tela de receitas. Origem: receitas_page.dart, receita_card.dart e
 * receitas_search_bar.dart. Criar e editar abrem o formulário da FE-12;
 * simular, a tela da FE-20.
 */
export function ReceitasLista() {
  const query = useQuery(receitasListOptions());
  const toast = useToast();
  const excluir = useDeleteReceita();
  const [paraExcluir, setParaExcluir] = useState<Receita | null>(null);

  const novaReceita = (
    <Link href="/receitas/nova" className={buttonClasses('primario')}>
      <IconAdicionar className="size-5" />
      Nova receita
    </Link>
  );

  return (
    <>
      <ListPage
        title="Receitas"
        subtitle="Gerencie insumos, rendimento, margem e custo automático"
        actions={novaReceita}
        label="Receitas"
        query={query}
        searchField="nome"
        searchPlaceholder="Buscar receita"
        itemLabel={{ singular: 'receita', plural: 'receitas' }}
        emptyTitle="Nenhuma receita encontrada."
        emptyAction={novaReceita}
        errorTitle="Não foi possível carregar as receitas."
        getRowKey={(receita) => receita.id}
        // Os valores gravados pelo backend, sem recalcular; ausentes viram "—".
        columns={[
          { id: 'nome', header: 'Nome', cell: (receita) => receita.nome },
          {
            id: 'rendimento',
            header: 'Rendimento',
            align: 'right',
            cell: (receita) =>
              formatQuantidade(receita.rendimento, receita.unidadeRendimento),
          },
          {
            id: 'custoProducao',
            header: 'Custo do lote',
            align: 'right',
            cell: (receita) => formatMoeda(receita.custoProducao),
          },
          {
            id: 'custoUnitario',
            header: 'Custo unitário',
            align: 'right',
            cell: (receita) => formatMoeda(receita.custoUnitario),
          },
          {
            id: 'margemLucro',
            header: 'Margem',
            align: 'right',
            cell: (receita) => formatMargem(receita.margemLucro),
          },
          {
            id: 'precoSugerido',
            header: 'Preço sugerido',
            align: 'right',
            cell: (receita) => formatMoeda(receita.precoSugerido),
          },
          {
            id: 'acoes',
            header: 'Ações',
            acoes: true,
            cell: (receita) => (
              <>
                <Link
                  href={`/receitas/${receita.id}/editar`}
                  aria-label={`Editar ${receita.nome}`}
                  className={ACAO_DE_LINHA}
                >
                  <IconEditar />
                </Link>
                <Link
                  href={`/receitas/${receita.id}/simular`}
                  aria-label={`Simular ${receita.nome}`}
                  className={ACAO_DE_LINHA}
                >
                  <IconSimular />
                </Link>
                <IconButton
                  aria-label={`Excluir ${receita.nome}`}
                  onClick={() => setParaExcluir(receita)}
                >
                  <IconExcluir />
                </IconButton>
              </>
            ),
          },
        ]}
      />

      <ConfirmDialog
        open={paraExcluir !== null}
        onOpenChange={(aberto) => {
          if (!aberto) setParaExcluir(null);
        }}
        title="Excluir receita"
        description={`Deseja excluir "${paraExcluir?.nome ?? ''}"?`}
        confirmLabel="Excluir"
        // Rejeitar mantém o diálogo aberto, com a mensagem do backend.
        onConfirm={async () => {
          if (!paraExcluir) return;
          await excluir.mutateAsync(paraExcluir.id);
          toast.success('Receita excluída com sucesso.');
          setParaExcluir(null);
        }}
      />
    </>
  );
}
