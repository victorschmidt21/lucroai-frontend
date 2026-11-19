import { jwtPayloadSchema, type JwtPayload } from '@/shared/api/contracts/auth';

// Só decodifica o payload, sem conferir a assinatura: serve para exibir o
// usuário e saber quando o token vence. Quem valida o token é o backend, a cada
// chamada (docs/security.md, regra 3). Roda no navegador, no Node e no proxy.ts.

function base64UrlParaTexto(parte: string) {
  const base64 = parte.replaceAll('-', '+').replaceAll('_', '/');
  const completo = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  const bytes = Uint8Array.from(atob(completo), (letra) => letra.charCodeAt(0));

  return new TextDecoder().decode(bytes);
}

/** Payload do JWT (`sub`, `email`, `nome`, `empresa`, `iat`, `exp`), ou `null` se o token não for legível. */
export function decodificarJwt(token: string | undefined): JwtPayload | null {
  const partes = token?.split('.') ?? [];

  if (partes.length !== 3) return null;

  try {
    const resultado = jwtPayloadSchema.safeParse(
      JSON.parse(base64UrlParaTexto(partes[1])),
    );

    return resultado.success ? resultado.data : null;
  } catch {
    return null;
  }
}

/** `exp` é em segundos; o token vale até o instante anterior a ele. */
export function isJwtExpirado(payload: JwtPayload, agoraMs = Date.now()) {
  return payload.exp * 1000 <= agoraMs;
}

/** Tempo restante até o `exp`, em segundos inteiros: o `maxAge` do cookie. */
export function segundosAteExpirar(payload: JwtPayload, agoraMs = Date.now()) {
  return Math.max(0, Math.floor(payload.exp - agoraMs / 1000));
}

/** Payload de uma sessão em vigor (token legível e antes do `exp`), ou `null`. */
export function lerSessao(token: string | undefined, agoraMs = Date.now()) {
  const payload = decodificarJwt(token);

  return payload && !isJwtExpirado(payload, agoraMs) ? payload : null;
}
