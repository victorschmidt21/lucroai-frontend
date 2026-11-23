'use client';

import { useWatch } from 'react-hook-form';
import type { Insumo } from '@/shared/api/contracts/catalog';
import { UNIDADE_MEDIDA_ROTULOS } from '@/shared/api/contracts/enums';
import { formatCustoUnitario } from '@/shared/format/moeda';
import { parseNumeroBR } from '@/shared/format/numero-br';
import { FormDecimalInput, FormDialog, FormMoneyInput } from '@/shared/ui/form';
import { useToast } from '@/shared/ui/toast';
import { useUpdateInsumo } from '../hooks/use-update-insumo';
import { calcularCustoUnitario } from '../insumos.calculos';
import {
  precoMercadoSchema,
  toPrecoMercadoBody,
  toPrecoMercadoInput,
  type PrecoMercadoInput,
} from '../schemas/preco-mercado.schema';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  insumo: Insumo;
};

/**
 * "Já sei que o preço mudou" (FE-43): muda o preço de hoje sem registrar
 * compra (`PATCH /insumos/:id` com `precoMercado`). O custo médio não muda.
 */
export function PrecoMercadoDialog({ open, onOpenChange, insumo }: Props) {
  const toast = useToast();
  const update = useUpdateInsumo();

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Já sei que o preço mudou"
      description="Informe quanto custa hoje. O custo médio do que você já tem guardado não muda."
      schema={precoMercadoSchema}
      defaultValues={toPrecoMercadoInput(insumo)}
      submitLabel="Salvar"
      onSubmit={async (values) => {
        await update.mutateAsync({
          id: insumo.id,
          body: toPrecoMercadoBody(values),
        });
        toast.success('Preço de hoje atualizado.');
        onOpenChange(false);
      }}
    >
      <FormMoneyInput name="valor" label="Quanto custa hoje" required />
      <FormDecimalInput
        name="quantidade"
        label="Por quanto"
        unidade={UNIDADE_MEDIDA_ROTULOS[insumo.unidade]}
        required
      />
      <PreviaPrecoDeHoje insumo={insumo} />
    </FormDialog>
  );
}

function PreviaPrecoDeHoje({ insumo }: { insumo: Insumo }) {
  const [valor, quantidade] = useWatch<
    PrecoMercadoInput,
    ['valor', 'quantidade']
  >({ name: ['valor', 'quantidade'] });
  const preco = calcularCustoUnitario(
    parseNumeroBR(valor) ?? 0,
    parseNumeroBR(quantidade) ?? 0,
  );

  return (
    <p
      aria-live="polite"
      className="rounded-md border border-border bg-surface-alt p-3.5 text-small font-semibold text-accent"
    >
      Novo preço de hoje: {formatCustoUnitario(preco, insumo.unidade)}
    </p>
  );
}
