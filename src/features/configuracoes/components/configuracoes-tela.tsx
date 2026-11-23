'use client';

import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { getErrorMessage } from '@/shared/api/errors';
import { Card } from '@/shared/ui/card';
import { ErrorState } from '@/shared/ui/error-state';
import { PageHeader } from '@/shared/ui/page-header';
import { SeletorAparencia } from '@/shared/ui/seletor-aparencia';
import { Skeleton } from '@/shared/ui/skeleton';
import {
  canaisOptions,
  configuracaoCustosOptions,
} from '../api/configuracoes.queries';
import { CanaisCard } from './canais-card';
import { ConfiguracaoCustosForm } from './configuracao-custos-form';

/**
 * Tela "Configurações de custo" (FE-41): como o negócio funciona, onde vende e,
 * desde a FE-52, a aparência do app.
 */
export function ConfiguracoesTela() {
  const configuracao = useQuery(configuracaoCustosOptions());
  const canais = useQuery(canaisOptions());

  let blocoConfiguracao: ReactNode;
  if (configuracao.isError) {
    blocoConfiguracao = (
      <ErrorState
        title="Não foi possível carregar as configurações."
        message={getErrorMessage(configuracao.error)}
        onRetry={() => void configuracao.refetch()}
        retrying={configuracao.isFetching}
      />
    );
  } else if (configuracao.data) {
    blocoConfiguracao = (
      <Card title="Como o seu negócio funciona">
        <ConfiguracaoCustosForm
          // Recria o formulário com os valores salvos quando eles mudam.
          key={JSON.stringify(configuracao.data)}
          configuracao={configuracao.data}
        />
      </Card>
    );
  } else {
    blocoConfiguracao = (
      <Skeleton aria-label="Carregando configurações" className="h-96" />
    );
  }

  let blocoCanais: ReactNode;
  if (canais.isError) {
    blocoCanais = (
      <ErrorState
        title="Não foi possível carregar as formas de venda."
        message={getErrorMessage(canais.error)}
        onRetry={() => void canais.refetch()}
        retrying={canais.isFetching}
      />
    );
  } else if (canais.data) {
    blocoCanais = <CanaisCard canais={canais.data} />;
  } else {
    blocoCanais = (
      <Skeleton aria-label="Carregando formas de venda" className="h-64" />
    );
  }

  return (
    <>
      <PageHeader
        title="Ajustes de preço"
        subtitle="Conte como o seu negócio funciona: o preço sugerido das receitas usa estas respostas."
      />
      <div className="grid items-start gap-6 lg:grid-cols-2">
        {blocoConfiguracao}
        {blocoCanais}
        <Card title="Aparência">
          <p className="text-body text-ink-muted">
            O claro é o mais fácil de ler na cozinha. O modo noite ajuda a
            anotar pedidos à noite.
          </p>
          <SeletorAparencia />
        </Card>
      </div>
    </>
  );
}
