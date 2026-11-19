import { z } from 'zod';

// `.catch()` evita que uma URL editada à mão derrube a tela.
export const estoqueSearchSchema = z.object({
  /** Busca pelo nome do insumo (FE-23, "Buscar insumos..." do mobile). */
  q: z.string().trim().min(1).optional().catch(undefined),
  /** Filtro "Baixo": só os itens abaixo do mínimo (link do painel, FE-22). */
  baixo: z.literal('1').optional().catch(undefined),
});

export type EstoqueSearch = z.infer<typeof estoqueSearchSchema>;
