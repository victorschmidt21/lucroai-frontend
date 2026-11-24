import { z } from 'zod';
import { ASSUNTOS } from '../aprender.schema';

// `.catch()` evita que uma URL editada à mão derrube a tela.
export const aprenderSearchSchema = z.object({
  /** Assunto escolhido nos chips; sem ele, "Todos". */
  assunto: z.enum(ASSUNTOS).optional().catch(undefined),
});

export type AprenderSearch = z.infer<typeof aprenderSearchSchema>;
