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
  critico: 'bg-danger-soft text-status-critico',
  baixo: 'bg-warning-soft text-status-baixo',
  adequado: 'bg-success-soft text-status-adequado',
  pendente: 'bg-warning-soft text-status-pendente',
  concluida: 'bg-success-soft text-status-concluida',
  cancelada: 'bg-surface-alt text-status-cancelada',
  neutro: 'bg-surface-alt text-ink-muted',
  destaque: 'bg-accent-soft text-ink',
};

export type BadgeTone = keyof typeof TONE_CLASSES;

// Status levam o ponto (cor, ponto e texto, docs/marca.md#cores-paleta-confeitaria);
// `neutro` e `destaque` são rótulos, como o tipo do gasto, e ficam sem ele.
const TONS_COM_PONTO: readonly BadgeTone[] = [
  'critico',
  'baixo',
  'adequado',
  'pendente',
  'concluida',
  'cancelada',
];

type BadgeProps = ComponentProps<'span'> & {
  tone?: BadgeTone;
};

/** Pílula com ponto de 8px na cor do texto e rótulo Nunito 800 de 13px (FE-55). */
export function Badge({
  tone = 'neutro',
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-caption font-extrabold whitespace-nowrap',
        TONE_CLASSES[tone],
        className,
      )}
      {...props}
    >
      {TONS_COM_PONTO.includes(tone) ? (
        <span
          aria-hidden="true"
          className="size-2 shrink-0 rounded-full bg-current"
        />
      ) : null}
      {children}
    </span>
  );
}

/** Resultado de `statusEstoque()` (FE-13, docs/business-rules.md#estoque-de-insumos). */
export type StatusEstoque = 'critico' | 'baixo' | 'adequado';

const STATUS_ESTOQUE = {
  critico: { label: 'Acabando', tone: 'critico' },
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
