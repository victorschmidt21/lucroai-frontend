// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { expect, it } from 'vitest';

// Critério da FE-04: nenhuma cor fixa fora de `src/app/globals.css`.
const SRC = join(process.cwd(), 'src');

function arquivos(pasta: string): string[] {
  return readdirSync(pasta, { withFileTypes: true }).flatMap((entrada) => {
    const caminho = join(pasta, entrada.name);

    if (entrada.isDirectory()) return arquivos(caminho);

    return /\.(ts|tsx|css)$/.test(entrada.name) &&
      !/\.test\.tsx?$/.test(entrada.name) &&
      !caminho.endsWith('globals.css')
      ? [caminho]
      : [];
  });
}

// Hex, funções de cor e a paleta pronta do Tailwind (`bg-orange-500`, `text-white`).
const COR_FIXA = [
  /#[0-9a-f]{3,8}\b/i,
  /\b(?:rgba?|hsla?|oklch|oklab)\(/i,
  /\b(?:bg|text|border|ring|outline|fill|stroke|from|to|via|accent|caret|decoration|shadow)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/,
  /\b(?:bg|text|border|ring|fill|stroke)-(?:white|black)\b/,
  /\b(?:bg|text|border|fill|stroke)-\[(?:#|rgb|hsl)/,
];

it('não há cor fixa no código, só tokens de globals.css', () => {
  const ocorrencias = arquivos(SRC).flatMap((arquivo) =>
    readFileSync(arquivo, 'utf8')
      .split('\n')
      .flatMap((linha, indice) =>
        COR_FIXA.some((padrao) => padrao.test(linha))
          ? [`${relative(SRC, arquivo)}:${indice + 1}: ${linha.trim()}`]
          : [],
      ),
  );

  expect(ocorrencias).toEqual([]);
});
