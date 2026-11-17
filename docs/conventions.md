# Convenções

## Idioma

| O quê                                                                      | Idioma                                  | Exemplo                                                                                        |
| -------------------------------------------------------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Termos de domínio (funcionalidades, campos, ações de negócio)              | português, **sem acento e sem cedilha** | `Insumo`, `GastoIndireto`, `custoUnitario`, `useRegistrarEntrada`, `features/gastos-indiretos` |
| Termos técnicos (sufixos, verbos CRUD, infraestrutura)                     | inglês                                  | `InsumoForm`, `useCreateInsumo`, `listInsumos`, `queryKey`                                     |
| Textos de tela, mensagens de erro, comentários, documentação, commits, PRs | português, **com acentuação correta**   | `'Não foi possível carregar os insumos.'`                                                      |
| Nomes vindos da API (campos, enums, rotas)                                 | exatamente como no contrato             | `quantidadeBaseCusto`, `margem_lucro`, `metodo_rateio`, `CONCLUIDA`                            |

Todo texto exibido ao usuário fica em português do Brasil, com datas, moeda e números no formato brasileiro. O mobile escreve muitos textos sem acento ("Descricao", "Calculo Real", "Nao foi possivel"): na web, use o texto de [business-rules.md](business-rules.md), já corrigido. Nunca copie um texto do mobile sem conferir a acentuação.

### Nomes do contrato

