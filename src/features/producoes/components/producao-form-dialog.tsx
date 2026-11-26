'use client';

import { useQuery } from '@tanstack/react-query';
import { useController, useWatch } from 'react-hook-form';
import { configuracaoCustosOptions } from '@/features/configuracoes/api/configuracoes.queries';
import { estoqueProdutosOptions } from '@/features/estoque/api/estoque.queries';
import { gastosIndiretosListOptions } from '@/features/gastos-indiretos/api/gastos-indiretos.queries';
import { receitasListOptions } from '@/features/receitas/api/receitas.queries';
import type { GastoIndireto } from '@/shared/api/contracts/catalog';
import { UNIDADE_MEDIDA_ROTULOS } from '@/shared/api/contracts/enums';
import type { EstoqueProduto } from '@/shared/api/contracts/operations';
import type { Receita } from '@/shared/api/contracts/recipe';
import { getErrorMessage } from '@/shared/api/errors';
import { formatMoeda } from '@/shared/format/moeda';
import { formatNumero, formatQuantidade } from '@/shared/format/numero';
import { parseInteiroBR } from '@/shared/format/numero-br';
import { Alert } from '@/shared/ui/alert';
import { ToggleChip } from '@/shared/ui/chip';
import { FormDialog, FormIntegerInput, FormSelect } from '@/shared/ui/form';
import { Skeleton } from '@/shared/ui/skeleton';
import { useToast } from '@/shared/ui/toast';
import { Termo } from '@/features/aprender/components/termo';
import type { DadosDoExemplo } from '@/features/aprender/termos';
import { calcularTotalContasDoMes } from '@/shared/domain/contas-do-mes';
import { useCreateProducao } from '../hooks/use-create-producao';
import {
  calcularPreviaProducao,
  calcularUsoDoEstoquePronto,
} from '../producoes.calculos';
import {
  producaoFormSchema,
  producaoFormVazio,
  toCreateProducaoBody,
  type ProducaoFormInput,
} from '../schemas/producao-form.schema';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Receita do filtro da lista, já escolhida ao abrir. */
  receitaIdInicial?: number;
};

/** "Registrar Produção". Origem: `_RegistrarProducaoSheet` de producoes_page.dart. */
export function ProducaoFormDialog({
  open,
  onOpenChange,
  receitaIdInicial,
}: Props) {
  const toast = useToast();
  const registrar = useCreateProducao();
  const receitas = useQuery(receitasListOptions());
  const gastos = useQuery(gastosIndiretosListOptions());
  const configuracao = useQuery(configuracaoCustosOptions());
  // Saldo pronto das receitas usadas dentro da escolhida (FE-72).
  const estoquePronto = useQuery({
    ...estoqueProdutosOptions(),
    enabled: open,
  });
  // Só a conta do mês entra na produção (BE-30): os outros tipos ficam na receita e na venda.
  const contasDoMes = (gastos.data ?? []).filter(
    (gasto) => gasto.tipo === 'MENSAL',
  );
  // Exemplo da Pitada de "Contas do mês" (FE-65): o rateio de 1 fornada, como a prévia.
  const divisao = configuracao.data
    ? {
        totalContas: calcularTotalContasDoMes(contasDoMes),
        capacidadeMensal: configuracao.data.capacidadeMensal,
        baseRateio: configuracao.data.baseRateio,
        porFornada: calcularPreviaProducao(contasDoMes, 1, 1, {
          usoPorLote: 1,
          capacidadeMensal: configuracao.data.capacidadeMensal,
        }).totalRateio,
      }
    : null;

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Anotar fornada"
      description="Informe quantos lotes foram produzidos"
      schema={producaoFormSchema}
      defaultValues={producaoFormVazio(receitaIdInicial)}
      submitLabel="Anotar fornada"
      // Rejeitar com o ApiError mantém o diálogo aberto e mostra o erro nele.
      onSubmit={async (values) => {
        await registrar.mutateAsync(toCreateProducaoBody(values));
        toast.success('Fornada anotada.');
        onOpenChange(false);
      }}
    >
      <FormSelect
        name="receitaId"
        label="Receita"
        required
        disabled={receitas.isPending}
        hint={receitas.isError ? getErrorMessage(receitas.error) : undefined}
      >
        <option value="">
          {receitas.isPending ? 'Carregando receitas…' : 'Selecione'}
        </option>
        {(receitas.data ?? []).map((receita) => (
          <option key={receita.id} value={String(receita.id)}>
            {receita.nome}
          </option>
        ))}
      </FormSelect>
      <FormIntegerInput
        name="quantidade"
        label="Quantidade de lotes"
        placeholder="Ex.: 3"
        required
      />
      <CampoGastos
        gastos={contasDoMes}
        carregando={gastos.isPending}
        erro={gastos.isError ? getErrorMessage(gastos.error) : null}
        divisao={divisao}
      />
      <Previa
        receitas={receitas.data ?? []}
        gastos={contasDoMes}
        capacidadeMensal={configuracao.data?.capacidadeMensal}
      />
      <SaidaDoEstoquePronto
        receitas={receitas.data ?? []}
        saldos={estoquePronto.data}
      />
    </FormDialog>
  );
}

