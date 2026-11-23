import { Button } from './button';
import { cn } from './cn';
import { BLOCO_ESTADO_CLASSES, TITULO_ESTADO_CLASSES } from './empty-state';
import { IconAtualizar } from './icons/acoes';
import { IlustracaoSemConexao } from './ilustracoes';

type ErrorStateProps = {
  /** O que falhou, com o texto da tela: "Não foi possível carregar os insumos." */
  title: string;
  /** Mensagem do backend em português (`getErrorMessage`, FE-05), sem detalhes técnicos. */
  message?: string;
  onRetry: () => void;
  /** Durante a nova tentativa, o botão fica ocupado. */
  retrying?: boolean;
  /** Versão menor, sem ilustração, para erro de um bloco dentro da tela (painel, FE-58). */
  compacto?: boolean;
  className?: string;
};

/**
 * Falha ao carregar dados, no mesmo bloco do `EmptyState`, sempre com "Tentar de novo".
 * Mostra a nuvem sem conexão (FE-59): o texto sempre manda conferir a internet.
 */
export function ErrorState({
  title,
  message,
  onRetry,
  retrying = false,
  compacto = false,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        compacto
          ? BLOCO_ESTADO_CLASSES.replace('gap-3', 'gap-2').replace('p-8', 'p-4')
          : BLOCO_ESTADO_CLASSES,
        className,
      )}
    >
      {compacto ? null : <IlustracaoSemConexao />}
      <div className="flex max-w-prose flex-col gap-1">
        <p
          className={
            compacto ? 'text-body font-bold text-ink' : TITULO_ESTADO_CLASSES
          }
        >
          {title}
        </p>
        {message ? <p className="text-body text-ink-muted">{message}</p> : null}
      </div>
      <Button variant="secundario" loading={retrying} onClick={onRetry}>
        {retrying ? null : <IconAtualizar className="size-4" />}
        Tentar de novo
      </Button>
    </div>
  );
}
