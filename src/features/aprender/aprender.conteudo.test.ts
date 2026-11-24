// @vitest-environment node
import { existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { termoSchema, type Termo } from './aprender.schema';
import { TERMOS, buscarTermo, isTermoId, type TermoId } from './termos';

const PASTA_DAS_ROTAS = path.resolve(process.cwd(), 'src/app/(app)');

/** Palavras da marca que só podem aparecer nos sinônimos (docs/marca.md). */
const PALAVRAS_PROIBIDAS = ['rateio', 'markup', 'gastos indiretos', 'insumo'];

function normalizar(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

/** Textos que aparecem na tela como texto principal (os sinônimos ficam de fora). */
function textosPrincipais(termo: Termo) {
  return [
    termo.titulo,
    termo.curto,
    termo.explicacao,
    termo.porQueImporta,
    termo.acao?.rotulo ?? '',
  ];
}

function existeRota(href: string) {
  const caminho = href.split(/[?#]/)[0];
  return existsSync(path.join(PASTA_DAS_ROTAS, caminho, 'page.tsx'));
}

describe('base de termos', () => {
  it('tem os 24 termos e todos passam no schema', () => {
    expect(TERMOS).toHaveLength(24);
    for (const termo of TERMOS) {
      expect(termoSchema.safeParse(termo).success, termo.id).toBe(true);
    }
  });

  it('não repete id', () => {
    const ids = TERMOS.map((termo) => termo.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('relaciona só ids existentes e nunca o próprio termo', () => {
    for (const termo of TERMOS) {
      for (const relacionado of termo.relacionados) {
        expect(isTermoId(relacionado), `${termo.id} → ${relacionado}`).toBe(
          true,
        );
        expect(relacionado, termo.id).not.toBe(termo.id);
      }
    }
  });

  it('leva a ação para uma rota que existe em src/app/(app)', () => {
    for (const termo of TERMOS) {
      if (termo.acao) {
        expect(existeRota(termo.acao.href), termo.acao.href).toBe(true);
      }
    }
  });

  it('usa as palavras proibidas só nos sinônimos', () => {
    for (const termo of TERMOS) {
      for (const texto of textosPrincipais(termo)) {
        for (const palavra of PALAVRAS_PROIBIDAS) {
          expect(normalizar(texto), `${termo.id}: ${palavra}`).not.toContain(
            palavra,
          );
        }
      }
    }
  });

  it('não usa exclamação nos textos', () => {
    for (const termo of TERMOS) {
      for (const texto of textosPrincipais(termo)) {
        expect(texto, termo.id).not.toContain('!');
      }
    }
  });
});

describe('buscarTermo', () => {
  it('acha o termo pelo id e devolve undefined para id desconhecido', () => {
    expect(buscarTermo('margem').titulo).toBe('Margem');
    expect(buscarTermo('nao-existe')).toBeUndefined();
    expect(isTermoId('nao-existe')).toBe(false);
  });

  it('TermoId só aceita ids existentes', () => {
    const existente: TermoId = 'contas-do-mes';
    // @ts-expect-error id inexistente não é um TermoId
    const inexistente: TermoId = 'nao-existe';
    expect([existente, inexistente]).toHaveLength(2);
  });
});
