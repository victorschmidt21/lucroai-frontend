'use client';

import Link from 'next/link';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { useAvisos } from '@/shared/avisos/avisos-context';
import {
  CARENCIA_MS,
  dicaDaVez,
  emCarencia,
  type DadosDaDica,
  type DicaId,
  type TelaDaDica,
} from '../dicas';
import {
  lerArmazenamentoDasDicas,
  marcarDicaDaSessao,
  marcarDicaVista,
} from '../dicas-armazenamento';
import { Termo } from './termo';

function nada() {
  return () => {};
}

type Props = DadosDaDica & {
  /** A tela onde a faixa está; cada tela tem as suas dicas. */
  tela: TelaDaDica;
};

/**
 * Dica na hora certa (FE-68, docs/aprender.md#dica-na-hora-certa): faixa no
 * topo do conteúdo, logo abaixo do `PageHeader`. A tela passa só o que já
 * carregou; os alertas e o estado do aviso ao entrar vêm do `AvisosContext`.
 * Num `<output>` (`role="status"`): o leitor de tela anuncia a dica sem tirar
 * o foco de onde está.
 * Qualquer funcionalidade importa este componente, como o `<Termo>`.
 */
export function DicaNaHora({ tela, ...dados }: Props) {
  const montado = useSyncExternalStore(
    nada,
    () => true,
    () => false,
  );
  // Lido uma vez ao abrir a tela; `null` no servidor.
  const [armazenado] = useState(lerArmazenamentoDasDicas);
  const [agora, setAgora] = useState(() => new Date());
  const [dispensada, setDispensada] = useState<DicaId | null>(null);
  const { alertas, dicasDeAlertaLiberadas } = useAvisos();

  const dica =
    montado && armazenado
      ? dicaDaVez(
          {
            ...dados,
            tela,
            alertas,
            avisoLiberado: dicasDeAlertaLiberadas,
            agora,
            primeiroAcesso: armazenado.primeiroAcesso,
            dicaDaSessao: armazenado.dicaDaSessao ?? dispensada,
          },
          dispensada ? [...armazenado.vistas, dispensada] : armazenado.vistas,
        )
      : null;
  const dicaId = dica?.id ?? null;

  useEffect(() => {
    if (dicaId) marcarDicaDaSessao(dicaId);
  }, [dicaId]);

  // Na carência da primeira sessão, confere de novo quando ela acaba.
  const fimDaCarencia =
    armazenado && emCarencia(armazenado.primeiroAcesso, agora)
      ? armazenado.primeiroAcesso + CARENCIA_MS
      : null;
  useEffect(() => {
    if (fimDaCarencia === null) return;
    const espera = setTimeout(
      () => setAgora(new Date()),
      Math.max(0, fimDaCarencia - Date.now()) + 100,
    );
    return () => clearTimeout(espera);
  }, [fimDaCarencia]);

  function dispensar() {
    if (!dica) return;
    marcarDicaVista(dica.id);
    setDispensada(dica.id);
  }

  // O `<output>` (região `status`) existe antes da dica, para o leitor de tela anunciar o
  // conteúdo quando ele chega. Vazia, fica `sr-only` (fora do fluxo), para não
  // somar um espaço a mais no `gap` da tela.
  return (
    <output className={dica ? 'block' : 'sr-only'}>
      {dica ? (
        <div className="flex flex-col gap-2 rounded-lg bg-warning-soft p-4">
          <h2 className="font-display text-title font-semibold text-ink">
            {dica.titulo}
          </h2>
          <p className="text-body text-ink">
            {dica.texto.map((parte, i) =>
              typeof parte === 'string' ? (
                parte
              ) : (
                <Termo key={i} id={parte.termo}>
                  {parte.texto}
                </Termo>
              ),
            )}
          </p>
          <div className="flex flex-wrap items-center gap-x-6">
            <Link
              href={dica.acao.href}
              onClick={dispensar}
              className="inline-flex min-h-12 items-center text-body font-extrabold text-accent underline underline-offset-4"
            >
              {dica.acao.rotulo}
            </Link>
            <button
              type="button"
              onClick={dispensar}
              className="inline-flex min-h-12 items-center text-small text-ink-muted underline underline-offset-4"
            >
              Não mostrar de novo
            </button>
          </div>
        </div>
      ) : null}
    </output>
  );
}
