import { describe, expect, it } from 'vitest';
import { simulacaoSearchSchema } from './simulacao-search.schema';

describe('simulacaoSearchSchema', () => {
  it('lê o receitaId da URL', () => {
    expect(simulacaoSearchSchema.parse({ receitaId: '7' })).toEqual({
      receitaId: 7,
    });
  });

  it('ignora receitaId ausente ou inválido', () => {
    expect(simulacaoSearchSchema.parse({})).toEqual({});
    expect(simulacaoSearchSchema.parse({ receitaId: 'abc' })).toEqual({
      receitaId: undefined,
    });
    expect(simulacaoSearchSchema.parse({ receitaId: '0' })).toEqual({
      receitaId: undefined,
    });
  });
});
