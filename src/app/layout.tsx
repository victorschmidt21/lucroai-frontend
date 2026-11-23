import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import type { ReactNode } from 'react';
import { publicEnv } from '@/shared/config/env.public';
import { COOKIE_TEMA, lerTema } from '@/shared/ui/tema';
import { TemaProvider } from '@/shared/ui/tema-provider';
import { roboto } from './fonts';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.NEXT_PUBLIC_APP_URL),
  // Cada tela define `metadata.title`: a aba mostra "Insumos | LucroAI".
  title: { default: 'LucroAI', template: '%s | LucroAI' },
};

// `cover` faz o navegador informar a área segura do aparelho
// (`env(safe-area-inset-bottom)`), que a barra inferior do celular respeita.
export const viewport: Viewport = { viewportFit: 'cover' };

/**
 * A aparência (FE-52) vem do cookie `tema` e vai no HTML do servidor, em
 * `data-tema`: o modo noite não pisca o claro ao carregar, sem script inline.
 * Sem cookie, o app abre claro mesmo com o sistema no modo escuro.
 */
export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const tema = lerTema((await cookies()).get(COOKIE_TEMA)?.value);

  return (
    <html lang="pt-BR" className={roboto.variable} data-tema={tema}>
      <body className="bg-bg font-sans text-body text-ink antialiased">
        <TemaProvider temaInicial={tema}>{children}</TemaProvider>
      </body>
    </html>
  );
}
