'use client';

import type { CanalVenda } from '@/shared/api/contracts/pricing';
import { FormDialog, FormInput, FormPercentInput } from '@/shared/ui/form';
import { useToast } from '@/shared/ui/toast';
import { useCreateCanal } from '../hooks/use-create-canal';
import { useUpdateCanal } from '../hooks/use-update-canal';
import {
  canalFormSchema,
  canalFormVazio,
  NOME_CANAL_MAX,
  toCanalFormInput,
  toCreateCanalBody,
  toUpdateCanalBody,
} from '../schemas/canal-form.schema';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Sem canal, é criação. */
  canal?: CanalVenda;
};

/** Cadastro e edição de forma de venda (nome e comissão). */
export function CanalFormDialog({ open, onOpenChange, canal }: Props) {
  const toast = useToast();
  const create = useCreateCanal();
  const update = useUpdateCanal();

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={canal ? 'Editar forma de venda' : 'Nova forma de venda'}
      description="A comissão é a parte de cada venda que fica com o aplicativo ou o parceiro."
      schema={canalFormSchema}
      defaultValues={canal ? toCanalFormInput(canal) : canalFormVazio}
      submitLabel={canal ? 'Atualizar' : 'Salvar'}
      // Rejeitar com o ApiError mantém o diálogo aberto e mostra o erro nele.
      onSubmit={async (values) => {
        if (canal) {
          await update.mutateAsync({
            id: canal.id,
            body: toUpdateCanalBody(values),
          });
          toast.success('Forma de venda atualizada.');
        } else {
          await create.mutateAsync(toCreateCanalBody(values));
          toast.success('Forma de venda criada.');
        }
        onOpenChange(false);
      }}
    >
      <FormInput
        name="nome"
        label="Nome"
        placeholder="Ex.: Rappi, encomendas, feira"
        maxLength={NOME_CANAL_MAX}
        required
      />
      <FormPercentInput
        name="comissaoPercentual"
        label="Comissão"
        hint="Se não paga comissão, deixe 0."
        required
      />
    </FormDialog>
  );
}
