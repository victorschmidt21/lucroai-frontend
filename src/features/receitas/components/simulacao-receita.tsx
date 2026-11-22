'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import type { ChangeEvent } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import type {
  Receita,
  ReceitaCusto,
  SimulacaoCenario,
} from '@/shared/api/contracts/recipe';
import { ApiError, getErrorMessage } from '@/shared/api/errors';
import { formatMoeda } from '@/shared/format/moeda';
import { formatNumero } from '@/shared/format/numero';
import { Alert } from '@/shared/ui/alert';
import { Button, buttonClasses } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { cn } from '@/shared/ui/cn';
import { ErrorState } from '@/shared/ui/error-state';
import { FormIntegerInput, FormMoneyInput } from '@/shared/ui/form';
import { IconInfo } from '@/shared/ui/icons/acoes';
import { PageHeader } from '@/shared/ui/page-header';
import { Select } from '@/shared/ui/select';
import { Skeleton } from '@/shared/ui/skeleton';
import {
  receitaCustoOptions,
  receitaDetailOptions,
} from '../api/receitas.queries';
import {
  useSimularCenario,
  useSimularReceitaCusto,
} from '../hooks/use-simulacao-receita';
import { formatarResultadoDaSimulacao } from '../receitas.calculos';
import {
  custoLotesFormSchema,
  precoDoCanalNoCampo,
  simulacaoCenarioFormSchema,
  toSimulacaoCenarioFormInput,
  toSimularCenarioBody,
  toSimularReceitaCustoBody,
  type CustoLotesFormInput,
  type CustoLotesFormValues,
  type SimulacaoCenarioFormInput,
  type SimulacaoCenarioFormValues,
} from '../schemas/simulacao-form.schema';

/**
 * Mensagem do backend com o nome do campo trocado pelo rótulo da tela, ou
 * "Erro ao simular." (docs/business-rules.md#simulação-de-cenário-da-receita).
 */
function mensagemDeErro(error: unknown) {
  if (!(error instanceof ApiError)) return 'Erro ao simular.';

  return error.message.replace(
    'Informe novoPreco',
    'Informe o preço que você cobra',
  );
}

/**
 * Simulação de uma receita (FE-20, refeita na FE-45): o preço que cobra, o
 * canal e as unidades por mês. Todos os valores do resultado vêm do backend.
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
        <CustoLotesCard receitaId={receitaId} />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <PageHeader
        title="Simulação de cenário"
        subtitle="Quanto você lucra cobrando este preço?"
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
    simular.mutate({
      id: receita.id,
      body: toSimularCenarioBody(valores, receita),
    });
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
                name="novoPreco"
                label="Preço que você cobra (R$)"
                placeholder="Ex.: 5,00"
              />
              <Select
                label="Onde vende"
                {...form.register('canalId', {
                  // Trocar o canal põe no campo o preço sugerido naquele canal.
                  onChange: (event: ChangeEvent<HTMLSelectElement>) =>
                    form.setValue(
                      'novoPreco',
                      precoDoCanalNoCampo(receita, Number(event.target.value)),
                    ),
                })}
                error={form.formState.errors.canalId?.message}
              >
                {receita.precos.map((preco) => (
                  <option key={preco.canalId} value={String(preco.canalId)}>
                    {preco.canal}
                  </option>
                ))}
              </Select>
              <FormIntegerInput
                name="volume"
                label="Unidades vendidas por mês"
                placeholder="Ex.: 300"
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
  const textos = formatarResultadoDaSimulacao(resultado);
  const tom = textos.prejuizo ? 'text-danger' : 'text-success';

  return (
    <Card title="Resultado">
      {textos.aviso ? (
        <Alert className="font-semibold text-danger">{textos.aviso}</Alert>
      ) : null}
      <div
        className={cn(
          'flex flex-wrap items-center justify-between gap-2 rounded-md border px-3.5 py-3',
          textos.prejuizo
            ? 'border-danger/40 bg-danger/8'
            : 'border-success/40 bg-success/8',
        )}
      >
        <span className="text-body text-ink-muted">Lucro no mês</span>
        <span className={cn('text-title font-bold tabular-nums', tom)}>
          {textos.lucroMes}
        </span>
      </div>
      <dl className="grid grid-cols-2 gap-2.5">
        <Indicador
          rotulo="Lucro por unidade"
          valor={textos.lucroPorUnidade}
          className={tom}
        />
        <Indicador
          rotulo="Lucro real (do preço)"
          valor={textos.lucroReal}
          className={tom}
        />
        <Indicador
          rotulo={`Preço (${resultado.canal})`}
          valor={formatMoeda(resultado.precoVenda)}
        />
        <Indicador
          rotulo="Custo por unidade"
          valor={formatMoeda(resultado.custoUnitario)}
        />
        <Indicador
          rotulo="Unidades por mês"
          valor={`${formatNumero(resultado.volume)} un.`}
        />
        <Indicador
          rotulo="Contas do mês"
          valor={formatMoeda(resultado.gastosMensais)}
        />
      </dl>
      {textos.pontoEquilibrio ? (
        <p className="flex items-start gap-2 rounded-md bg-surface-alt px-3 py-2.5 text-small text-ink-muted">
          <IconInfo className="mt-0.5 shrink-0" />
          {textos.pontoEquilibrio}
        </p>
      ) : null}
    </Card>
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
