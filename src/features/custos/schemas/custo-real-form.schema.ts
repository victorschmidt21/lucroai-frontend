import { z } from 'zod';
import {
  formatNumeroEditavel,
  inteiroBR,
  parseNumeroBR,
} from '@/shared/format/numero-br';
import type { EntradaCustoReal } from '../custos.calculos';

// Origem: validadores de calculo_real_screen.dart.
const NOME = 'Informe um nome';
const VALOR = 'Informe um valor válido';
const RENDIMENTO = 'Informe um rendimento maior que zero';

/** Valor ≥ 0; vazio conta como 0 (`_validateNonNegative` com `_parseBR`). */
const valorNaoNegativo = () =>
  z
    .string()
    .transform((texto) =>
      texto.trim() === '' ? 0 : (parseNumeroBR(texto) ?? Number.NaN),
    )
    .pipe(z.number({ error: VALOR }).min(0, VALOR));

export const custoRealFormSchema = z.object({
  nome: z.string().trim().min(1, NOME),
  ingredientes: valorNaoNegativo(),
  energia: valorNaoNegativo(),
  agua: valorNaoNegativo(),
  gas: valorNaoNegativo(),
  horas: valorNaoNegativo(),
  valorHora: valorNaoNegativo(),
  rendimento: inteiroBR(
    z.number({ error: RENDIMENTO }).int(RENDIMENTO).positive(RENDIMENTO),
  ),
});

export type CustoRealFormInput = z.input<typeof custoRealFormSchema>;
export type CustoRealFormValues = z.output<typeof custoRealFormSchema>;

/** "Novo": tudo vazio e o rendimento volta para 1 (`_novoCalculo`). */
export function custoRealFormVazio(): CustoRealFormInput {
  return {
    nome: '',
    ingredientes: '',
    energia: '',
    agua: '',
    gas: '',
    horas: '',
    valorHora: '',
    rendimento: '1',
  };
}

/** "Abrir": devolve os valores de uma simulação salva aos campos (`_carregarRegistro`). */
const dinheiro = (valor: number) => formatNumeroEditavel(valor, 2);

export function toCustoRealFormInput(
  simulacao: { nome: string } & EntradaCustoReal,
): CustoRealFormInput {
  return {
    nome: simulacao.nome,
    ingredientes: dinheiro(simulacao.ingredientes),
    energia: dinheiro(simulacao.energia),
    agua: dinheiro(simulacao.agua),
    gas: dinheiro(simulacao.gas),
    horas: formatNumeroEditavel(simulacao.horas),
    valorHora: dinheiro(simulacao.valorHora),
    rendimento: String(simulacao.rendimento),
  };
}
