import { formatMoeda } from '@/shared/format/moeda';
import { formatPercentual } from '@/shared/format/numero';
import { Card } from '@/shared/ui/card';
import { cn } from '@/shared/ui/cn';

type Props = {
  lucroAtual: number;
  lucroProjetado: number;
  margemAtual: number;
  margemProjetada: number;
  diferenca: number;
};

const LARGURA = 300;
const ALTURA = 120;
const BASE_Y = ALTURA - 18;
const ALTURA_UTIL = ALTURA - 28;
const LARGURA_BARRA = 66;
const ESPACO = 48;
const INICIO_X = (LARGURA - (LARGURA_BARRA * 2 + ESPACO)) / 2;

/** Altura da barra: `|valor| / max(|atual|, |projetado|, 1)`, no mínimo 4px. */
function alturaDaBarra(valor: number, maximo: number) {
  return Math.max(4, (Math.abs(valor) / maximo) * ALTURA_UTIL);
}

/**
 * `_ProjectionChartCard` e `_ProfitComparisonPainter`: duas barras (atual e
 * projetado) em SVG próprio. O SVG é decorativo; a tabela `sr-only` e a
 * legenda dizem os mesmos valores ao leitor de tela.
 */
export function GraficoLucro({
  lucroAtual,
  lucroProjetado,
  margemAtual,
  margemProjetada,
  diferenca,
}: Props) {
  const maximo = Math.max(Math.abs(lucroAtual), Math.abs(lucroProjetado), 1);
  const barras = [
    { x: INICIO_X, valor: lucroAtual, classe: 'fill-ink' },
    {
      x: INICIO_X + LARGURA_BARRA + ESPACO,
      valor: lucroProjetado,
      classe: 'fill-accent',
    },
  ];
  const positivo = diferenca >= 0;

  return (
    <Card title="Lucro projetado vs atual">
      <p
        className={cn(
          'text-body font-bold tabular-nums',
          positivo ? 'text-success' : 'text-danger',
        )}
      >
        Diferença: {positivo ? '+' : ''}
        {formatMoeda(diferenca)}
      </p>
      <svg
        aria-hidden="true"
        viewBox={`0 0 ${LARGURA} ${ALTURA}`}
        className="h-30 w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <line
          x1={0}
          x2={LARGURA}
          y1={BASE_Y}
          y2={BASE_Y}
          className="stroke-border"
          strokeWidth={1}
        />
        {barras.map(({ x, valor, classe }) => {
          const altura = alturaDaBarra(valor, maximo);
          return (
            <rect
              key={x}
              x={x}
              y={BASE_Y - altura}
              width={LARGURA_BARRA}
              height={altura}
              rx={8}
              className={classe}
            />
          );
        })}
      </svg>
      <table className="sr-only">
        <caption>Lucro atual e projetado</caption>
        <thead>
          <tr>
            <th scope="col">Cenário</th>
            <th scope="col">Lucro</th>
            <th scope="col">Margem</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">Atual</th>
            <td>{formatMoeda(lucroAtual)}</td>
            <td>{formatPercentual(margemAtual)}</td>
          </tr>
          <tr>
            <th scope="row">Projetado</th>
            <td>{formatMoeda(lucroProjetado)}</td>
            <td>{formatPercentual(margemProjetada)}</td>
          </tr>
        </tbody>
      </table>
      <div aria-hidden="true" className="grid grid-cols-2 gap-2.5">
        <Legenda
          rotulo="Atual"
          valor={formatMoeda(lucroAtual)}
          detalhe={`${formatPercentual(margemAtual)} margem`}
          className="text-ink"
        />
        <Legenda
          rotulo="Projetado"
          valor={formatMoeda(lucroProjetado)}
          detalhe={`${formatPercentual(margemProjetada)} margem`}
          className="text-success"
        />
      </div>
    </Card>
  );
}

function Legenda({
  rotulo,
  valor,
  detalhe,
  className,
}: {
  rotulo: string;
  valor: string;
  detalhe: string;
  className: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-md bg-surface-alt p-3">
      <span className="text-caption font-bold text-ink-muted">{rotulo}</span>
      <span
        className={cn(
          'text-body font-extrabold wrap-anywhere tabular-nums',
          className,
        )}
      >
        {valor}
      </span>
      <span className="text-caption text-ink-muted">{detalhe}</span>
    </div>
  );
}
