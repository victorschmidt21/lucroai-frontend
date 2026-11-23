import type { Metadata } from 'next';
import { InsumosLista } from '@/features/insumos/components/insumos-lista';
import { insumosSearchSchema } from '@/features/insumos/schemas/insumos-search.schema';

export const metadata: Metadata = { title: 'Insumos' };

/**
 * A busca (`q`) é lida pela `ListPage`; aqui, o `novo=1` das ações rápidas e o
 * `compra=<id>` do aviso de estoque negativo (FE-47). A `key` recria a lista
 * quando o aviso leva a outra compra com a tela de insumos já aberta.
 */
export default async function InsumosPage({
  searchParams,
}: PageProps<'/insumos'>) {
  const { novo, compra } = insumosSearchSchema.parse(await searchParams);

  return (
    <InsumosLista
      key={compra ?? 'lista'}
      abrirNovo={novo === '1'}
      abrirCompraDe={compra}
    />
  );
}
