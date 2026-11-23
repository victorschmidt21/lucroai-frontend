import { Button } from './button';
import { cn } from './cn';
import {
  BLOCO_ESTADO_CLASSES,
  ICONE_ESTADO_CLASSES,
  TITULO_ESTADO_CLASSES,
} from './empty-state';
import { IconAtualizar, IconErro } from './icons/acoes';

type ErrorStateProps = {
  /** O que falhou, com o texto da tela: "Não foi possível carregar os insumos." */
  title: string;
  /** Mensagem do backend em português (`getErrorMessage`, FE-05), sem detalhes técnicos. */
  message?: string;
  onRetry: () => void;
  /** Durante a nova tentativa, o botão fica ocupado. */
  retrying?: boolean;
  className?: string;
};

/** Falha ao carregar dados, no mesmo bloco do `EmptyState`, sempre com "Tentar novamente". */
export function ErrorState({
  title,
  message,
  onRetry,
  retrying = false,
  className,
}: ErrorStateProps) {
  return (
    <div role="alert" className={cn(BLOCO_ESTADO_CLASSES, className)}>
      <span className={cn(ICONE_ESTADO_CLASSES, 'text-danger')}>
        <IconErro />
      </span>
      <div className="flex max-w-prose flex-col gap-1">
        <p className={TITULO_ESTADO_CLASSES}>{title}</p>
        {message ? <p className="text-body text-ink-muted">{message}</p> : null}
      </div>
      <Button variant="secundario" loading={retrying} onClick={onRetry}>
        {retrying ? null : <IconAtualizar className="size-4" />}
        Tentar novamente
      </Button>
    </div>
  );
}
