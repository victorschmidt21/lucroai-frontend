import { formatMoeda } from '@/shared/format/moeda';
import { formatPercentual } from '@/shared/format/numero';
import { Card } from '@/shared/ui/card';
import type { ResultadoCustoReal } from '../custos.calculos';

/** Destaque do resultado. Origem: `_buildResultadoCard` de calculo_real_screen.dart. */
export function ResultadoCustoRealCard({
  resultado,
}: {
  resultado: ResultadoCustoReal;
}) {
  return (
    <Card variant="resumo" className="items-center py-6 text-center">
      <h2 className="text-section-label text-ink-muted">Custo por unidade</h2>
      <p className="text-display-lg wrap-anywhere text-accent tabular-nums">
        {formatMoeda(resultado.custoPorUnidade)}
      </p>
      <dl className="mt-3 grid w-full grid-cols-2 divide-x divide-border-strong">
        <div className="flex flex-col-reverse items-center gap-0.5 px-2">
          <dt className="text-caption text-ink-muted">Custo Total</dt>
          <dd className="text-body font-bold wrap-anywhere tabular-nums">
            {formatMoeda(resultado.custoTotal)}
          </dd>
        </div>
        <div className="flex flex-col-reverse items-center gap-0.5 px-2">
          <dt className="text-caption text-ink-muted">Custos Invisíveis</dt>
          <dd className="text-body font-bold wrap-anywhere text-warning tabular-nums">
            {`${formatMoeda(resultado.custosInvisiveis)} (${formatPercentual(resultado.percentualInvisivel)})`}
          </dd>
        </div>
      </dl>
    </Card>
  );
}
