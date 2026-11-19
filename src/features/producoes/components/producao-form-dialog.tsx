'use client';

import { useQuery } from '@tanstack/react-query';
import { useController, useWatch } from 'react-hook-form';
import { gastosIndiretosListOptions } from '@/features/gastos-indiretos/api/gastos-indiretos.queries';
import { receitasListOptions } from '@/features/receitas/api/receitas.queries';
import type { GastoIndireto } from '@/shared/api/contracts/catalog';
import {
  METODO_RATEIO_ROTULOS,
  UNIDADE_MEDIDA_ROTULOS,
} from '@/shared/api/contracts/enums';
import type { Receita } from '@/shared/api/contracts/recipe';
import { getErrorMessage } from '@/shared/api/errors';
import { formatMoeda } from '@/shared/format/moeda';
import { formatNumero } from '@/shared/format/numero';
import { parseInteiroBR } from '@/shared/format/numero-br';
import { Alert } from '@/shared/ui/alert';
import { ToggleChip } from '@/shared/ui/chip';
import { FormDialog, FormIntegerInput, FormSelect } from '@/shared/ui/form';
import { Skeleton } from '@/shared/ui/skeleton';
import { useToast } from '@/shared/ui/toast';
import { useCreateProducao } from '../hooks/use-create-producao';
import { calcularPreviaProducao } from '../producoes.calculos';
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

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Registrar Produção"
      description="Informe quantos lotes foram produzidos"
      schema={producaoFormSchema}
      defaultValues={producaoFormVazio(receitaIdInicial)}
      submitLabel="Registrar Produção"
      // Rejeitar com o ApiError mantém o diálogo aberto e mostra o erro nele.
      onSubmit={async (values) => {
        await registrar.mutateAsync(toCreateProducaoBody(values));
        toast.success('Produção registrada com sucesso.');
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
        gastos={gastos.data ?? []}
        carregando={gastos.isPending}
        erro={gastos.isError ? getErrorMessage(gastos.error) : null}
      />
      <Previa receitas={receitas.data ?? []} gastos={gastos.data ?? []} />
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
}: {
  gastos: readonly GastoIndireto[];
  carregando: boolean;
  erro: string | null;
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
        Gastos indiretos
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
}: {
  receitas: readonly Receita[];
  gastos: readonly GastoIndireto[];
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
  const previa = calcularPreviaProducao(rateados, lotes, receita.rendimento);

  return (
    <section
      aria-label="Prévia da produção"
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
        <p className="text-ink-muted">Nenhum gasto será rateado.</p>
      ) : (
        <>
          <p className="text-ink-muted">Rateio estimado</p>
          <ul className="flex flex-col gap-1">
            {previa.rateios.map(({ gasto, valorRateado }) => (
              <li key={gasto.id} className="flex justify-between gap-3">
                <span className="min-w-0 wrap-anywhere">
                  {gasto.descricao}
                  <span className="block text-ink-muted">
                    {METODO_RATEIO_ROTULOS[gasto.metodoRateio]}
                  </span>
                </span>
                <span className="shrink-0 tabular-nums">
                  {formatMoeda(valorRateado)}
                </span>
              </li>
            ))}
          </ul>
          <p className="flex justify-between gap-3 border-t border-border pt-2 font-semibold">
            <span>Total do rateio</span>
            <span className="tabular-nums">
              {formatMoeda(previa.totalRateio)}
            </span>
          </p>
        </>
      )}
    </section>
  );
}
