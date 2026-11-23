import type { Metadata } from 'next';
import { ProducoesLista } from '@/features/producoes/components/producoes-lista';
import { producoesSearchSchema } from '@/features/producoes/schemas/producoes-search.schema';

export const metadata: Metadata = { title: 'Fornadas' };

/** Filtro `receitaId` (aplicado pelo backend) e `novo=1` das ações rápidas. */
export default async function ProducoesPage({
  searchParams,
}: PageProps<'/producoes'>) {
  const { receitaId, novo } = producoesSearchSchema.parse(await searchParams);

  return <ProducoesLista receitaId={receitaId} abrirNovo={novo === '1'} />;
}
