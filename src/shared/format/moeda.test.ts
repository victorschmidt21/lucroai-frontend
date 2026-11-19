import { describe, expect, it } from 'vitest';
import { arredondarCentavos, formatCustoUnitario, formatMoeda } from './moeda';

describe('formatMoeda', () => {
  it.each([
    [1234.56, 'R$ 1.234,56'],
    [0, 'R$ 0,00'],
    [0.5, 'R$ 0,50'],
    [1800, 'R$ 1.800,00'],
    [1234567.891, 'R$ 1.234.567,89'],
    [-12.3, '-R$ 12,30'],
    [0.005, 'R$ 0,01'],
  ])('%d → %s', (valor, esperado) => {
    expect(formatMoeda(valor)).toBe(esperado);
  });

  it('não mostra "-R$ 0,00" para valores que arredondam para zero', () => {
    expect(formatMoeda(-0.001)).toBe('R$ 0,00');
  });

  it('mostra "—" para valor ausente, nunca R$ 0,00', () => {
    expect(formatMoeda(null)).toBe('—');
    expect(formatMoeda(undefined)).toBe('—');
    expect(formatMoeda(Number.NaN)).toBe('—');
  });
});

describe('formatCustoUnitario', () => {
  it('usa 4 casas fixas e a unidade', () => {
    expect(formatCustoUnitario(0.024, 'G')).toBe('R$ 0,0240/g');
    expect(formatCustoUnitario(3, 'KG')).toBe('R$ 3,0000/kg');
    expect(formatCustoUnitario(0.75, 'UN')).toBe('R$ 0,7500/un');
    expect(formatCustoUnitario(5, 'L')).toBe('R$ 5,0000/L');
    expect(formatCustoUnitario(0.0275, 'ML')).toBe('R$ 0,0275/ml');
  });

  it('arredonda na quarta casa', () => {
    expect(formatCustoUnitario(8.5 / 500, 'G')).toBe('R$ 0,0170/g');
    expect(formatCustoUnitario(8.8 / 2, 'KG')).toBe('R$ 4,4000/kg');
    expect(formatCustoUnitario(1 / 3, 'UN')).toBe('R$ 0,3333/un');
  });

  it('mostra "—" sem valor', () => {
    expect(formatCustoUnitario(null, 'G')).toBe('—');
    expect(formatCustoUnitario(undefined, 'G')).toBe('—');
  });

  it('não mostra zero negativo', () => {
    expect(formatCustoUnitario(-0.00001, 'G')).toBe('R$ 0,0000/g');
  });
});

describe('arredondarCentavos', () => {
  it('repete o Number(valor.toFixed(2)) do backend', () => {
    expect(arredondarCentavos(72.11200000000001)).toBe(72.11);
    expect(arredondarCentavos(0.1 + 0.2)).toBe(0.3);
    expect(arredondarCentavos(2253.3149)).toBe(2253.31);
  });
});
