import 'server-only';
import type { NextRequest, NextResponse } from 'next/server';
import type { JwtPayload } from '@/shared/api/contracts/auth';
import { segundosAteExpirar } from './jwt';
import { SESSION_COOKIE } from './session-paths';

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: 'lax',
    // Só o desenvolvimento em HTTP dispensa `Secure` (docs/security.md). O
    // navegador aceita cookie `Secure` em http://localhost, então os e2e contra
    // o build de produção continuam funcionando.
    secure: process.env.NODE_ENV !== 'development',
    path: '/',
    maxAge,
  } as const;
}

export function lerToken(request: NextRequest) {
  return request.cookies.get(SESSION_COOKIE)?.value;
}

/** O cookie vence junto com o JWT: `maxAge` é o tempo até o `exp` (4 h no login). */
export function gravarSessao(
  response: NextResponse,
  token: string,
  payload: JwtPayload,
  agoraMs = Date.now(),
) {
  response.cookies.set(
    SESSION_COOKIE,
    token,
    cookieOptions(segundosAteExpirar(payload, agoraMs)),
  );
}

export function apagarSessao(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, '', cookieOptions(0));
}
