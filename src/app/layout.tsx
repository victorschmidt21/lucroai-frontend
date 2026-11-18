import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { publicEnv } from '@/shared/config/env.public';
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

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={roboto.variable}>
      <body className="bg-bg font-sans text-body text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
