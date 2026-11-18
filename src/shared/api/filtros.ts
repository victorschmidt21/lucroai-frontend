import type { z } from 'zod';

// O backend não pagina nem busca por texto: as listas vêm inteiras e a busca roda
// no cliente (docs/api-integration.md#sem-paginação-busca-e-filtros-no-cliente).

/** Minúsculas e sem acentos, para comparar textos digitados ou do backend. */
export function normalizarTexto(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

export type CampoDeTexto<T> = {
  [K in keyof T]: T[K] extends string | null | undefined ? K : never;
}[keyof T];

/**
 * Mantém os itens cujo `campo` contém o `termo`, sem diferenciar acentos nem
 * maiúsculas ("acucar" encontra "Açúcar"). Termo vazio devolve a lista inteira.
 * O `campo` pode ser o nome de uma propriedade de texto ou uma função.
 */
export function filtrarPorTexto<T>(
  lista: readonly T[],
  campo: CampoDeTexto<T> | ((item: T) => string | null | undefined),
  termo: string | null | undefined,
): T[] {
  const busca = normalizarTexto(termo?.trim() ?? '');

  if (!busca) return [...lista];

  const lerCampo =
    typeof campo === 'function'
      ? campo
      : (item: T) => item[campo] as string | null | undefined;

  return lista.filter((item) =>
    normalizarTexto(lerCampo(item) ?? '').includes(busca),
  );
}

type SearchParamsLike =
  URLSearchParams | Record<string, string | string[] | undefined>;

/**
 * Lê os filtros da URL com um schema Zod. A URL é entrada do usuário: o schema
 * deve usar `.catch()` nos campos, para um valor inválido não derrubar a tela.
 * Aceita o `searchParams` de página (objeto) e o `useSearchParams()` do cliente.
 */
export function lerFiltros<S extends z.ZodType>(
  schema: S,
  searchParams: SearchParamsLike,
): z.output<S> {
  const entradas =
    searchParams instanceof URLSearchParams
      ? [...searchParams.keys()].map(
          (chave) => [chave, searchParams.get(chave)] as const,
        )
      : Object.entries(searchParams).map(
          ([chave, valor]) =>
            [chave, Array.isArray(valor) ? valor[0] : valor] as const,
        );

  return schema.parse(Object.fromEntries(entradas));
}

export type MudancasDeFiltro = Record<
  string,
  string | number | boolean | null | undefined
>;

/**
 * Aplica as mudanças sobre a query atual e devolve a nova, sem o `?`. Valor
 * vazio, `null`, `undefined` ou `false` remove o parâmetro (ex.: `novo`).
 */
export function atualizarFiltros(
  atual: URLSearchParams | string,
  mudancas: MudancasDeFiltro,
) {
  const params = new URLSearchParams(atual);

  for (const [chave, valor] of Object.entries(mudancas)) {
    if (
      valor === null ||
      valor === undefined ||
      valor === false ||
      valor === ''
    ) {
      params.delete(chave);
    } else {
      params.set(chave, valor === true ? '1' : String(valor));
    }
  }

  return params.toString();
}

/** Monta o `href` da tela com os filtros aplicados, para `router.replace`. */
export function hrefComFiltros(
  pathname: string,
  atual: URLSearchParams | string,
  mudancas: MudancasDeFiltro,
) {
  const query = atualizarFiltros(atual, mudancas);

  return query ? `${pathname}?${query}` : pathname;
}
