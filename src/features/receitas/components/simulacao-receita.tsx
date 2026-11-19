'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { FormProvider, useForm } from 'react-hook-form';
import type {
  PrecoVenda,
  Receita,
  ReceitaCusto,
  SimulacaoCenario,
} from '@/shared/api/contracts/recipe';
import { ApiError, getErrorMessage } from '@/shared/api/errors';
import { formatMoeda } from '@/shared/format/moeda';
import { formatMargem, formatNumero } from '@/shared/format/numero';
import { Alert } from '@/shared/ui/alert';
import { Button, buttonClasses } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { cn } from '@/shared/ui/cn';
import { ErrorState } from '@/shared/ui/error-state';
import {
  FormIntegerInput,
  FormMoneyInput,
  FormPercentInput,
} from '@/shared/ui/form';
import { IconInfo } from '@/shared/ui/icons/acoes';
import { PageHeader } from '@/shared/ui/page-header';
import { Skeleton } from '@/shared/ui/skeleton';
import {
  receitaCustoOptions,
  receitaDetailOptions,
} from '../api/receitas.queries';
import {
  useCalcularPrecoVenda,
  useSimularCenario,
  useSimularReceitaCusto,
} from '../hooks/use-simulacao-receita';
import {
  custoLotesFormSchema,
  precoMargemFormSchema,
  simulacaoCenarioFormSchema,
  toPrecoMargemFormInput,
  toPrecoVendaBody,
  toSimulacaoCenarioFormInput,
  toSimularCenarioBody,
  toSimularReceitaCustoBody,
  type CustoLotesFormInput,
  type CustoLotesFormValues,
  type PrecoMargemFormInput,
  type PrecoMargemFormValues,
  type SimulacaoCenarioFormInput,
  type SimulacaoCenarioFormValues,
} from '../schemas/simulacao-form.schema';

/**
 * Mensagem do backend com o nome do campo trocado pelo rótulo da tela, ou
 * "Erro ao simular." (docs/business-rules.md#simulação-de-cenário-da-receita).
 */
function mensagemDeErro(error: unknown) {
  if (!(error instanceof ApiError)) return 'Erro ao simular.';

  return error.message
    .replace('Informe novoCusto', 'Informe o custo por unidade')
    .replace('Informe novoPreco', 'Informe o preço de venda');
}

/**
 * Simulação de cenário de uma receita (FE-20). Origem: simulacao_page.dart.
 * Todos os valores do resultado vêm do backend.
 */
