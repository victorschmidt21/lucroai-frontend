'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useFieldArray, useWatch } from 'react-hook-form';
import { configuracaoCustosOptions } from '@/features/configuracoes/api/configuracoes.queries';
import { insumosListOptions } from '@/features/insumos/api/insumos.queries';
import type { Insumo } from '@/shared/api/contracts/catalog';
import { UNIDADE_MEDIDA_ROTULOS } from '@/shared/api/contracts/enums';
import type { ConfiguracaoCustos } from '@/shared/api/contracts/pricing';
import type { Receita } from '@/shared/api/contracts/recipe';
import { getErrorMessage } from '@/shared/api/errors';
import { formatMoeda } from '@/shared/format/moeda';
import { formatMargem } from '@/shared/format/numero';
import { parseNumeroBR } from '@/shared/format/numero-br';
import { Button, IconButton } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { ErrorState } from '@/shared/ui/error-state';
import {
  Form,
  FormDecimalInput,
  FormInput,
  FormIntegerInput,
  FormMoneyInput,
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
import { Termo } from '@/features/aprender/components/termo';
import { calcularCustoItem } from '../receitas.calculos';
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
  const configuracao = useQuery(configuracaoCustosOptions());
  const queries = edicao
    ? [receita, insumos, configuracao]
    : [insumos, configuracao];
  const comErro = queries.filter((query) => query.isError);

  let conteudo;
  if (comErro.length > 0) {
    conteudo = (
      <ErrorState
        title={
          edicao
            ? 'Não foi possível carregar a receita.'
            : 'Não consegui buscar seus ingredientes agora.'
        }
        message={getErrorMessage(comErro[0]?.error)}
        retrying={comErro.some((query) => query.isFetching)}
        onRetry={() => {
          for (const query of comErro) void query.refetch();
        }}
      />
    );
  } else if (!insumos.data || !configuracao.data || (edicao && !receita.data)) {
    conteudo = (
      <div className="flex flex-col gap-4">
        <Skeleton aria-label="Carregando receita" className="h-12" />
        <Skeleton aria-label="Carregando ingredientes" className="h-40" />
      </div>
    );
  } else {
    conteudo = (
      <ReceitaForm
        receita={receita.data}
        insumos={insumos.data}
        configuracao={configuracao.data}
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
  configuracao,
}: {
  receita?: Receita;
  insumos: Insumo[];
  configuracao: ConfiguracaoCustos;
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
      // Depois de salvar, o detalhe mostra o custo e os preços calculados pela API.
      onSubmit={async (values) => {
        let salva: Receita;
        if (receita) {
          salva = await update.mutateAsync({
            id: receita.id,
            body: toUpdateReceitaBody(values),
          });
          toast.success('Receita atualizada com sucesso.');
        } else {
          salva = await create.mutateAsync(toCreateReceitaBody(values));
          toast.success('Receita criada com sucesso.');
        }
        router.push(`/receitas/${salva.id}`);
      }}
    >
      <FormInput name="nome" label="Nome" maxLength={NOME_MAX} required />
      <div className="grid grid-cols-2 gap-3">
        <FormIntegerInput
          name="rendimento"
          label={
            <>
              Rende quantas <Termo id="rendimento">unidades boas</Termo>?
            </>
          }
          hint="Por lote, sem contar as que sobram ou estragam."
          required
        />
        <FormUnidadeSelect name="unidadeRendimento" label="Unidade" required />
      </div>
      <InsumosDaReceita insumos={insumos} />
      <Card title="Custos e lucro">
        <div className="grid gap-3 sm:grid-cols-2">
          <FormDecimalInput
            name="uso_por_lote"
            label={
              <Termo id="divisao-das-contas">
                {configuracao.baseRateio === 'MINUTOS'
                  ? 'Quantos minutos de forno um lote ocupa?'
                  : 'Quantas fornadas um lote ocupa?'}
              </Termo>
            }
            hint="Divide as contas do mês entre as receitas. Padrão: 1."
            required
          />
          <FormMoneyInput
            name="embalagem_por_unidade"
            label={
              <>
                <Termo id="embalagem">Embalagem</Termo> por unidade
              </>
            }
            hint="Caixa, pote ou saquinho de cada unidade."
          />
          <FormPercentInput
            name="perda_percentual"
            label={<Termo id="perda">Quanto costuma sobrar ou estragar?</Termo>}
            hint="Das unidades de cada lote. Vazio é 0%."
          />
          <FormPercentInput
            name="lucro_percentual"
            label={<Termo id="lucro-desejado">Lucro desta receita</Termo>}
            hint={`De cada R$ 1,00 vendido. Vazio usa o padrão (${formatMargem(configuracao.lucroPadrao)}).`}
          />
        </div>
      </Card>
      <AvisoDeSaida />
    </Form>
  );
}

function nomeDoInsumo(insumo: Insumo | undefined, insumoId: number) {
  return insumo?.nome ?? `Ingrediente #${insumoId}`;
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
    <Card title={<Termo id="ficha-tecnica">Ingredientes e embalagens</Termo>}>
      {fields.length === 0 ? (
        <p className="text-body text-ink-muted">
          Nenhum ingrediente adicionado.
        </p>
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
        {todosAdicionados
          ? 'Todos os ingredientes adicionados'
          : 'Adicionar ingrediente'}
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
