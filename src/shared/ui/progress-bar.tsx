import { cn } from './cn';

const TONE_CLASSES = {
  accent:
    '[&::-moz-progress-bar]:bg-accent [&::-webkit-progress-value]:bg-accent',
  critico:
    '[&::-moz-progress-bar]:bg-status-critico [&::-webkit-progress-value]:bg-status-critico',
  baixo:
    '[&::-moz-progress-bar]:bg-status-baixo [&::-webkit-progress-value]:bg-status-baixo',
  adequado:
    '[&::-moz-progress-bar]:bg-status-adequado [&::-webkit-progress-value]:bg-status-adequado',
};

type ProgressBarProps = {
  'aria-label': string;
  /** Fração de 0 a 1; valores fora do intervalo são limitados, como o `clamp` do mobile. */
  value: number;
  /** Cor da barra; no estoque, a do status. */
  tone?: keyof typeof TONE_CLASSES;
  /** Texto anunciado, como "86%". */
  valueText?: string;
  className?: string;
};

/** `LinearProgressIndicator` do cartão de estoque: 8px e cantos arredondados. */
export function ProgressBar({
  value,
  tone = 'accent',
  valueText,
  className,
  ...props
}: ProgressBarProps) {
  return (
    <progress
      max={1}
      value={Math.min(Math.max(value, 0), 1)}
      aria-valuetext={valueText}
      className={cn(
        'block h-2 w-full appearance-none overflow-hidden rounded-sm bg-border-strong',
        '[&::-webkit-progress-bar]:bg-border-strong [&::-webkit-progress-value]:rounded-sm [&::-moz-progress-bar]:rounded-sm',
        TONE_CLASSES[tone],
        className,
      )}
      {...props}
    />
  );
}
