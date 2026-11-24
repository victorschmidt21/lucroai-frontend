import { describe, expect, it } from 'vitest';
import {
  contarFrases,
  definirTermo,
  termoSchema,
  type Termo,
} from './aprender.schema';

const valido: Termo = {
  id: 'rendimento',
  titulo: 'Rendimento',
  assunto: 'custos',
  sinonimos: ['rende'],
  curto: 'Quantas unidades uma receita faz.',
  explicacao: 'Se a massa dá 12 potes, o rendimento é 12.',
  porQueImporta: 'Rendimento errado deixa o custo errado.',
  acao: { rotulo: 'Ver Receitas', href: '/receitas' },
  relacionados: ['custo-da-receita'],
};

function campos(entrada: Record<string, unknown>) {
  const result = termoSchema.safeParse({ ...valido, ...entrada });
  return (result.error?.issues ?? []).map((issue) => issue.path.join('.'));
}

describe('termoSchema', () => {
  it('aceita um termo válido, com ou sem ação', () => {
    expect(campos({})).toEqual([]);
    expect(campos({ acao: undefined })).toEqual([]);
  });

  it('pede o id em kebab-case', () => {
    expect(campos({ id: 'Custo Medio' })).toEqual(['id']);
    expect(campos({ id: 'custo_medio' })).toEqual(['id']);
    expect(campos({ relacionados: ['Margem'] })).toEqual(['relacionados.0']);
  });

  it('rejeita assunto fora da lista e textos vazios', () => {
    expect(campos({ assunto: 'financas' })).toEqual(['assunto']);
    expect(campos({ titulo: '  ', curto: '' })).toEqual(['titulo', 'curto']);
  });

  it('limita o tamanho de cada texto', () => {
    expect(campos({ curto: `${'a'.repeat(140)}` })).toEqual([]);
    expect(campos({ curto: `${'a'.repeat(141)}` })).toEqual(['curto']);
    expect(campos({ explicacao: 'a'.repeat(361) })).toEqual(['explicacao']);
    expect(campos({ porQueImporta: 'a'.repeat(161) })).toEqual([
      'porQueImporta',
    ]);
  });

  it('limita o número de frases', () => {
    expect(campos({ curto: 'Uma frase. Outra frase.' })).toEqual(['curto']);
    expect(campos({ explicacao: 'Um. Dois. Três.' })).toEqual([]);
    expect(campos({ explicacao: 'Um. Dois. Três. Quatro.' })).toEqual([
      'explicacao',
    ]);
    expect(campos({ porQueImporta: 'Uma. Duas.' })).toEqual(['porQueImporta']);
  });

  it('pede o href da ação começando por /', () => {
    expect(
      campos({ acao: { rotulo: 'Ver Receitas', href: 'receitas' } }),
    ).toEqual(['acao.href']);
  });
});

describe('contarFrases', () => {
  it('conta pelo ponto, sem confundir R$ 100 nem números', () => {
    expect(contarFrases('De cada R$ 100 vendidos, R$ 30 ficam com você.')).toBe(
      1,
    );
    expect(contarFrases('Sem ponto final')).toBe(0);
    expect(contarFrases('Uma. Duas? Três!')).toBe(3);
  });
});

describe('definirTermo', () => {
  it('devolve o termo válido', () => {
    expect(definirTermo(valido)).toBe(valido);
  });

  it('rejeita o termo inválido nos testes', () => {
    expect(() => definirTermo({ ...valido, curto: '' })).toThrow();
  });
});
