'use client';

import { useWatch } from 'react-hook-form';
import type { GastoIndireto } from '@/shared/api/contracts/catalog';
import {
  METODO_RATEIO_DESCRICOES,
  METODO_RATEIO_ROTULOS,
  METODOS_RATEIO,
  type MetodoRateio,
} from '@/shared/api/contracts/enums';
import {
  FormDialog,
  FormInput,
  FormMoneyInput,
  FormSelect,
} from '@/shared/ui/form';
import { useToast } from '@/shared/ui/toast';
import { useCreateGastoIndireto } from '../hooks/use-create-gasto-indireto';
import { useUpdateGastoIndireto } from '../hooks/use-update-gasto-indireto';
import {
  DESCRICAO_MAX,
  gastoIndiretoFormSchema,
  gastoIndiretoFormVazio,
  toCreateGastoIndiretoBody,
  toGastoIndiretoFormInput,
  toUpdateGastoIndiretoBody,
  type GastoIndiretoFormInput,
} from '../schemas/gasto-indireto-form.schema';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Sem gasto, é criação. */
  gasto?: GastoIndireto;
};

/** Cadastro e edição de gasto. Origem: `_openFormDialog` de gastos_indiretos_page.dart. */
export function GastoIndiretoFormDialog({ open, onOpenChange, gasto }: Props) {
  const toast = useToast();
  const create = useCreateGastoIndireto();
  const update = useUpdateGastoIndireto();

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={gasto ? 'Editar gasto' : 'Novo gasto indireto'}
      description="Este gasto será rateado em todas as receitas."
      schema={gastoIndiretoFormSchema}
      defaultValues={
        gasto ? toGastoIndiretoFormInput(gasto) : gastoIndiretoFormVazio
      }
      submitLabel={gasto ? 'Atualizar' : 'Salvar'}
      // Rejeitar com o ApiError mantém o diálogo aberto e mostra o erro nele.
      onSubmit={async (values) => {
        if (gasto) {
          await update.mutateAsync({
            id: gasto.id,
            body: toUpdateGastoIndiretoBody(values),
          });
          toast.success('Gasto atualizado com sucesso.');
        } else {
          await create.mutateAsync(toCreateGastoIndiretoBody(values));
          toast.success('Gasto criado com sucesso.');
        }
        onOpenChange(false);
      }}
    >
      <FormInput
        name="descricao"
        label="Descrição"
        maxLength={DESCRICAO_MAX}
        required
      />
      <FormMoneyInput name="valor" label="Valor (R$)" required />
      <CampoMetodoRateio />
    </FormDialog>
  );
}

/** Select nativo: a descrição do método escolhido aparece como texto de apoio. */
function CampoMetodoRateio() {
  const metodo = useWatch<GastoIndiretoFormInput, 'metodo_rateio'>({
    name: 'metodo_rateio',
  });

  return (
    <FormSelect
      name="metodo_rateio"
      label="Método de rateio"
      hint={METODO_RATEIO_DESCRICOES[metodo as MetodoRateio]}
      required
    >
      {METODOS_RATEIO.map((valor) => (
        <option key={valor} value={valor}>
          {METODO_RATEIO_ROTULOS[valor]}
        </option>
      ))}
    </FormSelect>
  );
}
