import { z } from 'zod';

export const ABAS_VENDAS = ['registrar', 'historico'] as const;
export type AbaVendas = (typeof ABAS_VENDAS)[number];

// `.catch()` evita que uma URL editada à mão derrube a tela.
export const vendasSearchSchema = z.object({
  /** Aba ativa; "registrar" quando ausente. O histórico é da FE-18. */
  aba: z.enum(ABAS_VENDAS).default('registrar').catch('registrar'),
});

export type VendasSearch = z.infer<typeof vendasSearchSchema>;
