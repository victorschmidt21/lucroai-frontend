import { NextResponse, type NextRequest } from 'next/server';
import { erroBff } from '@/shared/auth/bff.server';
import { lerSessao } from '@/shared/auth/jwt';
import { apagarSessao, lerToken } from '@/shared/auth/session.server';
import { toUsuarioAtual } from '@/shared/auth/usuario-atual';

/**
 * `GET /api/auth/sessao`: o usuário e a empresa decodificados do JWT do cookie,
 * sem o token (não há `/auth/me`). Sem sessão em vigor, `401` e o cookie
 * apagado, como no proxy.
 */
export function GET(request: NextRequest) {
  const token = lerToken(request);
  const payload = lerSessao(token);

  if (!payload) {
    const response = erroBff(401, 'Unauthorized');
    if (token !== undefined) apagarSessao(response);

    return response;
  }

  return NextResponse.json(toUsuarioAtual(payload), {
    headers: { 'Cache-Control': 'no-store' },
  });
}
