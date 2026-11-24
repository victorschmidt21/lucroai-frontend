import { describe, expect, it } from 'vitest';
import type { PrecoCanal, Receita } from '@/shared/api/contracts/recipe';
import {
  exemploContasDoMes,
  exemploCustoPorUnidade,
  exemploDivisaoDasContas,
  exemploFaturamento,
  exemploFornadasPorMes,
  exemploLucroReal,
  exemploMargem,
  exemploParaPagarAsContas,
  exemploPrecoSugerido,
  exemploRendimento,
  exemploSobrouPraVoce,
  exemploTaxaDoCanal,
} from './exemplos';
import { buscarTermo } from './termos';

const CUSTO: Receita['custo'] = {
  ingredientesLote: 46.8,
  gastosMensaisLote: 6,
  ingredientes: 3.9,
  gastosMensais: 0.5,
  gastosPorUnidade: 0,
  embalagem: 0.4,
  perdas: 0.3,
  unitario: 5.1,
};

function preco(canal: string, valor: number | null, lucro = 0.3): PrecoCanal {
  const parte = { valor: 0, fracao: 0 };
  return {
    canalId: canal.length,
    canal,
    balcao: canal === 'Balcão',
    percentuais: 0.4,
    preco: valor,
    motivo: valor === null ? 'PERCENTUAIS_ACIMA_DE_100' : null,
    composicao:
      valor === null
        ? null
        : {
            ingredientes: parte,
            gastosMensais: parte,
            gastosPorUnidade: parte,
            embalagem: parte,
            perdas: parte,
            imposto: parte,
            taxaCanal: parte,
            gastosPercentuais: parte,
            lucro: { valor: 0, fracao: lucro },
          },
  };
}

