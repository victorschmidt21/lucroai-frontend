import { z } from 'zod';

const valor = z.number().finite().min(0);

/**
 * Simulação salva do cálculo real (`_CalculoRealRegistro`). Fica no navegador
 * (exceção registrada em docs/security.md): o que vem de lá é validado, e o que
 * não passa é descartado.
 */
export const simulacaoSalvaSchema = z.object({
  nome: z.string().min(1),
  ingredientes: valor,
  energia: valor,
  agua: valor,
  gas: valor,
  horas: valor,
  valorHora: valor,
  rendimento: z.number().int().positive(),
  custoTotal: valor,
  custoPorUnidade: valor,
});

export type SimulacaoSalva = z.infer<typeof simulacaoSalvaSchema>;

/** Lê o JSON guardado; qualquer coisa inválida vira lista vazia. */
export function parseSimulacoesSalvas(json: string | null): SimulacaoSalva[] {
  if (!json) return [];

  try {
    const resultado = z
      .array(simulacaoSalvaSchema)
      .safeParse(JSON.parse(json) as unknown);
    return resultado.success ? resultado.data : [];
  } catch {
    return [];
  }
}
