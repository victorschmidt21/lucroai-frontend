import type { JwtPayload, LoginResponse } from '@/shared/api/contracts/auth';

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
