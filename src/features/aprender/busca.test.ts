// @vitest-environment node
import { describe, expect, it } from 'vitest';
import type { Termo } from './aprender.schema';
import { buscarTermos } from './busca';
import { TERMOS } from './termos';

function ids(termos: Termo[]) {
  return termos.map((termo) => termo.id);
}

function criarTermo(
  id: string,
  titulo: string,
  sinonimos: string[] = [],
): Termo {
  return {
    id,
    titulo,
    assunto: 'custos',
    sinonimos,
    curto: `Texto curto de ${titulo}.`,
    explicacao: 'Explicação.',
    porQueImporta: 'Importa.',
    relacionados: [],
  };
}

describe('buscarTermos', () => {
  it('acha os termos pelas palavras que a pessoa usaria', () => {
    expect(ids(buscarTermos('sobra'))).toContain('margem');
    expect(ids(buscarTermos('rateio'))).toContain('divisao-das-contas');
    expect(ids(buscarTermos('ifood'))).toContain('taxa-do-canal');
  });

  it('ignora acento e caixa', () => {
    expect(ids(buscarTermos('PRECO SUGERIDO'))).toEqual(['preco-sugerido']);
    expect(ids(buscarTermos('Fornadas por mês'))).toEqual(
      ids(buscarTermos('fornadas por mes')),
    );
    expect(ids(buscarTermos('desperdicio'))).toEqual(['perda']);
  });

  it('procura também no texto curto', () => {
    expect(ids(buscarTermos('maquininha'))).toContain('taxa-do-canal');
    const soNoCurto = criarTermo('a', 'Alfa');
    expect(buscarTermos('texto curto de alfa', [soNoCurto])).toEqual([
      soNoCurto,
    ]);
  });

  it('ordena: título que começa com o texto, sinônimo igual, depois o resto', () => {
    const resto = criarTermo('resto', 'Outro', ['bolo de pote']);
    const sinonimo = criarTermo('sinonimo', 'Fatia', ['bolo']);
    const titulo = criarTermo('titulo', 'Bolo de rolo');
    expect(ids(buscarTermos('bolo', [resto, sinonimo, titulo]))).toEqual([
      'titulo',
      'sinonimo',
      'resto',
    ]);
  });

  it('mantém a ordem da base dentro de cada grupo', () => {
    expect(ids(buscarTermos('custo')).slice(0, 2)).toEqual([
      'custo-da-receita',
      'custo-por-unidade',
    ]);
  });

  it('devolve lista vazia quando nada combina', () => {
    expect(buscarTermos('xyzabc')).toEqual([]);
  });

  it('com o texto vazio, devolve todos os termos', () => {
    expect(buscarTermos('   ')).toHaveLength(TERMOS.length);
  });
});