O contrato do backend mistura convenções, e o front usa os nomes **como estão**, sem converter (ver a [tabela de rotas](api-integration.md#rotas-usadas-pela-web)):

- **Respostas** em `camelCase`: `custoUnitario`, `precoSugerido`, `quantidadeDisponivel`, `metodoRateio`. Exceções: `ReceitaCusto` e `PrecoVenda` vêm em `snake_case` (`custo_por_unidade`, `preco_sugerido`).
- **Corpos** de receitas, gastos, produções e vendas em `snake_case`: `margem_lucro`, `metodo_rateio`, `insumo_id`, `receita_id`, `gasto_indireto_ids`, `preco_unitario_real`.
- **Corpos** de insumos e de simulação em `camelCase`: `quantidadeBaseCusto`, `valorPago`, `quantidadeDisponivelInicial`, `novoCusto`, `quantidadeLotes`.

Por isso, o schema do formulário usa os nomes do formulário, e uma função `to<Acao><Entidade>Body(values)` monta o corpo com os nomes do contrato (ex.: `toCreateReceitaBody` transforma `margem` em `margem_lucro` e divide por 100).

## Arquivos e pastas

- Arquivos e pastas em `kebab-case`. O nome do arquivo corresponde ao símbolo principal exportado.
- Um componente principal por arquivo.
- A pasta da funcionalidade é o plural do agregado principal, igual ao módulo do backend quando houver: `insumos`, `gastos-indiretos`, `producoes` (ver [architecture.md](architecture.md#estrutura-de-uma-funcionalidade)).

| Tipo                           | Arquivo                                              | Símbolo                                                            |
| ------------------------------ | ---------------------------------------------------- | ------------------------------------------------------------------ |
| Componente                     | `features/insumos/components/insumo-form-dialog.tsx` | `InsumoFormDialog`                                                 |
| Hook de mutação                | `features/insumos/hooks/use-create-insumo.ts`        | `useCreateInsumo`                                                  |
| Chamadas à API                 | `features/insumos/api/insumos.api.ts`                | `listInsumos`, `createInsumo`                                      |
| Query keys e opções            | `features/insumos/api/insumos.queries.ts`            | `insumosKeys`, `insumosListOptions`                                |
| Schema de formulário           | `features/insumos/schemas/insumo-form.schema.ts`     | `insumoFormSchema`, `InsumoFormValues`, `toCreateInsumoBody`       |
| Schema de search params        | `features/insumos/schemas/insumos-search.schema.ts`  | `insumosSearchSchema`                                              |
| Cálculos da tela               | `features/painel/painel.calculos.ts`                 | `calcularFaturamento`, `calcularTendencia`                         |
| Regra de negócio compartilhada | `shared/domain/estoque.ts`                           | `isBaixoEstoque`, `statusEstoque`                                  |
| Contrato da API                | `shared/api/contracts/catalog.ts`                    | `insumoSchema`, `Insumo`, `CreateInsumoBody`                       |
| Código só de servidor          | sufixo `.server.ts`, com `import 'server-only'`      | `env.server.ts`, `client.server.ts`                                |
| Teste unitário e de componente | ao lado do arquivo: `insumo-form.schema.test.ts`     | —                                                                  |
| Teste e2e                      | `e2e/<funcionalidade>.spec.ts`                       | —                                                                  |
| Arquivos especiais do Next     | nome exigido pelo framework                          | `page.tsx`, `layout.tsx`, `error.tsx`, `not-found.tsx`, `route.ts` |

Não crie `index.ts` de reexportação. Eles escondem de onde vem cada símbolo e podem levar código de servidor para o bundle do navegador.

## Código TypeScript

- Componentes, tipos e interfaces: `PascalCase`, sem prefixo `I`.
- Variáveis, funções e propriedades: `camelCase`. Hooks começam com `use`.
- Constantes de módulo: `UPPER_SNAKE_CASE` (`UNIDADE_MEDIDA_ROTULOS`).
- Booleanos com prefixo de predicado: `isBaixoEstoque`, `isFaturavel`, `isPending`, `podeConcluir`.
- Imports internos entre pastas usam o alias `@/` (`@/shared/config/env.schema`), sem extensão. Dentro da mesma pasta, use caminho relativo (`./env.schema`). O backend usa `.js` nos imports por causa do ESM `nodenext`; aqui o Next.js resolve os módulos, então a regra dele não se aplica.
- Ordem dos imports: pacotes externos, depois código do projeto.
- `import type` para importações usadas só como tipo.
- Sem `any`. Use `unknown` e refine o tipo.
- Sem comentários óbvios. Comente o **porquê** de decisões não evidentes, e cite a origem de cada fórmula (`// Origem: dashboard_page.dart, _buildTrendLabel`).
- Datas chegam da API em ISO 8601 UTC; converta para exibição só na camada de interface. Datas sem hora (`YYYY-MM-DD`) não passam por `new Date()` sem tratamento, porque o fuso pode mudar o dia: use `parseDataSemHora`.

A formatação é responsabilidade do Prettier (`.prettierrc`: aspas simples, vírgula final). Não discuta estilo em PR: rode `npm run format`. O Prettier também formata os `.md`.

## Dinheiro e quantidades

Diferente da Urbizzi, que recebe dinheiro como string decimal, o LucroAI recebe e envia valores monetários, quantidades e margens como **`number`** (ponto flutuante). Por isso:

1. **Nunca exiba um `number` cru nem use `toFixed` para exibir.** Use os formatadores de `src/shared/format/` (existem desde a FE-05), que usam `Intl.NumberFormat('pt-BR')`: `formatMoeda` (`R$ 1.234,56`), `formatCustoUnitario` (`R$ 0,0240/g`, 4 casas), `formatPercentual` (`86,0%`), `formatQuantidade` (`1,5 kg`), `formatNumero`.
2. **Some em `number` e arredonde para centavos só na exibição.** Somas de ponto flutuante acumulam erro (`0.1 + 0.2 !== 0.3`); o formatador arredonda ao exibir. Nunca compare dinheiro com `===`: use a tolerância de R$ 0,01 (`Math.abs(a - b) < 0.005`) ou compare depois de `arredondarCentavos`.
3. **Prévias que precisam bater com o backend** repetem o arredondamento dele em cada etapa com `arredondarCentavos(valor)`, que é `Number(valor.toFixed(2))`, a mesma função do backend ([business-rules.md](business-rules.md#arredondamento)).
4. **Ao enviar**, arredonde o que o backend limita: `preco_unitario_real` aceita no máximo 2 casas (`arredondarCentavos`). Quantidades vendidas, rendimento, lotes e volume são inteiros.
5. **Margem e percentuais**: o usuário digita em % (`30`), o contrato usa fração (`0.3`). Converta na função `to...Body` e, ao editar, multiplique por 100. `formatPercentual` recebe pontos percentuais (`86`), não a fração.
6. **Ausência não é zero.** Campo omitido ou `null` (ex.: `precoSugerido` de receita sem margem) aparece como `—`, nunca `R$ 0,00`, e não entra em soma como se fosse zero, a menos que a regra diga isso ([business-rules.md](business-rules.md)).
7. **Entrada do usuário**: campos numéricos aceitam `1.234,56`, `1234,56` e `1234.56` (`parseNumeroBR`, FE-06) e mostram o valor no formato brasileiro.

Organização de `src/shared/format/`: `moeda.ts` (`formatMoeda`, `formatCustoUnitario`, `arredondarCentavos`), `numero.ts` (`formatNumero`, `formatQuantidade`, `formatPercentual`, `fracaoParaPercentual`), `data.ts` (`formatData`, `parseDataSemHora`, `toDataSemHora`, `inicioDoDia`, `fimDoDia`) e `texto.ts` (`SEM_VALOR`, o `—` de valor ausente), existentes desde a FE-05; previsto na FE-06, `numero-br.ts` (`parseNumeroBR`, `formatNumeroEditavel`, `numeroBR`, `numeroBROpcional`). Todos recebem `null`/`undefined` e devolvem `—`.

## Rotas de tela

- Segmentos de URL em português, `kebab-case`, sem acento e no plural: `/insumos`, `/gastos-indiretos`, `/producoes`. Exceções herdadas do menu do mobile: `/estoque`, `/custos`, `/simulacao` (ver a [tabela de rotas](architecture.md#rotas-e-grupos-de-rota)).
- Parâmetros dinâmicos em `camelCase`, com o sufixo `Id`: `/receitas/[receitaId]/editar`.
- Criação e edição em página própria: `/receitas/nova` e `/receitas/[receitaId]/editar`. Cadastros curtos (insumo, gasto) usam `FormDialog` na própria listagem, com `?novo=1` para abrir a criação.
- Search params em `camelCase`, com os mesmos nomes dos filtros da API quando ela filtra (`receitaId`, `dataInicio`, `dataFim`, `status`), e `q` para a busca textual (ver [api-integration.md](api-integration.md#sem-paginação-busca-e-filtros-no-cliente)).

## Commits (Conventional Commits)

Formato: `<tipo>(<escopo>): <descrição>`

- **tipo**: `feat` (funcionalidade), `fix` (correção), `refactor` (sem mudar comportamento), `test`, `docs`, `chore` (build, dependências, configuração), `ci`, `perf`.
- **escopo**: nome da funcionalidade (`insumos`, `vendas`) ou área técnica (`docker`, `shared`, `api`, `ui`, `config`). Opcional quando a mudança é geral.
- **descrição**: em português, no presente, com inicial minúscula, sem ponto final, até ~72 caracteres. Ex.: `feat(vendas): adiciona confirmação com validação de estoque`.
- Corpo (opcional): o porquê da mudança, quebrado em linhas de ~72 caracteres.
- Commits pequenos e coesos; cada commit deve compilar e passar nos testes.
- Commits feitos com agente de IA terminam com a linha `Co-Authored-By` do agente.

## Branches

- Todo código entra por Pull Request. A proteção da `main` ainda não está configurada (ver [testing.md](testing.md#integração-contínua)), então esta regra depende de cada integrante.
- Nome: `<tipo>/fe-<nn>-<descricao-curta>` em `kebab-case`, onde `<nn>` é o número da issue no padrão `FE-NN`. Ex.: `feat/fe-09-insumos`, `fix/fe-17-estoque-disponivel`, `docs/fe-02-arquitetura-padroes`.
- Sem issue (raro): `<tipo>/<descricao-curta>`.
- Uma branch por issue.
- **PRs empilhados.** Como as issues dependem umas das outras, a branch de uma issue nasce da branch da issue que a bloqueia, e o PR aponta para ela (ex.: a FE-02 nasce da `chore/fe-01-inicializacao-nextjs`). Quando o PR de baixo é mergeado, o GitHub reaponta o de cima para a `main`; atualize-o com `git rebase` antes de pedir revisão.

## Pull Requests

- Título: `[FE-NN] <título da issue>`.
- Corpo: o template de `.github/PULL_REQUEST_TEMPLATE.md` preenchido, com `Closes #<número>`.
- Revisão de pelo menos um integrante (dois para mudanças de arquitetura ou de `docs/`).
- O CI (FE-03) precisa estar verde antes do merge (ver [testing.md](testing.md#integração-contínua)).
