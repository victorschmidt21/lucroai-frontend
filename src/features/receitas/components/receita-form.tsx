'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useFieldArray, useWatch } from 'react-hook-form';
import { gastosIndiretosListOptions } from '@/features/gastos-indiretos/api/gastos-indiretos.queries';
import { insumosListOptions } from '@/features/insumos/api/insumos.queries';
import type { GastoIndireto, Insumo } from '@/shared/api/contracts/catalog';
import { UNIDADE_MEDIDA_ROTULOS } from '@/shared/api/contracts/enums';
import type { Receita } from '@/shared/api/contracts/recipe';
import { getErrorMessage } from '@/shared/api/errors';
import { formatMoeda } from '@/shared/format/moeda';
import { percentualParaFracao } from '@/shared/format/numero';
import { parseInteiroBR, parseNumeroBR } from '@/shared/format/numero-br';
import { Button, IconButton } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { ErrorState } from '@/shared/ui/error-state';
import {
  Form,
  FormDecimalInput,
  FormInput,
  FormIntegerInput,
  FormPercentInput,
  FormUnidadeSelect,
} from '@/shared/ui/form';
import { IconAdicionar, IconExcluir } from '@/shared/ui/icons/acoes';
import { PageHeader } from '@/shared/ui/page-header';
import { Skeleton } from '@/shared/ui/skeleton';
import { useToast } from '@/shared/ui/toast';
import { receitaDetailOptions } from '../api/receitas.queries';
import { useCreateReceita } from '../hooks/use-create-receita';
import { useUpdateReceita } from '../hooks/use-update-receita';
import { calcularCustoItem, calcularPreviaReceita } from '../receitas.calculos';
import {
  NOME_MAX,
  receitaFormSchema,
  receitaFormVazio,
  toCreateReceitaBody,
  toReceitaFormInput,
  toUpdateReceitaBody,
  type ReceitaFormInput,
} from '../schemas/receita-form.schema';
import { AdicionarInsumoDialog } from './adicionar-insumo-dialog';
import { AvisoDeSaida } from './aviso-de-saida';

type Props = {
  /** Sem id, é criação (`/receitas/nova`). */
  receitaId?: number;
};

/**
 * Criação e edição de receita em página própria (no celular, a tela inteira,
 * como o bottom sheet em tela cheia do mobile). Origem: `_openReceitaForm` de
 * receitas_page.dart.
 */
