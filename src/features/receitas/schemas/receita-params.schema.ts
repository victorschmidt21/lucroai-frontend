import { z } from 'zod';

/** `[receitaId]` das rotas de receita (docs/api-integration.md#tipos-de-dados). */
export const receitaParamsSchema = z.object({
  receitaId: z.coerce.number().int().positive(),
});
