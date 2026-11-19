import type { Metadata } from 'next';
import { InsumosLista } from '@/features/insumos/components/insumos-lista';
import { insumosSearchSchema } from '@/features/insumos/schemas/insumos-search.schema';

export const metadata: Metadata = { title: 'Insumos' };

/** A busca (`q`) é lida pela `ListPage`; aqui, só o `novo=1` das ações rápidas. */
export default async function InsumosPage({
  searchParams,
}: PageProps<'/insumos'>) {
  const { novo } = insumosSearchSchema.parse(await searchParams);

  return <InsumosLista abrirNovo={novo === '1'} />;
}
