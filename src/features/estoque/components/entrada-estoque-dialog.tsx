'use client';

import { useWatch } from 'react-hook-form';
import type { Insumo } from '@/shared/api/contracts/catalog';
import { UNIDADE_MEDIDA_ROTULOS } from '@/shared/api/contracts/enums';
import type { Estoque } from '@/shared/api/contracts/operations';
import { formatQuantidade } from '@/shared/format/numero';
import { parseNumeroBR } from '@/shared/format/numero-br';
import { FormDecimalInput, FormDialog, FormTextarea } from '@/shared/ui/form';
import { useToast } from '@/shared/ui/toast';
import { useRegistrarEntrada } from '../hooks/use-registrar-entrada';
import {
  OBSERVACAO_MAX,
  entradaEstoqueSchema,
  entradaEstoqueVazia,
  saldoAposEntrada,
  toRegistrarEntradaBody,
  type EntradaEstoqueInput,
} from '../schemas/entrada-estoque.schema';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  insumo: Insumo;
  estoque: Estoque;
};

/** "Registrar Entrada". Origem: registrar_entrada_modal.dart. */
export function EntradaEstoqueDialog({
  open,
  onOpenChange,
  insumo,
  estoque,
}: Props) {
  const toast = useToast();
  const registrar = useRegistrarEntrada();

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Registrar Entrada"
      schema={entradaEstoqueSchema}
      defaultValues={entradaEstoqueVazia}
      submitLabel="Confirmar Entrada"
      // Rejeitar com o ApiError mantém o diálogo aberto e mostra o erro nele.
      onSubmit={async (values) => {
        await registrar.mutateAsync({
          insumoId: insumo.id,
          body: toRegistrarEntradaBody(values),
        });
        toast.success('Entrada de estoque registrada com sucesso.');
        onOpenChange(false);
      }}
    >
      <dl className="grid grid-cols-2 gap-3 rounded-md border border-border bg-surface-alt p-3">
        <div className="col-span-2 flex flex-col gap-0.5">
          <dt className="text-small text-ink-muted">Insumo</dt>
          <dd className="font-semibold wrap-anywhere">{insumo.nome}</dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-small text-ink-muted">Quantidade Atual</dt>
          <dd className="font-semibold tabular-nums">
            {formatQuantidade(estoque.quantidadeDisponivel, insumo.unidade)}
          </dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-small text-ink-muted">Mínimo</dt>
          <dd className="font-semibold tabular-nums">
            {formatQuantidade(estoque.quantidadeMinima, insumo.unidade)}
          </dd>
        </div>
      </dl>
      <FormDecimalInput
        name="quantidade"
        label="Quantidade a Adicionar"
        placeholder="Ex.: 10,5"
        unidade={UNIDADE_MEDIDA_ROTULOS[insumo.unidade]}
        required
      />
      <FormTextarea
        name="observacao"
        label="Observação"
        placeholder="Ex.: Compra de reposição, NF 4521"
        maxLength={OBSERVACAO_MAX}
        rows={2}
      />
      <PreviaSaldo insumo={insumo} estoque={estoque} />
    </FormDialog>
  );
}

/** "Saldo após a entrada" com a quantidade digitada (só na web). */
function PreviaSaldo({
  insumo,
  estoque,
}: {
  insumo: Insumo;
  estoque: Estoque;
}) {
  const quantidade = useWatch<EntradaEstoqueInput, 'quantidade'>({
    name: 'quantidade',
  });
  const digitado = parseNumeroBR(quantidade);
  const saldo = saldoAposEntrada(
    estoque.quantidadeDisponivel,
    digitado !== null && digitado > 0 ? digitado : 0,
  );

  return (
    <p
      aria-live="polite"
      className="rounded-md border border-border bg-surface-alt p-3.5 text-small font-semibold text-accent"
    >
      Saldo após a entrada: {formatQuantidade(saldo, insumo.unidade)}
    </p>
  );
}
