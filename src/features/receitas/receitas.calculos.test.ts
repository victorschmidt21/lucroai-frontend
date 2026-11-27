import { describe, expect, it } from 'vitest';
import { receitaSchema } from '@/shared/api/contracts/recipe';
import receitaDoSeed from '@/test/fixtures/recipe/receita.json';
import {
  makeReceita,
  makeComposicaoPreco,
  makePrecoCanal,
  makeSimulacaoCenario,
} from '@/test/factories/receita.factory';
import receitaComReceitas from '@/test/fixtures/recipe/receita-com-receitas.json';
import receitaUsadaEmOutra from '@/test/fixtures/recipe/receita-usada-em-outra.json';
import receitaComTrabalho from '@/test/fixtures/recipe/receita-com-trabalho.json';
import {
  custoParaUsarDentro,
  motivoParaNaoExcluir,
  passaNoFiltroDeVenda,
  precoOuNaoVendida,
  TEXTO_NAO_VENDIDA_SOZINHA,
  dicaDaQuantidadeDaReceita,
  motivoSemReceitasDentro,
  receitasQuePodemEntrar,
  calcularCustoItem,
  avisoDePrejuizo,
  avisoSemPrecoPossivel,
  formatarResultadoDaSimulacao,
  montarBarraDoPreco,
  sugestaoDoCanal,
  formatTempoDeTrabalho,
  horasEMinutosParaMinutos,
  minutosParaHorasEMinutos,
  mostrarSeuTrabalho,
} from './receitas.calculos';

describe('calcularCustoItem', () => {
  it('multiplica pela quantidade na unidade do insumo e arredonda a centavos', () => {
    // Manteiga: R$ 12 por 500 g = 0,024/g.
    expect(calcularCustoItem(100, 0.024)).toBe(2.4);
    // Fermento: 8,5 / 500 × 10 = 0,17.
    expect(calcularCustoItem(10, 8.5 / 500)).toBe(0.17);
  });
});

