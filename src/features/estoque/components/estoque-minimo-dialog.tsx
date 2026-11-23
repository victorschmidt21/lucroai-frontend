'use client';

import type { Insumo } from '@/shared/api/contracts/catalog';
import { UNIDADE_MEDIDA_ROTULOS } from '@/shared/api/contracts/enums';
import type { Estoque } from '@/shared/api/contracts/operations';
import { formatQuantidade } from '@/shared/format/numero';
import { FormDecimalInput, FormDialog } from '@/shared/ui/form';
import { useToast } from '@/shared/ui/toast';
import { useAtualizarMinimo } from '../hooks/use-atualizar-minimo';
import {
  estoqueMinimoInicial,
  estoqueMinimoSchema,
  toAtualizarMinimoBody,
} from '../schemas/estoque-minimo.schema';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  insumo: Insumo;
  estoque: Estoque;
};

/** "Definir mínimo" (`PATCH /estoque/insumos/:id/minimo`, lacuna 14). Só na web. */
export function EstoqueMinimoDialog({
  open,
  onOpenChange,
  insumo,
  estoque,
}: Props) {
  const toast = useToast();
  const atualizar = useAtualizarMinimo();

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Definir Estoque Mínimo"
      description={insumo.nome}
      schema={estoqueMinimoSchema}
      defaultValues={estoqueMinimoInicial(estoque.quantidadeMinima)}
      submitLabel="Salvar"
      // Rejeitar com o ApiError mantém o diálogo aberto e mostra o erro nele.
      onSubmit={async (values) => {
        await atualizar.mutateAsync({
          insumoId: insumo.id,
          body: toAtualizarMinimoBody(values),
        });
        toast.success('Estoque mínimo atualizado com sucesso.');
        onOpenChange(false);
      }}
    >
      <p className="text-small text-ink-muted">
        Disponível:{' '}
        <span className="font-semibold text-ink tabular-nums">
          {formatQuantidade(estoque.quantidadeDisponivel, insumo.unidade)}
        </span>
      </p>
      <FormDecimalInput
        name="quantidadeMinima"
        label="Estoque mínimo"
        placeholder="Ex.: 2,5"
        unidade={UNIDADE_MEDIDA_ROTULOS[insumo.unidade]}
        hint="Abaixo deste valor, o ingrediente aparece como Acabando."
        required
      />
    </FormDialog>
  );
}
