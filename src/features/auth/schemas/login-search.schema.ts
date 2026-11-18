import { z } from 'zod';
import { getSafeRedirect } from '@/shared/auth/session-paths';

/**
 * Search params de `/login`: `redirect` (só caminho interno; o resto vira `/`)
 * e `expirada=1`, que mostra o aviso de sessão expirada. A URL é entrada do
 * usuário: valor inválido não derruba a tela.
 */
export const loginSearchSchema = z.object({
  redirect: z
    .string()
    .optional()
    .catch(undefined)
    .transform((valor) => getSafeRedirect(valor)),
  expirada: z
    .literal('1')
    .optional()
    .catch(undefined)
    .transform((valor) => valor === '1'),
});

export type LoginSearch = z.output<typeof loginSearchSchema>;
