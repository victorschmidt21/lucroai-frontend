import { describe, expect, it } from 'vitest';
import {
  METODO_RATEIO_DESCRICOES,
  METODO_RATEIO_ROTULOS,
  METODOS_RATEIO,
  metodoRateioSchema,
  ORIGEM_MOVIMENTACAO_ROTULOS,
  STATUS_VENDA,
  STATUS_VENDA_ROTULOS,
  statusVendaSchema,
  TIPO_MOVIMENTACAO_ROTULOS,
  UNIDADE_MEDIDA_ROTULOS,
  UNIDADES_MEDIDA,
  unidadeMedidaSchema,
} from './enums';

describe('enums do contrato', () => {
  it('UnidadeMedida tem os valores do backend e os rótulos da FE-05', () => {
    expect(UNIDADES_MEDIDA).toEqual(['G', 'KG', 'ML', 'L', 'UN']);
    expect(UNIDADE_MEDIDA_ROTULOS).toEqual({
      G: 'g',
      KG: 'kg',
      ML: 'ml',
      L: 'L',
      UN: 'un',
    });
    expect(unidadeMedidaSchema.safeParse('kg').success).toBe(false);
  });

  it('MetodoRateio tem rótulo e descrição para cada valor', () => {
    expect(METODOS_RATEIO).toEqual(['PROPORCIONAL', 'POR_UNIDADE', 'FIXO']);
    expect(METODO_RATEIO_ROTULOS.FIXO).toBe('Valor fixo por produção');
    expect(Object.keys(METODO_RATEIO_DESCRICOES)).toEqual([...METODOS_RATEIO]);
    expect(metodoRateioSchema.safeParse('OUTRO').success).toBe(false);
  });

  it('StatusVenda tem os rótulos com acento', () => {
    expect(STATUS_VENDA).toEqual(['PENDENTE', 'CONCLUIDA', 'CANCELADA']);
    expect(STATUS_VENDA_ROTULOS.CONCLUIDA).toBe('Concluída');
    expect(statusVendaSchema.safeParse('PAGA').success).toBe(false);
  });

  it('movimentações têm rótulos de tipo e origem', () => {
    expect(TIPO_MOVIMENTACAO_ROTULOS.SAIDA).toBe('Saída');
    expect(ORIGEM_MOVIMENTACAO_ROTULOS.PRODUCAO).toBe('Produção');
  });
});
