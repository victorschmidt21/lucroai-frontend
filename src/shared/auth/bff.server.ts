import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { parseEnv, publicEnvSchema } from '@/shared/config/env.schema';

const METODOS_SEGUROS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Erro no formato do NestJS (`{ statusCode, message, error }`), para o
 * navegador tratar a resposta do BFF como as do backend (`ApiError`).
 */
export function erroBff(statusCode: number, message: string, error?: string) {
  return NextResponse.json(
    { statusCode, message, ...(error ? { error } : {}) },
    { status: statusCode, headers: { 'Cache-Control': 'no-store' } },
  );
}

export function servicoIndisponivel() {
  return erroBff(502, 'Serviço indisponível no momento.', 'Bad Gateway');
}

export function origemInvalida() {
  return erroBff(403, 'Origem não permitida.', 'Forbidden');
}

/**
 * `SameSite=Lax` ajuda contra CSRF, mas Route Handlers não têm a checagem de
 * origem das Server Actions. Em métodos que alteram dados, o `Origin` precisa
 * ser o de `NEXT_PUBLIC_APP_URL`; sem o header, recusa, porque os navegadores
 * sempre o enviam nesses métodos (docs/security.md, regra 6).
 */
export function isOrigemPermitida(request: NextRequest) {
  if (METODOS_SEGUROS.has(request.method)) return true;

  const origem = request.headers.get('origin');

  if (!origem || !URL.canParse(origem)) return false;

  const { NEXT_PUBLIC_APP_URL } = parseEnv(publicEnvSchema, {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  });

  return new URL(origem).origin === new URL(NEXT_PUBLIC_APP_URL).origin;
}
