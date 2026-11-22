import { describe, expect, it } from 'vitest';
import { makeCanalVenda } from '@/test/factories/pricing.factory';
import {
  canalFormSchema,
  canalFormVazio,
  toCanalFormInput,
  toCreateCanalBody,
  toUpdateCanalBody,
  type CanalFormInput,
} from './canal-form.schema';

const valido: CanalFormInput = { nome: 'Rappi', comissaoPercentual: '20' };

function mensagens(entrada: Record<string, unknown>) {
  const result = canalFormSchema.safeParse({ ...valido, ...entrada });
  return (result.error?.issues ?? []).map((issue) => [
    issue.path.join('.'),
    issue.message,
  ]);
}

describe('canalFormSchema', () => {
  it('apara o nome e lê a comissão brasileira', () => {
    expect(
      canalFormSchema.parse({ nome: '  Rappi  ', comissaoPercentual: '15,2' }),
    ).toEqual({ nome: 'Rappi', comissaoPercentual: 15.2 });
  });

  it('pede o nome', () => {
    expect(mensagens({ nome: '  ' })).toEqual([['nome', 'Informe o nome']]);
  });

  it('aceita 100 caracteres no nome e recusa 101', () => {
    expect(mensagens({ nome: 'a'.repeat(100) })).toEqual([]);
    expect(mensagens({ nome: 'a'.repeat(101) })).toEqual([
      ['nome', 'Use até 100 caracteres'],
    ]);
  });

  it.each(['', '-1', '101', 'abc'])(
    'recusa a comissão "%s"',
    (comissaoPercentual) => {
      expect(mensagens({ comissaoPercentual })).toEqual([
        ['comissaoPercentual', 'Informe um percentual de 0 a 100'],
      ]);
    },
  );

  it.each(['0', '100'])('aceita a comissão %s', (comissaoPercentual) => {
    expect(mensagens({ comissaoPercentual })).toEqual([]);
  });
});

describe('formulário e corpos da API', () => {
  it('começa vazio', () => {
    expect(canalFormVazio).toEqual({ nome: '', comissaoPercentual: '' });
  });

  it('preenche a edição com a comissão em percentual', () => {
    expect(
      toCanalFormInput(
        makeCanalVenda({ nome: 'iFood', comissaoPercentual: 0.152 }),
      ),
    ).toEqual({ nome: 'iFood', comissaoPercentual: '15,2' });
  });

  it('envia a comissão em fração, sem o ativo', () => {
    const values = canalFormSchema.parse({
      nome: 'iFood',
      comissaoPercentual: '15,2',
    });
    const corpo = { nome: 'iFood', comissaoPercentual: 0.152 };

    expect(toCreateCanalBody(values)).toEqual(corpo);
    expect(toUpdateCanalBody(values)).toEqual(corpo);
  });
});
