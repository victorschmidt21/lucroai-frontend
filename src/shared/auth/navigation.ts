/**
 * Navegação completa, usada ao entrar, ao sair e com a sessão expirada: descarta
 * o cache do TanStack Query e do roteador, para os dados de um usuário não
 * aparecerem para o próximo.
 */
export function navigateTo(path: string) {
  window.location.assign(path);
}
