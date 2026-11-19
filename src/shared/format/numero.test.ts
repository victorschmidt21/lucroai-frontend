import { describe, expect, it } from 'vitest';
import {
  formatMargem,
  formatNumero,
  formatPercentual,
  formatQuantidade,
  fracaoParaPercentual,
} from './numero';

describe('formatNumero', () => {
  it('usa separador de milhar e casas fixas', () => {
    expect(formatNumero(1200)).toBe('1.200');
    expect(formatNumero(1234567)).toBe('1.234.567');
    expect(formatNumero(2.5, 2)).toBe('2,50');
    expect(formatNumero(-3)).toBe('-3');
  });

  it('mostra "—" sem valor', () => {
    expect(formatNumero(null)).toBe('—');
  });
});

describe('formatQuantidade', () => {
  it('usa até 3 casas, sem zeros à direita, com a unidade', () => {
    expect(formatQuantidade(1.5, 'KG')).toBe('1,5 kg');
    expect(formatQuantidade(0.25, 'KG')).toBe('0,25 kg');
    expect(formatQuantidade(12, 'UN')).toBe('12 un');
    expect(formatQuantidade(1000, 'G')).toBe('1.000 g');
    expect(formatQuantidade(0.1234, 'L')).toBe('0,123 L');
  });

  it('funciona sem unidade e com saldo negativo', () => {
    expect(formatQuantidade(-0.04)).toBe('-0,04');
    expect(formatQuantidade(2)).toBe('2');
  });

  it('não mostra zero negativo', () => {
    expect(formatQuantidade(-0.0001, 'KG')).toBe('0 kg');
  });

  it('mostra "—" sem valor', () => {
    expect(formatQuantidade(undefined, 'KG')).toBe('—');
  });
});

describe('formatPercentual', () => {
  it('recebe pontos percentuais e usa 1 casa', () => {
    expect(formatPercentual(86)).toBe('86,0%');
    expect(formatPercentual(27.5)).toBe('27,5%');
    expect(formatPercentual(-89.14)).toBe('-89,1%');
    expect(formatPercentual(0)).toBe('0,0%');
  });

  it('mostra "—" sem valor', () => {
    expect(formatPercentual(null)).toBe('—');
  });
});

describe('fracaoParaPercentual', () => {
  it('converte a margem do contrato em pontos percentuais', () => {
    expect(fracaoParaPercentual(0.6)).toBe(60);
    expect(fracaoParaPercentual(0.07)).toBe(7);
    expect(formatPercentual(fracaoParaPercentual(0.86))).toBe('86,0%');
  });
});

describe('formatMargem', () => {
  it('mostra a fração do contrato em percentual', () => {
    expect(formatMargem(0.6)).toBe('60,0%');
    expect(formatMargem(0.075)).toBe('7,5%');
    expect(formatMargem(0)).toBe('0,0%');
  });

  it('mostra "—" sem valor', () => {
    expect(formatMargem(undefined)).toBe('—');
    expect(formatMargem(null)).toBe('—');
  });
});
