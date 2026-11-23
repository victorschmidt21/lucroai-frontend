import type { ComponentProps } from 'react';
import {
  STATUS_VENDA_ROTULOS,
  TIPO_GASTO_ROTULOS,
  type StatusVenda,
  type TipoGasto,
} from '@/shared/api/contracts/enums';
import { cn } from './cn';

// Fundo suave do status (`*-soft`) e texto na cor cheia; "Cancelada" é neutra, sobre
// `surface-alt` (FE-51, docs/ui.md#status). Pares medidos em tokens.test.ts.
const TONE_CLASSES = {
  critico: 'border-transparent bg-danger-soft text-status-critico',
  baixo: 'border-transparent bg-warning-soft text-status-baixo',
  adequado: 'border-transparent bg-success-soft text-status-adequado',
  pendente: 'border-transparent bg-warning-soft text-status-pendente',
  concluida: 'border-transparent bg-success-soft text-status-concluida',
  cancelada: 'border-transparent bg-surface-alt text-status-cancelada',
  neutro: 'border-border bg-surface-alt text-ink-muted',
  destaque: 'border-transparent bg-accent-soft text-ink',
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

/** Saldo abaixo de zero (`estoqueNegativo`, FE-47): cor e texto, nunca só cor. */
export function EstoqueNegativoBadge() {
  return <Badge tone="critico">Estoque negativo</Badge>;
}
