// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(join(process.cwd(), 'src/app/globals.css'), 'utf8');
const rootBlock = /:root \{([\s\S]*?)\n\}/.exec(css)?.[1] ?? '';
const tokens = new Map(
  [...rootBlock.matchAll(/--([\w-]+):\s*([^;]+);/g)].map((match) => [
    match[1],
    match[2].trim(),
  ]),
);

function resolve(name: string): string {
  const value = tokens.get(name);

  if (!value) {
    throw new Error(`Token inexistente: ${name}`);
  }

  const reference = /^var\(--([\w-]+)\)$/.exec(value);

  return reference ? resolve(reference[1]) : value;
}

type Rgb = [number, number, number];

function rgb(hex: string): Rgb {
  return [1, 3, 5].map((start) =>
    Number.parseInt(hex.slice(start, start + 2), 16),
  ) as Rgb;
}

/** Cor com transparência sobre um fundo, como `bg-success/12` sobre `surface`. */
function blend(frente: string, alpha: number, fundo: string): Rgb {
  const a = rgb(frente);
  const b = rgb(fundo);

  return [0, 1, 2].map((i) => a[i] * alpha + b[i] * (1 - alpha)) as Rgb;
}

function luminance(color: Rgb) {
  const [r, g, b] = color
    .map((channel) => channel / 255)
    .map((channel) =>
      channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
    );

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string | Rgb, b: string | Rgb) {
  const [claro, escuro] = [
    luminance(typeof a === 'string' ? rgb(a) : a),
    luminance(typeof b === 'string' ? rgb(b) : b),
  ].toSorted((x, y) => y - x);

  return (claro + 0.05) / (escuro + 0.05);
}

const FUNDOS = ['bg', 'bg-alt', 'surface', 'surface-alt', 'surface-raised'];

// Texto de qualquer tamanho: 4,5:1 (WCAG 1.4.3).
const TEXTO: [string, string][] = [
  ...['ink', 'ink-muted', 'ink-subtle', 'accent'].flatMap((frente) =>
    FUNDOS.map((fundo): [string, string] => [frente, fundo]),
  ),
  // Item ativo do menu e ToggleChip selecionado usam `accent-strong` como texto.
  ['accent-strong', 'bg'],
  ['accent-strong', 'bg-alt'],
  ['success', 'surface'],
  ['warning', 'surface'],
  ['danger', 'surface'],
  ['danger', 'surface-raised'],
  ['on-accent', 'accent'],
  ['on-accent', 'accent-strong'],
  ['on-danger', 'danger-strong'],
];

// Foco, trilho do Slider, borda do Checkbox e barras de progresso (WCAG 1.4.11).
const NAO_TEXTO: [string, string][] = [
  ...FUNDOS.map((fundo): [string, string] => ['accent', fundo]),
  ['ink-subtle', 'surface'],
  ['ink-muted', 'surface-alt'],
  ['success', 'surface-alt'],
  ['warning', 'surface-alt'],
  ['danger', 'surface-alt'],
];

const STATUS = [
  'critico',
  'baixo',
  'adequado',
  'pendente',
  'concluida',
  'cancelada',
];

describe('tokens', () => {
  it('mantém as cores do app Flutter', () => {
    expect(
      Object.fromEntries(
        [
          'bg',
          'bg-alt',
          'surface',
          'surface-alt',
          'surface-raised',
          'border',
          'border-strong',
          'ink',
          'ink-muted',
          'accent',
          'accent-strong',
          'success',
          'warning',
          'danger',
          'danger-strong',
        ].map((nome) => [nome, resolve(nome).toUpperCase()]),
      ),
    ).toEqual({
      bg: '#050505',
      'bg-alt': '#0A0A0A',
      surface: '#111111',
      'surface-alt': '#171717',
      'surface-raised': '#1A1A1A',
      border: '#272727',
      'border-strong': '#2B2B2B',
      ink: '#FFFFFF',
      'ink-muted': '#8A8A8A',
      accent: '#FF6B3D',
      'accent-strong': '#E85D33',
      success: '#4CAF50',
      warning: '#FFB000',
      danger: '#FF5252',
      'danger-strong': '#E53935',
    });
  });

  it('calcula o contraste como as medições de docs/ui.md', () => {
    expect(contrast('#8A8A8A', '#111111')).toBeCloseTo(5.47, 1);
    expect(contrast('#FF6B3D', '#050505')).toBeCloseTo(7.2, 1);
    expect(contrast('#000000', '#E85D33')).toBeCloseTo(6.04, 1);
  });

  // Por que `ink-subtle` mudou e `on-accent` é preto: se estes passarem a falhar, revise a decisão.
  it('reprova as cores originais do mobile que motivaram as decisões', () => {
    expect(contrast('#7C7C7C', '#1A1A1A')).toBeLessThan(4.5);
    expect(contrast('#FFFFFF', '#E85D33')).toBeLessThan(4.5);
    expect(contrast('#FFFFFF', '#FF6B3D')).toBeLessThan(4.5);
    expect(contrast('#FFFFFF', '#E53935')).toBeLessThan(4.5);
    expect(contrast('#E85D33', blend('#E85D33', 0.2, '#1A1A1A'))).toBeLessThan(
      4.5,
    );
  });

  it('usa texto preto sobre o laranja e sobre o vermelho do botão', () => {
    expect(resolve('on-accent')).toBe('#000000');
    expect(resolve('on-danger')).toBe('#000000');
  });

  it.each(TEXTO)('%s sobre %s atinge 4,5:1', (frente, fundo) => {
    expect(contrast(resolve(frente), resolve(fundo))).toBeGreaterThanOrEqual(
      4.5,
    );
  });

  it.each(NAO_TEXTO)('%s sobre %s atinge 3:1', (frente, fundo) => {
    expect(contrast(resolve(frente), resolve(fundo))).toBeGreaterThanOrEqual(3);
  });

  // O Badge pinta o fundo com 8% da cor do status (`bg-status-x/8`). O venda_card.dart usa
  // 12%, que deixa "Cancelada" em 4,30:1 sobre `surface-raised`.
  describe.each(STATUS)('status %s', (status) => {
    it.each(FUNDOS)('o texto do Badge atinge 4,5:1 sobre %s', (fundo) => {
      const cor = resolve(`status-${status}`);

      expect(
        contrast(cor, blend(cor, 0.08, resolve(fundo))),
      ).toBeGreaterThanOrEqual(4.5);
    });
  });

  // O FilterChip do mobile usa texto `accent-strong` sobre 20% dele (3,89:1); a web usa `accent`.
  it.each(FUNDOS)('o ToggleChip selecionado atinge 4,5:1 sobre %s', (fundo) => {
    const fundoChip = blend(resolve('accent-strong'), 0.2, resolve(fundo));

    expect(contrast(resolve('accent'), fundoChip)).toBeGreaterThanOrEqual(4.5);
  });
});
