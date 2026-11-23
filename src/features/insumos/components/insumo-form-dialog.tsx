'use client';

import { useWatch } from 'react-hook-form';
import type { Insumo } from '@/shared/api/contracts/catalog';
import { formatCustoUnitario } from '@/shared/format/moeda';
import { parseNumeroBR } from '@/shared/format/numero-br';
import {
  FormDecimalInput,
  FormDialog,
  FormInput,
  FormMoneyInput,
  FormUnidadeSelect,
} from '@/shared/ui/form';
import { useToast } from '@/shared/ui/toast';
import { useCreateInsumo } from '../hooks/use-create-insumo';
import { useUpdateInsumo } from '../hooks/use-update-insumo';
import { calcularCustoUnitario } from '../insumos.calculos';
import {
  insumoFormSchema,
  insumoFormVazio,
  NOME_MAX,
  toCreateInsumoBody,
  toInsumoFormInput,
  toUpdateInsumoBody,
  type InsumoFormInput,
} from '../schemas/insumo-form.schema';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Sem insumo, é criação. */
  insumo?: Insumo;
};

/** Cadastro e edição de insumo. Origem: `_openFormDialog` de insumos_page.dart. */
export function InsumoFormDialog({ open, onOpenChange, insumo }: Props) {
  const toast = useToast();
  const create = useCreateInsumo();
  const update = useUpdateInsumo();

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={insumo ? 'Editar ingrediente' : 'Novo ingrediente'}
      schema={insumoFormSchema}
      defaultValues={insumo ? toInsumoFormInput(insumo) : insumoFormVazio}
      submitLabel={insumo ? 'Atualizar' : 'Salvar'}
      // Rejeitar com o ApiError mantém o diálogo aberto e mostra o erro nele.
      onSubmit={async (values) => {
        if (insumo) {
          await update.mutateAsync({
            id: insumo.id,
            body: toUpdateInsumoBody(values),
          });
          toast.success('Ingrediente atualizado.');
        } else {
          await create.mutateAsync(toCreateInsumoBody(values));
          toast.success('Ingrediente cadastrado.');
        }
        onOpenChange(false);
      }}
    >
      <FormInput name="nome" label="Nome" maxLength={NOME_MAX} required />
      <div className="grid grid-cols-[minmax(0,1fr)_7rem] gap-2.5">
        <FormDecimalInput
          name="quantidadeBaseCusto"
          label="Quantidade"
          required
        />
        <FormUnidadeSelect name="unidade" label="Unidade" />
      </div>
      <FormMoneyInput
        name="valorPago"
        label="Valor pago"
        hint={
          insumo
            ? 'Mudar o valor ou a quantidade muda o preço de hoje, sem mexer no custo médio.'
            : 'Conta como a primeira compra.'
        }
        required
      />
      {insumo ? null : (
        <FormDecimalInput
          name="quantidadeDisponivelInicial"
          label="Quantidade disponível inicial"
          hint="Saldo inicial do estoque. Deixe vazio para começar em zero."
        />
      )}
      <PreviaCustoUnitario />
    </FormDialog>
  );
}

/** "Custo unitário: R$ X/un" com os valores digitados, como o mobile. */
function PreviaCustoUnitario() {
  const [quantidade, valorPago, unidade] = useWatch<
    InsumoFormInput,
    ['quantidadeBaseCusto', 'valorPago', 'unidade']
  >({ name: ['quantidadeBaseCusto', 'valorPago', 'unidade'] });
  const custo = calcularCustoUnitario(
    parseNumeroBR(valorPago) ?? 0,
    parseNumeroBR(quantidade) ?? 0,
  );

  return (
    <p
      aria-live="polite"
      className="rounded-md border border-border bg-surface-alt p-3.5 text-small font-semibold text-accent"
    >
      Custo unitário: {formatCustoUnitario(custo, unidade)}
    </p>
  );
}
