import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { TermoPagina } from '@/features/aprender/components/termo-pagina';
import { buscarTermo } from '@/features/aprender/termos';

type Props = PageProps<'/aprender/[termo]'>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const termo = buscarTermo((await params).termo);
  return termo ? { title: termo.titulo } : {};
}

/** Página de um termo (FE-67); id inexistente é 404. */
export default async function TermoPage({ params }: Props) {
  const termo = buscarTermo((await params).termo);

  if (!termo) notFound();

  return <TermoPagina termo={termo} />;
}