/**
 * Chip "Todos" (padrão) e um chip por gasto. Escolher um gasto desmarca "Todos";
 * marcar "Todos" limpa a seleção.
 */
function CampoGastos({
  gastos,
  carregando,
  erro,
  divisao,
}: {
  gastos: readonly GastoIndireto[];
  carregando: boolean;
  erro: string | null;
  divisao: DadosDoExemplo<'divisao-das-contas'> | null;
}) {
  const todos = useController<ProducaoFormInput, 'todosGastos'>({
    name: 'todosGastos',
  });
  const selecionados = useController<ProducaoFormInput, 'gastoIndiretoIds'>({
    name: 'gastoIndiretoIds',
  });
  const ids = selecionados.field.value;

  function alternarGasto(id: number, marcado: boolean) {
    const base = todos.field.value ? [] : ids;
    todos.field.onChange(false);
    selecionados.field.onChange(
      marcado ? [...base, id] : base.filter((atual) => atual !== id),
    );
  }

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-small text-ink-muted">
        <Termo id="divisao-das-contas" dados={divisao}>
          Contas do mês
        </Termo>
      </legend>
      {carregando ? (
        <Skeleton aria-label="Carregando os gastos" className="h-8" />
      ) : (
        <div className="flex flex-wrap gap-2">
          <ToggleChip
            selected={todos.field.value}
            onSelectedChange={(marcado) => {
              if (!marcado) return;
              todos.field.onChange(true);
              selecionados.field.onChange([]);
            }}
          >
            Todos
          </ToggleChip>
          {gastos.map((gasto) => (
            <ToggleChip
              key={gasto.id}
              selected={!todos.field.value && ids.includes(gasto.id)}
              onSelectedChange={(marcado) => alternarGasto(gasto.id, marcado)}
            >
              {gasto.descricao}
            </ToggleChip>
          ))}
        </div>
      )}
      {erro ? <Alert>{erro}</Alert> : null}
    </fieldset>
  );
}

