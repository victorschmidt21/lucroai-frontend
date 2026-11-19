import { describe, expect, it } from 'vitest';
import { vendasSearchSchema } from './vendas-search.schema';

describe('vendasSearchSchema', () => {
  it('sem parâmetros: aba Registrar e sem período (vale o mês atual)', () => {
    expect(vendasSearchSchema.parse({})).toEqual({ aba: 'registrar' });
  });

  it('lê o período em YYYY-MM-DD e o status', () => {
    expect(
      vendasSearchSchema.parse({
        aba: 'historico',
        dataInicio: '2026-11-01',
        dataFim: '2026-11-30',
        status: 'PENDENTE',
      }),
    ).toEqual({
      aba: 'historico',
      dataInicio: '2026-11-01',
      dataFim: '2026-11-30',
      status: 'PENDENTE',
    });
  });

  it.each(['2026-02-30', '01/11/2026', '2026-1-1', 'abc'])(
    'descarta a data inválida %s',
    (data) => {
      expect(vendasSearchSchema.parse({ dataInicio: data }).dataInicio).toBe(
        undefined,
      );
    },
  );

  it('descarta status e aba desconhecidos', () => {
    expect(vendasSearchSchema.parse({ aba: 'x', status: 'XYZ' })).toEqual({
      aba: 'registrar',
    });
  });

  it('período com a data inicial depois da final volta ao padrão', () => {
    const busca = vendasSearchSchema.parse({
      dataInicio: '2026-12-01',
      dataFim: '2026-11-30',
    });

    expect(busca.dataInicio).toBeUndefined();
    expect(busca.dataFim).toBeUndefined();
  });

  it('aceita só uma das datas', () => {
    expect(vendasSearchSchema.parse({ dataFim: '2026-11-30' })).toEqual({
      aba: 'registrar',
      dataFim: '2026-11-30',
    });
  });
});
