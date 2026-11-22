import type { ComponentProps } from 'react';
import {
  STATUS_VENDA_ROTULOS,
  TIPO_GASTO_ROTULOS,
  type StatusVenda,
  type TipoGasto,
} from '@/shared/api/contracts/enums';
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

/** Resultado de `statusEstoque()` (FE-13, docs/business-rules.md#estoque-de-insumos). */
export type StatusEstoque = 'critico' | 'baixo' | 'adequado';

const STATUS_ESTOQUE = {
  critico: { label: 'Crítico', tone: 'critico' },
  baixo: { label: 'Baixo', tone: 'baixo' },
  adequado: { label: 'Adequado', tone: 'adequado' },
} as const satisfies Record<StatusEstoque, { label: string; tone: BadgeTone }>;

const TOM_STATUS_VENDA: Record<StatusVenda, BadgeTone> = {
  PENDENTE: 'pendente',
  CONCLUIDA: 'concluida',
  CANCELADA: 'cancelada',
};

export function StatusEstoqueBadge({ status }: { status: StatusEstoque }) {
  const { label, tone } = STATUS_ESTOQUE[status];

  return <Badge tone={tone}>{label}</Badge>;
}

export function StatusVendaBadge({ status }: { status: StatusVenda }) {
  return (
    <Badge tone={TOM_STATUS_VENDA[status]}>
      {STATUS_VENDA_ROTULOS[status]}
    </Badge>
  );
}

export function TipoGastoBadge({ tipo }: { tipo: TipoGasto }) {
  return <Badge>{TIPO_GASTO_ROTULOS[tipo]}</Badge>;
}
