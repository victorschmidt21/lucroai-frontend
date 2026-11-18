'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { hrefComFiltros } from '@/shared/api/filtros';

/** Espera depois da última tecla antes de filtrar e gravar na URL. */
export const DEBOUNCE_BUSCA_MS = 300;

/**
 * Busca textual com o termo em `?q=` (recarregar a página mantém o filtro). O campo
 * responde a cada tecla; o `termo`, usado para filtrar, e a URL mudam 300 ms depois
 * da última. Voltar no navegador atualiza o campo.
 */
export function useBuscaNaUrl(parametro = 'q') {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const naUrl = searchParams.get(parametro) ?? '';
  const [texto, setTexto] = useState(naUrl);
  const [termo, setTermo] = useState(naUrl);
  const [urlAnterior, setUrlAnterior] = useState(naUrl);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // A URL mudou por fora (voltar, link): o campo acompanha. Ajuste durante a
  // renderização, sem efeito, como recomenda o React para estado derivado.
  if (naUrl !== urlAnterior) {
    setUrlAnterior(naUrl);

    if (naUrl !== termo.trim()) {
      setTexto(naUrl);
      setTermo(naUrl);
    }
  }

  useEffect(() => () => clearTimeout(timer.current), []);

  function aplicar(valor: string) {
    clearTimeout(timer.current);
    setTermo(valor);
    // Lê a query no momento da gravação: outro filtro pode ter mudado nos 300 ms.
    router.replace(
      hrefComFiltros(pathname, window.location.search, {
        [parametro]: valor.trim(),
      }),
      { scroll: false },
    );
  }

  function alterar(valor: string) {
    setTexto(valor);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => aplicar(valor), DEBOUNCE_BUSCA_MS);
  }

  return {
    /** O que está no campo. */
    texto,
    /** O termo já aplicado, sem espaços nas pontas. */
    termo: termo.trim(),
    alterar,
    /** Aplica agora, sem esperar (Enter). */
    aplicarAgora: () => aplicar(texto),
    limpar: () => {
      setTexto('');
      aplicar('');
    },
  };
}
