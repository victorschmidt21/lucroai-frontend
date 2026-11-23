import type {
  EmpresaCriada,
  JwtPayload,
  LoginResponse,
} from '@/shared/api/contracts/auth';

/** Payload do JWT do usuário do seed (João da Silva, Padaria Pão Feliz). */
export function makeJwtPayload(
  overrides: Partial<JwtPayload> = {},
): JwtPayload {
  return {
    sub: 1,
    email: 'joao@padariapaofeliz.com.br',
    nome: 'João da Silva',
    empresa: {
      id: 1,
      nome: 'Padaria Pão Feliz Ltda',
      cnpj: '45.678.901/0001-23',
      segmento: 'Panificação e Confeitaria',
    },
    iat: 1_780_000_000,
    exp: 1_780_014_400,
    ...overrides,
  };
}

/** Token de teste: não é assinado por segredo nenhum. */
export function makeLoginResponse(
  overrides: Partial<LoginResponse> = {},
): LoginResponse {
  return { access_token: 'token-de-teste', ...overrides };
}

function base64Url(valor: unknown) {
  return Buffer.from(JSON.stringify(valor)).toString('base64url');
}

/**
 * JWT de teste com o payload do seed, válido por 4 h a partir de agora (ou de
 * `agoraMs`). A assinatura é falsa: o front só decodifica o payload.
 */
export function makeJwt(
  overrides: Partial<JwtPayload> = {},
  agoraMs = Date.now(),
) {
  const iat = Math.floor(agoraMs / 1000);
  const payload = makeJwtPayload({ iat, exp: iat + 4 * 60 * 60, ...overrides });

  return [
    base64Url({ alg: 'HS256', typ: 'JWT' }),
    base64Url(payload),
    'assinatura-de-teste',
  ].join('.');
}

/** Resposta de `POST /auth/empresa` com o token de `makeJwt`. */
export function makeEmpresaCriada(
  overrides: Partial<EmpresaCriada> = {},
): EmpresaCriada {
  const { sub, email, nome, empresa } = makeJwtPayload();

  return { sub, email, nome, empresa, access_token: makeJwt(), ...overrides };
}
