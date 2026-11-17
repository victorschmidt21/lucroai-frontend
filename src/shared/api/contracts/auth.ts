import { z } from 'zod';

// auth-service. Origem: `services/auth-service/src/modules/auth/`.

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
