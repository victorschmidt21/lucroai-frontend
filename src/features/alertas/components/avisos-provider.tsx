'use client';

import { useQuery } from '@tanstack/react-query';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useUsuarioAtual } from '@/shared/auth/use-usuario-atual';
import { alertasOptions } from '../api/alertas.queries';
import {
  deveAbrirAviso,
  idDaSessao,
  lerSessaoVerificada,
  marcarSessaoVerificada,
  totalDeAlertas,
} from '../aviso-ao-entrar';
import { AvisosDialog } from './avisos-dialog';

type Avisos = { total: number; abrir: () => void };

const AvisosContext = createContext<Avisos>({ total: 0, abrir: () => {} });

export function useAvisos() {
  return useContext(AvisosContext);
}

/**
 * Aviso ao entrar (FE-47): na primeira leitura de `GET /alertas` da sessão,
 * com algum alerta, abre o aviso. Depois, só o indicador do topo
 * (`IndicadorAvisos`) o reabre. Composto pelo layout de `(app)`, por fora do
 * `AppShell`, para o diálogo existir uma vez só (o indicador aparece no menu
 * lateral e no cabeçalho do celular).
 */
export function AvisosProvider({ children }: { children: ReactNode }) {
  const { data: usuario } = useUsuarioAtual();
  const { data: alertas } = useQuery(alertasOptions());
  // `pendente` até a primeira leitura dos alertas; então a regra decide uma vez.
  const [estado, setEstado] = useState<'pendente' | 'aberto' | 'fechado'>(
    'pendente',
  );

  // Ajuste durante a renderização (sem efeito): os alertas só são lidos no
  // navegador, então o `sessionStorage` existe aqui.
  if (estado === 'pendente' && usuario && alertas) {
    const abrir = deveAbrirAviso({
      sessaoAtual: idDaSessao(usuario),
      sessaoJaVerificada: lerSessaoVerificada(),
      totalAlertas: totalDeAlertas(alertas),
    });
    setEstado(abrir ? 'aberto' : 'fechado');
  }

  // Aberto ou não, a sessão já foi verificada: o aviso não volta sozinho.
  const sessao = usuario ? idDaSessao(usuario) : null;
  useEffect(() => {
    if (estado !== 'pendente' && sessao) marcarSessaoVerificada(sessao);
  }, [estado, sessao]);

  const total = alertas ? totalDeAlertas(alertas) : 0;

  return (
    <AvisosContext value={{ total, abrir: () => setEstado('aberto') }}>
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
