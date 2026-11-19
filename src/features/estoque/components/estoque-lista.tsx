'use client';

import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { getErrorMessage } from '@/shared/api/errors';
import { hrefComFiltros, lerFiltros } from '@/shared/api/filtros';
import { isBaixoEstoque } from '@/shared/domain/estoque';
import { Button, buttonClasses } from '@/shared/ui/button';
import { Chip } from '@/shared/ui/chip';
import { EmptyState } from '@/shared/ui/empty-state';
import { ErrorState } from '@/shared/ui/error-state';
import {
  IconAdicionar,
  IconAtualizar,
  IconFechar,
  IconFiltro,
} from '@/shared/ui/icons/acoes';
import { IconEstoque } from '@/shared/ui/icons/menu';
import { PageHeader } from '@/shared/ui/page-header';
import { SegmentedControl } from '@/shared/ui/segmented-control';
import { estoqueKeys } from '../api/estoque.queries';
import { useEstoques, type ItemEstoque } from '../hooks/use-estoques';
import { estoqueSearchSchema } from '../schemas/estoque-search.schema';
import { EstoqueCard } from './estoque-card';

type FiltroStatus = 'todos' | 'baixo';

const OPCOES_STATUS = [
  { value: 'todos', label: 'Todos' },
  { value: 'baixo', label: 'Baixo' },
] satisfies { value: FiltroStatus; label: string }[];

/**
 * Com o filtro "Baixo", um item ainda carregando ou com erro continua visível: sem
 * o saldo, não dá para saber se ele está abaixo do mínimo.
 */
function passaNoFiltro({ estoque }: ItemEstoque, apenasBaixo: boolean) {
  if (!apenasBaixo || !estoque.isSuccess) return true;
  return isBaixoEstoque(estoque.data);
}

/** Tela de estoque. Origem: estoques_page.dart. */
export function EstoqueLista() {
  const { insumos, itens } = useEstoques();
  const queryClient = useQueryClient();
  const [atualizando, setAtualizando] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const apenasBaixo =
    lerFiltros(estoqueSearchSchema, searchParams).baixo === '1';

  function alterarFiltro(baixo: boolean) {
    router.replace(hrefComFiltros(pathname, searchParams, { baixo }), {
      scroll: false,
    });
  }

  async function atualizar() {
    setAtualizando(true);
    try {
      await Promise.all([
        insumos.refetch(),
        queryClient.invalidateQueries({ queryKey: estoqueKeys.all }),
      ]);
    } finally {
      setAtualizando(false);
    }
  }

  const visiveis = itens.filter((item) => passaNoFiltro(item, apenasBaixo));

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Estoque"
        subtitle="Acompanhe disponibilidade e alertas"
        actions={
          <Button
            variant="secundario"
            loading={atualizando}
            onClick={() => void atualizar()}
          >
            {atualizando ? null : <IconAtualizar className="size-5" />}
            Atualizar
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <span aria-hidden className="text-small text-ink-muted">
          Status
        </span>
        <SegmentedControl
          aria-label="Status"
          options={OPCOES_STATUS}
          value={apenasBaixo ? 'baixo' : 'todos'}
          onValueChange={(valor) => alterarFiltro(valor === 'baixo')}
        />
      </div>

      {apenasBaixo ? (
        <div className="flex flex-wrap items-center gap-2">
          <IconFiltro className="size-4 text-accent" />
          <Chip>Baixo Estoque</Chip>
          <Button
            variant="fantasma"
            size="compacto"
            onClick={() => alterarFiltro(false)}
          >
            <IconFechar className="size-4" />
            Limpar
          </Button>
        </div>
      ) : null}

      {insumos.isPending ? (
        <output
          aria-label="Carregando estoques"
          className="grid gap-3 md:grid-cols-2 xl:grid-cols-3"
        >
          {[0, 1, 2].map((chave) => (
            <span
              key={chave}
              className="block h-44 animate-pulse rounded-md border border-border bg-surface motion-reduce:animate-none"
            />
          ))}
        </output>
      ) : insumos.isError ? (
        <ErrorState
          title="Erro ao carregar estoques"
          message={getErrorMessage(insumos.error)}
          onRetry={() => void insumos.refetch()}
          retrying={insumos.isFetching}
        />
      ) : itens.length === 0 ? (
        <EmptyState
          icon={<IconEstoque />}
          title="Nenhum estoque encontrado"
          description="Comece adicionando insumos"
          action={
            <Link href="/insumos?novo=1" className={buttonClasses()}>
              <IconAdicionar className="size-5" />
              Novo insumo
            </Link>
          }
        />
      ) : visiveis.length === 0 ? (
        <EmptyState
          icon={<IconEstoque />}
          title="Nenhum estoque encontrado"
          description="Nenhum insumo está abaixo do estoque mínimo."
          action={
            <Button variant="secundario" onClick={() => alterarFiltro(false)}>
              Limpar filtro
            </Button>
          }
        />
      ) : (
        <ul
          aria-label="Estoques"
          className="grid gap-3 md:grid-cols-2 xl:grid-cols-3"
        >
          {visiveis.map((item) => (
            <li key={item.insumo.id}>
              <EstoqueCard {...item} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
