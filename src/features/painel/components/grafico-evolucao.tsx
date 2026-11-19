import { formatMoeda } from '@/shared/format/moeda';
import { cn } from '@/shared/ui/cn';
import type { PontoMensal } from '../painel.calculos';

const LARGURA = 300;
const ALTURA = 120;
const MARGEM = 8;

/**
 * Pontos da linha: como o `_MonthlyEvolutionPainter`, normaliza entre o menor e
 * o maior valor (intervalo mínimo de 1).
 */
function pontosDaLinha(valores: readonly number[]) {
  const minimo = Math.min(...valores);
  const intervalo = Math.max(Math.max(...valores) - minimo, 1);
  const passo = (LARGURA - MARGEM * 2) / (valores.length - 1);
  const alturaUtil = ALTURA - MARGEM * 2;
  return valores.map((valor, indice) => ({
    x: MARGEM + passo * indice,
    y: MARGEM + alturaUtil - ((valor - minimo) / intervalo) * alturaUtil,
  }));
}

/**
 * `_ChartCard`: receita dos últimos 6 meses em SVG próprio, com a tendência do
 * último mês. O SVG é decorativo; a tabela `sr-only` diz os valores.
 */
export function GraficoEvolucao({
  pontos,
  tendencia,
}: {
  pontos: readonly PontoMensal[];
  tendencia: string;
}) {
  const coordenadas = pontosDaLinha(pontos.map((p) => p.valor));
  const negativa = tendencia.startsWith('-');

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-3.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-body font-bold text-ink">
          Receita dos últimos 6 meses
        </p>
        <p
          className={cn(
            'text-small font-bold tabular-nums',
            negativa ? 'text-danger' : 'text-success',
          )}
        >
          <span className="sr-only">Tendência do último mês: </span>
          {tendencia}
        </p>
      </div>
      <svg
        aria-hidden="true"
        viewBox={`0 0 ${LARGURA} ${ALTURA}`}
        className="h-32 w-full"
        preserveAspectRatio="none"
      >
        {[0, 1, 2, 3].map((linha) => {
          const y = MARGEM + ((ALTURA - MARGEM * 2) * linha) / 3;
          return (
            <line
              key={linha}
              x1={0}
              x2={LARGURA}
              y1={y}
              y2={y}
              className="stroke-border"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
        <polyline
          points={coordenadas.map(({ x, y }) => `${x},${y}`).join(' ')}
          fill="none"
          className="stroke-accent"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div
        aria-hidden="true"
        className="flex justify-between text-caption text-ink-muted"
      >
        {pontos.map((p) => (
          <span key={`${p.ano}-${p.rotulo}`}>{p.rotulo}</span>
        ))}
      </div>
      <table className="sr-only">
        <caption>Receita dos últimos 6 meses</caption>
        <thead>
          <tr>
            <th scope="col">Mês</th>
            <th scope="col">Receita</th>
          </tr>
        </thead>
        <tbody>
          {pontos.map((p) => (
            <tr key={`${p.ano}-${p.rotulo}`}>
              <th scope="row">
                {p.rotulo}/{p.ano}
              </th>
              <td>{formatMoeda(p.valor)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
