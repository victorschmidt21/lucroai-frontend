import { z } from 'zod';
import type {
  CreateInsumoBody,
  Insumo,
  UpdateInsumoBody,
} from '@/shared/api/contracts/catalog';
import { unidadeMedidaSchema } from '@/shared/api/contracts/enums';
import {
  formatNumeroEditavel,
  numeroBR,
  numeroBROpcional,
} from '@/shared/format/numero-br';

const NOME_OBRIGATORIO = 'Informe o nome';
const NOME_LONGO = 'Use até 80 caracteres';
const QUANTIDADE = 'Informe uma quantidade maior que zero';
const VALOR = 'Informe um valor maior que zero';
const INICIAL = 'Informe uma quantidade maior ou igual a zero';

/** Coluna `nome` do catalog-service (o DTO não limita; ver a lacuna 12). */
export const NOME_MAX = 80;

// Os limites repetem os do mobile (insumos_page.dart) e do backend para dar
// resposta imediata; quem decide é a API.
export const insumoFormSchema = z.object({
  nome: z.string().trim().min(1, NOME_OBRIGATORIO).max(NOME_MAX, NOME_LONGO),
  quantidadeBaseCusto: numeroBR(
    z.number({ error: QUANTIDADE }).positive(QUANTIDADE),
  ),
  unidade: unidadeMedidaSchema,
  // O backend aceita 0 (`@Min(0)`); o mobile e a web pedem > 0.
  valorPago: numeroBR(z.number({ error: VALOR }).positive(VALOR)),
  // Só na criação; vazio não é enviado (o backend começa o estoque em 0).
  quantidadeDisponivelInicial: numeroBROpcional(
    z.number({ error: INICIAL }).min(0, INICIAL),
  ),
});

export type InsumoFormInput = z.input<typeof insumoFormSchema>;
export type InsumoFormValues = z.output<typeof insumoFormSchema>;

/** A unidade padrão é grama, como no mobile (`InsumoUnidadeMedida.gramas`). */
export const insumoFormVazio: InsumoFormInput = {
  nome: '',
  quantidadeBaseCusto: '',
  unidade: 'G',
  valorPago: '',
  quantidadeDisponivelInicial: '',
};

export function toInsumoFormInput(insumo: Insumo): InsumoFormInput {
  return {
    nome: insumo.nome,
    quantidadeBaseCusto: formatNumeroEditavel(insumo.quantidadeBaseCusto),
    unidade: insumo.unidade,
    valorPago: formatNumeroEditavel(insumo.valorPago, 2),
    quantidadeDisponivelInicial: '',
  };
}

export function toCreateInsumoBody(values: InsumoFormValues): CreateInsumoBody {
  const { quantidadeDisponivelInicial, ...resto } = values;
  return quantidadeDisponivelInicial === undefined
    ? resto
    : { ...resto, quantidadeDisponivelInicial };
}

/** O PATCH não aceita `quantidadeDisponivelInicial`: o backend rejeita campos extras (400). */
export function toUpdateInsumoBody(values: InsumoFormValues): UpdateInsumoBody {
  const { quantidadeDisponivelInicial: _ignorado, ...body } = values;
  return body;
}
