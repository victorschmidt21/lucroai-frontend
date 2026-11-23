import { z } from 'zod';

// Login. Origem: `lucroai-backend` (monolito), `src/modules/auth/`.

/** `login.dto.ts` */
export type LoginBody = {
  email: string;
  senha: string;
};

/** `auth.service.ts` (`login`): só o token, sem dados do usuário. */
export const loginResponseSchema = z.object({
  access_token: z.string().min(1),
});

export type LoginResponse = z.infer<typeof loginResponseSchema>;

/**
 * `create-empresa.dto.ts` (`POST /auth/empresa`, BE-06 e BE-36). `cnpj`,
 * `segmento` e `nome_usuario` são opcionais (omitidos ficam `null`); o
 * `token_cadastro` é obrigatório na prática: ausente ou errado dá 403
 * `TOKEN_CADASTRO_INVALIDO`. Só o BFF chama a rota (`/api/auth/cadastro`).
 */
export type CadastroEmpresaBody = {
  nome_empresa: string;
  cnpj?: string;
  segmento?: string;
  nome_usuario?: string;
  email: string;
  senha: string;
  token_cadastro: string;
};

/** `token.dto.ts` (`EmpresaCriadaDto`): o payload do token, sem `iat` e `exp`, mais o token. */
export const empresaCriadaSchema = z.object({
  sub: z.number().int(),
  email: z.string(),
  nome: z.string().nullable(),
  empresa: z.object({
    id: z.number().int(),
    nome: z.string(),
    cnpj: z.string().nullable(),
    segmento: z.string().nullable(),
  }),
  access_token: z.string().min(1),
});

export type EmpresaCriada = z.infer<typeof empresaCriadaSchema>;

/**
 * Payload do JWT (`auth.service.ts`, `buildToken`, e `JwtPayload` de
 * `shared/src/infra/auth/jwt.strategy.ts`). Não há `/auth/me`: os dados do
 * usuário e da empresa vêm daqui. `iat` e `exp` são do `@nestjs/jwt` (4 h).
 */
export const jwtPayloadSchema = z.object({
  sub: z.number().int(),
  email: z.string(),
  nome: z.string().nullable(),
  empresa: z.object({
    id: z.number().int(),
    nome: z.string(),
    cnpj: z.string().nullable(),
    segmento: z.string().nullable(),
  }),
  iat: z.number().int(),
  exp: z.number().int(),
});

export type JwtPayload = z.infer<typeof jwtPayloadSchema>;
