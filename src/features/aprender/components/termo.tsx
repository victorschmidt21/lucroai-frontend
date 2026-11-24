'use client';

import { useState, type ReactNode } from 'react';
import { cn } from '@/shared/ui/cn';
import { buscarTermo, type DadosDoExemplo, type TermoId } from '../termos';
import { Pitada } from './pitada';

type TermoProps<Id extends TermoId> = {
  id: Id;
  /** O texto da tela, que continua aparecendo como está. */
  children: ReactNode;
  /**
   * O que a tela já carregou, para o bloco "No seu caso" (FE-65): o tipo vem do
   * `exemplo` do termo. Sem dados (ou com o exemplo devolvendo `null`), o bloco
   * não aparece. Nunca faz requisição.
   */
  dados?: DadosDoExemplo<Id> | null;
  /** `sobre-cor`: sobre fundo `accent` (herói do painel), com sublinhado e "?" em `on-accent`. */
  tom?: 'padrao' | 'sobre-cor';
  className?: string;
};

/**
 * Pitada no termo (FE-64): o texto da tela vira um botão com sublinhado
 * pontilhado e um "?"; tocar (clique, Enter ou Espaço) abre a explicação. Nunca
 * abre por hover nem por foco. Use só na primeira vez que o termo aparece na tela.
 *
 *   <Termo id="margem" dados={{ nome, lucroReal, lucroPorUnidade }}>margem 29%</Termo>
 */
export function Termo<Id extends TermoId>({
  id,
  children,
  dados,
  tom = 'padrao',
  className,
}: TermoProps<Id>) {
  const sobreCor = tom === 'sobre-cor';
  const termo = buscarTermo(id);
  const [aberta, setAberta] = useState(false);
  const [idAtual, setIdAtual] = useState<string>(id);
  const atual = buscarTermo(idAtual) ?? termo;

  function mudarAberta(abrir: boolean) {
    // Abrir de novo sempre começa pelo termo da tela.
    if (abrir) setIdAtual(id);
    setAberta(abrir);
  }

  return (
    <Pitada
      termo={atual}
      aberta={aberta}
      onAbertaChange={mudarAberta}
      onTrocarTermo={setIdAtual}
      // O exemplo é só do termo da tela: os dados são dele, não dos relacionados.
      exemplo={
        aberta && atual.id === id && dados != null
          ? (termo.exemplo?.(dados as never) ?? null)
          : null
      }
      gatilho={
        <button
          type="button"
          aria-label={`O que é ${termo.titulo}?`}
          className={cn(
            // 48px de área de toque mesmo com texto pequeno, pelo `::before`.
            'relative inline cursor-pointer text-left underline decoration-dotted decoration-2 underline-offset-4',
            sobreCor
              ? 'decoration-on-accent focus-visible:outline-on-accent'
              : 'decoration-accent',
            'before:absolute before:top-1/2 before:left-1/2 before:size-full before:min-h-12 before:min-w-12 before:-translate-1/2',
            className,
          )}
        >
          {children}
          <span
            aria-hidden="true"
            className={cn(
              'ml-1 inline-flex size-[18px] items-center justify-center rounded-full align-middle text-caption leading-none font-extrabold no-underline',
              sobreCor ? 'bg-on-accent text-accent' : 'bg-accent-soft text-ink',
            )}
          >
            ?
          </span>
        </button>
      }
    />
  );
}
