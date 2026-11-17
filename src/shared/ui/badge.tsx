import type { ComponentProps } from 'react';
import { cn } from './cn';

// Fundo com 8% da cor e texto na cor cheia, como os status de estoque_card.dart e
// venda_card.dart (que usam 12%: com ele, "Cancelada" não atinge 4,5:1).
const TONE_CLASSES = {
  critico: 'border-status-critico/30 bg-status-critico/8 text-status-critico',
  baixo: 'border-status-baixo/30 bg-status-baixo/8 text-status-baixo',
  adequado:
    'border-status-adequado/30 bg-status-adequado/8 text-status-adequado',
  pendente:
    'border-status-pendente/30 bg-status-pendente/8 text-status-pendente',
  concluida:
    'border-status-concluida/30 bg-status-concluida/8 text-status-concluida',
  cancelada:
    'border-status-cancelada/30 bg-status-cancelada/8 text-status-cancelada',
  neutro: 'border-border-strong bg-surface-raised text-ink-muted',
  destaque: 'border-accent/30 bg-accent/8 text-accent',
};

export type BadgeTone = keyof typeof TONE_CLASSES;

type BadgeProps = ComponentProps<'span'> & {
  tone?: BadgeTone;
};

export function Badge({ tone = 'neutro', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-sm border px-2 py-0.5 text-caption font-semibold whitespace-nowrap',
        TONE_CLASSES[tone],
        className,
      )}
      {...props}
    />
  );
}

// Os tipos de enum passam a vir de `shared/api/contracts/enums.ts` na FE-05.

/** Resultado de `statusEstoque()` (FE-13, docs/business-rules.md#estoque-de-insumos). */
export type StatusEstoque = 'critico' | 'baixo' | 'adequado';
export type StatusVenda = 'PENDENTE' | 'CONCLUIDA' | 'CANCELADA';
export type MetodoRateio = 'PROPORCIONAL' | 'POR_UNIDADE' | 'FIXO';

const STATUS_ESTOQUE = {
  critico: { label: 'Crítico', tone: 'critico' },
  baixo: { label: 'Baixo', tone: 'baixo' },
  adequado: { label: 'Adequado', tone: 'adequado' },
} as const satisfies Record<StatusEstoque, { label: string; tone: BadgeTone }>;

const STATUS_VENDA = {
  PENDENTE: { label: 'Pendente', tone: 'pendente' },
  CONCLUIDA: { label: 'Concluída', tone: 'concluida' },
  CANCELADA: { label: 'Cancelada', tone: 'cancelada' },
} as const satisfies Record<StatusVenda, { label: string; tone: BadgeTone }>;

const METODO_RATEIO: Record<MetodoRateio, string> = {
  PROPORCIONAL: 'Proporcional à qtd. de lotes',
  POR_UNIDADE: 'Proporcional ao total de unidades',
  FIXO: 'Valor fixo por produção',
};

export function StatusEstoqueBadge({ status }: { status: StatusEstoque }) {
  const { label, tone } = STATUS_ESTOQUE[status];

  return <Badge tone={tone}>{label}</Badge>;
}

export function StatusVendaBadge({ status }: { status: StatusVenda }) {
  const { label, tone } = STATUS_VENDA[status];

  return <Badge tone={tone}>{label}</Badge>;
}

export function MetodoRateioBadge({ metodo }: { metodo: MetodoRateio }) {
  return <Badge>{METODO_RATEIO[metodo]}</Badge>;
}
