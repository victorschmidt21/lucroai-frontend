import { z } from 'zod';

// `.catch()` evita que uma URL editada à mão derrube a tela.
export const producoesSearchSchema = z.object({
  /** Filtro por receita, aplicado pelo backend (`GET /producoes?receitaId=`). */
  receitaId: z.coerce.number().int().positive().optional().catch(undefined),
  /** Abre o registro ao carregar (ações rápidas do painel, FE-22). */
  novo: z.literal('1').optional().catch(undefined),
});

export type ProducoesSearch = z.infer<typeof producoesSearchSchema>;
