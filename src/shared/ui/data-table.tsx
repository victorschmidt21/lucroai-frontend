// Os papéis explícitos são necessários: `display: block` (cartões no celular) faz o
// navegador perder a semântica de tabela, então a tag sozinha não basta.
// oxlint-disable jsx-a11y/prefer-tag-over-role, jsx-a11y/no-redundant-roles, jsx-a11y/no-interactive-element-to-noninteractive-role

import type { Key, ReactNode } from 'react';
import { cn } from './cn';

export type DataTableColumn<Row> = {
  id: string;
  header: string;
  cell: (row: Row) => ReactNode;
  /** Números e valores à direita, para compará-los na vertical. */
  align?: 'right';
  /** Coluna de botões: à direita na tabela e no rodapé do cartão no celular. */
  acoes?: boolean;
};

type DataTableProps<Row> = {
  /** Nome acessível da tabela ("Insumos"). */
  label: string;
  rows: readonly Row[];
  columns: DataTableColumn<Row>[];
  getRowKey: (row: Row) => Key;
};

/**
 * Lista em cartões no celular e em tabela a partir de `md`, só com CSS e sem repetir
 * o conteúdo no DOM. No cartão, a primeira coluna é o título (como o nome do insumo
 * nos cards do mobile), as outras ganham o rótulo da coluna, e as ações vão ao rodapé.
 */
export function DataTable<Row>({
  label,
  rows,
  columns,
  getRowKey,
}: DataTableProps<Row>) {
  const tituloId = columns.find((coluna) => !coluna.acoes)?.id;

  return (
    // No desktop, uma tabela com muitas colunas rola aqui dentro, sem estourar a página.
    <div
      role="region"
      aria-label={label}
      // A região precisa receber foco para ser rolada pelo teclado (WCAG 2.1.1).
      // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
      className="md:overflow-x-auto md:rounded-md md:border md:border-border md:bg-surface"
    >
      <table
        role="table"
        aria-label={label}
        className="block w-full border-collapse md:table"
      >
        <thead role="rowgroup" className="hidden md:table-header-group">
          <tr role="row" className="border-b border-border">
            {columns.map(({ id, header, align, acoes }) => (
              <th
                key={id}
                role="columnheader"
                scope="col"
                className={cn(
                  'px-4 py-3 text-left text-small font-semibold whitespace-nowrap text-ink-muted',
                  (align === 'right' || acoes) && 'text-right',
                  acoes && 'w-px',
                )}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody
          role="rowgroup"
          className="flex flex-col gap-3 md:table-row-group"
        >
          {rows.map((row) => (
            <tr
              key={getRowKey(row)}
              role="row"
              className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-md border border-border bg-surface p-4 md:table-row md:rounded-none md:border-0 md:border-b md:bg-transparent md:p-0 md:last:border-b-0 md:hover:bg-surface-alt"
            >
              {columns.map(({ id, header, cell, align, acoes }) => {
                const isTitulo = id === tituloId;

                return (
                  <td
                    key={id}
                    role="cell"
                    className={cn(
                      'flex min-w-0 flex-col gap-0.5 text-body text-ink md:table-cell md:px-4 md:py-3 md:align-middle',
                      isTitulo && 'col-span-2 font-semibold',
                      align === 'right' && 'tabular-nums md:text-right',
                      acoes &&
                        'col-span-2 -mb-2 flex-row justify-end border-t border-border pt-2 md:mb-0 md:border-t-0 md:whitespace-nowrap',
                    )}
                  >
                    {isTitulo || acoes ? null : (
                      <span className="text-caption text-ink-muted md:hidden">
                        {header}
                      </span>
                    )}
                    {acoes ? (
                      <span className="flex justify-end gap-1">
                        {cell(row)}
                      </span>
                    ) : (
                      <span className="wrap-anywhere">{cell(row)}</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