export function ReceitaFormPagina({ receitaId }: Props) {
  const edicao = receitaId !== undefined;
  const receita = useQuery({
    ...receitaDetailOptions(receitaId ?? 0),
    enabled: edicao,
  });
  const insumos = useQuery(insumosListOptions());
  const gastos = useQuery(gastosIndiretosListOptions());
  const queries = edicao ? [receita, insumos, gastos] : [insumos, gastos];
  const comErro = queries.filter((query) => query.isError);

  let conteudo;
  if (comErro.length > 0) {
    conteudo = (
      <ErrorState
        title={
          edicao
            ? 'Não foi possível carregar a receita.'
            : 'Não foi possível carregar os insumos.'
        }
        message={getErrorMessage(comErro[0]?.error)}
        retrying={comErro.some((query) => query.isFetching)}
        onRetry={() => {
          for (const query of comErro) void query.refetch();
        }}
      />
    );
  } else if (!insumos.data || !gastos.data || (edicao && !receita.data)) {
    conteudo = (
      <div className="flex flex-col gap-4">
        <Skeleton aria-label="Carregando receita" className="h-12" />
        <Skeleton aria-label="Carregando insumos" className="h-40" />
      </div>
    );
  } else {
    conteudo = (
      <ReceitaForm
        receita={receita.data}
        insumos={insumos.data}
        gastos={gastos.data}
      />
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <PageHeader title={edicao ? 'Editar receita' : 'Nova receita'} />
      {conteudo}
    </div>
  );
}

function ReceitaForm({
  receita,
  insumos,
  gastos,
}: {
  receita?: Receita;
  insumos: Insumo[];
  gastos: GastoIndireto[];
}) {
  const router = useRouter();
  const toast = useToast();
  const create = useCreateReceita();
  const update = useUpdateReceita();

  return (
    <Form
      schema={receitaFormSchema}
      defaultValues={receita ? toReceitaFormInput(receita) : receitaFormVazio}
      submitLabel={receita ? 'Atualizar' : 'Salvar'}
      cancelHref="/receitas"
      // Rejeitar com o ApiError mantém o formulário preenchido, com o erro no topo.
      onSubmit={async (values) => {
        if (receita) {
          await update.mutateAsync({
            id: receita.id,
            body: toUpdateReceitaBody(values),
          });
          toast.success('Receita atualizada com sucesso.');
        } else {
          await create.mutateAsync(toCreateReceitaBody(values));
          toast.success('Receita criada com sucesso.');
        }
        router.push('/receitas');
      }}
    >
      <FormInput name="nome" label="Nome" maxLength={NOME_MAX} required />
      <div className="grid grid-cols-2 gap-3">
        <FormIntegerInput name="rendimento" label="Rendimento" required />
        <FormUnidadeSelect name="unidadeRendimento" label="Unidade" required />
      </div>
      <FormPercentInput name="margem_lucro" label="Margem de lucro (%)" />
      <InsumosDaReceita insumos={insumos} />
      <PreviaDeCustos
        insumos={insumos}
        gastos={gastos}
        margemSalva={receita?.margemLucro}
      />
      {receita ? <ValoresSalvos receita={receita} /> : null}
      <AvisoDeSaida />
    </Form>
  );
}

function nomeDoInsumo(insumo: Insumo | undefined, insumoId: number) {
  return insumo?.nome ?? `Insumo #${insumoId}`;
}

function InsumosDaReceita({ insumos }: { insumos: Insumo[] }) {
  const { fields, append, remove } = useFieldArray<ReceitaFormInput, 'insumos'>(
    { name: 'insumos' },
  );
  const quantidades = useWatch<ReceitaFormInput, 'insumos'>({
    name: 'insumos',
  });
  const [adicionando, setAdicionando] = useState(false);
  const porId = new Map(insumos.map((insumo) => [insumo.id, insumo]));
  const naReceita = new Set(fields.map((field) => field.insumo_id));
  const disponiveis = insumos.filter((insumo) => !naReceita.has(insumo.id));
  const todosAdicionados = disponiveis.length === 0 && insumos.length > 0;

  return (
    <Card title="Insumos">
      {fields.length === 0 ? (
        <p className="text-body text-ink-muted">Nenhum insumo adicionado.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {fields.map((field, indice) => {
            const insumo = porId.get(field.insumo_id);
            const nome = nomeDoInsumo(insumo, field.insumo_id);
            const quantidade = parseNumeroBR(quantidades?.[indice]?.quantidade);
            const custo =
              insumo && quantidade !== null
                ? calcularCustoItem(quantidade, insumo.custoUnitario)
                : null;

            return (
              <li
                key={field.id}
                className="flex flex-wrap items-start gap-3 rounded-md border border-border bg-surface-alt p-3"
              >
                <div className="flex min-w-0 grow basis-40 flex-col gap-0.5 pt-1">
                  <p className="text-body font-medium wrap-anywhere text-ink">
                    {nome}
                  </p>
                  <p className="text-small text-ink-muted tabular-nums">
                    Custo: {formatMoeda(custo)}
                  </p>
                </div>
                <div className="w-36">
                  <FormDecimalInput
                    name={`insumos.${indice}.quantidade`}
                    label="Quantidade"
                    aria-label={`Quantidade de ${nome}`}
                    unidade={
                      insumo
                        ? UNIDADE_MEDIDA_ROTULOS[insumo.unidade]
                        : undefined
                    }
                  />
                </div>
                <IconButton
                  aria-label={`Remover ${nome}`}
                  className="mt-7"
                  onClick={() => remove(indice)}
                >
                  <IconExcluir />
                </IconButton>
              </li>
            );
          })}
        </ul>
      )}
      <Button
        variant="secundario"
        disabled={disponiveis.length === 0}
        onClick={() => setAdicionando(true)}
      >
        <IconAdicionar className="size-5" />
        {todosAdicionados ? 'Todos os insumos adicionados' : 'Adicionar insumo'}
      </Button>
      <AdicionarInsumoDialog
        open={adicionando}
        onOpenChange={setAdicionando}
        disponiveis={disponiveis}
        onAdicionar={(item) => append(item)}
      />
    </Card>
  );
}

function Linha({
  rotulo,
  valor,
  destaque = false,
}: {
  rotulo: string;
  valor: string;
  destaque?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-body text-ink-muted">{rotulo}</dt>
      <dd
        className={
          destaque
            ? 'text-body font-semibold text-ink tabular-nums'
            : 'text-body text-ink tabular-nums'
        }
      >
        {valor}
      </dd>
    </div>
  );
}

/**
 * Prévia calculada no cliente com as fórmulas do backend, incluindo o custo
 * invisível (lacuna 18). Margem vazia na edição não é enviada, e o backend
 * mantém a salva: a prévia usa a salva nesse caso (lacuna 21).
 */
function PreviaDeCustos({
  insumos,
  gastos,
  margemSalva,
}: {
  insumos: Insumo[];
  gastos: GastoIndireto[];
  margemSalva: number | undefined;
}) {
  const [rendimento, margemDigitada, itens] = useWatch<
    ReceitaFormInput,
    ['rendimento', 'margem_lucro', 'insumos']
  >({ name: ['rendimento', 'margem_lucro', 'insumos'] });
  const porId = new Map(insumos.map((insumo) => [insumo.id, insumo]));
  const margemEmPontos = parseNumeroBR(margemDigitada);
  const margem =
    margemEmPontos === null
      ? margemDigitada?.trim()
        ? undefined
        : margemSalva
      : percentualParaFracao(margemEmPontos);

  const previa = calcularPreviaReceita({
    itens: (itens ?? []).map((item) => ({
      quantidade: parseNumeroBR(item.quantidade),
      custoUnitario: porId.get(item.insumo_id)?.custoUnitario ?? null,
    })),
    rendimento: parseInteiroBR(rendimento),
    margem,
    gastos,
  });

  return (
    <Card title="Prévia dos custos">
      <dl aria-live="polite" className="flex flex-col gap-2">
        <Linha rotulo="Insumos" valor={formatMoeda(previa.custoInsumos)} />
        <Linha
          rotulo="Gastos indiretos (1 lote)"
          valor={formatMoeda(previa.custoInvisivel)}
        />
        <Linha
          rotulo="Custo produção"
          valor={formatMoeda(previa.custoProducao)}
          destaque
        />
        <Linha
          rotulo="Custo unitário"
          valor={formatMoeda(previa.custoUnitario)}
          destaque
        />
        <Linha
          rotulo="Preço sugerido"
          valor={formatMoeda(previa.precoSugerido)}
          destaque
        />
      </dl>
      <p className="text-small text-ink-muted">
        Estimativa enquanto você edita. O valor gravado é o calculado pelo
        servidor ao salvar.
      </p>
    </Card>
  );
}

function ValoresSalvos({ receita }: { receita: Receita }) {
  return (
    <Card title="Valores salvos">
      <dl className="flex flex-col gap-2">
        <Linha
          rotulo="Custo produção"
          valor={formatMoeda(receita.custoProducao)}
        />
        <Linha
          rotulo="Custo unitário"
          valor={formatMoeda(receita.custoUnitario)}
        />
        <Linha
          rotulo="Preço sugerido"
          valor={formatMoeda(receita.precoSugerido)}
        />
      </dl>
    </Card>
  );
}
