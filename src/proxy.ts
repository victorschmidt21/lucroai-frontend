import { NextResponse, type NextRequest } from 'next/server';
import { lerSessao } from '@/shared/auth/jwt';
import {
  CURRENT_PATH_HEADER,
  getLoginPath,
  getSafeRedirect,
  LOGIN_PATH,
  SESSION_COOKIE,
} from '@/shared/auth/session-paths';

// Abertas com ou sem sessão: o catálogo do design system não usa dados da
// empresa e responde 404 no build de produção.
const CAMINHOS_PUBLICOS = ['/design-system'];

function isPublico(pathname: string) {
  return CAMINHOS_PUBLICOS.some(
    (caminho) => pathname === caminho || pathname.startsWith(`${caminho}/`),
  );
}

function redirecionar(request: NextRequest, path: string) {
  return NextResponse.redirect(new URL(path, request.nextUrl.origin));
}

/**
 * Checagem otimista (docs/security.md#proteção-de-rotas): lê só o cookie e o
 * `exp` do JWT, sem chamar a API. Quem confere de verdade é o backend, a cada
 * chamada, e o `getUsuarioAtual()` no layout de `(app)`.
 */
export function proxy(request: NextRequest) {
  const { pathname, search, searchParams } = request.nextUrl;
  const cookie = request.cookies.get(SESSION_COOKIE)?.value;
  const temSessao = lerSessao(cookie) !== null;

  if (pathname === LOGIN_PATH) {
    return temSessao
      ? redirecionar(request, getSafeRedirect(searchParams.get('redirect')))
      : NextResponse.next();
  }

  if (isPublico(pathname)) return NextResponse.next();

  const rotaAtual = `${pathname}${search}`;

  if (!temSessao) {
    // Havia cookie, mas vencido ou ilegível: a sessão expirou.
    return redirecionar(
      request,
      getLoginPath(rotaAtual, { expirada: cookie !== undefined }),
    );
  }

  // Sobrescreve o valor que o navegador tenha enviado nesse header.
  const headers = new Headers(request.headers);
  headers.set(CURRENT_PATH_HEADER, rotaAtual);

  return NextResponse.next({ request: { headers } });
}

export const config = {
  // Rotas de API respondem 401, sem redirecionar; arquivos estáticos não têm sessão.
  matcher: ['/((?!api/|_next/static|_next/image|favicon\\.ico|.*\\.\\w+$).*)'],
};
