import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { GuiaPagina } from '@/features/aprender/components/guia-pagina';
import { buscarGuia } from '@/features/aprender/guias';

type Props = PageProps<'/aprender/guias/[guia]'>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const guia = buscarGuia((await params).guia);
  return guia ? { title: guia.titulo } : {};
}

/** Página de um guia (FE-67); id inexistente é 404. */
export default async function GuiaPage({ params }: Props) {
  const guia = buscarGuia((await params).guia);

  if (!guia) notFound();

  return <GuiaPagina guia={guia} />;
}
