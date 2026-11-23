'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { cookieDoTema, TEMA_PADRAO, type Tema } from './tema';

type TemaApi = { tema: Tema; setTema: (tema: Tema) => void };

const TemaContext = createContext<TemaApi | null>(null);

/**
 * Guarda a aparência escolhida (FE-52). O valor inicial vem do cookie, lido pelo
 * `RootLayout`; trocar atualiza o `data-tema` do <html> e o cookie na hora.
 */
export function TemaProvider({
  temaInicial,
  children,
}: {
  temaInicial: Tema;
  children: ReactNode;
}) {
  const [tema, setEstado] = useState(temaInicial);

  const setTema = useCallback((novo: Tema) => {
    document.documentElement.dataset.tema = novo;
    // Só preferência visual: o cookie fica legível de propósito (docs/security.md).
    // oxlint-disable-next-line unicorn/no-document-cookie
    document.cookie = cookieDoTema(novo, location.protocol === 'https:');
    setEstado(novo);
  }, []);

  const api = useMemo(() => ({ tema, setTema }), [tema, setTema]);

  return <TemaContext.Provider value={api}>{children}</TemaContext.Provider>;
}

/** Fora do `TemaProvider` (testes de componente), devolve o claro sem trocar. */
export function useTema(): TemaApi {
  return useContext(TemaContext) ?? { tema: TEMA_PADRAO, setTema: () => {} };
}
