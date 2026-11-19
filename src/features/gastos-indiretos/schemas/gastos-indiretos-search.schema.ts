import { z } from 'zod';

// `.catch()` evita que uma URL editada à mão derrube a tela.
export const gastosIndiretosSearchSchema = z.object({
  /** Abre o cadastro ao carregar (ações rápidas do painel, FE-22). */
  novo: z.literal('1').optional().catch(undefined),
});
