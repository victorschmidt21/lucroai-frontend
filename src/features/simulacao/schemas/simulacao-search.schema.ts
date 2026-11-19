import { z } from 'zod';

// `.catch()` evita que uma URL editada à mão derrube a tela.
export const simulacaoSearchSchema = z.object({
  /** Receita simulada; sem ela (ou se não existir), a primeira da lista. */
  receitaId: z.coerce.number().int().positive().optional().catch(undefined),
});

export type SimulacaoSearch = z.infer<typeof simulacaoSearchSchema>;
