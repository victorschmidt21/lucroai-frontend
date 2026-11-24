import { describe, expect, it } from 'vitest';
import type { Alertas } from '@/shared/api/contracts/catalog';
import {
  CARENCIA_MS,
  dicaDaVez,
  type ContextoDaDica,
  type Dica,
  type DicaId,
} from './dicas';

const AGORA = new Date(2026, 10, 24, 10, 0, 0);

function contexto(extra: Partial<ContextoDaDica>): ContextoDaDica {
  return {
    tela: 'receita',
    agora: AGORA,
    // A primeira sessão começou há um dia: fora da carência.
    primeiroAcesso: AGORA.getTime() - 86_400_000,
    dicaDaSessao: null,
    ...extra,
  };
}

/** O texto corrido, com os termos como texto. */
function textoDe(dica: Dica | null) {
  return dica?.texto
    .map((parte) => (typeof parte === 'string' ? parte : parte.texto))
    .join('');
}

const PREJUIZO = {
  receitaId: 7,
  receita: 'Bolo de pote',
  custo: 5.1,
  preco: 4.9,
  lucroPorUnidade: -0.2,
  hrefAjuste: '/receitas/7/editar',
};

const ALERTAS: Alertas = {
  estoqueNegativo: [
    { id: 3, nome: 'Leite condensado', saldo: -2, unidade: 'UN' },
  ],
  precoDefasado: [
    {
      id: 4,
      nome: 'Chocolate',
      unidade: 'KG',
      custoMedio: 40,
      custoReposicao: 50,
      aumentoPercentual: 0.25,
      receitas: [
        {
          id: 9,
          nome: 'Brigadeiro',
          precoSugerido: 2.5,
          precoComCustoMedio: 2.2,
        },
      ],
    },
  ],
};

