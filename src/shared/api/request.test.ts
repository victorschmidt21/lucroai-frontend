import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import insumosFixture from '@/test/fixtures/catalog/insumos.json';
import { insumoSchema } from './contracts/catalog';
import { ContratoInvalidoError } from './errors';
import { unwrap, validarCaminho } from './request';

describe('unwrap', () => {
  it('desembrulha o envelope { data, links } e valida com o contrato', () => {
    const insumos = unwrap(insumosFixture, z.array(insumoSchema));

    expect(insumos).toHaveLength(3);
    expect(insumos[0]).toMatchObject({
      nome: 'Farinha de Trigo',
      unidade: 'KG',
    });
  });

  it('usa como está um corpo sem envelope', () => {
    const corpo = { access_token: 'abc' };

    expect(unwrap(corpo, z.object({ access_token: z.string() }))).toEqual(
      corpo,
    );
  });

  it('não confunde um recurso com campo `data` com o envelope', () => {
    const corpo = { data: '2026-06-01' };

    expect(unwrap(corpo, z.object({ data: z.string() }))).toEqual(corpo);
  });

  it('devolve undefined para o corpo vazio (DELETE com 204)', () => {
    expect(unwrap(undefined, z.undefined())).toBeUndefined();
  });

  it('rejeita o corpo vazio quando o contrato espera dados', () => {
    expect(() => unwrap(undefined, insumoSchema)).toThrow(
      ContratoInvalidoError,
    );
  });

  it('rejeita uma resposta fora do contrato com os problemas do Zod', () => {
    const corpo = {
      data: { ...insumosFixture.data[0], custoUnitario: '3' },
      links: {},
    };

    let erro: unknown;
    try {
      unwrap(corpo, insumoSchema);
    } catch (cause) {
      erro = cause;
    }

    expect(erro).toBeInstanceOf(ContratoInvalidoError);
    const contrato = erro as ContratoInvalidoError;
    expect(contrato.message).toBe('Resposta inesperada do servidor.');
    expect(contrato.issues[0]?.path).toEqual(['custoUnitario']);
    expect(contrato.detalhes).toContain('custoUnitario');
    expect(String(contrato)).toContain('custoUnitario');
  });
});

describe('validarCaminho', () => {
  it('aceita caminhos do contrato', () => {
    expect(() => validarCaminho('/receitas/1/custo/simular')).not.toThrow();
  });

  it.each(['insumos', '/insumos/internal/1', '/insumos/../internal', '/x/..'])(
    'recusa %s',
    (caminho) => {
      expect(() => validarCaminho(caminho)).toThrow(
        'Caminho de API não permitido',
      );
    },
  );
});
