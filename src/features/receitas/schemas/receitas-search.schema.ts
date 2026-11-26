import { z } from 'zod';

// `.catch()` evita que uma URL editada à mão derrube a tela. A busca (`q`) é
// lida pela `ListPage`.
export const receitasSearchSchema = z.object({
  /** Filtro da lista (FE-71): `vendo` (vendo sozinha) ou `dentro` (só vai dentro de outras). */
  tipo: z.enum(['vendo', 'dentro']).optional().catch(undefined),
});

export type ReceitasSearch = z.infer<typeof receitasSearchSchema>;