describe('montarBarraDoPreco', () => {
  it('monta a barra do Pão Francês do seed no Balcão, somando R$ 1,00', () => {
    const balcao = makePrecoCanal();
    const barra = montarBarraDoPreco(makeComposicaoPreco(), balcao);

    expect(barra).toEqual([
      {
        id: 'ingredientes',
        rotulo: 'Ingredientes',
        valor: 0.1359,
        fracao: 0.2954,
      },
      {
        id: 'contasDoMes',
        rotulo: 'Contas do mês',
        valor: 0.1796,
        fracao: 0.3905,
      },
      // Gastos por unidade (0,05) + embalagem (0) + perdas (0,0192).
      {
        id: 'embalagemEPerdas',
        rotulo: 'Embalagem e perdas',
        valor: 0.0692,
        fracao: 0.1505,
      },
      {
        id: 'taxaCanal',
        rotulo: 'Taxa da maquininha',
        valor: 0.0063,
        fracao: 0.0136,
      },
      { id: 'lucro', rotulo: 'Lucro', valor: 0.069, fracao: 0.15 },
    ]);
    expect(barra.reduce((soma, parte) => soma + parte.fracao, 0)).toBeCloseTo(
      1,
      4,
    );
  });

  it('o lucro da barra é o lucro configurado, em todos os canais do seed', () => {
    const receita = receitaSchema.parse(receitaDoSeed);

    for (const preco of receita.precos) {
      if (!preco.composicao) throw new Error('canal do seed sem preço');
      const lucro = montarBarraDoPreco(preco.composicao, preco).find(
        (parte) => parte.id === 'lucro',
      );
      expect(lucro?.fracao).toBe(0.15);
    }
  });

  it('sem trabalho (0 minutos ou valor da hora 0), a fatia "Seu trabalho" fica de fora', () => {
    const barra = montarBarraDoPreco(makeComposicaoPreco(), makePrecoCanal());

    expect(barra.map((parte) => parte.id)).not.toContain('seuTrabalho');
  });

  it('com trabalho, mostra a fatia "Seu trabalho" e as fatias somam 100% (Brownie do seed)', () => {
    const receita = receitaSchema.parse(receitaComTrabalho);

    for (const preco of receita.precos) {
      if (!preco.composicao) throw new Error('canal do seed sem preço');
      const barra = montarBarraDoPreco(preco.composicao, preco);
      const trabalho = barra.find((parte) => parte.id === 'seuTrabalho');

      expect(trabalho?.rotulo).toBe('Seu trabalho');
      expect(trabalho?.valor).toBe(preco.composicao.trabalho.valor);
      // Logo depois das contas do mês.
      expect(barra.map((parte) => parte.id).indexOf('seuTrabalho')).toBe(
        barra.map((parte) => parte.id).indexOf('contasDoMes') + 1,
      );
      expect(barra.reduce((soma, parte) => soma + parte.fracao, 0)).toBeCloseTo(
        1,
        3,
      );
    }
  });

  it('fora do Balcão, a taxa leva o nome do canal', () => {
    const barra = montarBarraDoPreco(
      makeComposicaoPreco({ taxaCanal: { valor: 0.0838, fracao: 0.152 } }),
      { canal: 'iFood', balcao: false },
    );

    expect(barra.find((parte) => parte.id === 'taxaCanal')?.rotulo).toBe(
      'Taxa do iFood',
    );
  });

  it('mostra imposto e gastos em % da venda quando existem', () => {
    const barra = montarBarraDoPreco(
      makeComposicaoPreco({
        imposto: { valor: 0.03, fracao: 0.06 },
        gastosPercentuais: { valor: 0.01, fracao: 0.02 },
      }),
      makePrecoCanal(),
    );

    expect(barra.map((parte) => parte.id)).toEqual([
      'ingredientes',
      'contasDoMes',
      'embalagemEPerdas',
      'imposto',
      'taxaCanal',
      'percentuaisDaVenda',
      'lucro',
    ]);
  });

  it('esconde as partes zeradas, menos o lucro', () => {
    const zero = { valor: 0, fracao: 0 };
    const barra = montarBarraDoPreco(
      makeComposicaoPreco({
        gastosMensais: zero,
        gastosPorUnidade: zero,
        perdas: zero,
        taxaCanal: zero,
        ingredientes: { valor: 1, fracao: 1 },
        lucro: zero,
      }),
      makePrecoCanal(),
    );

    expect(barra.map((parte) => parte.id)).toEqual(['ingredientes', 'lucro']);
  });
});

describe('formatarResultadoDaSimulacao', () => {
  it('pelo preço sugerido, mostra o lucro real configurado e o ponto de equilíbrio', () => {
    expect(formatarResultadoDaSimulacao(makeSimulacaoCenario())).toEqual({
      lucroPorUnidade: 'R$ 0,07',
      lucroReal: '15,0%',
      lucroMes: 'R$ 1,93',
      prejuizo: false,
      aviso: null,
      pontoEquilibrio:
        'Para pagar as contas do mês, você precisa vender 9.745 unidades.',
    });
  });

  it('preço abaixo do custo mostra o aviso e nenhum ponto de equilíbrio', () => {
    const textos = formatarResultadoDaSimulacao(
      makeSimulacaoCenario({
        precoVenda: 0.3,
        lucroPorUnidade: -0.0889,
        lucroReal: -0.2962,
        lucroMes: -88.85,
        // A API ainda devolve unidades: a margem de contribuição é positiva.
        pontoEquilibrio: { unidades: 25089, motivo: null },
      }),
    );

    expect(textos).toMatchObject({
      lucroPorUnidade: '-R$ 0,09',
      lucroReal: '-29,6%',
      lucroMes: '-R$ 88,85',
      prejuizo: true,
      aviso:
        'Com esse preço você paga para vender. Você perde R$ 0,09 em cada unidade.',
      pontoEquilibrio: null,
    });
  });

  it('sem ponto de equilíbrio pela margem negativa, só o aviso', () => {
    const textos = formatarResultadoDaSimulacao(
      makeSimulacaoCenario({
        lucroPorUnidade: -0.3,
        pontoEquilibrio: { unidades: null, motivo: 'MARGEM_NEGATIVA' },
      }),
    );

    expect(textos.aviso).not.toBeNull();
    expect(textos.pontoEquilibrio).toBeNull();
  });

  it('no singular com 1 unidade e sem contas do mês com 0', () => {
    expect(
      formatarResultadoDaSimulacao(
        makeSimulacaoCenario({
          pontoEquilibrio: { unidades: 1, motivo: null },
        }),
      ).pontoEquilibrio,
    ).toBe('Para pagar as contas do mês, você precisa vender 1 unidade.');
    expect(
      formatarResultadoDaSimulacao(
        makeSimulacaoCenario({
          gastosMensais: 0,
          pontoEquilibrio: { unidades: 0, motivo: null },
        }),
      ).pontoEquilibrio,
    ).toBe(
      'Você não tem contas do mês cadastradas: qualquer venda já ajuda no lucro.',
    );
  });

  it('lucro zero não é prejuízo', () => {
    const textos = formatarResultadoDaSimulacao(
      makeSimulacaoCenario({ lucroPorUnidade: 0, lucroReal: 0, lucroMes: 0 }),
    );
    expect(textos.prejuizo).toBe(false);
    expect(textos.aviso).toBeNull();
  });
});

