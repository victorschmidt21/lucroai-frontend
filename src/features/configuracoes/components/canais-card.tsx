'use client';

import { useState } from 'react';
import type { CanalVenda } from '@/shared/api/contracts/pricing';
import { getErrorMessage } from '@/shared/api/errors';
import { Badge } from '@/shared/ui/badge';
import { Button, IconButton } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import {
  IconAdicionar,
  IconEditar,
  IconExcluir,
} from '@/shared/ui/icons/acoes';
import { useToast } from '@/shared/ui/toast';
import { formatComissao } from '../configuracoes.calculos';
import { useDeleteCanal } from '../hooks/use-delete-canal';
import { useUpdateCanal } from '../hooks/use-update-canal';
import { CanalFormDialog } from './canal-form-dialog';

type Formulario = { aberto: boolean; canal?: CanalVenda };

/** "Onde você vende": os canais de venda e a comissão de cada um (BE-25). */
export function CanaisCard({ canais }: { canais: readonly CanalVenda[] }) {
  const [formulario, setFormulario] = useState<Formulario>({ aberto: false });
  const [paraExcluir, setParaExcluir] = useState<CanalVenda | null>(null);
  const excluir = useDeleteCanal();
  const toast = useToast();

  return (
    <Card title="Onde você vende">
      <p className="text-small text-ink-muted">
        Cada forma de venda ativa ganha um preço sugerido nas receitas, já com a
        comissão dela.
      </p>
      <ul className="flex flex-col divide-y divide-border">
        {canais.map((canal) => (
          <LinhaCanal
            key={canal.id}
            canal={canal}
            onEditar={() => setFormulario({ aberto: true, canal })}
            onExcluir={() => setParaExcluir(canal)}
          />
        ))}
      </ul>
      <Button
        variant="secundario"
        className="self-start"
        onClick={() => setFormulario({ aberto: true })}
      >
        <IconAdicionar className="size-5" />
        Nova forma de venda
      </Button>

      <CanalFormDialog
        // A key recria o formulário com os valores do canal escolhido.
        key={formulario.canal?.id ?? 'novo'}
        open={formulario.aberto}
        onOpenChange={(aberto) =>
          setFormulario((atual) => ({ ...atual, aberto }))
        }
        canal={formulario.canal}
      />

      <ConfirmDialog
        open={paraExcluir !== null}
        onOpenChange={(aberto) => {
          if (!aberto) setParaExcluir(null);
        }}
        title="Excluir forma de venda"
        description={`Deseja excluir "${paraExcluir?.nome ?? ''}"? As vendas já feitas nela continuam no histórico.`}
        confirmLabel="Excluir"
        // Rejeitar mantém o diálogo aberto, com a mensagem do backend.
        onConfirm={async () => {
          if (!paraExcluir) return;
          await excluir.mutateAsync(paraExcluir.id);
          toast.success('Forma de venda excluída.');
          setParaExcluir(null);
        }}
      />
    </Card>
  );
}

function LinhaCanal({
  canal,
  onEditar,
  onExcluir,
}: {
  canal: CanalVenda;
  onEditar: () => void;
  onExcluir: () => void;
}) {
  const alternar = useUpdateCanal();
  const toast = useToast();
  const acao = canal.ativo ? 'Desativar' : 'Ativar';

  async function alternarAtivo() {
    try {
      await alternar.mutateAsync({
        id: canal.id,
        body: { ativo: !canal.ativo },
      });
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-3">
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold wrap-anywhere text-ink">
            {canal.nome}
          </span>
          {canal.ativo ? (
            <Badge tone="adequado">Ativo</Badge>
          ) : (
            <Badge tone="neutro">Desativado</Badge>
          )}
        </div>
        <span className="text-small text-ink-muted">
          {`Comissão: ${formatComissao(canal.comissaoPercentual)}`}
        </span>
        {canal.balcao ? (
          <span className="text-small text-ink-muted">
            A taxa da maquininha entra no preço do balcão.
          </span>
        ) : null}
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="secundario"
          size="compacto"
          loading={alternar.isPending}
          aria-label={`${acao} ${canal.nome}`}
          onClick={() => void alternarAtivo()}
        >
          {acao}
        </Button>
        <IconButton aria-label={`Editar ${canal.nome}`} onClick={onEditar}>
          <IconEditar />
        </IconButton>
        {/* O Balcão é o canal padrão: o backend recusa a exclusão (422). */}
        {canal.balcao ? null : (
          <IconButton aria-label={`Excluir ${canal.nome}`} onClick={onExcluir}>
            <IconExcluir />
          </IconButton>
        )}
      </div>
    </li>
  );
}
