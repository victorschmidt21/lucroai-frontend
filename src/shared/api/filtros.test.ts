import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { makeInsumosDoSeed } from '@/test/factories/insumo.factory';
import {
  atualizarFiltros,
  filtrarPorTexto,
  hrefComFiltros,
  lerFiltros,
  normalizarTexto,
} from './filtros';

describe('normalizarTexto', () => {
  it('tira acentos e cedilha e passa para minúsculas', () => {
    expect(normalizarTexto('Açúcar Cristal NÃO')).toBe('acucar cristal nao');
  });
});

describe('filtrarPorTexto', () => {
  const insumos = makeInsumosDoSeed();

  it('encontra sem diferenciar acentos nem maiúsculas', () => {
    const nomes = filtrarPorTexto(insumos, 'nome', 'ACUCAR').map((i) => i.nome);

    expect(nomes).toEqual(['Açúcar Cristal']);
  });

  it('ignora acentos digitados pelo usuário', () => {
    const nomes = filtrarPorTexto(insumos, 'nome', 'pó').map((i) => i.nome);

    expect(nomes).toEqual(['Cacau em Pó 100%']);
  });

  it('busca por trecho no meio do texto', () => {
    const nomes = filtrarPorTexto(insumos, 'nome', 'chocolate').map(
      (i) => i.nome,
    );

    expect(nomes).toEqual([
      'Chocolate ao Leite Gotas',
      'Granulado de Chocolate',
    ]);
  });

  it('devolve a lista inteira com termo vazio, só espaços ou ausente', () => {
    expect(filtrarPorTexto(insumos, 'nome', '')).toHaveLength(12);
    expect(filtrarPorTexto(insumos, 'nome', '   ')).toHaveLength(12);
    expect(filtrarPorTexto(insumos, 'nome', undefined)).toHaveLength(12);
  });

  it('aceita uma função para o campo e ignora campos sem valor', () => {
    const itens = [
      { nome: 'Pão', obs: null },
      { nome: 'Bolo', obs: 'Pão doce' },
    ];

    expect(filtrarPorTexto(itens, 'obs', 'pao')).toEqual([itens[1]]);
    expect(filtrarPorTexto(itens, (item) => item.nome, 'BOLO')).toEqual([
      itens[1],
    ]);
  });

  it('devolve uma lista nova, sem alterar a original', () => {
    const resultado = filtrarPorTexto(insumos, 'nome', '');

    expect(resultado).not.toBe(insumos);
  });
});

describe('lerFiltros', () => {
  const schema = z.object({
    q: z.string().catch(''),
    baixo: z.literal('1').optional().catch(undefined),
    receitaId: z.coerce.number().int().positive().optional().catch(undefined),
  });

  it('lê o useSearchParams() do cliente', () => {
    expect(
      lerFiltros(schema, new URLSearchParams('q=farinha&receitaId=3&baixo=1')),
    ).toEqual({ q: 'farinha', receitaId: 3, baixo: '1' });
  });

  it('lê o searchParams da página, usando o primeiro valor repetido', () => {
    expect(lerFiltros(schema, { q: ['sal', 'ovos'], receitaId: '2' })).toEqual({
      q: 'sal',
      receitaId: 2,
    });
  });

  it('não derruba a tela com valores inválidos', () => {
    expect(
      lerFiltros(schema, new URLSearchParams('receitaId=abc&baixo=sim')),
    ).toEqual({ q: '', receitaId: undefined, baixo: undefined });
  });
});

describe('atualizarFiltros e hrefComFiltros', () => {
  it('altera, acrescenta e remove parâmetros', () => {
    expect(
      atualizarFiltros('q=sal&novo=1', {
        q: 'farinha',
        novo: null,
        baixo: true,
      }),
    ).toBe('q=farinha&baixo=1');
  });

  it('remove valores vazios, undefined e false', () => {
    expect(
      atualizarFiltros(new URLSearchParams('q=sal&baixo=1&status=PENDENTE'), {
        q: '',
        baixo: false,
        status: undefined,
        receitaId: 4,
      }),
    ).toBe('receitaId=4');
  });

  it('monta o href, sem "?" quando não sobra filtro', () => {
    expect(hrefComFiltros('/insumos', 'q=sal', { q: 'ovo' })).toBe(
      '/insumos?q=ovo',
    );
    expect(hrefComFiltros('/insumos', 'q=sal', { q: '' })).toBe('/insumos');
  });
});
