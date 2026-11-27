'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
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
import { Badge } from '@/shared/ui/badge';
import { Checkbox } from '@/shared/ui/checkbox';
import {
  receitaDetailOptions,
  receitasListOptions,
} from '../api/receitas.queries';
import { useCreateReceita } from '../hooks/use-create-receita';
import { useUpdateReceita } from '../hooks/use-update-receita';
import { DicaNaHora } from '@/features/aprender/components/dica-na-hora';
import { Termo } from '@/features/aprender/components/termo';
import {
  calcularCustoItem,
  horasEMinutosParaMinutos,
  motivoSemReceitasDentro,
  receitasQuePodemEntrar,
} from '../receitas.calculos';
import {
  NOME_MAX,
  receitaFormSchema,
  receitaFormVazio,
  toCreateReceitaBody,
  toReceitaFormInput,
  toUpdateReceitaBody,
  traduzirErroDaReceita,
  type ReceitaFormInput,
} from '../schemas/receita-form.schema';
import { AdicionarInsumoDialog } from './adicionar-insumo-dialog';
import { AdicionarReceitaDialog } from './adicionar-receita-dialog';
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
  // Para o "Adicionar receita" (receita dentro de receita, FE-70).
  const receitas = useQuery(receitasListOptions());
  const configuracao = useQuery(configuracaoCustosOptions());
  const queries = edicao
    ? [receita, insumos, receitas, configuracao]
    : [insumos, receitas, configuracao];
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
  } else if (
    !insumos.data ||
    !receitas.data ||
    !configuracao.data ||
    (edicao && !receita.data)
  ) {
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
        todasReceitas={receitas.data}
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
  todasReceitas,
  configuracao,
}: {
  receita?: Receita;
  insumos: Insumo[];
  todasReceitas: Receita[];
  configuracao: ConfiguracaoCustos;
}) {
  // A unidade do rendimento não muda enquanto outra receita usa esta (BE-39).
  const usadaEmOutra = (receita?.usadaEm.length ?? 0) > 0;
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
        try {
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
        } catch (error) {
          throw traduzirErroDaReceita(error);
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
        <FormUnidadeSelect
          name="unidadeRendimento"
          label="Unidade"
          required
          disabled={usadaEmOutra}
          hint={
            usadaEmOutra
              ? 'Não muda: esta receita vai dentro de outra.'
              : undefined
          }
        />
      </div>
      <VendavelCampo />
      <ItensDaReceita
        receita={receita}
        insumos={insumos}
        todasReceitas={todasReceitas}
      />
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
          <TempoDeTrabalhoCampo />
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

/**
 * "Tempo de trabalho por lote" em horas e minutos (FE-77), que vai no
 * `minutos_trabalho_por_lote`. Na receita que usa outras, a ajuda lembra que
 * o tempo delas já está no custo de cada uma.
 */
function TempoDeTrabalhoCampo() {
  const receitas = useWatch<ReceitaFormInput, 'receitas'>({ name: 'receitas' });
  const usaOutras = (receitas?.length ?? 0) > 0;
  const horas = useWatch<ReceitaFormInput, 'horas_trabalho'>({
    name: 'horas_trabalho',
  });
  const minutos = useWatch<ReceitaFormInput, 'minutos_trabalho'>({
    name: 'minutos_trabalho',
  });
  // Para a dica na hora certa (FE-78): aparece quando ela conta o tempo.
  const minutosTrabalho = horasEMinutosParaMinutos({
    horas: parseNumeroBR(horas) ?? 0,
    minutos: parseNumeroBR(minutos) ?? 0,
  });

  return (
    <fieldset
      aria-describedby="tempo-de-trabalho-ajuda"
      className="flex min-w-0 flex-col gap-1.5 sm:col-span-2"
    >
      <legend className="mb-1.5 text-small font-extrabold text-ink">
        Tempo de trabalho por lote
      </legend>
      <div className="grid grid-cols-2 gap-3">
        <FormDecimalInput name="horas_trabalho" label="Horas" unidade="h" />
        <FormDecimalInput
          name="minutos_trabalho"
          label="Minutos"
          unidade="min"
        />
      </div>
      <p
        id="tempo-de-trabalho-ajuda"
        className="text-caption font-normal text-ink-muted"
      >
        {usaOutras
          ? 'Conte só o tempo de montar. O tempo das receitas que vão dentro já está no custo delas.'
          : 'Quanto tempo você fica ocupada com esta receita: preparar, mexer, montar, embalar. Não conte o tempo em que ela fica sozinha no forno ou na geladeira.'}
      </p>
      <DicaNaHora tela="receita-form" minutosTrabalho={minutosTrabalho} />
    </fieldset>
  );
}

/** Chave "Vendo esta receita sozinha" (`vendavel`, BE-39), ligada por padrão. */
function VendavelCampo() {
  const { register } = useFormContext<ReceitaFormInput>();

  return (
    <Checkbox
      label="Vendo esta receita sozinha"
      hint="Desligue se ela só vai dentro de outras receitas, como um recheio."
      {...register('vendavel')}
    />
  );
}

/**
 * Ingredientes e receitas numa lista só (FE-70): os ingredientes primeiro, e
 * cada receita com o selo "receita". O custo da linha da receita vem da API
 * (`receitas[].custoUnitario`, BE-40), então só aparece depois de salvar.
 */
function ItensDaReceita({
  receita,
  insumos,
  todasReceitas,
}: {
  receita?: Receita;
  insumos: Insumo[];
  todasReceitas: Receita[];
}) {
  const ingredientes = useFieldArray<ReceitaFormInput, 'insumos'>({
    name: 'insumos',
  });
  const receitasDentro = useFieldArray<ReceitaFormInput, 'receitas'>({
    name: 'receitas',
  });
  const quantidades = useWatch<ReceitaFormInput, 'insumos'>({
    name: 'insumos',
  });
  const quantidadesDasReceitas = useWatch<ReceitaFormInput, 'receitas'>({
    name: 'receitas',
  });
  const [adicionando, setAdicionando] = useState<
    'ingrediente' | 'receita' | null
  >(null);

  const porId = new Map(insumos.map((insumo) => [insumo.id, insumo]));
  const naReceita = new Set(
    ingredientes.fields.map((field) => field.insumo_id),
  );
  const disponiveis = insumos.filter((insumo) => !naReceita.has(insumo.id));
  const todosAdicionados = disponiveis.length === 0 && insumos.length > 0;

  const receitasPorId = new Map(todasReceitas.map((item) => [item.id, item]));
  const salvasPorId = new Map(
    (receita?.receitas ?? []).map((item) => [item.receitaId, item]),
  );
  const receitasDisponiveis = receitasQuePodemEntrar(todasReceitas, {
    receitaId: receita?.id,
    jaAdicionadas: receitasDentro.fields.map((field) => field.receita_id),
  });
  const motivo = motivoSemReceitasDentro(receita);
  const vazia =
    ingredientes.fields.length === 0 && receitasDentro.fields.length === 0;

  return (
    <Card title={<Termo id="ficha-tecnica">Ingredientes e embalagens</Termo>}>
      {vazia ? (
        <p className="text-body text-ink-muted">
          Nenhum ingrediente adicionado.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {ingredientes.fields.map((field, indice) => {
            const insumo = porId.get(field.insumo_id);
            const nome = nomeDoInsumo(insumo, field.insumo_id);
            const quantidade = parseNumeroBR(quantidades?.[indice]?.quantidade);
            const custo =
              insumo && quantidade !== null
                ? calcularCustoItem(quantidade, insumo.custoUnitario)
                : null;

            return (
              <LinhaDoItem
                key={field.id}
                nome={nome}
                custo={formatMoeda(custo)}
                campo={`insumos.${indice}.quantidade`}
                unidade={
                  insumo ? UNIDADE_MEDIDA_ROTULOS[insumo.unidade] : undefined
                }
                onRemover={() => ingredientes.remove(indice)}
              />
            );
          })}
          {receitasDentro.fields.map((field, indice) => {
            const usada = receitasPorId.get(field.receita_id);
            const salva = salvasPorId.get(field.receita_id);
            const nome =
              usada?.nome ?? salva?.nome ?? `Receita #${field.receita_id}`;
            const unidade = usada?.unidadeRendimento ?? salva?.unidade;
            const quantidade = parseNumeroBR(
              quantidadesDasReceitas?.[indice]?.quantidade,
            );
            const custo =
              salva?.custoUnitario !== undefined && quantidade !== null
                ? formatMoeda(
                    calcularCustoItem(quantidade, salva.custoUnitario),
                  )
                : null;

            return (
              <LinhaDoItem
                key={field.id}
                nome={nome}
                selo
                custo={custo}
                campo={`receitas.${indice}.quantidade`}
                unidade={unidade ? UNIDADE_MEDIDA_ROTULOS[unidade] : undefined}
                onRemover={() => receitasDentro.remove(indice)}
              />
            );
          })}
        </ul>
      )}
      <div className="flex flex-wrap gap-2 *:grow sm:*:grow-0">
        <Button
          variant="secundario"
          disabled={disponiveis.length === 0}
          onClick={() => setAdicionando('ingrediente')}
        >
          <IconAdicionar className="size-5" />
          {todosAdicionados
            ? 'Todos os ingredientes adicionados'
            : 'Adicionar ingrediente'}
        </Button>
        <Button
          variant="secundario"
          disabled={motivo !== null || receitasDisponiveis.length === 0}
          aria-describedby={motivo ? 'motivo-sem-receitas' : undefined}
          onClick={() => setAdicionando('receita')}
        >
          <IconAdicionar className="size-5" />
          Adicionar receita
        </Button>
      </div>
      {motivo ? (
        <p id="motivo-sem-receitas" className="text-small text-ink-muted">
          {motivo}
        </p>
      ) : (
        <p className="text-small text-ink-muted">
          Brigadeiro, recheio ou massa que você já cadastrou também pode entrar:
          é a{' '}
          <Termo id="receita-dentro-de-receita">
            receita dentro de receita
          </Termo>
          .
        </p>
      )}
      <AdicionarInsumoDialog
        open={adicionando === 'ingrediente'}
        onOpenChange={(aberto) => setAdicionando(aberto ? 'ingrediente' : null)}
        disponiveis={disponiveis}
        onAdicionar={(item) => ingredientes.append(item)}
      />
      <AdicionarReceitaDialog
        open={adicionando === 'receita'}
        onOpenChange={(aberto) => setAdicionando(aberto ? 'receita' : null)}
        disponiveis={receitasDisponiveis}
        onAdicionar={(item) => receitasDentro.append(item)}
      />
    </Card>
  );
}

function LinhaDoItem({
  nome,
  selo = false,
  custo,
  campo,
  unidade,
  onRemover,
}: {
  nome: string;
  /** Selo "receita" nas receitas usadas dentro. */
  selo?: boolean;
  /** `null`: sem custo para mostrar (receita ainda não salva). */
  custo: string | null;
  campo: string;
  unidade?: string;
  onRemover: () => void;
}) {
  return (
    <li className="flex flex-wrap items-start gap-3 rounded-md border border-border bg-surface-alt p-3">
      <div className="flex min-w-0 grow basis-40 flex-col gap-0.5 pt-1">
        <p className="flex flex-wrap items-center gap-2 text-body font-medium wrap-anywhere text-ink">
          {nome}
          {selo ? <Badge tone="destaque">receita</Badge> : null}
        </p>
        {custo !== null ? (
          <p className="text-small text-ink-muted tabular-nums">
            Custo: {custo}
          </p>
        ) : null}
      </div>
      <div className="w-36">
        <FormDecimalInput
          name={campo}
          label="Quantidade"
          aria-label={`Quantidade de ${nome}`}
          unidade={unidade}
        />
      </div>
      <IconButton
        aria-label={`Remover ${nome}`}
        className="mt-7"
        onClick={onRemover}
      >
        <IconExcluir />
      </IconButton>
    </li>
  );
}
