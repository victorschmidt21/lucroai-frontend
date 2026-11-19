import { NextResponse, type NextRequest } from 'next/server';
import { isOrigemPermitida, origemInvalida } from '@/shared/auth/bff.server';
import { apagarSessao } from '@/shared/auth/session.server';

/**
 * `POST /api/auth/logout`: o backend não tem logout, então sair é só apagar o
 * cookie. O token continua válido no backend até o `exp`, mas não está mais em
 * lugar nenhum do navegador.
 */
export function POST(request: NextRequest) {
  if (!isOrigemPermitida(request)) return origemInvalida();

  const response = new NextResponse(null, {
    status: 204,
    headers: { 'Cache-Control': 'no-store' },
  });
  apagarSessao(response);

  return response;
}
