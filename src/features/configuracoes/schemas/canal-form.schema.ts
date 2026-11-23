import { z } from 'zod';
import type {
  CanalVenda,
  CreateCanalVendaBody,
  UpdateCanalVendaBody,
} from '@/shared/api/contracts/pricing';
import { percentualDaApi, percentualDaTela } from '../configuracoes.calculos';
import { campoPercentual } from './percentual';

/** `@MaxLength(100)` de `create-canal-venda.dto.ts`. */
export const NOME_CANAL_MAX = 100;

export const canalFormSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(1, 'Informe o nome')
    .max(NOME_CANAL_MAX, 'Use até 100 caracteres'),
  comissaoPercentual: campoPercentual(),
});

export type CanalFormInput = z.input<typeof canalFormSchema>;
export type CanalFormValues = z.output<typeof canalFormSchema>;

export const canalFormVazio: CanalFormInput = {
  nome: '',
  comissaoPercentual: '',
};

export function toCanalFormInput(canal: CanalVenda): CanalFormInput {
  return {
    nome: canal.nome,
    comissaoPercentual: percentualDaApi(canal.comissaoPercentual),
  };
}

/** O canal novo nasce ativo (`ativo` omitido). */
export function toCreateCanalBody(
  values: CanalFormValues,
): CreateCanalVendaBody {
  return {
    nome: values.nome,
    comissaoPercentual: percentualDaTela(values.comissaoPercentual),
  };
}

/** A edição não mexe no `ativo`, que tem o próprio controle na lista. */
export function toUpdateCanalBody(
  values: CanalFormValues,
): UpdateCanalVendaBody {
  return toCreateCanalBody(values);
}
