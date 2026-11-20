import type {
  CreateInsumoBody,
  Insumo,
  UpdateInsumoBody,
} from '@/shared/api/contracts/catalog';
import { ApiError } from '@/shared/api/errors';

/*
 * API em memória do exemplo de /design-system/listagem. O catálogo não depende do
 * backend nem de sessão, como na Urbizzi; a forma das funções é a de
 * `features/<modulo>/api/` (FE-09), e os dados são do seed "Padaria Pão Feliz".
 */

const SEED: [string, number, Insumo['unidade'], number][] = [
  ['Farinha de Trigo', 5, 'KG', 15],
  ['Açúcar Cristal', 2, 'KG', 8.8],
  ['Manteiga sem Sal', 500, 'G', 12],
  ['Ovos', 12, 'UN', 9],
  ['Leite Integral', 1, 'L', 5],
  ['Fermento Biológico Seco', 500, 'G', 8.5],
  ['Cacau em Pó 100%', 200, 'G', 9],
  ['Sal', 1, 'KG', 2.5],
];

function montarInsumo(
  id: number,
  body: Omit<CreateInsumoBody, 'quantidadeDisponivelInicial'>,
  quantidadeDisponivel: number,
): Insumo {
  // Como o catalog-service: custo unitário sem arredondamento.
  const custoUnitario = body.valorPago / body.quantidadeBaseCusto;

  return {
    id,
    empresaId: 1,
    ...body,
    quantidadeDisponivel,
    quantidadeMinima: 0,
    custoUnitario,
    precoUnitario: custoUnitario,
    dataCriacao: '2026-11-17T10:00:00.000Z',
  };
}

export type CenarioExemplo = {
  /** A listagem responde 500. */
  falharAoCarregar: boolean;
  /** Criar, editar e excluir respondem 500. */
  falharAoSalvar: boolean;
  /** A listagem vem vazia. */
  listaVazia: boolean;
};

export function criarApiDeExemplo({ atrasoMs = 400 } = {}) {
  let insumos = SEED.map(([nome, quantidadeBaseCusto, unidade, valorPago], i) =>
    montarInsumo(i + 1, { nome, quantidadeBaseCusto, unidade, valorPago }, 0),
  );
  let proximoId = insumos.length + 1;
  const cenario: CenarioExemplo = {
    falharAoCarregar: false,
    falharAoSalvar: false,
    listaVazia: false,
  };

  function responder<T>(resposta: () => T, falhar: boolean) {
    return new Promise<T>((resolve, reject) => {
      setTimeout(() => {
        if (falhar) {
          // A mesma mensagem que o `apiFetch` dá a um 500 do NestJS.
          reject(new ApiError({ statusCode: 500 }));
        } else {
          try {
            resolve(resposta());
          } catch (erro) {
            reject(erro);
          }
        }
      }, atrasoMs);
    });
  }

  return {
    cenario: (): CenarioExemplo => ({ ...cenario }),
    definirCenario: (mudancas: Partial<CenarioExemplo>) => {
      Object.assign(cenario, mudancas);
    },
    listInsumos: () =>
      responder(
        () => (cenario.listaVazia ? [] : [...insumos]),
        cenario.falharAoCarregar,
      ),
    createInsumo: ({
      quantidadeDisponivelInicial = 0,
      ...body
    }: CreateInsumoBody) =>
      responder(() => {
        const insumo = montarInsumo(
          proximoId,
          body,
          quantidadeDisponivelInicial,
        );
        proximoId += 1;
        insumos = [...insumos, insumo];
        return insumo;
      }, cenario.falharAoSalvar),
    updateInsumo: ({ id, body }: { id: number; body: UpdateInsumoBody }) =>
      responder(() => {
        const atual = insumos.find((insumo) => insumo.id === id);

        if (!atual) {
          throw new ApiError({ statusCode: 404 });
        }

        const atualizado = montarInsumo(
          id,
          {
            nome: body.nome ?? atual.nome,
            quantidadeBaseCusto:
              body.quantidadeBaseCusto ?? atual.quantidadeBaseCusto,
            unidade: body.unidade ?? atual.unidade,
            valorPago: body.valorPago ?? atual.valorPago,
          },
          atual.quantidadeDisponivel,
        );
        insumos = insumos.map((insumo) =>
          insumo.id === id ? atualizado : insumo,
        );
        return atualizado;
      }, cenario.falharAoSalvar),
    deleteInsumo: (id: number) =>
      responder(() => {
        insumos = insumos.filter((insumo) => insumo.id !== id);
      }, cenario.falharAoSalvar),
  };
}

export type ApiDeExemplo = ReturnType<typeof criarApiDeExemplo>;
