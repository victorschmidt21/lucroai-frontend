import { formatMoeda } from '@/shared/format/moeda';
import { formatNumero } from '@/shared/format/numero';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import type { SimulacaoSalva } from '../schemas/simulacao-salva.schema';

type Props = {
  simulacoes: readonly SimulacaoSalva[];
  onAbrir: (simulacao: SimulacaoSalva) => void;
};

/** "Simulações salvas", da mais recente para a mais antiga (`_buildHistorico`). */
export function SimulacoesSalvasCard({ simulacoes, onAbrir }: Props) {
  return (
    <Card title="Simulações salvas">
      {simulacoes.length === 0 ? (
        <p className="text-small text-ink-muted">Nenhuma simulação salva.</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {simulacoes
            .map((simulacao, indice) => ({ simulacao, indice }))
            .toReversed()
            .map(({ simulacao, indice }) => (
              <li
                key={indice}
                className="flex items-center gap-3 rounded-md bg-surface-alt p-3"
              >
                <div className="flex min-w-0 grow flex-col gap-1">
                  <span className="truncate text-body font-bold">
                    {simulacao.nome}
                  </span>
                  <span className="text-caption text-ink-muted tabular-nums">
                    {`${formatNumero(simulacao.rendimento)} un - total ${formatMoeda(simulacao.custoTotal)}`}
                  </span>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-body font-bold text-success tabular-nums">
                    {formatMoeda(simulacao.custoPorUnidade)}
                  </span>
                  <Button
                    variant="fantasma"
                    size="compacto"
                    className="text-accent"
                    aria-label={`Abrir ${simulacao.nome}`}
                    onClick={() => onAbrir(simulacao)}
                  >
                    Abrir
                  </Button>
                </div>
              </li>
            ))}
        </ul>
      )}
    </Card>
  );
}
