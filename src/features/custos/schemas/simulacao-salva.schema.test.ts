import { describe, expect, it } from 'vitest';
import {
  parseSimulacoesSalvas,
  type SimulacaoSalva,
} from './simulacao-salva.schema';

const SIMULACAO: SimulacaoSalva = {
  nome: 'Bolo',
  ingredientes: 30,
  energia: 5,
  agua: 2,
  gas: 3,
  horas: 2,
  valorHora: 15,
  rendimento: 20,
  custoTotal: 70,
  custoPorUnidade: 3.5,
};

describe('parseSimulacoesSalvas', () => {
  it('lê a lista guardada', () => {
    expect(parseSimulacoesSalvas(JSON.stringify([SIMULACAO]))).toEqual([
      SIMULACAO,
    ]);
  });

  it.each([
    ['nada guardado', null],
    ['JSON quebrado', '[{'],
    ['outro formato', JSON.stringify({ nome: 'Bolo' })],
    ['valor negativo', JSON.stringify([{ ...SIMULACAO, energia: -1 }])],
    ['rendimento 0', JSON.stringify([{ ...SIMULACAO, rendimento: 0 }])],
    ['sem nome', JSON.stringify([{ ...SIMULACAO, nome: '' }])],
  ])('%s vira lista vazia', (_caso, json) => {
    expect(parseSimulacoesSalvas(json)).toEqual([]);
  });
});
