'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { hrefComFiltros, lerFiltros } from '@/shared/api/filtros';
import type { Receita } from '@/shared/api/contracts/recipe';
import { formatMoeda } from '@/shared/format/moeda';
import { formatQuantidade } from '@/shared/format/numero';
import { SEM_VALOR } from '@/shared/format/texto';
import {
  Button,
  buttonClasses,
  IconButton,
  iconButtonClasses,
} from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { Dialog, DialogClose } from '@/shared/ui/dialog';
import {
  IconAdicionar,
  IconEditar,
  IconExcluir,
  IconSimular,
} from '@/shared/ui/icons/acoes';
import { IlustracaoCaderno } from '@/shared/ui/ilustracoes';
import { ListPage } from '@/shared/ui/list-page';
import { SegmentedControl } from '@/shared/ui/segmented-control';
import { useToast } from '@/shared/ui/toast';
import { DicaNaHora } from '@/features/aprender/components/dica-na-hora';
import { receitasListOptions } from '../api/receitas.queries';
import { useDeleteReceita } from '../hooks/use-delete-receita';
import {
  motivoParaNaoExcluir,
  passaNoFiltroDeVenda,
  type FiltroDeVenda,
} from '../receitas.calculos';
import { receitasSearchSchema } from '../schemas/receitas-search.schema';

const ACAO_DE_LINHA = iconButtonClasses();

const OPCOES_DE_VENDA = [
  { value: 'todas', label: 'Todas' },
  { value: 'vendo', label: 'Vendo sozinha' },
  { value: 'dentro', label: 'Só vai dentro de outras' },
] satisfies { value: FiltroDeVenda; label: string }[];

/**
 * Tela de receitas. Origem: receitas_page.dart, receita_card.dart e
 * receitas_search_bar.dart. O nome abre o detalhe com os preços por canal
 * (FE-44); criar e editar abrem o formulário da FE-12; simular, a tela da FE-20.
 */
export function ReceitasLista() {
  const query = useQuery(receitasListOptions());
  const toast = useToast();
  const excluir = useDeleteReceita();
  const [paraExcluir, setParaExcluir] = useState<Receita | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filtro: FiltroDeVenda =
    lerFiltros(receitasSearchSchema, searchParams).tipo ?? 'todas';
  // Receita usada em outra não chega ao `DELETE` (a API daria 409 `RECEITA_EM_USO`).
  const motivo = paraExcluir ? motivoParaNaoExcluir(paraExcluir) : null;

  function alterarFiltro(valor: FiltroDeVenda) {
    router.replace(
      hrefComFiltros(pathname, searchParams, {
        tipo: valor === 'todas' ? null : valor,
      }),
      { scroll: false },
    );
  }

  function fecharExclusao(aberto: boolean) {
    if (!aberto) setParaExcluir(null);
  }

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
        subtitle="Quanto custa e quanto cobrar por cada uma"
        actions={novaReceita}
        topo={<DicaNaHora tela="receitas" />}
        summary={
          <SegmentedControl
            aria-label="Mostrar receitas"
            options={OPCOES_DE_VENDA}
            value={filtro}
            onValueChange={alterarFiltro}
            larguraDoTexto
            className="self-start"
          />
        }
        filter={(receita) => passaNoFiltroDeVenda(receita, filtro)}
        filterEmptyTitle={
          filtro === 'dentro'
            ? 'Nenhuma receita só vai dentro de outras.'
            : 'Nenhuma receita vendida sozinha.'
        }
        filterEmptyAction={
          <Link href="/receitas" className={buttonClasses('secundario')}>
            Ver todas
          </Link>
        }
        label="Receitas"
        query={query}
        searchField="nome"
        searchPlaceholder="Buscar receita"
        itemLabel={{ singular: 'receita', plural: 'receitas' }}
        emptyTitle="Seu caderno de receitas está vazio"
        emptyDescription="Crie a primeira receita e descubra quanto custa e quanto cobrar."
        emptyIlustracao={<IlustracaoCaderno />}
        emptyAction={
          <Link href="/receitas/nova" className={buttonClasses('primario')}>
            <IconAdicionar className="size-5" />
            Criar receita
          </Link>
        }
        errorTitle="Não foi possível carregar as receitas."
        getRowKey={(receita) => receita.id}
        // Os valores gravados pelo backend, sem recalcular; ausentes viram "—".
        columns={[
          {
            id: 'nome',
            header: 'Nome',
            cell: (receita) => (
              <span className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/receitas/${receita.id}`}
                  className="text-accent underline-offset-2 hover:underline"
                >
                  {receita.nome}
                </Link>
                {receita.vendavel ? null : (
                  <Badge tone="destaque">Só vai dentro de outras</Badge>
                )}
              </span>
            ),
          },
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
            id: 'precoSugerido',
            header: 'Preço no Balcão',
            align: 'right',
            // Sem preço quando a receita não é vendida sozinha (BE-40).
            cell: (receita) =>
              receita.vendavel ? formatMoeda(receita.precoSugerido) : SEM_VALOR,
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
                {receita.vendavel ? (
                  <Link
                    href={`/receitas/${receita.id}/simular`}
                    aria-label={`Simular ${receita.nome}`}
                    className={ACAO_DE_LINHA}
                  >
                    <IconSimular />
                  </Link>
                ) : null}
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

      <Dialog
        open={motivo !== null}
        onOpenChange={fecharExclusao}
        title="Não dá para excluir esta receita"
        description={motivo ?? undefined}
        footer={
          <DialogClose asChild>
            <Button variant="primario">Entendi</Button>
          </DialogClose>
        }
      >
        <ul className="flex flex-col gap-1">
          {paraExcluir?.usadaEm.map((uso) => (
            <li key={uso.receitaId}>
              <Link
                href={`/receitas/${uso.receitaId}`}
                className="text-body text-accent underline"
              >
                {uso.nome}
              </Link>
            </li>
          ))}
        </ul>
      </Dialog>

      <ConfirmDialog
        open={paraExcluir !== null && motivo === null}
        onOpenChange={fecharExclusao}
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
