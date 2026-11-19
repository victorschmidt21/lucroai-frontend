import { z } from 'zod';
import type { JwtPayload } from '@/shared/api/contracts/auth';

/**
 * O que a tela mostra do usuário da sessão, tirado do payload do JWT (não há
 * `/auth/me`). É a resposta de `GET /api/auth/sessao`, sem o token.
 */
export const usuarioAtualSchema = z.object({
  id: z.number().int(),
  nome: z.string().nullable(),
  email: z.string(),
  empresa: z.object({
    id: z.number().int(),
    nome: z.string(),
    cnpj: z.string().nullable(),
    segmento: z.string().nullable(),
  }),
  /** Fim da sessão (o `exp` do JWT), em ISO 8601. */
  expiraEm: z.iso.datetime(),
});

export type UsuarioAtual = z.infer<typeof usuarioAtualSchema>;

export function toUsuarioAtual(payload: JwtPayload): UsuarioAtual {
  return {
    id: payload.sub,
    nome: payload.nome,
    email: payload.email,
    empresa: { ...payload.empresa },
    expiraEm: new Date(payload.exp * 1000).toISOString(),
  };
}
