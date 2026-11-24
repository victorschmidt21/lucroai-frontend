'use client';

import type { UseQueryResult } from '@tanstack/react-query';
import { useRef, type Key, type ReactNode } from 'react';
import { getErrorMessage } from '@/shared/api/errors';
import { filtrarPorTexto, type CampoDeTexto } from '@/shared/api/filtros';
import { formatNumero } from '@/shared/format/numero';
import { Button } from './button';
import { DataTable, type DataTableColumn } from './data-table';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';
import { IconBusca } from './icons/acoes';
import { Input } from './input';
import { PageHeader } from './page-header';
import { useBuscaNaUrl } from './use-busca-na-url';

/** O que a `ListPage` usa do `useQuery` com a lista inteira (o backend não pagina). */
export type ListPageQuery<Row> = Pick<
  UseQueryResult<readonly Row[]>,
  'data' | 'error' | 'isPending' | 'isError' | 'isFetching' | 'refetch'
>;

type ListPageProps<Row> = {
  title: string;
  subtitle?: ReactNode;
  /** Ação primária ("Novo insumo"), com a variante `primario`. */
  actions?: ReactNode;
  /** Nome acessível da lista ("Insumos"). */
  label: string;
  query: ListPageQuery<Row>;
  columns: DataTableColumn<Row>[];
  getRowKey: (row: Row) => Key;
  /** Campo da busca; sem ele, não há busca. */
  searchField?: CampoDeTexto<Row> | ((row: Row) => string | null | undefined);
  /** Também é o rótulo acessível do campo ("Buscar insumo"). */
  searchPlaceholder?: string;
  /** Contagem de resultados: `{ singular: 'insumo', plural: 'insumos' }`. */
  itemLabel?: { singular: string; plural: string };
  /** Nenhum cadastro ainda: "Nenhum insumo encontrado." */
  emptyTitle: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  /** Ilustração "spot" do vazio sem cadastro (`shared/ui/ilustracoes`, FE-59). */
  emptyIlustracao?: ReactNode;
  /** "Não foi possível carregar os insumos." */
  errorTitle: string;
  /** Filtro extra, como `baixo=1` no estoque. */
  filter?: (row: Row) => boolean;
  /** Quando só o `filter` esvazia a lista. */
  filterEmptyTitle?: string;
  filterEmptyAction?: ReactNode;
  /** Cartão de resumo acima da lista (total de gastos). */
  summary?: ReactNode;
};

const LINHAS_DO_ESQUELETO = ['w-3/4', 'w-1/2', 'w-2/3'];

function ListaCarregando({ label }: { label: string }) {
  return (
    <output aria-label={label} className="flex flex-col gap-3">
      {LINHAS_DO_ESQUELETO.map((largura) => (
        <span
          key={largura}
          className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4"
        >
          <span
            className={`block h-4 animate-pulse rounded-sm bg-surface-alt motion-reduce:animate-none ${largura}`}
          />
          <span className="block h-3 w-1/3 animate-pulse rounded-sm bg-surface-alt motion-reduce:animate-none" />
        </span>
      ))}
    </output>
  );
}

/**
 * Tela de listagem: `PageHeader`, busca com debounce gravando `q` na URL, contagem,
 * cartões no celular e tabela no desktop, e os estados de carregamento, vazio, vazio
 * por busca e erro. Busca e filtros rodam no cliente, porque o backend não pagina.
 */
export function ListPage<Row>({
  title,
  subtitle,
  actions,
  label,
  query,
  columns,
  getRowKey,
  searchField,
  searchPlaceholder = 'Buscar',
  itemLabel = { singular: 'resultado', plural: 'resultados' },
  emptyTitle,
  emptyDescription,
  emptyAction,
  emptyIlustracao,
  errorTitle,
  filter,
  filterEmptyTitle = 'Nenhum resultado para os filtros.',
  filterEmptyAction,
  summary,
}: ListPageProps<Row>) {
  const busca = useBuscaNaUrl();
  const campoDeBusca = useRef<HTMLInputElement>(null);
  const termo = searchField ? busca.termo : '';

  function limparBusca() {
    busca.limpar();
    // O botão some com o estado vazio: o foco volta ao campo, e não ao `body`.
    campoDeBusca.current?.focus();
  }

  let conteudo: ReactNode;

  if (query.isPending) {
    conteudo = (
      <ListaCarregando
        label={`Carregando ${label.toLocaleLowerCase('pt-BR')}`}
      />
    );
  } else if (query.isError) {
    conteudo = (
      <ErrorState
        title={errorTitle}
        message={getErrorMessage(query.error)}
        onRetry={() => void query.refetch()}
        retrying={query.isFetching}
      />
    );
  } else {
    const todos = query.data ?? [];
    const filtrados = filter ? todos.filter(filter) : todos;
    const linhas = searchField
      ? filtrarPorTexto(filtrados, searchField, termo)
      : filtrados;

    if (todos.length === 0) {
      conteudo = (
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          action={emptyAction}
          ilustracao={emptyIlustracao}
        />
      );
    } else if (linhas.length === 0 && termo) {
      conteudo = (
        <EmptyState
          title={`Nenhum resultado para "${termo}"`}
          icon={<IconBusca />}
          action={
            <Button variant="secundario" onClick={limparBusca}>
              Limpar busca
            </Button>
          }
        />
      );
    } else if (linhas.length === 0) {
      conteudo = (
        <EmptyState title={filterEmptyTitle} action={filterEmptyAction} />
      );
    } else {
      conteudo = (
        <DataTable
          label={label}
          rows={linhas}
          columns={columns}
          getRowKey={getRowKey}
        />
      );
    }

    if (todos.length > 0) {
      conteudo = (
        <>
          {/* Anunciada ao filtrar, para quem usa leitor de tela saber o resultado. */}
          <output className="block text-small text-ink-muted tabular-nums">
            {`${formatNumero(linhas.length)} ${
              linhas.length === 1 ? itemLabel.singular : itemLabel.plural
            }`}
          </output>
          {conteudo}
        </>
      );
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title={title} subtitle={subtitle} actions={actions} />
      {summary}
      {searchField ? (
        <search>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              busca.aplicarAgora();
            }}
          >
            <Input
              ref={campoDeBusca}
              type="search"
              label={searchPlaceholder}
              hideLabel
              placeholder={searchPlaceholder}
              icon={<IconBusca className="size-5" />}
              value={busca.texto}
              onChange={(event) => busca.alterar(event.target.value)}
              autoComplete="off"
              enterKeyHint="search"
            />
          </form>
        </search>
      ) : null}
      {conteudo}
    </div>
  );
}