describe('dicaDaVez', () => {
  describe('margem-negativa', () => {
    it('aparece no detalhe da receita com lucro por unidade negativo', () => {
      const dica = dicaDaVez(contexto({ prejuizo: PREJUIZO }), []);

      expect(dica?.id).toBe('margem-negativa');
      expect(dica?.titulo).toBe('Esse preço está pagando para vender');
      expect(textoDe(dica)).toBe(
        'A receita Bolo de pote custa R$ 5,10 para fazer e está a R$ 4,90. Cada unidade vendida tira R$ 0,20 do seu bolso.',
      );
      expect(dica?.texto).toContainEqual({
        termo: 'custo-por-unidade',
        texto: 'custa R$ 5,10 para fazer',
      });
      expect(dica?.acao).toEqual({
        rotulo: 'Ajustar o preço',
        href: '/receitas/7/editar',
      });
    });

    it('aparece também na simulação', () => {
      const dica = dicaDaVez(
        contexto({ tela: 'simulacao', prejuizo: PREJUIZO }),
        [],
      );
      expect(dica?.id).toBe('margem-negativa');
    });

    it('não aparece com lucro zero ou positivo, nem sem dados', () => {
      expect(
        dicaDaVez(
          contexto({ prejuizo: { ...PREJUIZO, lucroPorUnidade: 0 } }),
          [],
        ),
      ).toBeNull();
      expect(
        dicaDaVez(
          contexto({ prejuizo: { ...PREJUIZO, lucroPorUnidade: 1 } }),
          [],
        ),
      ).toBeNull();
      expect(dicaDaVez(contexto({ prejuizo: null }), [])).toBeNull();
    });

    it('não aparece em outra tela', () => {
      expect(
        dicaDaVez(contexto({ tela: 'receitas', prejuizo: PREJUIZO }), []),
      ).toBeNull();
    });
  });

  describe('estoque-negativo', () => {
    it('aparece em Ingredientes e no Estoque com o primeiro ingrediente negativo', () => {
      for (const tela of ['insumos', 'estoque'] as const) {
        const dica = dicaDaVez(
          contexto({ tela, alertas: ALERTAS, avisoLiberado: true }),
          [],
        );

        expect(dica?.id).toBe('estoque-negativo');
        expect(dica?.titulo).toBe('Faltou anotar uma compra?');
        expect(textoDe(dica)).toBe(
          'O ingrediente Leite condensado está com estoque abaixo de zero. Anote a compra para o custo ficar certo.',
        );
        expect(dica?.acao).toEqual({
          rotulo: 'Anotar compra',
          href: '/insumos?compra=3',
        });
      }
    });

    it('não aparece enquanto o aviso ao entrar não foi resolvido ou abriu nesta sessão', () => {
      expect(
        dicaDaVez(
          contexto({ tela: 'insumos', alertas: ALERTAS, avisoLiberado: false }),
          [],
        ),
      ).toBeNull();
      expect(
        dicaDaVez(contexto({ tela: 'insumos', alertas: ALERTAS }), []),
      ).toBeNull();
    });

    it('não aparece sem estoque negativo', () => {
      expect(
        dicaDaVez(
          contexto({
            tela: 'insumos',
            alertas: { ...ALERTAS, estoqueNegativo: [] },
            avisoLiberado: true,
          }),
          [],
        ),
      ).toBeNull();
    });
  });

  describe('preco-que-precisa-subir', () => {
    it('aparece em Receitas com a primeira receita afetada', () => {
      const dica = dicaDaVez(
        contexto({ tela: 'receitas', alertas: ALERTAS, avisoLiberado: true }),
        [],
      );

      expect(dica?.id).toBe('preco-que-precisa-subir');
      expect(dica?.titulo).toBe('Um ingrediente ficou mais caro');
      expect(textoDe(dica)).toBe(
        'O preço de Brigadeiro deixa menos lucro do que antes. Veja o preço novo sugerido.',
      );
      expect(dica?.acao).toEqual({
        rotulo: 'Ver a receita',
        href: '/receitas/9',
      });
    });

    it('não aparece com o aviso pendente nem quando nenhuma receita usa o ingrediente', () => {
      expect(
        dicaDaVez(contexto({ tela: 'receitas', alertas: ALERTAS }), []),
      ).toBeNull();
      expect(
        dicaDaVez(
          contexto({
            tela: 'receitas',
            alertas: {
              estoqueNegativo: [],
              precoDefasado: [{ ...ALERTAS.precoDefasado[0]!, receitas: [] }],
            },
            avisoLiberado: true,
          }),
          [],
        ),
      ).toBeNull();
    });
  });

  describe('taxa-do-canal', () => {
    it('aparece em Vendas depois de anotar uma venda num canal com taxa', () => {
      const dica = dicaDaVez(
        contexto({
          tela: 'vendas',
          vendaAnotada: { canal: 'iFood', comissao: 0.27, total: 40 },
        }),
        [],
      );

      expect(dica?.id).toBe('taxa-do-canal');
      expect(dica?.titulo).toBe('No canal iFood, uma parte fica com eles');
      expect(textoDe(dica)).toBe(
        'Dessa venda, R$ 10,80 foram de taxa. O preço sugerido do canal iFood já conta com isso.',
      );
      expect(dica?.acao).toEqual({
        rotulo: 'Ver preços por canal',
        href: '/receitas',
      });
    });

    it('não aparece num canal sem taxa nem antes de anotar', () => {
      expect(
        dicaDaVez(
          contexto({
            tela: 'vendas',
            vendaAnotada: { canal: 'Balcão', comissao: 0, total: 40 },
          }),
          [],
        ),
      ).toBeNull();
      expect(
        dicaDaVez(contexto({ tela: 'vendas', vendaAnotada: null }), []),
      ).toBeNull();
    });
  });

  describe('primeiro-mes', () => {
    const venda = (dataVenda: string, status = 'CONCLUIDA' as const) => ({
      dataVenda,
      status,
    });

    it('aparece no Início no mês seguinte ao da primeira venda', () => {
      const dica = dicaDaVez(
        contexto({
          tela: 'inicio',
          vendas: [
            venda(new Date(2026, 9, 20, 12).toISOString()),
            venda(new Date(2026, 10, 2, 12).toISOString()),
          ],
        }),
        [],
      );

      expect(dica?.id).toBe('primeiro-mes');
      expect(dica?.titulo).toBe('Seu primeiro mês fechou');
      expect(textoDe(dica)).toBe(
        'Veja quanto sobrou pra você e quanto precisa vender para pagar as contas do mês.',
      );
      expect(dica?.acao).toEqual({
        rotulo: 'Entender o Início',
        href: '/aprender/sobrou-pra-voce',
      });
    });

    it('não aparece no mesmo mês da primeira venda, dois meses depois nem sem vendas concluídas', () => {
      const noMes = [venda(new Date(2026, 10, 2, 12).toISOString())];
      const antiga = [venda(new Date(2026, 8, 2, 12).toISOString())];
      const cancelada = [
        {
          dataVenda: new Date(2026, 9, 2, 12).toISOString(),
          status: 'CANCELADA' as const,
        },
      ];

      for (const vendas of [noMes, antiga, cancelada, []]) {
        expect(dicaDaVez(contexto({ tela: 'inicio', vendas }), [])).toBeNull();
      }
    });

    it('vira o ano: venda em dezembro, dica em janeiro', () => {
      const dica = dicaDaVez(
        contexto({
          tela: 'inicio',
          agora: new Date(2027, 0, 5, 10),
          primeiroAcesso: 0,
          vendas: [venda(new Date(2026, 11, 20, 12).toISOString())],
        }),
        [],
      );
      expect(dica?.id).toBe('primeiro-mes');
    });
  });

  describe('regras', () => {
    it('uma dica já vista não volta, nem em outra receita', () => {
      const vistas: DicaId[] = ['margem-negativa'];

      expect(dicaDaVez(contexto({ prejuizo: PREJUIZO }), vistas)).toBeNull();
      expect(
        dicaDaVez(
          contexto({
            tela: 'simulacao',
            prejuizo: { ...PREJUIZO, receitaId: 8, receita: 'Torta' },
          }),
          vistas,
        ),
      ).toBeNull();
    });

    it('no máximo uma dica por sessão: com outra já mostrada, nenhuma aparece', () => {
      expect(
        dicaDaVez(
          contexto({ prejuizo: PREJUIZO, dicaDaSessao: 'estoque-negativo' }),
          [],
        ),
      ).toBeNull();
    });

    it('a dica da sessão continua até ser dispensada, e então nenhuma outra aparece', () => {
      const comPrejuizo = contexto({
        prejuizo: PREJUIZO,
        dicaDaSessao: 'margem-negativa',
      });
      expect(dicaDaVez(comPrejuizo, [])?.id).toBe('margem-negativa');
      expect(dicaDaVez(comPrejuizo, ['margem-negativa'])).toBeNull();
      expect(
        dicaDaVez(
          contexto({
            tela: 'insumos',
            alertas: ALERTAS,
            avisoLiberado: true,
            dicaDaSessao: 'margem-negativa',
          }),
          ['margem-negativa'],
        ),
      ).toBeNull();
    });

    it('nada aparece nos primeiros 30 segundos da primeira sessão', () => {
      const inicio = AGORA.getTime();
      expect(
        dicaDaVez(contexto({ prejuizo: PREJUIZO, primeiroAcesso: inicio }), []),
      ).toBeNull();
      expect(
        dicaDaVez(
          contexto({
            prejuizo: PREJUIZO,
            primeiroAcesso: inicio - CARENCIA_MS + 1,
          }),
          [],
        ),
      ).toBeNull();
      expect(
        dicaDaVez(
          contexto({
            prejuizo: PREJUIZO,
            primeiroAcesso: inicio - CARENCIA_MS,
          }),
          [],
        )?.id,
      ).toBe('margem-negativa');
    });
  });
});
