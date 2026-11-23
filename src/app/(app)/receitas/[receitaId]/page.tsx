import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ReceitaDetalhePagina } from '@/features/receitas/components/receita-detalhe';
import { receitaParamsSchema } from '@/features/receitas/schemas/receita-params.schema';

export const metadata: Metadata = { title: 'Receita' };

/** Id inválido na URL (`/receitas/abc`) é 404. */
export default async function ReceitaPage({
  params,
}: PageProps<'/receitas/[receitaId]'>) {
  const resultado = receitaParamsSchema.safeParse(await params);

  if (!resultado.success) notFound();

  return <ReceitaDetalhePagina receitaId={resultado.data.receitaId} />;
}
