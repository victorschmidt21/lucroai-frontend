import { z } from 'zod';

// `.catch()` evita que uma URL editada à mão derrube a tela.
export const insumosSearchSchema = z.object({
  q: z.string().trim().min(1).optional().catch(undefined),
  /** Abre o cadastro ao carregar (ações rápidas do painel, FE-22). */
  novo: z.literal('1').optional().catch(undefined),
  /** Abre "Registrar compra" do insumo (link do aviso de estoque negativo, FE-47). */
  compra: z.coerce.number().int().positive().optional().catch(undefined),
});

export type InsumosSearch = z.infer<typeof insumosSearchSchema>;
