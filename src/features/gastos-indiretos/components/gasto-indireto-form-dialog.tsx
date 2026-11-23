'use client';

import { useWatch } from 'react-hook-form';
import type { GastoIndireto } from '@/shared/api/contracts/catalog';
import {
  TIPO_GASTO_DESCRICOES,
  TIPO_GASTO_ROTULOS,
  TIPOS_GASTO,
  type TipoGasto,
} from '@/shared/api/contracts/enums';
import {
  FormDialog,
  FormInput,
  FormMoneyInput,
  FormPercentInput,
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
      title={gasto ? 'Editar gasto' : 'Novo gasto'}
      description="Este gasto entra no custo de todas as receitas."
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
      <CampoTipo />
      <CampoValor />
    </FormDialog>
  );
}

/** Select nativo: a explicação do tipo escolhido aparece como texto de apoio. */
function CampoTipo() {
  const tipo = useWatch<GastoIndiretoFormInput, 'tipo'>({ name: 'tipo' });

  return (
    <FormSelect
      name="tipo"
      label="Tipo"
      hint={TIPO_GASTO_DESCRICOES[tipo as TipoGasto]}
      required
    >
      {TIPOS_GASTO.map((valor) => (
        <option key={valor} value={valor}>
          {TIPO_GASTO_ROTULOS[valor]}
        </option>
      ))}
    </FormSelect>
  );
}

/** O rótulo e a máscara do valor seguem o tipo: R$ por mês, R$ por unidade ou %. */
function CampoValor() {
  const tipo = useWatch<GastoIndiretoFormInput, 'tipo'>({ name: 'tipo' });

  if (tipo === 'PERCENTUAL_VENDA') {
    return (
      <FormPercentInput name="valor" label="Percentual da venda" required />
    );
  }

  return (
    <FormMoneyInput
      name="valor"
      label={tipo === 'POR_UNIDADE' ? 'Valor por unidade' : 'Valor por mês'}
      required
    />
  );
}
