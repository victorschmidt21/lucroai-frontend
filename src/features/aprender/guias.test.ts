// @vitest-environment node
import { existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { GUIAS, LIMITES_GUIA, buscarGuia, guiaSchema } from './guias';
import { isTermoId } from './termos';

const PASTA_DAS_ROTAS = path.resolve(process.cwd(), 'src/app/(app)');

/** Palavras da marca que não aparecem no texto da tela (docs/marca.md). */
const PALAVRAS_PROIBIDAS = ['rateio', 'markup', 'gastos indiretos', 'insumo'];

function existeRota(href: string) {
  const caminho = href.split(/[?#]/)[0];
  return existsSync(path.join(PASTA_DAS_ROTAS, caminho, 'page.tsx'));
}

const PASSOS = GUIAS.flatMap((guia) =>
  guia.passos.map((passo) => ({ guia: guia.id, ...passo })),
);

describe('guias', () => {
  it('tem os 3 guias, todos válidos pelo schema', () => {
    expect(GUIAS.map((guia) => guia.titulo)).toEqual([
      'Como chegar no preço do seu bolo',
      'Como registrar uma fornada',
      'O que fazer quando um ingrediente fica mais caro',
    ]);
    const invalidos = GUIAS.filter(
      (guia) => !guiaSchema.safeParse(guia).success,
    ).map((guia) => guia.id);
    expect(invalidos).toEqual([]);
  });

  it('não repete id e acha cada guia pelo id', () => {
    const ids = GUIAS.map((guia) => guia.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(buscarGuia(id)?.id).toBe(id);
    expect(buscarGuia('nao-existe')).toBeUndefined();
  });

  it('tem de 3 a 5 passos, cada um com até 160 caracteres', () => {
    for (const guia of GUIAS) {
      expect(guia.passos.length).toBeGreaterThanOrEqual(3);
      expect(guia.passos.length).toBeLessThanOrEqual(LIMITES_GUIA.passos);
    }
    expect(
      PASSOS.filter((passo) => passo.texto.length > LIMITES_GUIA.texto),
    ).toEqual([]);
  });

  it('o schema recusa passo longo demais, guia com 6 passos e termo inexistente', () => {
    const passo = { texto: 'Faça.', link: { rotulo: 'Ir', href: '/' } };
    const guia = { id: 'teste', titulo: 'Teste', passos: [passo] };
    expect(guiaSchema.safeParse(guia).success).toBe(true);
    expect(
      guiaSchema.safeParse({
        ...guia,
        passos: [{ ...passo, texto: 'a'.repeat(161) }],
      }).success,
    ).toBe(false);
    expect(
      guiaSchema.safeParse({ ...guia, passos: Array(6).fill(passo) }).success,
    ).toBe(false);
    expect(
      guiaSchema.safeParse({
        ...guia,
        passos: [{ ...passo, termo: 'nao-existe' }],
      }).success,
    ).toBe(false);
  });

  it('leva cada passo para uma rota que existe em src/app/(app)', () => {
    const semRota = PASSOS.filter((passo) => !existeRota(passo.link.href)).map(
      (passo) => `${passo.guia}: ${passo.link.href}`,
    );
    expect(semRota).toEqual([]);
  });

  it('cita só termos que existem na base', () => {
    const errados = PASSOS.filter(
      (passo) => passo.termo !== undefined && !isTermoId(passo.termo),
    ).map((passo) => `${passo.guia}: ${passo.termo}`);
    expect(errados).toEqual([]);
  });

  it('segue as regras de escrita: sem palavras proibidas nem exclamação', () => {
    const textos = GUIAS.flatMap((guia) => [
      guia.titulo,
      ...guia.passos.flatMap((passo) => [passo.texto, passo.link.rotulo]),
    ]);
    const normalizar = (texto: string) =>
      texto
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase();
    const errados = textos.filter(
      (texto) =>
        texto.includes('!') ||
        PALAVRAS_PROIBIDAS.some((palavra) =>
          normalizar(texto).includes(palavra),
        ),
    );
    expect(errados).toEqual([]);
  });
});
