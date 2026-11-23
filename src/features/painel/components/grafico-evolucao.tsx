import { formatMoeda } from '@/shared/format/moeda';
import { cn } from '@/shared/ui/cn';
import type { PontoMensal } from '../painel.calculos';

const LARGURA = 300;
const ALTURA = 120;
const ESPACO = 12;
/** Altura mínima da barra, para o mês sem vendas não sumir. */
const MINIMO = 2;

/**
 * Receita dos últimos 6 meses em barras (FE-58): `accent-soft`, com o mês atual
 * (o último) em `accent`, a partir do zero. O valor de cada mês fica no tooltip
 * (`<title>`) e na tabela `sr-only`; o SVG é decorativo para o leitor de tela.
 */
export function GraficoEvolucao({
  pontos,
  tendencia,
}: {
  pontos: readonly PontoMensal[];
  tendencia: string;
}) {
  const maximo = Math.max(...pontos.map((p) => p.valor), 1);
  const largura = (LARGURA - ESPACO * (pontos.length - 1)) / pontos.length;
  const negativa = tendencia.startsWith('-');

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
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
        {pontos.map((p, indice) => {
          const altura = Math.max((p.valor / maximo) * ALTURA, MINIMO);
          const atual = indice === pontos.length - 1;
          return (
            <rect
              key={`${p.ano}-${p.rotulo}`}
              x={indice * (largura + ESPACO)}
              y={ALTURA - altura}
              width={largura}
              height={altura}
              rx={6}
              className={atual ? 'fill-accent' : 'fill-accent-soft'}
            >
              <title>{`${p.rotulo}/${p.ano}: ${formatMoeda(p.valor)}`}</title>
            </rect>
          );
        })}
      </svg>
      <div
        aria-hidden="true"
        className="grid grid-cols-6 text-center text-caption text-ink-muted"
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