describe('avisoDePrejuizo', () => {
  it('sugere o preço do canal e quanto sobra por unidade', () => {
    expect(
      avisoDePrejuizo(0.0889, { preco: 0.4667, lucroPorUnidade: 0.07 }),
    ).toBe(
      'Com esse preço você paga para vender. Que tal R$ 0,47? Assim sobram R$ 0,07 por unidade.',
    );
  });

  it('sem sugestão, diz quanto perde em cada unidade', () => {
    expect(avisoDePrejuizo(0.0889, null)).toBe(
      'Com esse preço você paga para vender. Você perde R$ 0,09 em cada unidade.',
    );
  });

  it('o resultado da simulação usa a sugestão no aviso', () => {
    expect(
      formatarResultadoDaSimulacao(
        makeSimulacaoCenario({ lucroPorUnidade: -0.1 }),
        { preco: 5, lucroPorUnidade: 0.75 },
      ).aviso,
    ).toBe(
      'Com esse preço você paga para vender. Que tal R$ 5,00? Assim sobram R$ 0,75 por unidade.',
    );
  });
});

describe('sugestaoDoCanal', () => {
  it('usa o preço e o lucro por unidade do canal simulado', () => {
    const balcao = makePrecoCanal();
    expect(sugestaoDoCanal([balcao], balcao.canalId)).toEqual({
      preco: balcao.preco,
      lucroPorUnidade: balcao.composicao?.lucro.valor,
    });
  });

  it('sem preço possível, sem lucro ou com outro canal, não sugere', () => {
    const balcao = makePrecoCanal();
    expect(sugestaoDoCanal([balcao], balcao.canalId + 99)).toBeNull();
    expect(
      sugestaoDoCanal(
        [makePrecoCanal({ preco: null, composicao: null })],
        balcao.canalId,
      ),
    ).toBeNull();
  });
});

describe('avisoSemPrecoPossivel', () => {
  it('diz o percentual e o que fazer', () => {
    expect(avisoSemPrecoPossivel(1.05)).toBe(
      'Não existe preço que pague tudo: as taxas e o lucro já somam 105,0% do preço. Diminua o lucro da receita ou as taxas em Ajustes de preço.',
    );
  });
});

describe('receitasQuePodemEntrar (FE-70)', () => {
  const preto = makeReceita({ id: 5, nome: 'Brigadeiro preto' });
  const branco = makeReceita({ id: 6, nome: 'Brigadeiro branco' });
  const brownie = makeReceita({ id: 7, nome: 'Brownie' });
  const doisAmores = makeReceita({
    id: 8,
    nome: 'Brownie Dois Amores',
    receitas: [
      { receitaId: 5, nome: 'Brigadeiro preto', quantidade: 150, unidade: 'G' },
    ],
  });
  const todas = [preto, branco, brownie, doisAmores];
  const ids = (lista: { id: number }[]) => lista.map((receita) => receita.id);

  it('no cadastro, oferece só as receitas sem receitas dentro', () => {
    expect(ids(receitasQuePodemEntrar(todas, { jaAdicionadas: [] }))).toEqual([
      5, 6, 7,
    ]);
  });

  it('não oferece a própria receita', () => {
    expect(
      ids(receitasQuePodemEntrar(todas, { receitaId: 7, jaAdicionadas: [] })),
    ).toEqual([5, 6]);
  });

  it('não oferece de novo as que já estão na receita', () => {
    expect(
      ids(receitasQuePodemEntrar(todas, { receitaId: 8, jaAdicionadas: [5] })),
    ).toEqual([6, 7]);
  });

  it('sem receitas, não oferece nada', () => {
    expect(receitasQuePodemEntrar([], { jaAdicionadas: [] })).toEqual([]);
  });
});

