# Regras de negócio

Fonte única das regras, fórmulas, validações e textos das telas do LucroAI, extraídos do app Flutter ([`lucroai_mobile`](https://github.com/GrupoDoisENG/lucroai_mobile)) e conferidos no código do [backend](https://github.com/GrupoDoisENG/lucroai-backend). As issues FE-09 a FE-22 citam este arquivo; ao implementar uma tela, siga a seção dela.

> **Status:** documento de referência. Os formatadores, os enums com rótulos, `filtrarPorTexto`, `getErrorMessage` e `isEstoqueInsuficiente` existem desde a **FE-05**; as demais funções citadas são entregues pela issue indicada na seção. Os caminhos de origem são relativos à raiz de cada repositório: `lib/...` é do `lucroai_mobile`, `services/...` e `shared/...` são do `lucroai-backend`.

Como ler:

- **Quem decide é o backend.** Quando o backend calcula e grava um valor (custo da receita, preço sugerido, rateio, total da venda, margem realizada), a tela mostra o valor devolvido. O cálculo no cliente serve só para **prévia** enquanto o usuário digita, e precisa repetir as fórmulas e os arredondamentos do backend descritos aqui.
- **Quando o backend não tem o dado**, o cliente calcula (painel, estoque, simulação interativa, cálculo real). Essas fórmulas viram **funções puras** testadas à parte (ver [architecture.md](architecture.md#regras-de-negócio-no-cliente)).
- **Textos.** A coluna "Web" é o texto a usar. O mobile escreve muitos textos sem acento ("Descricao", "Calculo Real"); a web corrige a acentuação, e só ela. Mudanças de sentido estão em [Diferenças intencionais](#diferenças-intencionais-em-relação-ao-mobile).
- Fórmulas usam a notação do código: `Σ` é soma, `round2(x)` é o arredondamento do backend descrito em [Arredondamento](#arredondamento).

## Sumário

| Seção                                                                      | Issue        |
| -------------------------------------------------------------------------- | ------------ |
| [Convenções de número, moeda e data](#convenções-de-número-moeda-e-data)   | FE-05, FE-06 |
| [Enumerações e rótulos](#enumerações-e-rótulos)                            | FE-05        |
| [Insumos](#insumos)                                                        | FE-09        |
| [Gastos indiretos](#gastos-indiretos)                                      | FE-10        |
| [Receitas: listagem](#receitas-listagem)                                   | FE-11        |
| [Receitas: formulário e custo](#receitas-formulário-e-custo)               | FE-12        |
| [Estoque de insumos](#estoque-de-insumos)                                  | FE-13        |
| [Entrada de estoque e histórico](#entrada-de-estoque-e-histórico)          | FE-14        |
| [Produções e rateio](#produções-e-rateio)                                  | FE-15        |
| [Vendas: carrinho](#vendas-carrinho)                                       | FE-16        |
| [Vendas: confirmação e ciclo de vida](#vendas-confirmação-e-ciclo-de-vida) | FE-17        |
| [Vendas: histórico e resumo](#vendas-histórico-e-resumo)                   | FE-18        |
| [Custos: cálculo real](#custos-cálculo-real)                               | FE-19        |
| [Simulação de cenário da receita](#simulação-de-cenário-da-receita)        | FE-20        |
| [Simulação interativa](#simulação-interativa)                              | FE-21        |
| [Painel](#painel)                                                          | FE-22        |
| [Login e mensagens de erro gerais](#login-e-mensagens-de-erro-gerais)      | FE-05, FE-07 |

## Convenções de número, moeda e data

### Leitura de números digitados

O mobile aceita vírgula ou ponto como separador decimal:

- `_parseDouble` (`lib/features/insumos/presentation/pages/insumos_page.dart`, `lib/features/receitas/presentation/pages/receitas_page.dart`): `trim()`, troca `,` por `.` e usa `double.tryParse`. Vazio ou inválido vira `null`, e a validação do campo falha.
- `_parseBR` (`lib/features/insumos/presentation/pages/calculo_real_screen.dart`): vazio vira `0`; inválido vira `-1`, para falhar na validação "≥ 0".
- `vendas_page.dart` (`_parseDouble`): vazio ou inválido vira `0`, que falha na validação "> 0".

Na web, `parseNumeroBR(texto)` (`src/shared/format/numero-br.ts`, desde a FE-06) segue a mesma ideia e aceita também separador de milhar:

| Entrada        | Resultado | Regra                                                     |
| -------------- | --------- | --------------------------------------------------------- |
| `1.234,56`     | `1234.56` | com vírgula, os pontos são milhar e a vírgula é o decimal |
| `1234,56`      | `1234.56` |                                                           |
| `1234.56`      | `1234.56` | sem vírgula, o ponto é decimal (compatível com o mobile)  |
| `0,5`          | `0.5`     |                                                           |
| vazio          | `null`    | o schema decide se é obrigatório ou se conta como 0       |
| `abc`, `1,2,3` | `null`    | inválido: o schema mostra a mensagem do campo             |

Campos inteiros (rendimento, lotes, quantidade vendida, volume) só aceitam dígitos (`parseInteiroBR`: `1,5`, `1.200` e `-3` viram `null`). Os schemas usam `numeroBR()`, `numeroBROpcional()` (vazio não é enviado) e `inteiroBR()`; vazio ou inválido mostra a mensagem do campo.

### Arredondamento

O backend arredonda dinheiro com `Number(valor.toFixed(2))` em cada etapa (ex.: `arredondarValorMonetario` em `services/recipe-service/src/modules/custos/application/services/custo.service.ts`). A web usa `arredondarCentavos(valor)`, com a mesma implementação, sempre que uma prévia precisar bater com o valor que o backend vai gravar. Em todos os outros casos, some em `number` e arredonde só ao exibir.

| Valor do backend                                             | Arredondamento                                  | Origem                                                                                       |
| ------------------------------------------------------------ | ----------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `custoUnitario` do insumo                                    | **nenhum** (`valorPago / quantidade`)           | `services/catalog-service/src/modules/insumos/domain/models/insumo.entity.ts`                |
| `custoCalculado` do item da receita                          | 2 casas                                         | `custo.service.ts` (`calcularItens`)                                                         |
| `custoProducao`, `custoUnitario`, `precoSugerido` da receita | 2 casas, em cada etapa                          | `custo.service.ts` (`calcularReceita`)                                                       |
| `valorRateado`, `custoTotal`, `custoUnitario` da produção    | 2 casas                                         | `services/operations-service/src/modules/producoes/application/services/producao.service.ts` |
| `total` da venda                                             | 2 casas                                         | `services/sales-service/src/modules/vendas/application/services/venda.service.ts`            |
| `margemRealizada` do item da venda                           | 4 casas (fração)                                | `venda.service.ts`                                                                           |
| resultado de `POST /receitas/:id/simular`                    | 2 casas; `margemProjetada` é fração com 2 casas | `services/recipe-service/src/modules/custos/application/services/simulacao.service.ts`       |
| resultado de `POST /receitas/:id/preco-venda`                | **nenhum**                                      | `services/recipe-service/src/modules/receitas/application/services/receita.service.ts`       |

### Formatação

Todos os formatadores usam `Intl.NumberFormat('pt-BR')` e ficam em `src/shared/format/` (existem desde a FE-05). Nunca use `toFixed` para exibir.

| Uso                                  | Formato                                                             | Exemplo             | Observação                                                                             |
| ------------------------------------ | ------------------------------------------------------------------- | ------------------- | -------------------------------------------------------------------------------------- |
| Dinheiro                             | `formatMoeda`, 2 casas                                              | `R$ 1.234,56`       | negativo com sinal: `-R$ 12,30`                                                        |
| Custo unitário do insumo             | `formatCustoUnitario`, 4 casas fixas, com a unidade                 | `R$ 0,0240/g`       | o mobile corta zeros à direita (`R$ 0,024/g`); a web segue a FE-05                     |
| Custo unitário de receita e produção | `formatMoeda`, 2 casas, com `/un` quando indicado                   | `R$ 0,81/un`        |                                                                                        |
| Percentual                           | `formatPercentual`, 1 casa                                          | `86,0%`             | recebe o valor **já em pontos percentuais** (`86`), não a fração                       |
| Quantidade de insumo e de estoque    | `formatQuantidade`, até 3 casas, sem zeros à direita, com a unidade | `1,5 kg`, `0,25 kg` |                                                                                        |
| Quantidade inteira                   | `formatNumero`                                                      | `1.200`             |                                                                                        |
| Data                                 | `formatData`                                                        | `17/11/2026`        | datas ISO da API são UTC: converta para o fuso local só ao exibir                      |
| Data de filtro (`YYYY-MM-DD`)        | `parseDataSemHora`                                                  | —                   | nunca `new Date('2026-11-01')`, que é meia-noite UTC e mostra o dia anterior no Brasil |

Valor ausente (`null` ou campo omitido) aparece como `—`, nunca como `R$ 0,00`.

Os formatadores trocam o espaço inquebrável que o `Intl` põe depois de "R$" por espaço comum, para o texto bater com esta tabela; um valor que arredonda para zero não aparece como `-R$ 0,00`. Para margens, `fracaoParaPercentual(0.6)` dá `60`, que vai ao `formatPercentual`. Para o filtro de vendas, `toDataSemHora`, `inicioDoDia` e `fimDoDia` (`data.ts`) convertem entre a URL e o ISO enviado à API.

### Margem em percentual

A margem de lucro é digitada em percentual e trafega como fração: `60` → `0.6`. Ao exibir, multiplique por 100 (`0.6` → `60,0%`). Origem: `receitas_page.dart` (`margemRaw / 100` ao salvar; `margemLucro * 100` ao editar).

## Enumerações e rótulos

Valores do contrato (`shared/src/domain/enums/` no backend) e os rótulos de tela. Ficam em `src/shared/api/contracts/enums.ts` (FE-05), como `UNIDADE_MEDIDA_ROTULOS`, `METODO_RATEIO_ROTULOS`, `METODO_RATEIO_DESCRICOES`, `STATUS_VENDA_ROTULOS`, `TIPO_MOVIMENTACAO_ROTULOS` e `ORIGEM_MOVIMENTACAO_ROTULOS`. Nunca mostre o valor cru do enum.

### `UnidadeMedida`

| Valor | Rótulo | Origem do rótulo                                                           |
| ----- | ------ | -------------------------------------------------------------------------- |
| `G`   | `g`    | `lib/features/insumos/domain/entities/insumo.dart` (`InsumoUnidadeMedida`) |
| `KG`  | `kg`   |                                                                            |
| `ML`  | `ml`   |                                                                            |
| `L`   | `L`    | o mobile usa `l`; a web usa `L`, como pede a FE-05                         |
| `UN`  | `un`   |                                                                            |

### `MetodoRateio`

| Valor          | Rótulo (Badge e Select)           | Descrição (texto de apoio no Select)                                 | Fórmula do rateio              |
| -------------- | --------------------------------- | -------------------------------------------------------------------- | ------------------------------ |
| `PROPORCIONAL` | Proporcional à qtd. de lotes      | Gastos que crescem com o volume, como energia e gás.                 | `valor × lotes`                |
| `POR_UNIDADE`  | Proporcional ao total de unidades | Gastos por peça, como embalagem individual.                          | `valor × (lotes × rendimento)` |
| `FIXO`         | Valor fixo por produção           | Valor integral, independente do volume, como aluguel e mensalidades. | `valor`                        |

Rótulos: `lib/features/gastos_indiretos/domain/entities/gasto_indireto.dart` (`MetodoRateio.label`). Descrições e fórmulas: `services/catalog-service/src/modules/gastos-indiretos/OVERVIEW.md` e `producao.service.ts` (`calcularValorRateado`).

### `StatusVenda`

| Valor       | Rótulo    | Token (FE-04) | Entra no faturamento |
| ----------- | --------- | ------------- | -------------------- |
| `PENDENTE`  | Pendente  | `warning`     | não                  |
| `CONCLUIDA` | Concluída | `success`     | **sim**              |
| `CANCELADA` | Cancelada | `ink-muted`   | não                  |

Origem: `lib/features/vendas/presentation/widgets/venda_card.dart` (`_statusLabel`) e `lib/features/vendas/domain/entities/venda.dart` (`isFaturavel`: "Apenas vendas concluídas entram no faturamento").

### Movimentação de estoque

| Campo    | Valor      | Rótulo   |
| -------- | ---------- | -------- |
| `tipo`   | `ENTRADA`  | Entrada  |
| `tipo`   | `SAIDA`    | Saída    |
| `origem` | `COMPRA`   | Compra   |
| `origem` | `PRODUCAO` | Produção |

Origem: `lib/features/estoques/domain/entities/movimentacao_estoque.dart` (`tipoLabel`, `origemLabel`).

## Insumos

FE-09. Origem: `lib/features/insumos/presentation/pages/insumos_page.dart`, `lib/features/insumos/presentation/widgets/insumo_card.dart`, `lib/features/insumos/domain/services/insumo_custo_calculator.dart`. Backend: `services/catalog-service/src/modules/insumos/`.

### Custo unitário

```text
custoUnitario = quantidade > 0 ? valorPago / quantidade : 0
```

`InsumoCustoCalculator.calcularCustoUnitario` no mobile e `Insumo.calcularCustoUnitario` no backend, sem arredondamento. A prévia "Custo unitário: R$ X/un" do formulário usa essa fórmula com os valores digitados; a lista mostra o `custoUnitario` devolvido pelo backend (a resposta traz também `precoUnitario`, um alias com o mesmo valor: use `custoUnitario`).

Exemplo do seed: farinha, 5 kg por R$ 15,00 → `R$ 3,0000/kg`; manteiga, 500 g por R$ 12,00 → `R$ 0,0240/g`.

### Validações do formulário

| Campo (contrato)              | Regra                                                 | Mensagem                                       | Origem                                                                                                             |
| ----------------------------- | ----------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `nome`                        | obrigatório, até 80 caracteres                        | "Informe o nome" / "Use até 80 caracteres"     | mobile; o limite vem da coluna do banco (o DTO não o valida, ver [lacunas](api-integration.md#lacunas-do-backend)) |
| `quantidadeBaseCusto`         | número > 0                                            | "Informe uma quantidade maior que zero"        | mobile; backend `@Min(0.000001)`                                                                                   |
| `unidade`                     | `G`, `KG`, `ML`, `L` ou `UN`                          | —                                              | Select com valor padrão `G` (g), como o mobile (`InsumoUnidadeMedida.gramas`)                                      |
| `valorPago`                   | número > 0                                            | "Informe um valor maior que zero"              | mobile; o backend aceita 0                                                                                         |
| `quantidadeDisponivelInicial` | número ≥ 0, só na criação, padrão vazio = não enviado | "Informe uma quantidade maior ou igual a zero" | FE-09; backend `@Min(0)`, opcional                                                                                 |

### Textos

| Onde                    | Mobile                                                                                         | Web                                                                                            |
| ----------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Título e subtítulo      | "Insumos" / "Gerencie quantidade, valor pago e custo unitario"                                 | "Insumos" / "Gerencie quantidade, valor pago e custo unitário"                                 |
| Ação primária           | —                                                                                              | "Novo insumo"                                                                                  |
| Busca                   | "Buscar insumo..."                                                                             | "Buscar insumo"                                                                                |
| Linha da lista          | `<quantidade> <unidade> - R$ <valorPago>` e `R$ <custo>/<unidade>`                             | igual, com os formatadores                                                                     |
| Título do formulário    | "Novo insumo" / "Editar insumo"                                                                | igual                                                                                          |
| Prévia                  | "Custo unitario: R$ X/un"                                                                      | "Custo unitário: R$ X/un" (com a unidade escolhida)                                            |
| Botões                  | "Cancelar", "Salvar" / "Atualizar"                                                             | igual                                                                                          |
| Confirmação de exclusão | "Excluir insumo" / `Deseja excluir "<nome>"?`                                                  | igual; botão "Excluir"                                                                         |
| Toasts                  | "Insumo criado com sucesso.", "Insumo atualizado com sucesso.", "Insumo excluido com sucesso." | "Insumo criado com sucesso.", "Insumo atualizado com sucesso.", "Insumo excluído com sucesso." |
| Vazio                   | "Nenhum insumo encontrado."                                                                    | igual                                                                                          |
| Erro                    | "Nao foi possivel carregar os insumos."                                                        | "Não foi possível carregar os insumos."                                                        |

### Ordem e busca

A lista vem do backend sem ordem garantida; a web ordena por nome (`localeCompare` com `'pt-BR'`).

A busca é por nome, no cliente, com debounce (350 ms no mobile, `insumos_cubit.dart`). O mobile só ignora maiúsculas; a web ignora também acentos ("acucar" encontra "Açúcar"), com `filtrarPorTexto` (FE-05).

## Gastos indiretos

FE-10. Origem: `lib/features/gastos_indiretos/presentation/pages/gastos_indiretos_page.dart`, `lib/features/gastos_indiretos/presentation/cubit/gastos_indiretos_state.dart`. Backend: `services/catalog-service/src/modules/gastos-indiretos/`.

### Total

```text
totalGastos = Σ gasto.valor
```

`GastosIndiretosState.totalGastos`. O cartão mostra também a contagem: "1 item" ou "N itens".

### Validações

| Campo (contrato) | Regra                           | Mensagem                                         | Origem                                                       |
| ---------------- | ------------------------------- | ------------------------------------------------ | ------------------------------------------------------------ |
| `descricao`      | obrigatória, até 100 caracteres | "Informe a descrição" / "Use até 100 caracteres" | mobile; backend `@MaxLength(100)`                            |
| `valor`          | número > 0                      | "Informe um valor válido"                        | FE-10; mobile e backend aceitam 0                            |
| `metodo_rateio`  | um dos três métodos             | —                                                | Select com rótulo e descrição, padrão `FIXO` (como o mobile) |

### Textos

| Onde                 | Mobile                                                                                                                      | Web                                                                                                                         |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Título e subtítulo   | "Gastos Indiretos" / "Custos rateados automaticamente nas receitas"                                                         | igual                                                                                                                       |
| Ação primária        | "Novo gasto"                                                                                                                | igual                                                                                                                       |
| Resumo               | "Total de gastos", "N item(s)"                                                                                              | "Total de gastos", "1 item" / "N itens"                                                                                     |
| Aviso                | "Alteracoes afetam o custo unitario de todas as receitas automaticamente."                                                  | "Alterações afetam o custo unitário de todas as receitas automaticamente."                                                  |
| Título do formulário | "Novo gasto indireto" / "Editar gasto"                                                                                      | igual                                                                                                                       |
| Apoio do formulário  | "Este gasto será rateado em todas as receitas."                                                                             | igual                                                                                                                       |
| Rótulos              | "Descricao", "Valor (R$)", "Metodo de rateio"                                                                               | "Descrição", "Valor (R$)", "Método de rateio"                                                                               |
| Confirmação          | "Excluir gasto" / `Deseja excluir "<descrição>"?\nIsso afetara o custo de todas as receitas.`                               | "Excluir gasto" / `Deseja excluir "<descrição>"? Isso afetará o custo de todas as receitas.`                                |
| Toasts               | — (o mobile só mostra erros)                                                                                                | "Gasto criado com sucesso.", "Gasto atualizado com sucesso.", "Gasto excluído com sucesso."                                 |
| Vazio                | "Nenhum gasto cadastrado" / "Adicione agua, energia, gas, aluguel e outros custos para calcular o custo real das receitas." | "Nenhum gasto cadastrado" / "Adicione água, energia, gás, aluguel e outros custos para calcular o custo real das receitas." |
| Erro                 | "Nao foi possivel carregar os gastos."                                                                                      | "Não foi possível carregar os gastos."                                                                                      |

## Receitas: listagem

FE-11. Origem: `lib/features/receitas/presentation/pages/receitas_page.dart`, `lib/features/receitas/presentation/widgets/receita_card.dart`. Backend: `services/recipe-service/src/modules/receitas/`.

- Linha: nome; `<rendimento> <unidade> - custo <custoProducao>`; preço sugerido; margem (`margemLucro × 100`, 1 casa); custo unitário.
- Web: colunas Nome, Rendimento (`formatQuantidade`), Custo do lote (`custoProducao`, 1 lote), Custo unitário, Margem (`formatMargem`: `0.6` → `60,0%`) e Preço sugerido (`formatMoeda`), na ordem do backend (`dataCriacao` decrescente). "Nova receita" leva a `/receitas/nova` (FE-12).
- `custoProducao`, `custoUnitario`, `margemLucro` e `precoSugerido` podem **não vir** na resposta (o backend omite o campo quando é `null`): exiba `—`.
- Ações: Editar (`/receitas/[receitaId]/editar`), Simular (`/receitas/[receitaId]/simular`, FE-20) e Excluir.

| Onde               | Mobile                                                                 | Web                                                                    |
| ------------------ | ---------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Título e subtítulo | "Receitas" / "Gerencie insumos, rendimento, margem e custo automatico" | "Receitas" / "Gerencie insumos, rendimento, margem e custo automático" |
| Ação primária      | —                                                                      | "Nova receita"                                                         |
| Busca              | "Buscar receita..."                                                    | "Buscar receita"                                                       |
| Confirmação        | "Excluir receita" / `Deseja excluir "<nome>"?`                         | igual                                                                  |
| Toast              | —                                                                      | "Receita excluída com sucesso."                                        |
| Vazio              | "Nenhuma receita encontrada."                                          | igual                                                                  |
| Erro               | "Nao foi possivel carregar as receitas."                               | "Não foi possível carregar as receitas.", com "Tentar novamente"       |

## Receitas: formulário e custo

FE-12. Origem: `receitas_page.dart` (`_openReceitaForm` e o diálogo de adicionar insumo). Backend: `services/recipe-service/src/modules/custos/application/services/custo.service.ts`, `services/recipe-service/src/modules/receitas/application/dto/create-receita.dto.ts` e `update-receita.dto.ts`.

### Fórmulas (iguais às do backend, para a prévia)

```text
custoItem      = round2(quantidade × insumo.custoUnitario)
custoProducao  = round2(round2(Σ custoItem) + custoInvisivel)
custoInvisivel = round2(Σ rateio de TODOS os gastos indiretos da empresa, para 1 lote)
custoUnitario  = round2(custoProducao / rendimento)
precoSugerido  = margem informada ? round2(custoUnitario × (1 + margem)) : sem preço sugerido
```

- `insumo.custoUnitario` é o valor atual do catálogo, sem arredondamento.
- `custoInvisivel` **não é zero**: o `DefaultCustoInvisivelResultProvider` (`services/recipe-service/src/modules/custos/infra/providers/`) soma o rateio de todos os gastos indiretos da empresa (`PROPORCIONAL`: `valor × lotes`; `POR_UNIDADE`: `valor × lotes × rendimento`; `FIXO`: `valor`), cada um com `round2`, para 1 lote. Conferido na API na FE-05: com Energia Elétrica (R$ 450, proporcional) e Aluguel (R$ 1.800, fixo), o Pão Francês ficou com `custoProducao = 3,31 + 2.250 = 2.253,31`. A prévia da FE-12 precisa da lista de gastos para bater com o backend (ver [lacuna 18](api-integration.md#lacunas-do-backend)).
- Sem margem, o backend não calcula `precoSugerido` (o campo não vem na resposta).
- A quantidade do item está **na unidade do insumo** (ex.: manteiga em `g`, farinha em `kg`).
- Exemplo do seed (Bolo de Chocolate, rendimento 12, margem 50%; o seed grava os valores sem o custo invisível): `custoProducao = 9,70`, `custoUnitario = round2(9,70 / 12) = 0,81`, `precoSugerido = round2(0,81 × 1,5) = 1,22`.
- Critério da FE-12: a prévia bate com o retorno do backend com tolerância de R$ 0,01. O valor exibido depois de salvar é sempre o do backend.

### Validações

| Campo (contrato)       | Regra                                                            | Mensagem                                        | Origem                                                      |
| ---------------------- | ---------------------------------------------------------------- | ----------------------------------------------- | ----------------------------------------------------------- |
| `nome`                 | obrigatório, até 80 caracteres                                   | "Informe o nome" / "Use até 80 caracteres"      | mobile; backend `@MaxLength(80)`                            |
| `rendimento`           | **inteiro** > 0                                                  | "Obrigatório"                                   | backend `@IsInt @IsPositive`; o mobile aceitava decimal     |
| `unidadeRendimento`    | `UnidadeMedida`                                                  | —                                               |                                                             |
| `margem_lucro`         | opcional; se preenchida, ≥ 0; digitada em %, enviada como fração | "Valor inválido"                                | mobile; backend `@Min(0)`                                   |
| `insumos[].insumo_id`  | insumo do catálogo, sem repetir                                  | —                                               | o diálogo só oferece insumos que ainda não estão na receita |
| `insumos[].quantidade` | número > 0 (mínimo do backend: 0,001)                            | no diálogo: "Obrigatório"; na linha: "Inválido" | mobile; backend `@Min(0.001)`                               |

Na edição, margem `null`, ausente ou ≤ 0 aparece vazia (mobile: `(margemLucro ?? 0) <= 0 ? ''`). Campo de margem vazio não é enviado, e o `PUT` mantém a margem salva ([lacuna 21](api-integration.md#lacunas-do-backend)); por isso, na edição com o campo vazio, a prévia usa a margem salva.

A prévia (`calcularPreviaReceita`, `receitas.calculos.ts`) mostra `—` no que não dá para calcular: quantidade ou rendimento inválido, ou insumo fora do catálogo (que o backend recusa ao salvar, com 404 "Insumo não encontrado").

### Textos

| Onde                           | Mobile                                                               | Web                                                                                                                                                                                                         |
| ------------------------------ | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Título                         | "Nova receita" / "Editar receita"                                    | igual                                                                                                                                                                                                       |
| Rótulos                        | "Nome", "Rendimento", "Unidade", "Margem de lucro (%)", "Insumos"    | igual                                                                                                                                                                                                       |
| Botão de adicionar             | "Adicionar insumo" / "Todos os insumos adicionados" (desabilitado)   | igual                                                                                                                                                                                                       |
| Diálogo de adicionar           | "Adicionar insumo", "Insumo", "Quantidade", "Cancelar", "Adicionar"  | igual, com a unidade do insumo ao lado da quantidade                                                                                                                                                        |
| Insumo fora do catálogo        | "Insumo #<id>"                                                       | igual                                                                                                                                                                                                       |
| Lista vazia                    | "Nenhum insumo adicionado."                                          | igual                                                                                                                                                                                                       |
| Valores salvos (edição)        | "Custo producao", "Custo unitario", "Preco sugerido"; `–` se ausente | "Custo produção", "Custo unitário", "Preço sugerido"; `—` se ausente                                                                                                                                        |
| Botão                          | "Salvar" / "Atualizar"                                               | igual                                                                                                                                                                                                       |
| Toasts                         | —                                                                    | "Receita criada com sucesso." / "Receita atualizada com sucesso."                                                                                                                                           |
| Sair com alterações não salvas | —                                                                    | ConfirmDialog "Descartar alterações?" / "As alterações não salvas serão perdidas." / "Descartar"                                                                                                            |
| Prévia (sem equivalente)       | —                                                                    | "Prévia dos custos": "Insumos", "Gastos indiretos (1 lote)", "Custo produção", "Custo unitário", "Preço sugerido"; "Estimativa enquanto você edita. O valor gravado é o calculado pelo servidor ao salvar." |
| Linha do insumo                | nome e unidade                                                       | nome, "Custo: R$ X", quantidade com a unidade e "Remover <nome>"                                                                                                                                            |
| Valores salvos (seção)         | —                                                                    | "Valores salvos"                                                                                                                                                                                            |

## Estoque de insumos

FE-13. Origem: `lib/features/estoques/domain/entities/estoque_com_insumo.dart`, `lib/features/estoques/presentation/widgets/estoque_card.dart`, `lib/features/estoques/presentation/pages/estoques_page.dart`, `lib/features/estoques/data/datasources/estoque_remote_datasource.dart`. Backend: `services/operations-service/src/modules/estoque/`.

### Composição dos dados

Não há endpoint de listagem de estoque. O mobile lista `GET /insumos` (catalog) e, para cada insumo, `GET /estoque/insumos/:id` (operations), em sequência. A resposta de `GET /insumos` já traz `quantidadeDisponivel` (espelho atualizado por evento), mas **não** traz `quantidadeMinima`. Por isso, a web continua fazendo uma chamada por insumo, em paralelo (`useQueries`), e usa `quantidadeDisponivel` e `quantidadeMinima` do operations-service, que é a fonte de verdade (ver [lacunas](api-integration.md#lacunas-do-backend)).

### Fórmulas

```text
isBaixoEstoque = quantidadeDisponivel < quantidadeMinima
percentual     = quantidadeMinima > 0 ? quantidadeDisponivel / quantidadeMinima × 100 : 100
status         = isBaixoEstoque ? 'Crítico' : percentual < 50 ? 'Baixo' : 'Adequado'
barra          = clamp(percentual / 100, 0, 1)
```

- Como `Baixo` exige `percentual < 50`, e isso já implica `quantidadeDisponivel < quantidadeMinima`, o status **Baixo nunca aparece** com a regra atual do mobile: tudo abaixo do mínimo é Crítico. A web reproduz a regra como está (critério da FE-13: "confere com o mobile") e mantém o ramo, que fica testado.
- Mínimo 0 (todo insumo criado pela API nasce com `quantidadeMinima = 0`) dá percentual 100 e status Adequado.
- O percentual é exibido sem casas (`toStringAsFixed(0)`): `86%`.
- `isBaixoEstoque` também é usado pelo painel (FE-22): as fórmulas ficam em `src/shared/domain/estoque.ts`. Como o ramo Baixo é inalcançável com números reais, ele é testado por `classificarStatusEstoque(baixoEstoque, percentual)`.

| Status   | Token     | Condição          |
| -------- | --------- | ----------------- |
| Crítico  | `danger`  | `isBaixoEstoque`  |
| Baixo    | `warning` | `percentual < 50` |
| Adequado | `success` | demais casos      |

### Textos

| Onde               | Mobile                                                       | Web                                                                                           |
| ------------------ | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| Título e subtítulo | "Estoque" / "Acompanhe disponibilidade e alertas"            | igual                                                                                         |
| Ação               | "Atualizar"                                                  | igual (refaz as consultas)                                                                    |
| Cartão             | "Disponível", "Mínimo", `<quantidade> <unidade>` com 2 casas | "Disponível", "Mínimo", "Atualizado em dd/mm/aaaa" (a data não aparece no mobile)             |
| Ação do cartão     | "Registrar entrada"                                          | igual                                                                                         |
| Filtro             | "Status": "Todos" / "Baixo"; chip "Baixo Estoque" e "Limpar" | igual; `baixo=1` na URL                                                                       |
| Vazio              | "Nenhum estoque encontrado" / "Comece adicionando insumos"   | igual, com link para `/insumos`                                                               |
| Erro               | "Erro ao carregar estoques" / "Tentar Novamente"             | "Erro ao carregar estoques" / "Tentar novamente"                                              |
| Erro em um insumo  | —                                                            | "Não foi possível carregar o estoque deste insumo." no próprio cartão, com "Tentar novamente" |

O filtro "Baixo" mostra os itens com `isBaixoEstoque`. Na web, um item cujo saldo ainda está carregando ou falhou continua visível com o filtro ativo, porque sem o saldo não dá para saber se ele está abaixo do mínimo.

- Vazio por filtro (só na web): "Nenhum estoque encontrado" / "Nenhum insumo está abaixo do estoque mínimo.", com "Limpar filtro".
- A ação do vazio é o link "Novo insumo" (`/insumos?novo=1`), no lugar do "Atualizar" do mobile, que continua no cabeçalho.
- O percentual aparece com `formatNumero(percentual, 0)` + `%` (`500%`) e as quantidades com `formatQuantidade` (`10 kg`), em vez das 2 casas fixas do mobile.
- Ações do cartão (FE-14): "Registrar entrada" (só com o saldo carregado, porque o diálogo mostra a quantidade atual) e "Histórico", que abre a gaveta de movimentações. No mobile, tocar no cartão ou no menu ⋮ abre a entrada; a web usa botões visíveis.

## Entrada de estoque e histórico

FE-14. Origem: `lib/features/estoques/presentation/widgets/registrar_entrada_modal.dart`, `lib/features/estoques/presentation/cubit/estoques_cubit.dart`, `movimentacao_estoque.dart`. Backend: `services/operations-service/src/modules/estoque/application/dto/registrar-entrada-estoque.dto.ts`.

- Corpo: `{ quantidade }`, com `quantidade > 0`. O DTO **não** tem `observacao` e o backend rejeita campos extras (`forbidNonWhitelisted`), então a web **não** envia nem mostra o campo "Observação" pedido na FE-14 (ex.: "Compra de reposição, NF 4521") (ver [divergências](api-integration.md#divergências-entre-as-issues-e-o-backend)).
- Prévia do saldo: `saldoAposEntrada(quantidadeDisponivel, quantidade)` = `quantidadeDisponivel + quantidade`, arredondado a 6 casas para tirar o ruído de ponto flutuante (`entrada-estoque.schema.ts`). Com o campo vazio ou inválido, a prévia mostra o saldo atual.
- Depois da entrada, a web invalida `estoque` (saldo, status, histórico e painel) e `insumos`, e revalida `insumos` de novo 2 s depois, porque o catalog atualiza `quantidadeDisponivel` por evento.
- Histórico: gaveta "Histórico" (o mobile busca as movimentações, mas não tem tela), com `GET /estoque/insumos/:id/movimentacoes`, já ordenado da mais recente para a mais antiga. Cada item: ícone de seta (para baixo em Entrada, verde; para cima em Saída, vermelha), tipo, origem, data `dd/mm/aaaa` e quantidade com sinal e unidade: `+` em Entrada, `−` em Saída. Referência: em `PRODUCAO`, "Produção #<referenciaId>" (ex.: "Produção #12"); em `COMPRA`, sem referência.
- Não existe endpoint para alterar a quantidade mínima nem para corrigir o saldo (`atualizarEstoque` lança `UnsupportedError` no mobile). Não crie essas ações.

| Onde            | Mobile                                                         | Web                                                    |
| --------------- | -------------------------------------------------------------- | ------------------------------------------------------ |
| Título          | "Registrar Entrada"                                            | igual                                                  |
| Informações     | "Insumo", "Quantidade Atual", "Mínimo"                         | igual                                                  |
| Campo           | "Quantidade a Adicionar", dica "Ex: 10.5"                      | "Quantidade a Adicionar", dica "Ex.: 10,5"             |
| Validação       | "Digite uma quantidade válida" (o mobile não aceitava vírgula) | igual, aceitando vírgula                               |
| Prévia          | —                                                              | "Saldo após a entrada: <quantidade> <unidade>"         |
| Botão           | "Confirmar Entrada"                                            | igual                                                  |
| Sucesso         | "Entrada de estoque registrada com sucesso"                    | "Entrada de estoque registrada com sucesso."           |
| Erro            | "Erro ao registrar entrada: <erro>"                            | `getErrorMessage(error)` no diálogo                    |
| Histórico vazio | —                                                              | "Nenhuma movimentação registrada."                     |
| Histórico       | —                                                              | título "Histórico", com o nome do insumo               |
| Histórico, erro | —                                                              | "Erro ao carregar o histórico", com "Tentar novamente" |

## Produções e rateio

FE-15. Origem: `lib/features/producoes/presentation/pages/producoes_page.dart`, `lib/features/producoes/presentation/cubit/producoes_cubit.dart`, `lib/features/producoes/data/datasources/producao_remote_datasource.dart`. Backend: `services/operations-service/src/modules/producoes/application/services/producao.service.ts`.

### Fórmulas do backend (para a prévia e o detalhe)

```text
totalUnidades = lotes × receita.rendimento
valorRateado  = round2(PROPORCIONAL: valor × lotes | POR_UNIDADE: valor × totalUnidades | FIXO: valor)
custoTotal    = round2(receita.custoProducao × lotes + Σ valorRateado)
custoUnitario = totalUnidades > 0 ? round2(custoTotal / totalUnidades) : 0
```

- `receita.custoProducao` é o valor **gravado** na receita (snapshot), não um recálculo com os preços atuais.
- Exemplo (OVERVIEW do catalog): 1 lote de 50 pãezinhos → energia R$ 450 PROPORCIONAL = R$ 450; aluguel R$ 1.800 FIXO = R$ 1.800; embalagem R$ 120 POR_UNIDADE = R$ 6.000.
- A prévia do formulário é informativa: mostra o total de unidades e o rateio estimado por gasto. O valor gravado é o devolvido pelo backend.

### Seleção de gastos

| Escolha           | Corpo enviado                                                                                           |
| ----------------- | ------------------------------------------------------------------------------------------------------- |
| "Todos" (padrão)  | `{ receita_id, quantidade }`, **sem** `gasto_indireto_ids`: o backend rateia todos os gastos da empresa |
| Seleção de gastos | `{ receita_id, quantidade, gasto_indireto_ids: [ids] }`                                                 |

Origem: `_submeter` em `producoes_page.dart` (`_selecionarTodosGastos ? null : _gastosSelecionados`). Com "Todos" desmarcado e nenhum gasto escolhido, o mobile envia `[]` (nenhum rateio); a web faz o mesmo, mostrando "Nenhum gasto será rateado." na prévia.

### Validações e textos

| Onde               | Mobile                                                                                   | Web                                                                           |
| ------------------ | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Título e subtítulo | "Produções" / "Registre e acompanhe suas produções"                                      | igual                                                                         |
| Ação primária      | "Nova Produção"                                                                          | igual                                                                         |
| Linha              | nome da receita ou "Receita #<id>"; "N lote(s) · dd/mm/aaaa"; custo total; `R$ X/un`     | igual: "1 lote" / "N lotes"                                                   |
| Formulário         | "Registrar Produção" / "Informe quantos lotes foram produzidos"                          | igual                                                                         |
| Receita            | "Receita", obrigatória: "Selecione uma receita"                                          | igual                                                                         |
| Lotes              | "Quantidade de lotes", inteiro > 0: "Informe a quantidade de lotes"                      | igual                                                                         |
| Gastos             | "Gastos indiretos", interruptor "Todos" e um chip por gasto                              | chip "Todos" e um chip por gasto (FE-15)                                      |
| Botão              | "Registrar Produção"                                                                     | igual                                                                         |
| Sucesso            | "Produção registrada com sucesso"                                                        | "Produção registrada com sucesso."                                            |
| Vazio              | "Nenhuma produção registrada" / "Registre sua primeira produção tocando no botão abaixo" | "Nenhuma produção registrada" / "Registre sua primeira produção", com o botão |
| Erro               | "Erro ao carregar produções" e a mensagem                                                | "Erro ao carregar produções", com "Tentar novamente"                          |
| Filtro             | —                                                                                        | Select "Receita", com "Todas as receitas" (`receitaId` na URL)                |
| Vazio no filtro    | —                                                                                        | "Nenhuma produção registrada para esta receita"                               |
| Prévia             | —                                                                                        | "Total de unidades", "Rateio estimado" por gasto e "Total do rateio"          |
| Detalhe            | —                                                                                        | Drawer com os custos, o total de unidades e os rateios (abaixo)               |

Chips de gastos (web): escolher um gasto desmarca "Todos" e fica só com os gastos escolhidos; marcar "Todos" limpa a seleção. O formulário já vem com a receita do filtro da lista.

Detalhe (web): "Total de unidades", "Custo total", "Custo unitário" e "Rateio dos gastos indiretos" (descrição do gasto ou "Gasto #<id>"; sem rateio, "Nenhum gasto rateado."). O total de unidades usa o rendimento **atual** da receita, porque a produção não grava o rendimento nem o total de unidades (lacuna 23).

O backend **não** bloqueia produção com estoque de insumo insuficiente: o saldo fica negativo (ver [lacunas](api-integration.md#lacunas-do-backend)). Mesmo assim, a tela mostra no formulário qualquer erro devolvido.

## Vendas: carrinho

FE-16. Origem: `lib/features/vendas/presentation/pages/vendas_page.dart` (`_buildAddItemForm`, `_onReceitaChanged`, carrinho, `_registrarVenda`, `_friendlyError`), `lib/features/vendas/presentation/cubit/vendas_state.dart` (`ItemCarrinho`), `lib/features/vendas/domain/entities/venda.dart` (`CreateVendaRequest`). Backend: `services/sales-service/src/modules/vendas/application/dto/create-venda.dto.ts`.

### Fórmulas

```text
subtotal = quantidade × precoUnitario
total    = Σ subtotal                       // o backend grava round2(Σ quantidade × preco_unitario_real)
```

- Ao escolher a receita, o preço é preenchido com `precoSugerido` quando ele for > 0; senão, o campo fica vazio (`_onReceitaChanged`). O usuário pode alterar.
- Corpo: `{ itens: [{ receita_id, quantidade, preco_unitario_real }] }`. `quantidade` é **inteira** (`@IsInt`) e `preco_unitario_real` tem no máximo 2 casas (`@IsNumber({ maxDecimalPlaces: 2 })`): arredonde com `arredondarCentavos` antes de enviar.
- O carrinho vive só no estado do componente. Recarregar a página o descarta.
- Adicionar a mesma receita de novo cria outra linha, como no mobile.
- A venda nasce `PENDENTE`. Depois de criar, a tela limpa o carrinho e abre a confirmação (FE-17) com a venda devolvida.

### Validações e textos

| Onde                  | Mobile                                                                                      | Web                                       |
| --------------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------- |
| Título e subtítulo    | "Vendas" / "Registre vendas e acompanhe o histórico"                                        | igual                                     |
| Abas                  | "Registrar" / "Historico"                                                                   | "Registrar" / "Histórico"                 |
| Atalho                | "Produção"                                                                                  | igual, para `/producoes`                  |
| Cartão                | "Adicionar produto"                                                                         | igual                                     |
| Produto               | "Produto/Receita": "Selecione um produto"                                                   | igual                                     |
| Quantidade            | "Quantidade" > 0: "Informe a quantidade" (aceitava decimal)                                 | igual, só inteiro                         |
| Preço                 | "Preço unitário real" > 0: "Informe o preço"                                                | igual, 2 casas                            |
| Botão                 | "Adicionar ao carrinho"                                                                     | igual                                     |
| Carrinho              | "Carrinho", "N item(ns)" ("1 item" / "N itens"); linha `qtd × R$ preço` e subtotal; "Total" | igual                                     |
| Registrar             | "Registrar Venda", desabilitado com carrinho vazio ou durante o envio                       | igual                                     |
| Sessão expirada (401) | "Sessão expirada. Faça login novamente."                                                    | tratado pelo cliente da API (FE-05/FE-07) |
| Estoque insuficiente  | "Estoque insuficiente para registrar a venda. Cadastre a produção do item em Produções."    | igual, com link para `/producoes`         |
| Outros erros          | mensagem do backend                                                                         | `getErrorMessage(error)`                  |

Na web (FE-16):

- Os erros do registro aparecem num `Alert` dentro do cartão do carrinho (o mobile usa `SnackBar`), e o carrinho é mantido. No estoque insuficiente, o `Alert` traz o link "Ir para Produções" (a ação "Produção" do `SnackBar`).
- Carrinho vazio: o cartão continua visível, com "0 itens", "Adicione produtos para registrar a venda." e "Registrar Venda" desabilitado (o mobile esconde o cartão).
- O carrinho fica no componente da tela, não na aba: trocar de aba não o descarta; recarregar, sim.
- Depois de registrar, a tela abre a confirmação (FE-17); o Toast provisório "Venda #<id> registrada como pendente." saiu.
- A aba "Histórico" mostra "Em construção" até a FE-18.

### Detector de estoque insuficiente

`isEstoqueInsuficiente(error)` (`src/shared/api/`, FE-05) reproduz `_isStockError` de `vendas_page.dart`: normaliza a mensagem (minúsculas, sem acentos) e retorna `true` se ela contém `estoque` **e** um destes: `insuficiente`, `indisponivel`, `nao ha`, `sem estoque`. É o único caso em que a tela decide pelo texto da mensagem.

## Vendas: confirmação e ciclo de vida

FE-17. Origem: `vendas_page.dart` (`_ConfirmacaoSheet`, `_concluirComValidacao`, `_acao`), `lib/features/vendas/presentation/cubit/vendas_cubit.dart` (`verificarEstoqueParaVenda`, `atualizarStatus`). Backend: `services/sales-service/src/modules/vendas/` e `services/operations-service/src/modules/estoque-produto-acabado/`.

### Ciclo de vida

```text
PENDENTE ──► CONCLUIDA   (publica venda_concluida; o operations-service baixa o produto acabado)
         └─► CANCELADA   (sem efeito no estoque)
```

- `PATCH /vendas/:id/status` com `{ status: 'CONCLUIDA' | 'CANCELADA' }`.
- Só `PENDENTE` muda de status. Fora disso, o backend responde 400 "Venda já finalizada não pode ser alterada".
- A baixa do produto acabado é **assíncrona**. Se faltar estoque, o consumidor do operations-service falha, mas a venda **continua `CONCLUIDA`** no sales-service: não há compensação (ver [lacunas](api-integration.md#lacunas-do-backend)). Por isso, a validação no cliente, abaixo, é a barreira que de fato impede vender o que não foi produzido.
- Cancelar não verifica estoque.

### Validação de estoque antes de concluir

`calcularEstoqueDisponivel(receitaId, producoes, receitas, vendas)` em `features/vendas/`, função pura:

```text
rendimento  = receita.rendimento (ou 1, se a receita não estiver na lista)
produzido   = Σ producao.quantidade × rendimento        // produções da receita: GET /producoes?receitaId=
vendido     = Σ item.quantidade                          // itens da receita em vendas CONCLUIDA
disponivel  = produzido − vendido
```

Para cada receita da venda, se `disponivel < quantidade solicitada`, **não conclui** e mostra o diálogo "Estoque insuficiente":

> Estoque insuficiente para "<receita>": disponível X, solicitado Y. Registre uma produção antes de concluir.

X e Y são inteiros (`toStringAsFixed(0)` no mobile). O nome usa `Receita #<id>` quando a receita não está na lista. Botões: "Entendido" e o link "Ir para Produções".

Se a consulta de produções ou de vendas falhar, a tela segue com a conclusão e deixa o backend validar (o mobile ignora o erro em `catch (_)`).

Diferenças em relação ao mobile, registradas como decisão:

1. **Vendas consideradas.** O mobile soma só as vendas concluídas do período carregado no histórico (o mês atual), o que superestima o disponível. A web busca `GET /vendas?status=CONCLUIDA` sem período, porque as produções também não têm período.
2. **Mesma receita em duas linhas.** O mobile confere cada item isoladamente. A web soma as quantidades da mesma receita antes de comparar.
3. **Rendimento.** O estoque real usa o rendimento da receita no momento da produção; a produção não guarda esse valor, então o cálculo usa o rendimento atual (limitação também do mobile).
4. **Falha na consulta.** O mobile ignora a falha item a item; a web consulta juntas as receitas, as vendas concluídas e as produções de cada receita e, se qualquer uma falhar, segue com a conclusão sem conferir nenhum item.
5. **Depois de concluir ou cancelar, o diálogo continua aberto**, com o status devolvido (Badge "Concluída" ou "Cancelada") e só o botão "Fechar"; o mobile fecha a folha. Assim a tela mostra o status real, consultado de novo.
6. **Disponível negativo** (vendas concluídas acima do produzido) aparece como está na mensagem ("disponível -20"), como no mobile.

### Textos

| Onde   | Mobile                                                                                                        | Web                                                             |
| ------ | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Título | "Confirmar venda" / "Revise os itens antes de concluir"                                                       | igual                                                           |
| Item   | nome ou "Produto #<id>"; `qtd × R$ preço`; subtotal; `X% margem` (`margemRealizada × 100`, 1 casa, se houver) | igual                                                           |
| Total  | "Total"                                                                                                       | igual                                                           |
| Ações  | "Concluir Venda", "Cancelar Venda"                                                                            | "Concluir venda", "Cancelar venda" e "Fechar" (mantém pendente) |
| Toasts | "Venda concluída com sucesso.", "Venda cancelada."                                                            | igual                                                           |

Depois de concluir, a tela refaz `GET /vendas/:id` e mostra o status devolvido. Na web: `ConfirmacaoVenda`, `useVerificarEstoqueParaVenda` e `useAtualizarStatusVenda` (`features/vendas/`); o histórico (FE-18) abre o mesmo componente com a venda `PENDENTE`.

## Vendas: histórico e resumo

FE-18. Origem: `vendas_page.dart` (aba "Historico", `_selectDate`, `_resolveProdutoNome`), `lib/features/vendas/presentation/widgets/venda_card.dart`, `venda_summary_card.dart`, `venda.dart` (`VendaResumo.fromVendas`), `vendas_state.dart` (período padrão).

### Período padrão

```text
dataInicio = primeiro dia do mês atual
dataFim    = último dia do mês atual          // DateTime(ano, mes + 1, 0)
```

As datas ficam na URL como `YYYY-MM-DD`. Ao chamar a API, a web envia o **início do dia local** em `dataInicio` e o **fim do dia local** em `dataFim`, ambos em ISO 8601, porque o backend faz `new Date(dataFim)` e compara com `lte`: `2026-11-30` viraria meia-noite UTC e deixaria de fora as vendas do último dia (ver [lacunas](api-integration.md#lacunas-do-backend)). Data inicial depois da final é bloqueada: "A data inicial não pode ser depois da data final.".

### Resumo (só vendas `CONCLUIDA`)

```text
faturaveis     = vendas com status CONCLUIDA
totalVendido   = Σ faturaveis.total
quantidade     = faturaveis.length
ticketMedio    = quantidade > 0 ? totalVendido / quantidade : 0
```

`VendaResumo.fromVendas`. Na web: `resumirVendas(vendas)`; `isFaturavel` fica em `src/shared/domain/vendas.ts`, porque o painel e a simulação também usam.

### Lista e detalhe

- Ordem: mais recente primeiro (o backend já ordena por `dataVenda desc`).
- Produto(s): nomes das receitas dos itens, separados por vírgula (`_resolveProdutoNome`); "Produto vendido" se nenhum nome for encontrado.
- Quantidade: soma das quantidades dos itens. Linha: `N un - dd/mm/aaaa`, total e Badge do status.
- Venda `PENDENTE` tem a ação "Confirmar", que abre a FE-17.
- Detalhe: por item, preço real, custo unitário (snapshot `custoUnitario`) e margem realizada.

```text
margemRealizada = (precoUnitarioReal − custoUnitario) / precoUnitarioReal     // calculada e gravada pelo backend
```

Exemplo do OVERVIEW: pão a R$ 0,50 com custo R$ 0,07 → `86,0%`.

| Onde   | Mobile                                    | Web                                                                    |
| ------ | ----------------------------------------- | ---------------------------------------------------------------------- |
| Filtro | "Data inicial", "Data final"              | igual; status opcional ("Todos", "Pendente", "Concluída", "Cancelada") |
| Resumo | "Total vendido", "Vendas", "Ticket medio" | "Total vendido", "Vendas", "Ticket médio"                              |
| Vazio  | "Nenhuma venda encontrada no período."    | igual                                                                  |
| Erro   | "Não foi possível carregar as vendas."    | igual, com "Tentar novamente"                                          |

## Custos: cálculo real

FE-19. Origem: `lib/features/insumos/presentation/pages/calculo_real_screen.dart` (é a aba "Custos" de `lib/core/presentation/pages/main_screen.dart`; `lib/features/custos/` é código morto). Tela 100% local, sem API.

### Fórmulas

```text
maoDeObra           = horas × valorHora
custosInvisiveis    = energia + agua + gas + maoDeObra
custoTotal          = ingredientes + custosInvisiveis
custoPorUnidade     = rendimento > 0 ? custoTotal / rendimento : 0
percentualInvisivel = custoTotal > 0 ? custosInvisiveis / custoTotal × 100 : 0
```

Campo vazio conta como 0 (`_parseBR`); nenhum resultado pode virar `NaN`.

### Validações e textos

| Seção / campo          | Mobile                                                                                            | Web                                                                                    |
| ---------------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Título e subtítulo     | "Calculo Real" / "Custo verdadeiro incluindo custos invisiveis"                                   | "Cálculo Real" / "Custo verdadeiro incluindo custos invisíveis"                        |
| IDENTIFICAÇÃO          | "Nome da simulacao", obrigatório: "Informe um nome"                                               | "Nome da simulação": "Informe um nome"                                                 |
| CUSTO DOS INGREDIENTES | "Custo dos ingredientes" ≥ 0                                                                      | igual                                                                                  |
| CUSTOS INVISÍVEIS      | "Energia", "Agua", "Gas", "Horas", "Valor/hora mao de obra", todos ≥ 0: "Informe um valor valido" | "Energia", "Água", "Gás", "Horas", "Valor/hora mão de obra": "Informe um valor válido" |
| RENDIMENTO             | "Unidades produzidas", inteiro > 0, padrão 1: "Informe um rendimento maior que zero"              | igual                                                                                  |
| Resultado              | "CUSTO POR UNIDADE"; "Custo Total"; "Custos Invisiveis" (só o %, 1 casa)                          | "CUSTO POR UNIDADE"; "Custo Total"; "Custos Invisíveis" (valor e %)                    |
| Ações                  | "Novo" (limpa e volta o rendimento para 1), "Salvar" (valida e guarda)                            | igual                                                                                  |
| Toast                  | "Simulacao salva."                                                                                | "Simulação salva."                                                                     |
| SIMULAÇÕES SALVAS      | `N un - total R$ X`, "Abrir" (recarrega os campos); vazio: "Nenhuma simulacao salva."             | igual; vazio: "Nenhuma simulação salva."                                               |

No mobile, os registros ficam numa lista estática em memória e somem ao fechar o app. Na web, ficam no estado do cliente e podem ir para `localStorage` (com `try/catch`), porque não são dados pessoais nem sensíveis (ver [security.md](security.md#o-que-nunca-guardar-no-navegador)).

## Simulação de cenário da receita

FE-20. Origem: `lib/features/receitas/presentation/pages/simulacao_page.dart`, `lib/features/receitas/presentation/cubit/simulacao_cubit.dart`, `lib/features/receitas/domain/entities/simulacao_result.dart`. Backend: `services/recipe-service/src/modules/custos/application/services/simulacao.service.ts`, DTOs `simular-cenario.dto.ts`, `simulacao-cenario-resultado.dto.ts`, `simular-receita-custo.dto.ts` e `receitas/application/dto/preco-venda.dto.ts`.

### Cálculo (feito pelo backend; a tela não recalcula)

```text
custoUnitario   = novoCusto ?? receita.custoUnitario      // sem nenhum dos dois: 400
precoVenda      = novoPreco ?? receita.precoSugerido      // sem nenhum dos dois: 400
volume          = volume ?? receita.rendimento
lucroEstimado   = round2((precoVenda − custoUnitario) × volume)
margemProjetada = round2((precoVenda − custoUnitario) / precoVenda)    // fração
breakEven       = ceil(custoUnitario × volume / precoVenda)
```

### Parâmetros

| Campo                  | Valor inicial                      | Envio                     |
| ---------------------- | ---------------------------------- | ------------------------- |
| Custo por unidade (R$) | `custoUnitario` da receita, se > 0 | `novoCusto`, número > 0   |
| Preço de venda (R$)    | `precoSugerido`, se > 0            | `novoPreco`, número > 0   |
| Quantidade (unidades)  | `rendimento`                       | `volume`, **inteiro** > 0 |

Campo vazio não é enviado (o backend usa o valor da receita). Dicas: "Ex.: 2,50", "Ex.: 5,00", "Ex.: 12".

### Resultado e textos

| Onde                | Mobile                                                                 | Web                                                                                           |
| ------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Título e subtítulo  | "Simulacao de cenario" / "Ajuste os valores e veja o impacto no lucro" | "Simulação de cenário" / "Ajuste os valores e veja o impacto no lucro", com o nome da receita |
| Blocos              | "Parametros", "Resultado"                                              | "Parâmetros", "Resultado"                                                                     |
| Botão               | "Simular"                                                              | igual                                                                                         |
| Lucro               | "Lucro estimado": verde se ≥ 0, vermelho se < 0, com sinal             | igual (`success` / `danger`)                                                                  |
| Margem              | "Margem projetada": `margemProjetada × 100`, 1 casa                    | igual                                                                                         |
| Demais              | "Custo/unidade", "Preco de venda", "Volume simulado" (`N un.`)         | "Custo/unidade", "Preço de venda", "Volume simulado"                                          |
| Ponto de equilíbrio | "Venda pelo menos N unidades para nao ter prejuizo."                   | "Venda pelo menos N unidades para não ter prejuízo."                                          |
| Erro                | mensagem do backend ou "Erro ao simular."                              | igual                                                                                         |

Mensagens de erro do backend (400): "Receita sem custo calculado. Informe novoCusto para simular." e "Receita sem preço sugerido definido. Informe novoPreco para simular.". Antes de exibi-las, troque o nome do campo pelo rótulo: "Informe o custo por unidade para simular." e "Informe o preço de venda para simular.".

### Blocos auxiliares (sem equivalente no mobile)

| Bloco                        | Endpoint                           | Corpo                               | Resposta (nomes como vêm da API)                                                                 |
| ---------------------------- | ---------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------ |
| "Preço para margem desejada" | `POST /receitas/:id/preco-venda`   | `{ margem_lucro }` (fração ≥ 0)     | `{ custo_total_unitario, preco_sugerido, lucro_por_unidade }`, sem arredondamento                |
| "Custo para N lotes"         | `POST /receitas/:id/custo/simular` | `{ quantidadeLotes }` (inteiro > 0) | `{ quantidade_lotes, total_unidades, custo_invisivel, custo_total_producao, custo_por_unidade }` |
| Custo atual de 1 lote        | `GET /receitas/:id/custo`          | —                                   | mesmo formato do anterior                                                                        |

`preco_sugerido = custoUnitario × (1 + margem_lucro)` e `lucro_por_unidade = preco_sugerido − custoUnitario`. "Receita sem custo calculado" (400) quando a receita não tem `custoUnitario`.

A simulação não grava nada: mutação sem invalidação.

## Simulação interativa

FE-21. Origem: `lib/features/simulacao/presentation/pages/simulacao_page.dart` (`_ScenarioBase.fromReceita`, `_priceRangeFor`, `_volumeRangeFor`, `_buildSimulationContent`, `_ProjectionChartCard`, `_VolumePreviewCard`). Funções puras em `features/simulacao/simulacao.calculos.ts`.

Dados: `GET /receitas` e `GET /vendas` do mês atual (o mobile usa as vendas carregadas no histórico, que por padrão é o mês atual). Sem receitas: "Cadastre uma receita para simular cenários.". A receita selecionada fica em `receitaId` na URL; sem ela, usa a primeira da lista.

### Base da receita

```text
custo          = receita.custoUnitario ?? 0
precoSugerido  = receita.precoSugerido > 0 ? receita.precoSugerido : custo × (1 + (receita.margemLucro ?? 0))
// vendas CONCLUIDA, itens desta receita:
quantidade     = Σ item.quantidade
receitaVendas  = Σ item.quantidade × item.precoUnitarioReal
precoAtual     = quantidade > 0 ? receitaVendas / quantidade : precoSugerido
volumePadrao   = max(1, receita.rendimento)
receitaAtual   = quantidade > 0 ? receitaVendas : precoAtual × volumePadrao
volumeAtual    = quantidade > 0 ? quantidade : volumePadrao
lucroAtual     = receitaAtual − custo × volumeAtual
margemAtual    = receitaAtual == 0 ? 0 : lucroAtual / receitaAtual × 100
```

Sem vendas, a base usa o preço sugerido e o rendimento: não há divisão por zero.

### Faixas dos controles

```text
// preço
precoBase = receita.precoSugerido > 0 ? receita.precoSugerido : custo × (1 + margemLucro)
base      = max(precoBase, custo × 1,25)
min       = max(0,01, min(custo × 0,75, base))
max       = max(base × 2,2, custo × 3)
passo     = (max − min) / 80

// variação de custo (%)
faixa de −50 a +100, passo 1, valor inicial 0

// volume
base      = max(1, volumeAtual > 0 ? volumeAtual : rendimento)
faixa de 1 a ceil(max(20, base × 3)), passo 1
```

Valores iniciais: preço = `precoAtual`; volume = `volumeAtual`. Ambos ficam presos à faixa (`clamp`). Trocar a receita ou "Restaurar" volta tudo ao inicial.

### Resultado

```text
custoProjetado         = custo × (1 + variacao / 100)
lucroPorUnidade        = preco − custoProjetado
lucroProjetado         = lucroPorUnidade × volume
receitaProjetada       = preco × volume
margemProjetada        = receitaProjetada == 0 ? 0 : lucroProjetado / receitaProjetada × 100
diferenca              = lucroProjetado − lucroAtual
```

Cenários de volume, com o preço e o custo projetados:

| Cenário     | Volume                        | Receita     | Lucro                          |
| ----------- | ----------------------------- | ----------- | ------------------------------ |
| Conservador | `max(1, round(volume × 0,5))` | `preco × v` | `(preco − custoProjetado) × v` |
| Base        | `max(1, round(volume))`       | idem        | idem                           |
| Otimista    | `max(1, round(volume × 1,5))` | idem        | idem                           |

O mobile chama o cenário do meio de "Simulado" e, como usa os volumes como chave de um mapa, junta cenários com o mesmo volume (com volume 1, aparecem só dois). A web usa "Base", como pede a FE-21, e mostra sempre os três.

### Textos

| Onde               | Mobile                                                                                                                                                | Web                                                                                      |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Título e subtítulo | "Simulacao" / "Projete preco, custo e volume antes de agir"                                                                                           | "Simulação" / "Projete preço, custo e volume antes de agir"                              |
| Produto            | "Produto"; "Custo unitario", "Preco atual", "Volume atual no periodo" (`N unidades`)                                                                  | "Produto"; "Custo unitário", "Preço atual", "Volume atual no período"                    |
| Controles          | "Preco de venda" ("Atual: R$ X"); "Variacao de custo" ("Custo projetado: R$ X", "-50%", "+100%"); "Volume projetado" (`N un.`, "Volume atual: N un.") | "Preço de venda"; "Variação de custo"; "Volume projetado", com os mesmos textos de apoio |
| Resultado          | "PRECO SIMULADO", "Lucro: R$ X por unidade", "Lucro projetado", "Margem"                                                                              | "PREÇO SIMULADO", "Lucro: R$ X por unidade", "Lucro projetado", "Margem"                 |
| Gráfico            | "Lucro projetado vs atual"; diferença com sinal; "Atual" / "Projetado", `X% margem`                                                                   | igual, com tabela equivalente para leitor de tela                                        |
| Cenários           | "Simulacao de volume"; `N unidades`; receita; "Lucro: R$ X"                                                                                           | "Simulação de volume"; mesmos textos                                                     |
| Ação               | —                                                                                                                                                     | "Restaurar"                                                                              |

A variação de custo é exibida com sinal e sem casas (`+20%`, `-10%`).

## Painel

FE-22. Origem: `lib/features/dashboard/presentation/pages/dashboard_page.dart` (`_DashboardData.fromStates`, `_calculateVendaProfit`, `_buildMonthlyValues`, `_buildMonthLabels`, `_buildTrendLabel`, `_buildTopProducts`, `_QuickActions`). Funções puras em `features/painel/painel.calculos.ts`.

Critério da FE-22: com o seed "Padaria Pão Feliz", os indicadores batem com o cálculo manual (vendas `PENDENTE` e `CANCELADA` ficam fora).

Não há endpoint de painel: o mobile chama `/vendas/dashboard` (`lib/core/network/api_constants.dart`), que não existe no backend. O painel é composto no cliente a partir de `GET /vendas` (dos últimos 6 meses, a partir do dia 1 de cinco meses atrás), `GET /receitas` e da query de estoque (FE-13).

### Indicadores (só vendas `CONCLUIDA`)

```text
vendasMes    = faturáveis do mês atual
faturamento  = Σ vendasMes.total
lucroItem    = item.quantidade × item.precoUnitarioReal − custo × item.quantidade
custo        = item.custoUnitario (snapshot)  ??  receita.custoUnitario atual  ??  0
lucro        = Σ lucroItem dos itens de vendasMes
margem       = faturamento == 0 ? 0 : lucro / faturamento × 100
vendas7dias  = número de faturáveis com dataVenda ≥ agora − 7 dias
estoqueBaixo = número de insumos com isBaixoEstoque
```

| Indicador     | Detalhe                                  | Ação                      |
| ------------- | ---------------------------------------- | ------------------------- |
| Faturamento   | "Período atual"                          | —                         |
| Lucro líquido | "Margem X%" (1 casa), verde se lucro ≥ 0 | —                         |
| Vendas        | "Últimos 7 dias"                         | —                         |
| Estoque baixo | "Item crítico" (1) ou "Itens críticos"   | leva a `/estoque?baixo=1` |

O mobile usa sempre o `custoUnitario` atual da receita. A web prefere o snapshot do item de venda, que é o custo no momento da venda (`services/sales-service/src/modules/integracao/OVERVIEW.md`), e cai para o da receita quando o snapshot é `null`.

### Evolução mensal

```text
meses      = os 6 meses até o atual, inclusive (vira o ano corretamente)
valorMes   = Σ total das faturáveis com dataVenda no mês (fuso local)
rotulos    = Jan Fev Mar Abr Mai Jun Jul Ago Set Out Nov Dez
tendencia  = anterior == 0 && atual == 0 ? "0,0%"
           : anterior == 0               ? "+100,0%"
           : (atual − anterior) / anterior × 100, com sinal "+" quando ≥ 0, 1 casa
```

Título "Evolução mensal", subtítulo "Receita dos últimos 6 meses". A tendência negativa usa `danger`. O mobile formata com ponto (`+100.0%`); a web, com vírgula.

### Produtos mais rentáveis

Top 3 por lucro, decrescente, com "Ver tudo" → `/vendas?aba=historico`.

- **Com vendas** (nas faturáveis do mês): agrupa os itens por receita, somando quantidade, receita (`quantidade × preço`) e lucro (mesmo `lucroItem` acima); `margem = receita == 0 ? 0 : lucro / receita × 100`. Linha: `N un - margem X%`. O mobile agrupa pelo nome; a web agrupa por `receitaId` e usa o nome atual da receita.
- **Sem vendas:** usa as receitas com `lucro = precoSugerido − custoUnitario > 0` (ausente conta como 0); `margem = preco == 0 ? margemLucro × 100 : lucro / preco × 100`; a quantidade exibida é o rendimento.
- **Vazio:** "Cadastre receitas e registre vendas para ver rentabilidade.".

### Cabeçalho e ações rápidas

Cabeçalho "LucroAI", "Seu painel financeiro", nome da empresa (do JWT) e atalho para `/simulacao`.

| Ação         | Destino                    |
| ------------ | -------------------------- |
| Novo Insumo  | `/insumos?novo=1`          |
| Nova Receita | `/receitas/nova`           |
| Produção     | `/producoes?novo=1`        |
| Gastos       | `/gastos-indiretos?novo=1` |

`?novo=1` abre o formulário de criação ao carregar a listagem.

## Login e mensagens de erro gerais

FE-05 e FE-07. Origem: `lib/features/auth/presentation/pages/login_page.dart`, `lib/core/auth/auth_session.dart`, `_buildException` dos datasources.

| Situação                | Texto                                                              |
| ----------------------- | ------------------------------------------------------------------ |
| E-mail vazio / inválido | "Informe seu e-mail" / "Informe um e-mail válido"                  |
| Senha vazia             | "Informe sua senha"                                                |
| Login 401               | "E-mail ou senha inválidos"                                        |
| Login, outros erros     | "Não foi possível entrar. Verifique o servidor e tente novamente." |
| Login, botão do olho    | "Mostrar senha" / "Ocultar senha" (nome acessível do botão)        |
| Login, cabeçalho        | "LucroAI" e "Entre para acessar os dados da sua empresa"           |
| 401 em qualquer serviço | "Sessão expirada. Faça login novamente." (leva ao login)           |
| 404                     | "Registro não encontrado."                                         |
| 409                     | mensagem do backend ("CNPJ já cadastrado", "E-mail já cadastrado") |
| 400                     | mensagens de validação do backend, juntas                          |
| Rede ou timeout (10 s)  | "Sem conexão com o servidor."                                      |
| 5xx                     | "Erro no servidor. Tente novamente."                               |

Como a web aplica (FE-07, `features/auth/`):

- `loginFormSchema` (`schemas/login-form.schema.ts`): o e-mail é aparado e conferido com `z.email()`, o mesmo critério do `@IsEmail()` do backend (o mobile só confere o `@`); a senha não é aparada. Com erro, o foco vai para o primeiro campo inválido.
- `getLoginErrorMessage(error)`: `ApiError` 401 vira "E-mail ou senha inválidos"; qualquer outro erro (400, 5xx, rede), "Não foi possível entrar. Verifique o servidor e tente novamente.". O texto aparece num `Alert` acima do botão, e não num SnackBar.
- `?expirada=1` mostra "Sessão expirada. Faça login novamente." num aviso (`role="status"`) acima dos campos, que some quando há erro de login.
- Depois de entrar, a web vai para o `redirect` (só caminho interno) ou para `/`.

## Diferenças intencionais em relação ao mobile

Resumo do que a web faz diferente, de propósito. Cada item está detalhado na seção da tela e entra na matriz de paridade da FE-23.

| Tela                 | Diferença                                                                                                                                                                                 | Motivo                                           |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| Todas                | textos com acentuação correta                                                                                                                                                             | FE-02                                            |
| Todas                | busca ignora acentos                                                                                                                                                                      | FE-05                                            |
| Navegação            | menu lateral no desktop; no celular, cabeçalho com a logo e o botão "Conta" (nome, empresa e "Sair"), que o mobile não tem; rótulos da barra com 10px (mobile: 9px); 404 dentro do layout | FE-08                                            |
| Login                | e-mail conferido com `z.email()` (o mobile só exige `@`); erro num `Alert` no formulário; volta à página de destino e avisa a sessão expirada                                             | FE-07 e backend `@IsEmail()`                     |
| Campos numéricos     | aceitam separador de milhar (`1.234,56`); ao sair do campo, mostram o valor lido no formato brasileiro (`1234.5` vira `1.234,50` no dinheiro)                                             | FE-06                                            |
| Formulários          | erro da API num `Alert` no topo do formulário, que continua aberto, e não num SnackBar                                                                                                    | FE-06 ([ui.md](ui.md#toasts-depois-de-mutações)) |
| Insumos              | custo unitário com 4 casas fixas                                                                                                                                                          | FE-05                                            |
| Receitas             | rendimento só inteiro                                                                                                                                                                     | backend `@IsInt`                                 |
| Estoque              | mostra a data da última alteração; erro isolado por cartão                                                                                                                                | FE-13                                            |
| Entrada de estoque   | sem o campo "Observação"; prévia do saldo; gaveta "Histórico"                                                                                                                             | o backend rejeita o campo                        |
| Vendas               | quantidade só inteira; preço arredondado a 2 casas                                                                                                                                        | backend `@IsInt` e `maxDecimalPlaces: 2`         |
| Confirmação de venda | vendido considera todas as vendas concluídas e soma itens da mesma receita                                                                                                                | correção do cálculo                              |
| Histórico de vendas  | filtro de período enviado como início e fim do dia local                                                                                                                                  | lacuna do backend com `dataFim`                  |
| Cálculo real         | simulações podem sobreviver ao recarregamento (`localStorage`)                                                                                                                            | FE-19                                            |
| Simulação            | cenário do meio chamado "Base"; sempre três cenários                                                                                                                                      | FE-21                                            |
| Painel               | lucro com o snapshot de custo do item; seis meses reais no gráfico; vendas de 7 dias sobre os seis meses carregados                                                                       | FE-22                                            |
