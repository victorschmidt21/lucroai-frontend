import type { Metadata } from 'next';
import { VendasTela } from '@/features/vendas/components/vendas-tela';
import { vendasSearchSchema } from '@/features/vendas/schemas/vendas-search.schema';

export const metadata: Metadata = { title: 'Vendas' };

/** Abas "Registrar" (FE-16) e "Histórico" (FE-18), em `aba` na URL. */
export default async function VendasPage({
  searchParams,
}: PageProps<'/vendas'>) {
  const { aba } = vendasSearchSchema.parse(await searchParams);

  return <VendasTela aba={aba} />;
}
