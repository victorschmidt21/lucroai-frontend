import { describe, expect, it } from 'vitest';
import {
  fimDoDia,
  formatData,
  inicioDoDia,
  parseDataSemHora,
  toDataSemHora,
} from './data';

// Os testes rodam no fuso America/Sao_Paulo (UTC-3), fixado no vitest.config.ts.

describe('parseDataSemHora', () => {
  it('lê YYYY-MM-DD como meia-noite local, sem mudar o dia', () => {
    const data = parseDataSemHora('2026-11-01');

    expect(data?.getFullYear()).toBe(2026);
    expect(data?.getMonth()).toBe(10);
    expect(data?.getDate()).toBe(1);
    expect(data?.getHours()).toBe(0);
  });

  it('é diferente do new Date(), que mostraria o dia anterior no Brasil', () => {
    expect(new Date('2026-11-01').getDate()).toBe(31);
    expect(parseDataSemHora('2026-11-01')?.getDate()).toBe(1);
  });

  it.each(['2026-02-30', '2026-13-01', '01/11/2026', '2026-1-1', '', null])(
    'devolve null para %s',
    (texto) => {
      expect(parseDataSemHora(texto)).toBeNull();
    },
  );
});

describe('toDataSemHora', () => {
  it('é o inverso de parseDataSemHora', () => {
    expect(toDataSemHora(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
    expect(toDataSemHora(parseDataSemHora('2026-12-31') as Date)).toBe(
      '2026-12-31',
    );
  });
});

describe('formatData', () => {
  it('formata YYYY-MM-DD sem deslocar o fuso', () => {
    expect(formatData('2026-11-01')).toBe('01/11/2026');
    expect(formatData('2026-01-01')).toBe('01/01/2026');
  });

  it('converte a data ISO da API (UTC) para o dia local', () => {
    expect(formatData('2026-11-17T20:31:13.282Z')).toBe('17/11/2026');
    // 02:00 UTC ainda é a noite anterior em Brasília.
    expect(formatData('2026-06-01T02:00:00.000Z')).toBe('31/05/2026');
    expect(formatData('2027-01-01T02:59:59.999Z')).toBe('31/12/2026');
  });

  it('aceita Date', () => {
    expect(formatData(new Date(2026, 5, 7))).toBe('07/06/2026');
  });

  it('mostra "—" sem valor ou com data inválida', () => {
    expect(formatData(null)).toBe('—');
    expect(formatData(undefined)).toBe('—');
    expect(formatData('ontem')).toBe('—');
    expect(formatData('2026-02-30')).toBe('—');
  });
});

describe('inicioDoDia e fimDoDia', () => {
  it('cobrem o dia local inteiro, para o filtro de vendas (lacuna 7)', () => {
    const dia = parseDataSemHora('2026-11-30') as Date;

    expect(inicioDoDia(dia).toISOString()).toBe('2026-11-30T03:00:00.000Z');
    expect(fimDoDia(dia).toISOString()).toBe('2026-12-01T02:59:59.999Z');
  });

  it('ignoram a hora da data recebida', () => {
    const tarde = new Date(2026, 10, 30, 15, 30);

    expect(inicioDoDia(tarde).getHours()).toBe(0);
    expect(fimDoDia(tarde).getMinutes()).toBe(59);
  });
});
