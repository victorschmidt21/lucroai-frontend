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

function luminance(color: Rgb) {
  const [r, g, b] = color
    .map((channel) => channel / 255)
    .map((channel) =>
      channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
    );

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string) {
  const [claro, escuro] = [luminance(rgb(a)), luminance(rgb(b))].toSorted(
    (x, y) => y - x,
  );

  return (claro + 0.05) / (escuro + 0.05);
}

const FUNDOS = ['bg', 'bg-alt', 'surface', 'surface-alt', 'surface-raised'];

// Pares da FE-51, medidos com a fórmula do WCAG (docs/ui.md#contraste).
const MEDIDOS: [string, string, number][] = [
  ['ink', 'bg', 13.43],
  ['ink-muted', 'surface-alt', 5.04],
  ['accent', 'surface', 6.48],
  ['accent', 'surface-alt', 5.71],
  ['on-accent', 'accent', 6.48],
  ['on-accent', 'accent-strong', 8.27],
  ['ink', 'accent-soft', 11.08],
  ['highlight-ink', 'surface', 5.3],
  ['success', 'success-soft', 5.13],
  ['warning', 'warning-soft', 5.03],
  ['danger', 'danger-soft', 4.75],
  ['on-danger', 'danger-strong', 7.44],
  ['border-field', 'surface', 3.57],
];

// Texto de qualquer tamanho: 4,5:1 (WCAG 1.4.3).
const TEXTO: [string, string][] = [
  ...['ink', 'ink-muted', 'ink-subtle', 'accent'].flatMap((frente) =>
    FUNDOS.map((fundo): [string, string] => [frente, fundo]),
  ),
  // Item ativo do menu, sobre o fundo e sobre o realce do item.
  ['accent-strong', 'bg'],
  ['accent-strong', 'surface-alt'],
  ['ink', 'accent-soft'],
  ['highlight-ink', 'surface'],
  ['success', 'surface'],
  ['warning', 'surface'],
  ['danger', 'surface'],
  ['danger', 'surface-alt'],
  ['on-accent', 'accent'],
  ['on-accent', 'accent-strong'],
  ['on-danger', 'danger'],
  ['on-danger', 'danger-strong'],
  // Badges de status (docs/ui.md#status): texto na cor cheia sobre o fundo suave.
  ['status-critico', 'danger-soft'],
  ['status-baixo', 'warning-soft'],
  ['status-pendente', 'warning-soft'],
  ['status-adequado', 'success-soft'],
  ['status-concluida', 'success-soft'],
  ['status-cancelada', 'surface-alt'],
];

// Foco, borda de campo, Checkbox, Slider e barras de progresso (WCAG 1.4.11).
const NAO_TEXTO: [string, string][] = [
  ...FUNDOS.map((fundo): [string, string] => ['accent', fundo]),
  ['border-field', 'surface'],
  ['border-field', 'surface-alt'],
  ['border-field', 'bg'],
  ['ink-subtle', 'surface'],
  ['success', 'surface-alt'],
  ['warning', 'surface-alt'],
  ['danger', 'surface-alt'],
];

describe('tokens', () => {
  it('usa a paleta Confeitaria da marca Doce Fatia', () => {
    expect(
      Object.fromEntries(
        [
          'bg',
          'surface',
          'surface-alt',
          'border',
          'border-field',
          'ink',
          'ink-muted',
          'accent',
          'accent-strong',
          'on-accent',
          'accent-soft',
          'highlight',
          'highlight-ink',
          'success',
          'warning',
          'danger',
        ].map((nome) => [nome, resolve(nome).toUpperCase()]),
      ),
    ).toEqual({
      bg: '#FFF8F3',
      surface: '#FFFFFF',
      'surface-alt': '#FBEEE7',
      border: '#EBD8CF',
      'border-field': '#9C8279',
      ink: '#3A2530',
      'ink-muted': '#7A5F69',
      accent: '#A3326E',
      'accent-strong': '#8A285C',
      'on-accent': '#FFFFFF',
      'accent-soft': '#FADCE9',
      highlight: '#F08A5D',
      'highlight-ink': '#B04E25',
      success: '#2A6F46',
      warning: '#8A5A00',
      danger: '#B8342A',
    });
  });

  it.each(MEDIDOS)('%s sobre %s mede %s:1', (frente, fundo, esperado) => {
    expect(contrast(resolve(frente), resolve(fundo))).toBeCloseTo(esperado, 1);
  });

  // Damasco é decorativo: como texto, reprova. Por isso existe `highlight-ink`.
  it('reprova o Damasco como texto', () => {
    expect(contrast(resolve('highlight'), resolve('surface'))).toBeLessThan(
      4.5,
    );
  });

  it.each(TEXTO)('%s sobre %s atinge 4,5:1', (frente, fundo) => {
    expect(contrast(resolve(frente), resolve(fundo))).toBeGreaterThanOrEqual(
      4.5,
    );
  });

  it.each(NAO_TEXTO)('%s sobre %s atinge 3:1', (frente, fundo) => {
    expect(contrast(resolve(frente), resolve(fundo))).toBeGreaterThanOrEqual(3);
  });
});
