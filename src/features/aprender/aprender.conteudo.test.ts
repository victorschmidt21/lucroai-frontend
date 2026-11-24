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
    const invalidos = TERMOS.filter(
      (termo) => !termoSchema.safeParse(termo).success,
    ).map((termo) => termo.id);
    expect(invalidos).toEqual([]);
  });

  it('não repete id', () => {
    const ids = TERMOS.map((termo) => termo.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('relaciona só ids existentes e nunca o próprio termo', () => {
    const errados = TERMOS.flatMap((termo) =>
      termo.relacionados
        .filter((id) => !isTermoId(id) || id === termo.id)
        .map((id) => `${termo.id} → ${id}`),
    );
    expect(errados).toEqual([]);
  });

  it('leva a ação para uma rota que existe em src/app/(app)', () => {
    const semRota = TERMOS.flatMap((termo) =>
      termo.acao && !existeRota(termo.acao.href) ? [termo.acao.href] : [],
    );
    expect(TERMOS.filter((termo) => termo.acao)).not.toHaveLength(0);
    expect(semRota).toEqual([]);
  });

  it('usa as palavras proibidas só nos sinônimos', () => {
    const usos = TERMOS.flatMap((termo) =>
      textosPrincipais(termo).flatMap((texto) =>
        PALAVRAS_PROIBIDAS.filter((palavra) =>
          normalizar(texto).includes(palavra),
        ).map((palavra) => `${termo.id}: ${palavra}`),
      ),
    );
    expect(usos).toEqual([]);
  });

  it('acha as palavras proibidas mesmo com acento e maiúscula', () => {
    expect(normalizar('Cadastre o Insumo')).toContain('insumo');
    expect(normalizar('GASTOS INDIRETOS')).toContain('gastos indiretos');
  });

  it('não usa exclamação nos textos', () => {
    const comExclamacao = TERMOS.filter((termo) =>
      textosPrincipais(termo).some((texto) => texto.includes('!')),
    ).map((termo) => termo.id);
    expect(comExclamacao).toEqual([]);
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
