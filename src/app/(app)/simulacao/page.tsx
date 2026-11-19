import type { Metadata } from 'next';
import { SimulacaoTela } from '@/features/simulacao/components/simulacao-tela';
import { simulacaoSearchSchema } from '@/features/simulacao/schemas/simulacao-search.schema';

export const metadata: Metadata = { title: 'Simulação' };

/**
 * Simulação interativa (FE-21), fora do menu: aberta pelo painel (FE-22), que
 * pode passar a receita em `?receitaId=`.
 */
export default async function SimulacaoPage({
  searchParams,
}: PageProps<'/simulacao'>) {
  const { receitaId } = simulacaoSearchSchema.parse(await searchParams);

  return <SimulacaoTela receitaId={receitaId} />;
}