/** Prévia informativa: o valor gravado é o que o backend devolver. */
function Previa({
  receitas,
  gastos,
  capacidadeMensal,
}: {
  receitas: readonly Receita[];
  gastos: readonly GastoIndireto[];
  /** Sem a configuração de custos, a prévia não estima as contas do mês. */
  capacidadeMensal: number | undefined;
}) {
  const [receitaId, quantidade, todosGastos, ids] = useWatch<
    ProducaoFormInput,
    ['receitaId', 'quantidade', 'todosGastos', 'gastoIndiretoIds']
  >({ name: ['receitaId', 'quantidade', 'todosGastos', 'gastoIndiretoIds'] });

  const receita = receitas.find((atual) => String(atual.id) === receitaId);
  const lotes = parseInteiroBR(quantidade);

  if (!receita || !lotes) return null;

  const rateados = todosGastos
    ? gastos
    : gastos.filter((gasto) => ids.includes(gasto.id));
  const previa = calcularPreviaProducao(
    rateados,
    lotes,
    receita.rendimento,
    capacidadeMensal
      ? { usoPorLote: receita.usoPorLote, capacidadeMensal }
      : undefined,
  );

  return (
    <section
      aria-label="Prévia da fornada"
      aria-live="polite"
      className="flex flex-col gap-2 rounded-md border border-border bg-surface-alt p-3.5 text-small"
    >
      <p className="flex justify-between gap-3 font-semibold">
        <span>Total de unidades</span>
        <span className="text-accent tabular-nums">
          {`${formatNumero(previa.totalUnidades)} ${UNIDADE_MEDIDA_ROTULOS[receita.unidadeRendimento]}`}
        </span>
      </p>
      {previa.rateios.length === 0 ? (
        <p className="text-ink-muted">
          Nenhuma conta do mês entra nesta fornada.
        </p>
      ) : (
        <>
          <p className="text-ink-muted">
            Parte das contas do mês nesta fornada
          </p>
          <ul className="flex flex-col gap-1">
            {previa.rateios.map(({ gasto, valorRateado }) => (
              <li key={gasto.id} className="flex justify-between gap-3">
                <span className="min-w-0 wrap-anywhere">{gasto.descricao}</span>
                <span className="shrink-0 tabular-nums">
                  {formatMoeda(valorRateado)}
                </span>
              </li>
            ))}
          </ul>
          <p className="flex justify-between gap-3 border-t border-border pt-2 font-semibold">
            <span>Total das contas</span>
            <span className="tabular-nums">
              {formatMoeda(previa.totalRateio)}
            </span>
          </p>
        </>
      )}
    </section>
  );
}

/**
 * Receita com receitas dentro (FE-72): o que sai do estoque pronto de cada uma
 * ("Vai usar 300 g de Brigadeiro branco; você tem 100 g"). Saldo que vai
 * ficar negativo ganha o aviso amarelo, sem bloquear: o negativo é permitido.
 */
function SaidaDoEstoquePronto({
  receitas,
  saldos,
}: {
  receitas: readonly Receita[];
  /** Sem o saldo ainda (carregando ou com erro), não mostra a conta. */
  saldos: readonly EstoqueProduto[] | undefined;
}) {
  const [receitaId, quantidade] = useWatch<
    ProducaoFormInput,
    ['receitaId', 'quantidade']
  >({ name: ['receitaId', 'quantidade'] });

  const receita = receitas.find((atual) => String(atual.id) === receitaId);
  const lotes = parseInteiroBR(quantidade);

  if (!receita || receita.receitas.length === 0 || !lotes || !saldos) {
    return null;
  }

  const usos = calcularUsoDoEstoquePronto(receita.receitas, lotes, saldos);

  return (
    <section
      aria-label="Sai do estoque pronto"
      aria-live="polite"
      className="flex flex-col gap-2 text-small"
    >
      <p className="text-ink-muted">Sai do estoque pronto</p>
      <ul className="flex flex-col gap-2">
        {usos.map((uso) => (
          <li key={uso.receitaId} className="flex flex-col gap-2">
            <span className="wrap-anywhere">
              {`Vai usar ${formatQuantidade(uso.vaiUsar, uso.unidade)} de ${uso.nome}; você tem ${formatQuantidade(uso.voceTem, uso.unidade)}.`}
            </span>
            {uso.ficaNegativo ? (
              <output className="flex flex-col gap-1 rounded-md border border-warning/40 bg-warning/8 p-3 text-ink">
                <span className="font-semibold wrap-anywhere">
                  {`Registre antes a produção de ${uso.nome}.`}
                </span>
                <span className="wrap-anywhere">
                  {`Se anotar assim, o estoque pronto fica em ${formatQuantidade(uso.saldoDepois, uso.unidade)}.`}
                </span>
              </output>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
