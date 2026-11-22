'use client';

import { useWatch } from 'react-hook-form';
import type { Insumo } from '@/shared/api/contracts/catalog';
import { UNIDADE_MEDIDA_ROTULOS } from '@/shared/api/contracts/enums';
import { formatCustoUnitario } from '@/shared/format/moeda';
import { parseNumeroBR } from '@/shared/format/numero-br';
import {
  FormDecimalInput,
  FormDialog,
  FormMoneyInput,
  FormTextarea,
} from '@/shared/ui/form';
import { useToast } from '@/shared/ui/toast';
import { useRegistrarCompra } from '../hooks/use-registrar-compra';
import { calcularCustoUnitario } from '../insumos.calculos';
import {
  OBSERVACAO_COMPRA_MAX,
  compraInsumoSchema,
  compraInsumoVazia,
  toCreateCompraInsumoBody,
  type CompraInsumoInput,
} from '../schemas/compra-insumo.schema';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  insumo: Insumo;
};

/**
 * "Registrar compra" (FE-43, `POST /insumos/:id/compras`): dá entrada no
 * estoque e recalcula o custo médio e o preço de hoje. A data é a do registro.
 */
export function CompraInsumoDialog({ open, onOpenChange, insumo }: Props) {
  const toast = useToast();
  const registrar = useRegistrarCompra();

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Registrar compra"
      description={insumo.nome}
      schema={compraInsumoSchema}
      defaultValues={compraInsumoVazia}
      submitLabel="Registrar"
      // Rejeitar com o ApiError mantém o diálogo aberto e mostra o erro nele.
      onSubmit={async (values) => {
        await registrar.mutateAsync({
          insumoId: insumo.id,
          body: toCreateCompraInsumoBody(values),
        });
        toast.success('Compra registrada com sucesso.');
        onOpenChange(false);
      }}
    >
      <FormDecimalInput
        name="quantidade"
        label="Quantidade comprada"
        placeholder="Ex.: 5"
        unidade={UNIDADE_MEDIDA_ROTULOS[insumo.unidade]}
        hint="Entra no estoque."
        required
      />
      <FormMoneyInput name="valorTotal" label="Valor pago" required />
      <FormTextarea
        name="observacao"
        label="Observação"
        placeholder="Ex.: Atacadão, nota 1532"
        maxLength={OBSERVACAO_COMPRA_MAX}
        rows={2}
      />
      <PreviaCustoDaCompra insumo={insumo} />
    </FormDialog>
  );
}

/** "Custo desta compra: R$ X/un" com os valores digitados. */
function PreviaCustoDaCompra({ insumo }: { insumo: Insumo }) {
  const [quantidade, valorTotal] = useWatch<
    CompraInsumoInput,
    ['quantidade', 'valorTotal']
  >({ name: ['quantidade', 'valorTotal'] });
  const custo = calcularCustoUnitario(
    parseNumeroBR(valorTotal) ?? 0,
    parseNumeroBR(quantidade) ?? 0,
  );

  return (
    <p
      aria-live="polite"
      className="rounded-md border border-border bg-surface-alt p-3.5 text-small font-semibold text-accent"
    >
      Custo desta compra: {formatCustoUnitario(custo, insumo.unidade)}
    </p>
  );
}
