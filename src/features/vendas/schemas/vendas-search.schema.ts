import { z } from 'zod';
import { statusVendaSchema } from '@/shared/api/contracts/enums';
import { parseDataSemHora } from '@/shared/format/data';

export const ABAS_VENDAS = ['registrar', 'historico'] as const;
export type AbaVendas = (typeof ABAS_VENDAS)[number];

/** `YYYY-MM-DD` de uma data que existe; qualquer outra coisa some da busca. */
const dataSemHora = z
  .string()
  .refine((texto) => parseDataSemHora(texto) !== null)
  .optional()
  .catch(undefined);

// `.catch()` evita que uma URL editada à mão derrube a tela (e o backend, que
// responde 500 a status ou data inválidos: lacuna 8).
export const vendasSearchSchema = z
  .object({
    /** Aba ativa; "registrar" quando ausente. */
    aba: z.enum(ABAS_VENDAS).default('registrar').catch('registrar'),
    /** Período do histórico (FE-18); ausente, vale o mês atual. */
    dataInicio: dataSemHora,
    dataFim: dataSemHora,
    status: statusVendaSchema.optional().catch(undefined),
  })
  // Período invertido vindo da URL volta ao padrão, em vez de buscar nada.
  .transform((busca) =>
    busca.dataInicio && busca.dataFim && busca.dataInicio > busca.dataFim
      ? { ...busca, dataInicio: undefined, dataFim: undefined }
      : busca,
  );

export type VendasSearch = z.infer<typeof vendasSearchSchema>;
