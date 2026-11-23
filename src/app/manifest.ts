import type { MetadataRoute } from 'next';

/**
 * Manifesto do app instalável (FE-54): nome e ícones Doce Fatia. As cores são
 * fixas porque o navegador as lê antes do CSS: Amora (#A3326E) na barra e
 * Chantilly (#FFF8F3) no fundo da abertura, como em docs/marca.md.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Doce Fatia',
    short_name: 'Doce Fatia',
    description:
      'Calcule o preço justo dos seus doces e veja quanto sobra pra você.',
    start_url: '/',
    display: 'standalone',
    lang: 'pt-BR',
    theme_color: '#A3326E',
    background_color: '#FFF8F3',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