export function SimulacaoReceitaPagina({ receitaId }: { receitaId: number }) {
  const receita = useQuery(receitaDetailOptions(receitaId));

  let conteudo;
  if (receita.isError) {
    conteudo = (
      <ErrorState
        title="Não foi possível carregar a receita."
        message={getErrorMessage(receita.error)}
        retrying={receita.isFetching}
        onRetry={() => void receita.refetch()}
      />
    );
  } else if (!receita.data) {
    conteudo = <Skeleton aria-label="Carregando receita" className="h-64" />;
  } else {
    conteudo = (
      <div className="flex flex-col gap-4">
        <p className="text-body font-semibold wrap-anywhere text-ink">
          {receita.data.nome}
        </p>
        <CenarioCard receita={receita.data} />
        <div className="grid items-start gap-4 md:grid-cols-2">
          <PrecoMargemCard receita={receita.data} />
          <CustoLotesCard receitaId={receitaId} />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <PageHeader
        title="Simulação de cenário"
        subtitle="Ajuste os valores e veja o impacto no lucro"
        actions={
          <Link href="/receitas" className={buttonClasses('secundario')}>
            Voltar para receitas
          </Link>
        }
      />
      {conteudo}
    </div>
  );
}

function CenarioCard({ receita }: { receita: Receita }) {
  const simular = useSimularCenario();
  const form = useForm<
    SimulacaoCenarioFormInput,
    unknown,
    SimulacaoCenarioFormValues
  >({
    resolver: zodResolver(simulacaoCenarioFormSchema),
    defaultValues: toSimulacaoCenarioFormInput(receita),
    shouldFocusError: true,
  });

  const enviar = form.handleSubmit((valores) => {
    simular.mutate({ id: receita.id, body: toSimularCenarioBody(valores) });
  });

  return (
    <>
      <Card title="Parâmetros">
        <FormProvider {...form}>
          <form
            noValidate
            aria-label="Parâmetros da simulação"
            onSubmit={(event) => void enviar(event)}
            className="flex flex-col gap-4"
          >
            <div className="grid gap-4 sm:grid-cols-3">
              <FormMoneyInput
                name="novoCusto"
                label="Custo por unidade (R$)"
                placeholder="Ex.: 2,50"
              />
              <FormMoneyInput
                name="novoPreco"
                label="Preço de venda (R$)"
                placeholder="Ex.: 5,00"
              />
              <FormIntegerInput
                name="volume"
                label="Quantidade (unidades)"
                placeholder="Ex.: 12"
              />
            </div>
            <Button
              type="submit"
              loading={simular.isPending}
              className="sm:self-end"
            >
              Simular
            </Button>
          </form>
        </FormProvider>
      </Card>

      <div aria-live="polite">
        {simular.isError ? (
          <Alert>{mensagemDeErro(simular.error)}</Alert>
        ) : simular.data ? (
          <ResultadoCenario resultado={simular.data} />
        ) : null}
      </div>
    </>
  );
}

function Indicador({
  rotulo,
  valor,
  className,
}: {
  rotulo: string;
  valor: string;
  className?: string;
}) {
  return (
    <div className="flex min-w-0 flex-col-reverse gap-1 rounded-md bg-surface-alt px-3 py-2.5">
      <dt className="text-caption text-ink-muted">{rotulo}</dt>
      <dd
        className={cn(
          'text-body font-semibold wrap-anywhere tabular-nums',
          className,
        )}
      >
        {valor}
      </dd>
    </div>
  );
}

function ResultadoCenario({ resultado }: { resultado: SimulacaoCenario }) {
  const positivo = resultado.lucroEstimado >= 0;

  return (
    <Card title="Resultado">
      <div
        className={cn(
          'flex flex-wrap items-center justify-between gap-2 rounded-md border px-3.5 py-3',
          positivo
            ? 'border-success/40 bg-success/8'
            : 'border-danger/40 bg-danger/8',
        )}
      >
        <span className="text-body text-ink-muted">Lucro estimado</span>
        <span
          className={cn(
            'text-title font-bold tabular-nums',
            positivo ? 'text-success' : 'text-danger',
          )}
        >
          {formatMoeda(resultado.lucroEstimado)}
        </span>
      </div>
      <dl className="grid grid-cols-2 gap-2.5">
        <Indicador
          rotulo="Margem projetada"
          valor={formatMargem(resultado.margemProjetada)}
          className={
            resultado.margemProjetada >= 0 ? 'text-success' : 'text-danger'
          }
        />
        <Indicador
          rotulo="Custo/unidade"
          valor={formatMoeda(resultado.custoUnitario)}
        />
        <Indicador
          rotulo="Preço de venda"
          valor={formatMoeda(resultado.precoVenda)}
        />
        <Indicador
          rotulo="Volume simulado"
          valor={`${formatNumero(resultado.volume)} un.`}
        />
      </dl>
      <p className="flex items-start gap-2 rounded-md bg-surface-alt px-3 py-2.5 text-small text-ink-muted">
        <IconInfo className="mt-0.5 shrink-0" />
        {`Venda pelo menos ${formatNumero(resultado.breakEven)} unidades para não ter prejuízo.`}
      </p>
    </Card>
  );
}

function PrecoMargemCard({ receita }: { receita: Receita }) {
  const calcular = useCalcularPrecoVenda();
  const form = useForm<PrecoMargemFormInput, unknown, PrecoMargemFormValues>({
    resolver: zodResolver(precoMargemFormSchema),
    defaultValues: toPrecoMargemFormInput(receita),
    shouldFocusError: true,
  });

  const enviar = form.handleSubmit((valores) => {
    calcular.mutate({ id: receita.id, body: toPrecoVendaBody(valores) });
  });

  return (
    <Card title="Preço para margem desejada">
      <FormProvider {...form}>
        <form
          noValidate
          aria-label="Preço para margem desejada"
          onSubmit={(event) => void enviar(event)}
          className="flex flex-col gap-3"
        >
          <FormPercentInput name="margem" label="Margem de lucro" />
          <Button
            type="submit"
            variant="secundario"
            loading={calcular.isPending}
          >
            Calcular preço
          </Button>
        </form>
      </FormProvider>
      <div aria-live="polite">
        {calcular.isError ? (
          <Alert>{mensagemDeErro(calcular.error)}</Alert>
        ) : calcular.data ? (
          <ResultadoPreco resultado={calcular.data} />
        ) : null}
      </div>
    </Card>
  );
}

function ResultadoPreco({ resultado }: { resultado: PrecoVenda }) {
  return (
    <dl className="grid gap-2.5">
      <Indicador
        rotulo="Preço sugerido"
        valor={formatMoeda(resultado.preco_sugerido)}
        className="text-accent"
      />
      <Indicador
        rotulo="Custo/unidade"
        valor={formatMoeda(resultado.custo_total_unitario)}
      />
      <Indicador
        rotulo="Lucro por unidade"
        valor={formatMoeda(resultado.lucro_por_unidade)}
      />
    </dl>
  );
}

function CustoLotesCard({ receitaId }: { receitaId: number }) {
  const custoAtual = useQuery(receitaCustoOptions(receitaId));
  const simular = useSimularReceitaCusto();
  const form = useForm<CustoLotesFormInput, unknown, CustoLotesFormValues>({
    resolver: zodResolver(custoLotesFormSchema),
    defaultValues: { quantidadeLotes: '1' },
    shouldFocusError: true,
  });

  const enviar = form.handleSubmit((valores) => {
    simular.mutate({
      id: receitaId,
      body: toSimularReceitaCustoBody(valores),
    });
  });

  let resultado;
  if (simular.data) {
    resultado = <ResultadoCusto custo={simular.data} />;
  } else if (simular.isError) {
    resultado = <Alert>{mensagemDeErro(simular.error)}</Alert>;
  } else if (custoAtual.isError) {
    resultado = (
      <ErrorState
        title="Não foi possível carregar o custo."
        message={getErrorMessage(custoAtual.error)}
        retrying={custoAtual.isFetching}
        onRetry={() => void custoAtual.refetch()}
      />
    );
  } else if (custoAtual.data) {
    resultado = <ResultadoCusto custo={custoAtual.data} />;
  } else {
    resultado = <Skeleton aria-label="Carregando custo" className="h-32" />;
  }

  return (
    <Card title="Custo para N lotes">
      <FormProvider {...form}>
        <form
          noValidate
          aria-label="Custo para N lotes"
          onSubmit={(event) => void enviar(event)}
          className="flex flex-col gap-3"
        >
          <FormIntegerInput
            name="quantidadeLotes"
            label="Quantidade de lotes"
          />
          <Button
            type="submit"
            variant="secundario"
            loading={simular.isPending}
          >
            Calcular custo
          </Button>
        </form>
      </FormProvider>
      <div aria-live="polite">{resultado}</div>
    </Card>
  );
}

function ResultadoCusto({ custo }: { custo: ReceitaCusto }) {
  const lotes = custo.quantidade_lotes === 1 ? 'lote' : 'lotes';

  return (
    <dl className="grid gap-2.5">
      <Indicador
        rotulo={`Custo total (${formatNumero(custo.quantidade_lotes)} ${lotes})`}
        valor={formatMoeda(custo.custo_total_producao)}
        className="text-accent"
      />
      <Indicador
        rotulo="Custo/unidade"
        valor={formatMoeda(custo.custo_por_unidade)}
      />
      <Indicador
        rotulo="Custos invisíveis"
        valor={formatMoeda(custo.custo_invisivel)}
      />
      <Indicador
        rotulo="Total de unidades"
        valor={`${formatNumero(custo.total_unidades)} un.`}
      />
    </dl>
  );
}
