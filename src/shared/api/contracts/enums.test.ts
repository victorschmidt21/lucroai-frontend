import { describe, expect, it } from 'vitest';
import {
  ORIGEM_MOVIMENTACAO_ROTULOS,
  STATUS_VENDA,
  STATUS_VENDA_ROTULOS,
  statusVendaSchema,
  TIPO_GASTO_DESCRICOES,
  TIPO_GASTO_ROTULOS,
  TIPO_MOVIMENTACAO_ROTULOS,
  TIPOS_GASTO,
  tipoGastoSchema,
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

  it('TipoGasto tem rótulo e descrição sem jargão para cada valor', () => {
    expect(TIPOS_GASTO).toEqual(['MENSAL', 'POR_UNIDADE', 'PERCENTUAL_VENDA']);
    expect(TIPO_GASTO_ROTULOS).toEqual({
      MENSAL: 'Conta do mês',
      POR_UNIDADE: 'Por unidade vendida',
      PERCENTUAL_VENDA: '% da venda',
    });
    expect(Object.keys(TIPO_GASTO_DESCRICOES)).toEqual([...TIPOS_GASTO]);
    expect(tipoGastoSchema.safeParse('FIXO').success).toBe(false);
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
