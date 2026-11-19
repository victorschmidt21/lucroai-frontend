import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ReceitaFormPagina } from '@/features/receitas/components/receita-form';
import { receitaParamsSchema } from '@/features/receitas/schemas/receita-params.schema';

export const metadata: Metadata = { title: 'Editar receita' };

/** Id inválido na URL (`/receitas/abc/editar`) é 404. */
export default async function EditarReceitaPage({
  params,
}: PageProps<'/receitas/[receitaId]/editar'>) {
  const resultado = receitaParamsSchema.safeParse(await params);

  if (!resultado.success) notFound();

  return <ReceitaFormPagina receitaId={resultado.data.receitaId} />;
}
