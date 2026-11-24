import type { Alertas } from '@/shared/api/contracts/catalog';
import type { UsuarioAtual } from '@/shared/auth/usuario-atual';

// Regra "mostrar uma vez por sessão" do aviso ao entrar (FE-47,
// docs/business-rules.md#avisos-ao-entrar).

/**
 * Identifica a sessão sem dado de negócio: o usuário e o fim do token, que
 * muda a cada login. Sair e entrar de novo é outra sessão, e o aviso volta.
 */
export function idDaSessao(usuario: Pick<UsuarioAtual, 'id' | 'expiraEm'>) {
  return `${usuario.id}:${usuario.expiraEm}`;
}

export function totalDeAlertas(alertas: Alertas) {
  return alertas.estoqueNegativo.length + alertas.precoDefasado.length;
}

/**
 * O aviso abre só na primeira leitura dos alertas da sessão, e só se houver
 * algum. Fechado (ou sem alertas ao entrar), não abre mais na mesma sessão:
 * alertas novos durante o uso aparecem só no indicador do topo.
 */
export function deveAbrirAviso({
  sessaoAtual,
  sessaoJaVerificada,
  totalAlertas,
}: {
  sessaoAtual: string;
  sessaoJaVerificada: string | null;
  totalAlertas: number;
}) {
  return sessaoAtual !== sessaoJaVerificada && totalAlertas > 0;
}

/**
 * Guarda só o id da sessão já verificada (nenhum dado de negócio), no
 * `sessionStorage`, para recarregar a página não reabrir o aviso. Sem acesso
 * ao armazenamento (modo privado, bloqueio), fica em memória.
 */
const CHAVE = 'lucroai:aviso-ao-entrar';
let emMemoria: string | null = null;

export function lerSessaoVerificada(): string | null {
  try {
    return window.sessionStorage.getItem(CHAVE) ?? emMemoria;
  } catch {
    return emMemoria;
  }
}

export function marcarSessaoVerificada(sessao: string) {
  emMemoria = sessao;
  try {
    window.sessionStorage.setItem(CHAVE, sessao);
  } catch {
    // Fica só em memória.
  }
}

/**
 * Guarda a sessão em que o aviso abriu sozinho (FE-68): nessa sessão, as dicas
 * de estoque negativo e de preço que precisa subir não aparecem, nem depois de
 * recarregar a página.
 */
const CHAVE_ABRIU = 'lucroai:aviso-ao-entrar-abriu';
let abriuEmMemoria: string | null = null;

export function lerSessaoEmQueAbriu(): string | null {
  try {
    return window.sessionStorage.getItem(CHAVE_ABRIU) ?? abriuEmMemoria;
  } catch {
    return abriuEmMemoria;
  }
}

export function marcarSessaoEmQueAbriu(sessao: string) {
  abriuEmMemoria = sessao;
  try {
    window.sessionStorage.setItem(CHAVE_ABRIU, sessao);
  } catch {
    // Fica só em memória.
  }
}
