import { EmptyState } from '@/shared/ui/empty-state';
import { IconConstrucao } from '@/shared/ui/icons/acoes';
import { PageHeader } from '@/shared/ui/page-header';

type TelaProvisoriaProps = {
  /** Título e subtítulo da tela definitiva (docs/business-rules.md). */
  title: string;
  subtitle: string;
};

/** Ocupa a rota do menu até a issue da tela ser entregue (FE-09 a FE-22). */
export function TelaProvisoria({ title, subtitle }: TelaProvisoriaProps) {
  return (
    <>
      <PageHeader title={title} subtitle={subtitle} />
      <EmptyState
        icon={<IconConstrucao />}
        title="Em construção"
        description="Esta tela ainda não está disponível na versão web."
      />
    </>
  );
}
