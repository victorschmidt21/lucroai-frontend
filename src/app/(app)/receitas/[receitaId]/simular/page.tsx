import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SimulacaoReceitaPagina } from '@/features/receitas/components/simulacao-receita';
import { receitaParamsSchema } from '@/features/receitas/schemas/receita-params.schema';

export const metadata: Metadata = { title: 'Simulação de cenário' };

/** Id inválido na URL (`/receitas/abc/simular`) é 404. */
export default async function SimularReceitaPage({
  params,
}: PageProps<'/receitas/[receitaId]/simular'>) {
  const resultado = receitaParamsSchema.safeParse(await params);

  if (!resultado.success) notFound();

  return <SimulacaoReceitaPagina receitaId={resultado.data.receitaId} />;
}
