'use client';

import { useState } from 'react';
import { UNIDADE_MEDIDA_ROTULOS } from '@/shared/api/contracts/enums';
import type { Receita } from '@/shared/api/contracts/recipe';
import { Button } from '@/shared/ui/button';
import { Combobox } from '@/shared/ui/combobox';
import { Dialog } from '@/shared/ui/dialog';
import { DecimalInput } from '@/shared/ui/number-input';
import { dicaDaQuantidadeDaReceita } from '../receitas.calculos';
import { novaReceitaSchema } from '../schemas/receita-form.schema';

export type NovaReceita = { receita_id: number; quantidade: string };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Só as receitas que podem entrar (`receitasQuePodemEntrar`). */
  disponiveis: Receita[];
  onAdicionar: (item: NovaReceita) => void;
};

/**
 * Diálogo "Adicionar receita" (receita dentro de receita, FE-70), como o
 * `AdicionarInsumoDialog`: a quantidade vai na unidade em que a receita
 * escolhida rende. Sem `<form>`, pelo mesmo motivo do de ingrediente.
 */
export function AdicionarReceitaDialog({
  open,
  onOpenChange,
  disponiveis,
  onAdicionar,
}: Props) {
  return (
    <Dialog title="Adicionar receita" open={open} onOpenChange={onOpenChange}>
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
  disponiveis: Receita[];
  onCancelar: () => void;
  onAdicionar: (item: NovaReceita) => void;
}) {
  const [receitaId, setReceitaId] = useState<string | null>(
    disponiveis[0] ? String(disponiveis[0].id) : null,
  );
  const [quantidade, setQuantidade] = useState('');
  const [erros, setErros] = useState<{
    receita_id?: string;
    quantidade?: string;
  }>({});
  const escolhida = disponiveis.find(
    (receita) => String(receita.id) === receitaId,
  );

  function adicionar() {
    const result = novaReceitaSchema.safeParse({
      receita_id: receitaId,
      quantidade,
    });

    if (!result.success) {
      const novos: typeof erros = {};
      for (const issue of result.error.issues) {
        const campo = issue.path[0];
        if (campo === 'receita_id' || campo === 'quantidade') {
          novos[campo] ??= issue.message;
        }
      }
      setErros(novos);
      return;
    }

    onAdicionar({ receita_id: result.data.receita_id, quantidade });
  }

  return (
    <>
      <Combobox
        label="Receita"
        options={disponiveis.map((receita) => ({
          value: String(receita.id),
          label: receita.nome,
        }))}
        value={receitaId}
        onValueChange={setReceitaId}
        error={erros.receita_id}
        required
      />
      <DecimalInput
        label="Quantidade"
        value={quantidade}
        onValueChange={setQuantidade}
        unidade={
          escolhida
            ? UNIDADE_MEDIDA_ROTULOS[escolhida.unidadeRendimento]
            : undefined
        }
        hint={escolhida ? dicaDaQuantidadeDaReceita(escolhida) : undefined}
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
