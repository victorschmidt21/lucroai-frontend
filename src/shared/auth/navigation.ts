let navegando = false;

/**
 * Navegação completa, usada ao entrar, ao sair e com a sessão expirada: descarta
 * o cache do TanStack Query e do roteador, para os dados de um usuário não
 * aparecerem para o próximo.
 */
export function navigateTo(path: string) {
  navegando = true;
  window.location.assign(path);
}

/**
 * Já há uma navegação completa em curso. Ao sair, o `queryClient.clear()` faz a
 * sessão ser buscada de novo e receber 401 antes de a página trocar: esse 401
 * não pode levar ao login com o aviso de sessão expirada.
 */
export function isNavegando() {
  return navegando;
}
