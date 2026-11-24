'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect, useState, type ReactNode } from 'react';
import { useUsuarioAtual } from '@/shared/auth/use-usuario-atual';
import { AvisosContext } from '@/shared/avisos/avisos-context';
import { alertasOptions } from '../api/alertas.queries';
import {
  deveAbrirAviso,
  idDaSessao,
  lerSessaoEmQueAbriu,
  lerSessaoVerificada,
  marcarSessaoEmQueAbriu,
  marcarSessaoVerificada,
  totalDeAlertas,
} from '../aviso-ao-entrar';
import { AvisosDialog } from './avisos-dialog';

/**
 * Aviso ao entrar (FE-47): na primeira leitura de `GET /alertas` da sessão,
 * com algum alerta, abre o aviso. Depois, só o indicador do topo
 * (`IndicadorAvisos`) o reabre. Composto pelo layout de `(app)`, por fora do
 * `AppShell`, para o diálogo existir uma vez só (o indicador aparece no menu
 * lateral e no cabeçalho do celular).
 *
 * O estado vai pelo `AvisosContext` de `shared/avisos/` (FE-68): a dica na hora
 * certa só mostra as dicas de alerta com o aviso resolvido e se ele não abriu
 * sozinho nesta sessão.
 */
export function AvisosProvider({ children }: { children: ReactNode }) {
  const { data: usuario } = useUsuarioAtual();
  const { data: alertas } = useQuery(alertasOptions());
  // `pendente` até a primeira leitura dos alertas; então a regra decide uma vez.
  const [estado, setEstado] = useState<'pendente' | 'aberto' | 'fechado'>(
    'pendente',
  );
  // O aviso abriu sozinho nesta sessão (agora ou antes de recarregar a página).
  const [abriuNaSessao, setAbriuNaSessao] = useState(false);

  // Ajuste durante a renderização (sem efeito): os alertas só são lidos no
  // navegador, então o `sessionStorage` existe aqui.
  if (estado === 'pendente' && usuario && alertas) {
    const sessaoAtual = idDaSessao(usuario);
    const abrir = deveAbrirAviso({
      sessaoAtual,
      sessaoJaVerificada: lerSessaoVerificada(),
      totalAlertas: totalDeAlertas(alertas),
    });
    setEstado(abrir ? 'aberto' : 'fechado');
    setAbriuNaSessao(abrir || lerSessaoEmQueAbriu() === sessaoAtual);
  }

  // Aberto ou não, a sessão já foi verificada: o aviso não volta sozinho.
  const sessao = usuario ? idDaSessao(usuario) : null;
  useEffect(() => {
    if (estado !== 'pendente' && sessao) marcarSessaoVerificada(sessao);
  }, [estado, sessao]);
  useEffect(() => {
    if (abriuNaSessao && sessao) marcarSessaoEmQueAbriu(sessao);
  }, [abriuNaSessao, sessao]);

  const total = alertas ? totalDeAlertas(alertas) : 0;

  return (
    <AvisosContext
      value={{
        total,
        abrir: () => setEstado('aberto'),
        alertas: alertas ?? null,
        dicasDeAlertaLiberadas: estado === 'fechado' && !abriuNaSessao,
      }}
    >
      {children}
      {alertas ? (
        <AvisosDialog
          open={estado === 'aberto' && total > 0}
          onOpenChange={(aberto) => setEstado(aberto ? 'aberto' : 'fechado')}
          alertas={alertas}
        />
      ) : null}
    </AvisosContext>
  );
}