describe('motivoSemReceitasDentro', () => {
  it('diz onde a receita já vai', () => {
    expect(
      motivoSemReceitasDentro(
        makeReceita({
          nome: 'Brigadeiro branco',
          usadaEm: [{ receitaId: 8, nome: 'Brownie Dois Amores' }],
        }),
      ),
    ).toBe(
      'A receita Brigadeiro branco já vai dentro de Brownie Dois Amores, então não pode levar outras receitas.',
    );
  });

  it('junta os nomes quando vai dentro de mais de uma', () => {
    expect(
      motivoSemReceitasDentro(
        makeReceita({
          nome: 'Brigadeiro preto',
          usadaEm: [
            { receitaId: 8, nome: 'Brownie Dois Amores' },
            { receitaId: 9, nome: 'Bolo Prestígio' },
          ],
        }),
      ),
    ).toContain('dentro de Brownie Dois Amores e Bolo Prestígio,');
  });

  it('é null no cadastro e na receita que não vai dentro de outra', () => {
    expect(motivoSemReceitasDentro(undefined)).toBeNull();
    expect(motivoSemReceitasDentro(makeReceita())).toBeNull();
  });
});

describe('dicaDaQuantidadeDaReceita', () => {
  it('fala na unidade em que a receita rende', () => {
    expect(
      dicaDaQuantidadeDaReceita({
        nome: 'Brigadeiro preto',
        rendimento: 1000,
        unidadeRendimento: 'G',
      }),
    ).toBe(
      'A receita de Brigadeiro preto rende 1.000 g. Quanto vai em 1 lote desta?',
    );
    expect(
      dicaDaQuantidadeDaReceita({
        nome: 'Brownie',
        rendimento: 12,
        unidadeRendimento: 'UN',
      }),
    ).toBe('A receita de Brownie rende 12 un. Quanto vai em 1 lote desta?');
  });
});

describe('precoOuNaoVendida', () => {
  it('receita vendida mostra os preços por canal', () => {
    expect(precoOuNaoVendida(makeReceita({ vendavel: true }), 0.07)).toEqual({
      tipo: 'precos',
    });
  });

  it('receita que só vai dentro de outras mostra o texto e o custo por grama', () => {
    const brigadeiro = receitaSchema.parse(receitaUsadaEmOutra);
    expect(precoOuNaoVendida(brigadeiro, 0.0241)).toEqual({
      tipo: 'naoVendida',
      texto:
        'Esta receita não é vendida sozinha. O custo dela entra nas receitas onde ela vai.',
      custo: 'R$ 0,0241/g',
    });
  });

  it('usa a unidade do rendimento (ml ou unidade)', () => {
    const calda = makeReceita({ vendavel: false, unidadeRendimento: 'ML' });
    const resultado = precoOuNaoVendida(calda, 0.5);
    expect(resultado).toMatchObject({
      texto: TEXTO_NAO_VENDIDA_SOZINHA,
      custo: 'R$ 0,5000/ml',
    });
  });
});

describe('custoParaUsarDentro', () => {
  const brigadeiro = receitaSchema.parse(receitaUsadaEmOutra);
  const brownieDoisAmores = receitaSchema.parse(receitaComReceitas);

  it('usa o custo que a API mostra na receita onde ela vai', () => {
    expect(
      custoParaUsarDentro(brigadeiro, [makeReceita(), brownieDoisAmores]),
    ).toBe(0.0241);
  });

  it('sem receita que a use, fica o custo dela mesma', () => {
    expect(custoParaUsarDentro(brigadeiro, [makeReceita()])).toBe(0.0741);
  });
});

