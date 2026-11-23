'use client';

import { useState } from 'react';
import type { Insumo } from '@/shared/api/contracts/catalog';
import { UNIDADE_MEDIDA_ROTULOS } from '@/shared/api/contracts/enums';
import { Button } from '@/shared/ui/button';
import { Combobox } from '@/shared/ui/combobox';
import { Dialog } from '@/shared/ui/dialog';
import { DecimalInput } from '@/shared/ui/number-input';
import { novoInsumoSchema } from '../schemas/receita-form.schema';

export type NovoItem = { insumo_id: number; quantidade: string };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Só os insumos que ainda não estão na receita. */
  disponiveis: Insumo[];
  onAdicionar: (item: NovoItem) => void;
};

/**
 * Diálogo "Adicionar insumo" (`_showAddInsumoDialog` de receitas_page.dart).
 * Não usa `<form>`: ele fica dentro do formulário da receita na árvore do
 * React, e o `submit` subiria até ele.
 */
export function AdicionarInsumoDialog({
  open,
  onOpenChange,
  disponiveis,
  onAdicionar,
}: Props) {
  return (
    <Dialog
      title="Adicionar ingrediente"
      open={open}
      onOpenChange={onOpenChange}
    >
      {/* O Radix desmonta o conteúdo ao fechar: cada abertura começa limpa. */}
      <ConteudoAdicionar
        disponiveis={disponiveis}
        onCancelar={() => onOpenChange(false)}
        onAdicionar={(item) => {
          onAdicionar(item);
          onOpenChange(false);
        }}
      />
    </Dialog>
  );
}

function ConteudoAdicionar({
  disponiveis,
  onCancelar,
  onAdicionar,
}: {
  disponiveis: Insumo[];
  onCancelar: () => void;
  onAdicionar: (item: NovoItem) => void;
}) {
  // Como no mobile, o primeiro insumo disponível já vem escolhido.
  const [insumoId, setInsumoId] = useState<string | null>(
    disponiveis[0] ? String(disponiveis[0].id) : null,
  );
  const [quantidade, setQuantidade] = useState('');
  const [erros, setErros] = useState<{
    insumo_id?: string;
    quantidade?: string;
  }>({});
  const escolhido = disponiveis.find(
    (insumo) => String(insumo.id) === insumoId,
  );

  function adicionar() {
    const result = novoInsumoSchema.safeParse({
      insumo_id: insumoId,
      quantidade,
    });

    if (!result.success) {
      const novos: typeof erros = {};
      for (const issue of result.error.issues) {
        const campo = issue.path[0];
        if (campo === 'insumo_id' || campo === 'quantidade') {
          novos[campo] ??= issue.message;
        }
      }
      setErros(novos);
      return;
    }

    onAdicionar({ insumo_id: result.data.insumo_id, quantidade });
  }

  return (
    <>
      <Combobox
        label="Ingrediente"
        options={disponiveis.map((insumo) => ({
          value: String(insumo.id),
          label: insumo.nome,
        }))}
        value={insumoId}
        onValueChange={setInsumoId}
        error={erros.insumo_id}
        required
      />
      <DecimalInput
        label="Quantidade"
        value={quantidade}
        onValueChange={setQuantidade}
        unidade={
          escolhido ? UNIDADE_MEDIDA_ROTULOS[escolhido.unidade] : undefined
        }
        hint={
          escolhido
            ? `Na unidade do ingrediente (${UNIDADE_MEDIDA_ROTULOS[escolhido.unidade]}).`
            : undefined
        }
        error={erros.quantidade}
        required
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            adicionar();
          }
        }}
      />
      <div className="mt-2 flex flex-wrap justify-end gap-2 *:grow sm:*:grow-0">
        <Button variant="secundario" onClick={onCancelar}>
          Cancelar
        </Button>
        <Button onClick={adicionar}>Adicionar</Button>
      </div>
    </>
  );
}
