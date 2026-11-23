import type { Metadata } from 'next';
import { GastosIndiretosLista } from '@/features/gastos-indiretos/components/gastos-indiretos-lista';
import { gastosIndiretosSearchSchema } from '@/features/gastos-indiretos/schemas/gastos-indiretos-search.schema';

export const metadata: Metadata = { title: 'Contas do mês' };

/** Só o `novo=1` das ações rápidas vem da URL. */
export default async function GastosIndiretosPage({
  searchParams,
}: PageProps<'/gastos-indiretos'>) {
  const { novo } = gastosIndiretosSearchSchema.parse(await searchParams);

  return <GastosIndiretosLista abrirNovo={novo === '1'} />;
}