describe('motivoParaNaoExcluir', () => {
  it('diz onde a receita vai', () => {
    expect(
      motivoParaNaoExcluir({
        nome: 'Brigadeiro branco',
        usadaEm: [
          { receitaId: 159, nome: 'Brownie Dois Amores' },
          { receitaId: 160, nome: 'Bolo Prestígio' },
        ],
      }),
    ).toBe(
      'A receita Brigadeiro branco vai dentro de Brownie Dois Amores e Bolo Prestígio. Tire ela de lá antes de excluir.',
    );
  });

  it('receita que não vai dentro de outra pode ser excluída', () => {
    expect(motivoParaNaoExcluir(makeReceita())).toBeNull();
  });
});

describe('passaNoFiltroDeVenda', () => {
  const vendida = makeReceita({ vendavel: true });
  const soDentro = makeReceita({ vendavel: false });

  it('"Todas" mostra as duas', () => {
    expect(passaNoFiltroDeVenda(vendida, 'todas')).toBe(true);
    expect(passaNoFiltroDeVenda(soDentro, 'todas')).toBe(true);
  });

  it('"Vendo sozinha" mostra só as vendidas', () => {
    expect(passaNoFiltroDeVenda(vendida, 'vendo')).toBe(true);
    expect(passaNoFiltroDeVenda(soDentro, 'vendo')).toBe(false);
  });

  it('"Só vai dentro de outras" mostra só as não vendidas', () => {
    expect(passaNoFiltroDeVenda(vendida, 'dentro')).toBe(false);
    expect(passaNoFiltroDeVenda(soDentro, 'dentro')).toBe(true);
  });
});

describe('tempo de trabalho (FE-77)', () => {
  it('1 h 20 min vira 80 minutos', () => {
    expect(horasEMinutosParaMinutos({ horas: 1, minutos: 20 })).toBe(80);
  });

  it('campo vazio conta como 0, e horas quebradas viram minutos', () => {
    expect(horasEMinutosParaMinutos({})).toBe(0);
    expect(horasEMinutosParaMinutos({ minutos: 40 })).toBe(40);
    expect(horasEMinutosParaMinutos({ horas: 1.5 })).toBe(90);
    expect(horasEMinutosParaMinutos({ horas: 0.1, minutos: 0.2 })).toBe(6.2);
  });

  it('80 minutos salvos voltam como 1 h 20 min', () => {
    expect(minutosParaHorasEMinutos(80)).toEqual({ horas: 1, minutos: 20 });
    expect(minutosParaHorasEMinutos(40)).toEqual({ horas: 0, minutos: 40 });
    expect(minutosParaHorasEMinutos(120)).toEqual({ horas: 2, minutos: 0 });
    expect(minutosParaHorasEMinutos(0)).toEqual({ horas: 0, minutos: 0 });
  });

  it('minutos fracionários ficam no resto, e valor inválido vira 0', () => {
    expect(minutosParaHorasEMinutos(72.5)).toEqual({ horas: 1, minutos: 12.5 });
    expect(minutosParaHorasEMinutos(-5)).toEqual({ horas: 0, minutos: 0 });
    expect(minutosParaHorasEMinutos(Number.NaN)).toEqual({
      horas: 0,
      minutos: 0,
    });
  });

  it('formata o tempo para o detalhe', () => {
    expect(formatTempoDeTrabalho(80)).toBe('1 h 20 min');
    expect(formatTempoDeTrabalho(40)).toBe('40 min');
    expect(formatTempoDeTrabalho(120)).toBe('2 h');
    expect(formatTempoDeTrabalho(72.5)).toBe('1 h 12,5 min');
    expect(formatTempoDeTrabalho(0)).toBe('0 min');
  });

  it('a linha "Seu trabalho" só aparece com trabalho no lote', () => {
    expect(mostrarSeuTrabalho({ trabalhoLote: 12.5 })).toBe(true);
    expect(mostrarSeuTrabalho({ trabalhoLote: 0 })).toBe(false);
  });
});