describe('exemplos da Pitada (FE-65)', () => {
  it('cada termo principal tem o exemplo ligado na base', () => {
    for (const id of [
      'custo-por-unidade',
      'rendimento',
      'divisao-das-contas',
      'fornadas-por-mes',
      'contas-do-mes',
      'preco-sugerido',
      'margem',
      'taxa-do-canal',
      'lucro-real',
      'faturamento',
      'sobrou-pra-voce',
      'para-pagar-as-contas',
    ]) {
      expect(buscarTermo(id)?.exemplo, id).toBeTypeOf('function');
    }
  });

  describe('custo-por-unidade', () => {
    it('mostra o custo e as partes com os valores da API', () => {
      expect(
        exemploCustoPorUnidade({ nome: 'Bolo de pote', custo: CUSTO }),
      ).toBe(
        'Cada unidade da receita Bolo de pote custa R$ 5,10: R$ 3,90 de ingredientes, R$ 0,40 de embalagem, R$ 0,30 de perdas e R$ 0,50 das contas do mês.',
      );
    });

    it('inclui os gastos por unidade e omite as partes zeradas', () => {
      expect(
        exemploCustoPorUnidade({
          nome: 'Pão',
          custo: {
            ...CUSTO,
            embalagem: 0,
            perdas: 0,
            gastosPorUnidade: 0.05,
            unitario: 4.45,
          },
        }),
      ).toBe(
        'Cada unidade da receita Pão custa R$ 4,45: R$ 3,90 de ingredientes, R$ 0,05 de gastos por unidade e R$ 0,50 das contas do mês.',
      );
    });

    it('sem custo, devolve null', () => {
      expect(
        exemploCustoPorUnidade({
          nome: 'Nova',
          custo: { ...CUSTO, ingredientes: 0, unitario: 0 },
        }),
      ).toBeNull();
    });
  });

  describe('rendimento', () => {
    it('em unidades, mostra a fração de cada uma', () => {
      expect(
        exemploRendimento({
          nome: 'Bolo de pote',
          rendimento: 12,
          unidadeRendimento: 'UN',
        }),
      ).toBe(
        'A receita Bolo de pote rende 12 unidades, então cada uma leva 1/12 dos ingredientes.',
      );
    });

    it('com 1 unidade e em outra medida', () => {
      expect(
        exemploRendimento({
          nome: 'Torta',
          rendimento: 1,
          unidadeRendimento: 'UN',
        }),
      ).toBe(
        'A receita Torta rende 1 unidade, que leva todos os ingredientes.',
      );
      expect(
        exemploRendimento({
          nome: 'Massa',
          rendimento: 2,
          unidadeRendimento: 'KG',
        }),
      ).toBe(
        'A receita Massa rende 2 kg, então cada kg leva 1/2 dos ingredientes.',
      );
    });

    it('sem rendimento, devolve null', () => {
      expect(
        exemploRendimento({
          nome: 'X',
          rendimento: 0,
          unidadeRendimento: 'UN',
        }),
      ).toBeNull();
    });
  });

  describe('divisao-das-contas', () => {
    it('por fornadas', () => {
      expect(
        exemploDivisaoDasContas({
          totalContas: 240,
          capacidadeMensal: 40,
          baseRateio: 'FORNADAS',
          porFornada: 6,
        }),
      ).toBe(
        'Suas contas do mês somam R$ 240,00 e cabem 40 fornadas: cada fornada leva R$ 6,00.',
      );
    });

    it('por minutos de forno', () => {
      expect(
        exemploDivisaoDasContas({
          totalContas: 240,
          capacidadeMensal: 2400,
          baseRateio: 'MINUTOS',
          porFornada: 0.1,
        }),
      ).toBe(
        'Suas contas do mês somam R$ 240,00 e se dividem por 2.400 minutos de forno: cada minuto leva R$ 0,10.',
      );
    });

    it('sem contas, devolve null', () => {
      expect(
        exemploDivisaoDasContas({
          totalContas: 0,
          capacidadeMensal: 40,
          baseRateio: 'FORNADAS',
          porFornada: 0,
        }),
      ).toBeNull();
    });
  });

  describe('fornadas-por-mes', () => {
    it('repete o que a pessoa disse', () => {
      expect(
        exemploFornadasPorMes({ capacidadeMensal: 40, baseRateio: 'FORNADAS' }),
      ).toBe('Você disse que faz 40 fornadas por mês.');
      expect(
        exemploFornadasPorMes({
          capacidadeMensal: 2400,
          baseRateio: 'MINUTOS',
        }),
      ).toBe('Você disse que usa 2.400 minutos de forno por mês.');
    });

    it('sem capacidade, devolve null', () => {
      expect(
        exemploFornadasPorMes({ capacidadeMensal: 0, baseRateio: 'FORNADAS' }),
      ).toBeNull();
    });
  });

  describe('contas-do-mes', () => {
    it('mostra o total', () => {
      expect(exemploContasDoMes({ totalContas: 240 })).toBe(
        'Suas contas do mês somam R$ 240,00.',
      );
    });

    it('sem contas, devolve null', () => {
      expect(exemploContasDoMes({ totalContas: 0 })).toBeNull();
    });
  });

  describe('preco-sugerido', () => {
    it('lista os canais com preço e o lucro da receita', () => {
      expect(
        exemploPrecoSugerido({
          nome: 'Bolo de pote',
          lucroPercentual: 0.3,
          precos: [
            preco('Balcão', 7.29),
            preco('iFood', 9.6),
            preco('Feira', null),
          ],
        }),
      ).toBe(
        'Para sobrar o lucro de 30,0%, cada unidade da receita Bolo de pote sai a R$ 7,29 (Balcão) e R$ 9,60 (iFood).',
      );
    });

    it('sem lucro próprio, usa o da composição (padrão da empresa)', () => {
      expect(
        exemploPrecoSugerido({
          nome: 'Pão',
          lucroPercentual: undefined,
          precos: [preco('Balcão', 1, 0.15)],
        }),
      ).toBe(
        'Para sobrar o lucro de 15,0%, cada unidade da receita Pão sai a R$ 1,00 (Balcão).',
      );
    });

    it('sem preço possível, devolve null', () => {
      expect(
        exemploPrecoSugerido({
          nome: 'Pão',
          lucroPercentual: 0.3,
          precos: [preco('Balcão', null)],
        }),
      ).toBeNull();
    });
  });

  describe('margem', () => {
    it('margem positiva em "R$ X de cada R$ 100"', () => {
      expect(
        exemploMargem({
          nome: 'Bolo de pote',
          lucroReal: 0.2875,
          lucroPorUnidade: 2.1,
        }),
      ).toBe(
        'Na receita Bolo de pote, ficam com você R$ 29 de cada R$ 100 vendidos.',
      );
    });

    it('margem negativa: quanto cada venda tira do bolso', () => {
      expect(
        exemploMargem({
          nome: 'Bolo de pote',
          lucroReal: -0.03,
          lucroPorUnidade: -0.2,
        }),
      ).toBe('Na receita Bolo de pote, cada venda tira R$ 0,20 do seu bolso.');
    });
  });

  describe('taxa-do-canal', () => {
    it('mostra a taxa e quanto fica com eles', () => {
      expect(exemploTaxaDoCanal({ canal: 'O iFood', taxa: 0.24 })).toBe(
        'O iFood cobra 24,0%: de cada R$ 100 vendidos, R$ 24,00 ficam com eles.',
      );
    });

    it('sem taxa, devolve null', () => {
      expect(exemploTaxaDoCanal({ canal: 'A maquininha', taxa: 0 })).toBeNull();
    });
  });

  describe('lucro-real', () => {
    it('usa descreverLucroReal, com o prejuízo', () => {
      expect(exemploLucroReal({ nome: 'Pão', lucroReal: 0.29 })).toBe(
        'Na venda mais recente da lista, a receita Pão teve lucro real de 29,0%.',
      );
      expect(exemploLucroReal({ nome: 'Pão', lucroReal: -0.05 })).toBe(
        'Na venda mais recente da lista, a receita Pão teve lucro real de -5,0% (prejuízo).',
      );
    });

    it('venda antiga sem lucro real, devolve null', () => {
      expect(exemploLucroReal({ nome: 'Pão', lucroReal: null })).toBeNull();
    });
  });

  describe('faturamento', () => {
    it('com lucro e no vermelho', () => {
      expect(exemploFaturamento({ faturamento: 4524.36, lucro: 1312.06 })).toBe(
        'Você vendeu R$ 4.524,36 este mês e sobraram R$ 1.312,06.',
      );
      expect(exemploFaturamento({ faturamento: 100, lucro: -20 })).toBe(
        'Você vendeu R$ 100,00 este mês, mas ficou R$ 20,00 no vermelho.',
      );
    });

    it('sem vendas no mês, devolve null', () => {
      expect(exemploFaturamento({ faturamento: 0, lucro: 0 })).toBeNull();
    });
  });

  describe('sobrou-pra-voce', () => {
    it('lucro e "R$ X de cada R$ 100"', () => {
      expect(
        exemploSobrouPraVoce({
          faturamento: 4524.36,
          lucro: 1312.06,
          margem: 29,
        }),
      ).toBe('Este mês sobraram R$ 1.312,06: R$ 29 de cada R$ 100 vendidos.');
    });

    it('sem vendas ou no vermelho, devolve null', () => {
      expect(
        exemploSobrouPraVoce({ faturamento: 0, lucro: 0, margem: 0 }),
      ).toBeNull();
      expect(
        exemploSobrouPraVoce({ faturamento: 100, lucro: -20, margem: -20 }),
      ).toBeNull();
    });
  });

  describe('para-pagar-as-contas', () => {
    it('meta atingida', () => {
      expect(
        exemploParaPagarAsContas({ valor: 830, faturamento: 4524.36 }),
      ).toBe('Você precisa vender R$ 830,00 no mês; já vendeu R$ 4.524,36.');
    });

    it('meta ainda não atingida: quanto falta', () => {
      expect(exemploParaPagarAsContas({ valor: 830, faturamento: 520 })).toBe(
        'Faltam R$ 310,00 para pagar as contas do mês.',
      );
    });

    it('sem o valor da API, devolve null', () => {
      expect(
        exemploParaPagarAsContas({ valor: null, faturamento: 520 }),
      ).toBeNull();
    });
  });
});
