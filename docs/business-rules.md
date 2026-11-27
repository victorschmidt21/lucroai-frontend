# Regras de negócio

Fonte única das regras, fórmulas, validações e textos das telas do LucroAI, extraídos do app Flutter ([`lucroai_mobile`](https://github.com/GrupoDoisENG/lucroai_mobile)) e conferidos no código do [backend](https://github.com/GrupoDoisENG/lucroai-backend). As issues FE-09 a FE-22 citam este arquivo; ao implementar uma tela, siga a seção dela.

> **Status:** documento de referência. Os formatadores, os enums com rótulos, `filtrarPorTexto`, `getErrorMessage` e `isEstoqueInsuficiente` existem desde a **FE-05**; as demais funções citadas são entregues pela issue indicada na seção. Os caminhos de origem são relativos à raiz de cada repositório: `lib/...` é do `lucroai_mobile`, `services/...` e `shared/...` são do `lucroai-backend`.

Como ler:

- **Quem decide é o backend.** Quando o backend calcula e grava um valor (custo da receita, preço sugerido, rateio, total da venda, lucro real da venda), a tela mostra o valor devolvido. O cálculo no cliente serve só para **prévia** enquanto o usuário digita, e precisa repetir as fórmulas e os arredondamentos do backend descritos aqui.
- **Quando o backend não tem o dado**, o cliente calcula (painel, estoque, simulação interativa, cálculo real). Essas fórmulas viram **funções puras** testadas à parte (ver [architecture.md](architecture.md#regras-de-negócio-no-cliente)).
- **Textos.** A coluna "Web" é o texto a usar. Desde a FE-57, ela segue a linguagem de cozinha de [marca.md](marca.md#voz-e-tom): "Ingredientes e embalagens" (insumos), "Fornadas" (produções), "Contas do mês" (gastos indiretos), "Ajustes de preço" (configurações de custo), "Acabando" (estoque crítico), "Sobrou pra você" (lucro líquido), "R$ X de cada R$ 100" (margem) e "Para pagar as contas do mês, venda R$ X" (ponto de equilíbrio). Os títulos das seções abaixo continuam com os nomes do código. O mobile escreve muitos textos sem acento ("Descricao", "Calculo Real"); a web corrige a acentuação, e só ela. Mudanças de sentido estão em [Diferenças intencionais](#diferenças-intencionais-em-relação-ao-mobile).
- Fórmulas usam a notação do código: `Σ` é soma, `round2(x)` é o arredondamento do backend descrito em [Arredondamento](#arredondamento).

## Sumário

| Seção                                                                                 | Issue        |
| ------------------------------------------------------------------------------------- | ------------ |
| [Convenções de número, moeda e data](#convenções-de-número-moeda-e-data)              | FE-05, FE-06 |
| [Enumerações e rótulos](#enumerações-e-rótulos)                                       | FE-05        |
| [Insumos](#insumos)                                                                   | FE-09        |
| [Gastos indiretos](#gastos-indiretos)                                                 | FE-10        |
| [Receitas: listagem](#receitas-listagem)                                              | FE-11        |
| [Receitas: formulário e custo](#receitas-formulário-e-custo)                          | FE-12, FE-44 |
| [Estoque de insumos](#estoque-de-insumos)                                             | FE-13        |
| [Entrada de estoque e histórico](#entrada-de-estoque-e-histórico)                     | FE-14        |
| [Produções e rateio](#produções-e-rateio)                                             | FE-15        |
| [Vendas: carrinho](#vendas-carrinho)                                                  | FE-16, FE-46 |
| [Vendas: confirmação e ciclo de vida](#vendas-confirmação-e-ciclo-de-vida)            | FE-17        |
| [Vendas: histórico e resumo](#vendas-histórico-e-resumo)                              | FE-18        |
| [Custos: cálculo real](#custos-cálculo-real)                                          | FE-19        |
| [Simulação de cenário da receita](#simulação-de-cenário-da-receita)                   | FE-20        |
| [Simulação interativa](#simulação-interativa)                                         | FE-21        |
| [Painel](#painel)                                                                     | FE-22        |
| [Configurações de custo e formas de venda](#configurações-de-custo-e-formas-de-venda) | FE-41        |
| [Estoque negativo e avisos ao entrar](#estoque-negativo-e-avisos-ao-entrar)           | FE-47        |
| [Login e mensagens de erro gerais](#login-e-mensagens-de-erro-gerais)                 | FE-05, FE-07 |
| [Criar conta com token de cadastro](#criar-conta-com-token-de-cadastro)               | FE-48        |

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
| `lucroReal` do item da venda (FE-46)                         | 4 casas (fração)                                | `venda.service.ts`                                                                           |
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

Valores do contrato (`shared/src/domain/enums/` no backend) e os rótulos de tela. Ficam em `src/shared/api/contracts/enums.ts` (FE-05), como `UNIDADE_MEDIDA_ROTULOS`, `TIPO_GASTO_ROTULOS`, `TIPO_GASTO_DESCRICOES`, `STATUS_VENDA_ROTULOS`, `TIPO_MOVIMENTACAO_ROTULOS` e `ORIGEM_MOVIMENTACAO_ROTULOS`. Nunca mostre o valor cru do enum.

### `UnidadeMedida`

| Valor | Rótulo | Origem do rótulo                                                           |
| ----- | ------ | -------------------------------------------------------------------------- |
| `G`   | `g`    | `lib/features/insumos/domain/entities/insumo.dart` (`InsumoUnidadeMedida`) |
| `KG`  | `kg`   |                                                                            |
| `ML`  | `ml`   |                                                                            |
| `L`   | `L`    | o mobile usa `l`; a web usa `L`, como pede a FE-05                         |
| `UN`  | `un`   |                                                                            |

### `TipoGasto`

FE-42. Substitui o antigo `MetodoRateio` (`PROPORCIONAL`, `POR_UNIDADE`, `FIXO`), que saiu dos contratos e da tela. Backend: `TipoGasto` (BE-26), `gastos-indiretos/domain/gastos-indiretos.calculos.ts` do monolito.

| Valor              | Rótulo (Badge e Select) | Descrição (texto de apoio no Select)                                      | Unidade do `valor` na API          | Campo do valor no formulário |
| ------------------ | ----------------------- | ------------------------------------------------------------------------- | ---------------------------------- | ---------------------------- |
| `MENSAL`           | Conta do mês            | Dividida pelas fornadas do mês. Ex.: aluguel, luz, gás, água, DAS do MEI. | reais por mês                      | "Valor por mês" (R$)         |
| `POR_UNIDADE`      | Por unidade vendida     | Valor de cada unidade. Ex.: saquinho, etiqueta.                           | reais por unidade vendida          | "Valor por unidade" (R$)     |
| `PERCENTUAL_VENDA` | % da venda              | Percentual de cada venda. Ex.: comissão de revendedora.                   | fração do preço, de 0 a menos de 1 | "Percentual da venda" (%)    |

### `StatusVenda`

| Valor       | Rótulo    | Token (FE-04) | Entra no faturamento |
| ----------- | --------- | ------------- | -------------------- |
| `PENDENTE`  | Pendente  | `warning`     | não                  |
| `CONCLUIDA` | Concluída | `success`     | **sim**              |
| `CANCELADA` | Cancelada | `ink-muted`   | não                  |

Origem: `lib/features/vendas/presentation/widgets/venda_card.dart` (`_statusLabel`) e `lib/features/vendas/domain/entities/venda.dart` (`isFaturavel`: "Apenas vendas concluídas entram no faturamento").

### Movimentação de estoque

| Campo    | Valor      | Rótulo  |
| -------- | ---------- | ------- |
| `tipo`   | `ENTRADA`  | Entrada |
| `tipo`   | `SAIDA`    | Saída   |
| `origem` | `COMPRA`   | Compra  |
| `origem` | `PRODUCAO` | Fornada |

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

| Campo (contrato)              | Regra                                                 | Mensagem                                       | Origem                                                                        |
| ----------------------------- | ----------------------------------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------- |
| `nome`                        | obrigatório, até 80 caracteres                        | "Informe o nome" / "Use até 80 caracteres"     | mobile; o backend também limita a 80 (lacuna 12, resolvida)                   |
| `quantidadeBaseCusto`         | número > 0                                            | "Informe uma quantidade maior que zero"        | mobile; backend `@Min(0.000001)`                                              |
| `unidade`                     | `G`, `KG`, `ML`, `L` ou `UN`                          | —                                              | Select com valor padrão `G` (g), como o mobile (`InsumoUnidadeMedida.gramas`) |
| `valorPago`                   | número > 0                                            | "Informe um valor maior que zero"              | mobile; o backend aceita 0                                                    |
| `quantidadeDisponivelInicial` | número ≥ 0, só na criação, padrão vazio = não enviado | "Informe uma quantidade maior ou igual a zero" | FE-09; backend `@Min(0)`, opcional                                            |

### Textos

| Onde                    | Mobile                                                                                         | Web                                                                                                                                                                             |
| ----------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Título e subtítulo      | "Insumos" / "Gerencie quantidade, valor pago e custo unitario"                                 | "Ingredientes e embalagens" / "O que você compra para produzir" (FE-57)                                                                                                         |
| Ação primária           | —                                                                                              | "Novo ingrediente" (FE-57)                                                                                                                                                      |
| Busca                   | "Buscar insumo..."                                                                             | "Buscar ingrediente"; contagem "1 ingrediente" / "N ingredientes"                                                                                                               |
| Linha da lista          | `<quantidade> <unidade> - R$ <valorPago>` e `R$ <custo>/<unidade>`                             | igual, com os formatadores                                                                                                                                                      |
| Título do formulário    | "Novo insumo" / "Editar insumo"                                                                | "Novo ingrediente" / "Editar ingrediente"                                                                                                                                       |
| Prévia                  | "Custo unitario: R$ X/un"                                                                      | "Custo unitário: R$ X/un" (com a unidade escolhida)                                                                                                                             |
| Botões                  | "Cancelar", "Salvar" / "Atualizar"                                                             | igual                                                                                                                                                                           |
| Confirmação de exclusão | "Excluir insumo" / `Deseja excluir "<nome>"?`                                                  | "Excluir ingrediente" / `Deseja excluir "<nome>"?`; botão "Excluir"                                                                                                             |
| Toasts                  | "Insumo criado com sucesso.", "Insumo atualizado com sucesso.", "Insumo excluido com sucesso." | "Ingrediente cadastrado.", "Ingrediente atualizado.", "Ingrediente excluído." (FE-57)                                                                                           |
| Vazio                   | "Nenhum insumo encontrado."                                                                    | "Sua despensa está vazia" / "Comece pelo ingrediente que você mais usa, como leite condensado." (FE-57), com a ilustração da despensa e o botão "Adicionar ingrediente" (FE-59) |
| Erro                    | "Nao foi possivel carregar os insumos."                                                        | "Não consegui buscar seus ingredientes agora.", com "Tentar de novo"                                                                                                            |

### Ordem e busca

A lista vem do backend sem ordem garantida; a web ordena por nome (`localeCompare` com `'pt-BR'`).

A busca é por nome, no cliente, com debounce (350 ms no mobile, `insumos_cubit.dart`). O mobile só ignora maiúsculas; a web ignora também acentos ("acucar" encontra "Açúcar"), com `filtrarPorTexto` (FE-05).

### Compras, custo médio e preço de hoje

FE-43, só na web. Backend: BE-29 (`src/modules/insumos/`, [Compras de insumo](https://github.com/victorschmidt21/lucroai-backend/blob/main/docs/business-rules.md#compras-de-insumo)). Os três custos vêm gravados pelo backend, por unidade do insumo, e a tela não os recalcula:

| Número (contrato)                  | Texto na tela                                                                                                  |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| "Custo médio" (`custoMedio`)       | "Quanto você pagou, em média, pelo que tem guardado."                                                          |
| "Última compra" (`ultimoCusto`)    | "Quanto custou na compra mais recente."                                                                        |
| "Preço de hoje" (`custoReposicao`) | "Usado para calcular o preço de venda." + "É o da última compra." ou "Você informou este preço em dd/mm/aaaa." |

- O detalhe abre pelo botão "Compras e preços de &lt;nome&gt;" da lista e mostra também "Em estoque" e a lista "Compras" (`GET /insumos/:id/compras`, a mais recente primeiro: "&lt;quantidade&gt; por R$ X", data, observação e o custo por unidade). Vazio: "Nenhuma compra registrada.".
- A coluna "Custo unitário" da lista passa a se chamar "Preço de hoje": o `custoUnitario` é o custo de reposição desde a BE-29.
- **"Registrar compra"** (`POST /insumos/:id/compras`): "Quantidade comprada" (> 0, na unidade do insumo), "Valor pago" (> 0) e "Observação" (opcional, até 200, vazia não vai). Prévia "Custo desta compra: R$ X/un" (`calcularCustoUnitario`). A data é a do registro (o backend não aceita outra). Toast "Compra registrada com sucesso.". Dá entrada no estoque, recalcula o custo médio e faz o preço de hoje ser o da compra.
- **"Já sei que o preço mudou"** (`PATCH /insumos/:id` só com `precoMercado`): "Quanto custa hoje" (> 0) "Por quanto" (> 0, começa com a quantidade do último preço). Envia `precoMercado = valor ÷ quantidade`; a prévia é "Novo preço de hoje: R$ X/un". O custo médio e o estoque não mudam. Toast "Preço de hoje atualizado.".
- Com preço informado, **"Voltar ao preço da última compra"** pede confirmação ("O preço de hoje volta a ser R$ X/un.", botão "Voltar ao preço") e envia `precoMercado: null`.
- O cadastro continua pedindo o valor pago, com a dica "Conta como a primeira compra." (o backend cria a compra inicial). Na edição, a dica é "Mudar o valor ou a quantidade muda o preço de hoje, sem mexer no custo médio." (o backend trata a mudança como preço de mercado).

## Gastos indiretos

FE-10. Origem: `lib/features/gastos_indiretos/presentation/pages/gastos_indiretos_page.dart`, `lib/features/gastos_indiretos/presentation/cubit/gastos_indiretos_state.dart`. Backend: `services/catalog-service/src/modules/gastos-indiretos/`.

### Total

```text
totalContasDoMes = Σ gasto.valor, só dos gastos MENSAL
```

`calcularTotalContasDoMes` (FE-42). Os outros tipos têm outra unidade (reais por unidade, percentual da venda) e ficam fora da soma. O cartão "Total por mês" ("Contas do mês" até a FE-57, quando a tela passou a se chamar assim) mostra também a contagem: "1 conta" ou "N contas".

### Valor na lista

`formatValorDoGasto` (FE-42): `R$ 1.800,00 por mês`, `R$ 0,05 por unidade` ou `12% da venda` (a API guarda `0.12`; até 3 casas, sem zeros à direita).

### Percentual da venda

O formulário recebe pontos percentuais (`12`) e envia a fração (`0.12`, `percentualParaFracao`); na edição, a fração volta como `12`. Ao trocar o tipo, o rótulo e a máscara do campo do valor mudam (R$ ou %), e o valor digitado fica como está.

### Cobrança dupla do seu trabalho (FE-78)

O trabalho da dona entra pelo [valor da sua hora](#valor-da-sua-hora-fe-76) vezes o tempo de cada receita; uma conta do mês com o salário dela seria dividida pelas fornadas e cobraria o trabalho duas vezes. `lembraSeuTrabalho(descricao)` (`gastos-indiretos.calculos.ts`) reconhece o nome que lembra o trabalho dela:

- compara sem acento e sem maiúscula (`normalizarTexto`);
- por **palavra inteira** (limite de palavra `\b` da regex): "salário(s)", "pró-labore" (com hífen, espaço ou junto, e no plural), "retirada(s)", "meu(s)" e "minha(s)";
- "Meu salário", "SALARIO", "Pró-labore" e "Minha parte" avisam; "Luz", "Comunicação" e "Fermento" não avisam (a palavra inteira evita achar "meu" ou "minha" no meio de outro nome).

Aviso (só avisa, **não bloqueia** salvar):

| Onde                       | Quando                                                   | Texto                                                                                                                                                     |
| -------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lista, acima do total      | um aviso por conta com nome reconhecido                  | `“<descrição>”: Seu trabalho agora entra pelo valor da sua hora. Tire esta conta para não cobrar duas vezes.` e "Ver Ajustes de preço" (`/configuracoes`) |
| Formulário, abaixo do nome | enquanto o nome digitado é reconhecido (antes de salvar) | "Seu trabalho agora entra pelo valor da sua hora. Tire esta conta para não cobrar duas vezes." e "Ver Ajustes de preço"                                   |

O aviso usa o `Aviso` de `shared/ui/alert.tsx` (borda e fundo `warning`, ícone e texto). No formulário, fica num `<output>`, para o leitor de tela anunciar quando aparece.

### Validações

| Campo (contrato)             | Regra                           | Mensagem                                            | Origem                                                 |
| ---------------------------- | ------------------------------- | --------------------------------------------------- | ------------------------------------------------------ |
| `descricao`                  | obrigatória, até 100 caracteres | "Informe a descrição" / "Use até 100 caracteres"    | mobile; backend `@MaxLength(100)`                      |
| `tipo`                       | um dos três tipos               | —                                                   | Select com rótulo e descrição, padrão `MENSAL` (FE-42) |
| `valor`                      | número > 0                      | "Informe um valor válido"                           | FE-10; mobile e backend aceitam 0                      |
| `valor` (`PERCENTUAL_VENDA`) | menor que 100%                  | "Informe um percentual maior que 0 e menor que 100" | backend: fração menor que 1 (`validarGasto`)           |

### Textos

| Onde                 | Mobile                                                                                                                      | Web                                                                                                                                                                                      |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Título e subtítulo   | "Gastos Indiretos" / "Custos rateados automaticamente nas receitas"                                                         | "Contas do mês" / "Gás, luz, internet, aluguel, DAS do MEI e outros custos que entram no preço" (FE-57; "DAS do MEI" desde a FE-64)                                                      |
| Ação primária        | "Novo gasto"                                                                                                                | igual                                                                                                                                                                                    |
| Resumo               | "Total de gastos", "N item(s)"                                                                                              | "Total por mês", "1 conta" / "N contas" (FE-42; "Total por mês" desde a FE-57)                                                                                                           |
| Aviso                | "Alteracoes afetam o custo unitario de todas as receitas automaticamente."                                                  | "Alterações afetam o custo unitário de todas as receitas automaticamente."                                                                                                               |
| Título do formulário | "Novo gasto indireto" / "Editar gasto"                                                                                      | "Novo gasto" / "Editar gasto" (FE-57)                                                                                                                                                    |
| Apoio do formulário  | "Este gasto será rateado em todas as receitas."                                                                             | "Este gasto entra no custo de todas as receitas." (FE-42)                                                                                                                                |
| Rótulos              | "Descricao", "Valor (R$)", "Metodo de rateio"                                                                               | "Descrição", "Tipo" e o valor conforme o tipo ([`TipoGasto`](#tipogasto)); colunas "Descrição", "Tipo", "Valor"                                                                          |
| Confirmação          | "Excluir gasto" / `Deseja excluir "<descrição>"?\nIsso afetara o custo de todas as receitas.`                               | "Excluir gasto" / `Deseja excluir "<descrição>"? Isso afetará o custo de todas as receitas.`                                                                                             |
| Toasts               | — (o mobile só mostra erros)                                                                                                | "Gasto criado com sucesso.", "Gasto atualizado com sucesso.", "Gasto excluído com sucesso."                                                                                              |
| Vazio                | "Nenhum gasto cadastrado" / "Adicione agua, energia, gas, aluguel e outros custos para calcular o custo real das receitas." | "Nenhuma conta do mês ainda" / "Adicione gás, luz, internet, aluguel e o que mais você paga, para o preço cobrir tudo.", com a ilustração das contas e o botão "Adicionar conta" (FE-59) |
| Erro                 | "Nao foi possivel carregar os gastos."                                                                                      | "Não foi possível carregar os gastos."                                                                                                                                                   |

## Receitas: listagem

FE-11. Origem: `lib/features/receitas/presentation/pages/receitas_page.dart`, `lib/features/receitas/presentation/widgets/receita_card.dart`. Backend: `services/recipe-service/src/modules/receitas/`.

- Linha: nome; `<rendimento> <unidade> - custo <custoProducao>`; preço sugerido; margem (`margemLucro × 100`, 1 casa); custo unitário.
- Web: colunas Nome (link para o detalhe `/receitas/[receitaId]`, FE-44), Rendimento (`formatQuantidade`), Custo do lote (`custoProducao`, 1 lote), Custo unitário e Preço no Balcão (`precoSugerido`, `formatMoeda`), na ordem do backend (`dataCriacao` decrescente). A coluna Margem (markup) saiu na FE-44. "Nova receita" leva a `/receitas/nova` (FE-12).
- `custoProducao`, `custoUnitario` e `precoSugerido` podem **não vir** na resposta (o backend omite o campo quando é `null`; sem preço possível no Balcão, não há `precoSugerido`): exiba `—`.
- Ações: Editar (`/receitas/[receitaId]/editar`), Simular (`/receitas/[receitaId]/simular`, FE-20) e Excluir.

| Onde               | Mobile                                                                 | Web                                                                                                                                                                     |
| ------------------ | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Título e subtítulo | "Receitas" / "Gerencie insumos, rendimento, margem e custo automatico" | "Receitas" / "Quanto custa e quanto cobrar por cada uma" (FE-57)                                                                                                        |
| Ação primária      | —                                                                      | "Nova receita"                                                                                                                                                          |
| Busca              | "Buscar receita..."                                                    | "Buscar receita"                                                                                                                                                        |
| Confirmação        | "Excluir receita" / `Deseja excluir "<nome>"?`                         | igual                                                                                                                                                                   |
| Toast              | —                                                                      | "Receita excluída com sucesso."                                                                                                                                         |
| Vazio              | "Nenhuma receita encontrada."                                          | "Seu caderno de receitas está vazio" / "Crie a primeira receita e descubra quanto custa e quanto cobrar.", com a ilustração do caderno e o link "Criar receita" (FE-59) |
| Erro               | "Nao foi possivel carregar as receitas."                               | "Não foi possível carregar as receitas.", com "Tentar de novo"                                                                                                          |

## Receitas: formulário e custo

FE-12, refeita na FE-44 (ficha técnica e preço por canal). Origem: `receitas_page.dart` (`_openReceitaForm` e o diálogo de adicionar insumo). Backend: `src/modules/receitas/application/dto/create-receita.dto.ts`, `receita.dto.ts` e `domain/receitas.calculos.ts` do monolito (BE-27 e BE-28).

### Custo e preço: sempre da API

Desde a BE-27 o backend não grava custo: `custoUnitario`, `custoProducao`, `precoSugerido`, `custo` e `precos` são calculados na leitura, com os custos atuais. A web **não recalcula** nada disso e não tem mais prévia do custo da receita (a do "custo invisível" saiu na FE-44). Depois de salvar, o formulário leva ao detalhe da receita, que mostra os valores da API. Só fica no cliente o custo de cada item na linha do insumo (`calcularCustoItem`, `round2(quantidade × insumo.custoUnitario)`, o mesmo `custoCalculado` do backend).

As fórmulas do backend, para referência (não repetir na tela):

```text
custoUnitario = ((ingredientesLote + gastosMensaisLote + trabalhoLote) ÷ rendimento + embalagem + gastosPorUnidade) ÷ (1 − perda)
gastosMensaisLote = Σ gastos MENSAL × usoPorLote ÷ capacidadeMensal
trabalhoLote = minutosTrabalhoPorLote ÷ 60 × valorHora   (BE-46)
preço no canal = custoUnitario ÷ (1 − imposto − taxa do canal − gastos % da venda − lucro)
```

Com percentuais ≥ 100% não há preço possível no canal (`preco: null`, `motivo: 'PERCENTUAIS_ACIMA_DE_100'`). O lucro é fração do **preço**: o lucro da barra é exatamente o configurado (o da receita ou o `lucroPadrao` da empresa).

### Validações

| Campo (contrato)            | Regra                                                                                                                               | Mensagem                                        | Origem                                                         |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | -------------------------------------------------------------- |
| `nome`                      | obrigatório, até 80 caracteres                                                                                                      | "Informe o nome" / "Use até 80 caracteres"      | mobile; backend `@MaxLength(80)`                               |
| `rendimento`                | **inteiro** > 0 (unidades boas por lote)                                                                                            | "Obrigatório"                                   | backend `@IsInt @IsPositive`; o mobile aceitava decimal        |
| `unidadeRendimento`         | `UnidadeMedida`                                                                                                                     | —                                               |                                                                |
| `uso_por_lote`              | número > 0; começa em 1                                                                                                             | "Informe um valor maior que zero"               | backend `@IsPositive` (BE-27)                                  |
| `embalagem_por_unidade`     | opcional, ≥ 0, em reais; vazio envia 0                                                                                              | "Valor inválido"                                | backend `@Min(0)`                                              |
| `perda_percentual`          | opcional, de 0 até menos de 100%; digitada em %, enviada em fração; vazio 0                                                         | "Informe um percentual de 0 a 99"               | backend `validarFichaTecnica`                                  |
| `lucro_percentual`          | opcional, de 0 até menos de 100%; vazio envia `null` (lucro padrão)                                                                 | "Informe um percentual de 0 a 99"               | backend `validarFichaTecnica`; `null` no `PUT` volta ao padrão |
| `minutos_trabalho_por_lote` | digitado em "Horas" e "Minutos", cada um opcional e ≥ 0 (decimal permitido); enviado em minutos (`horas × 60 + minutos`); vazio é 0 | "Valor inválido"                                | backend ≥ 0, finito (BE-45)                                    |
| `insumos[].insumo_id`       | insumo do catálogo, sem repetir                                                                                                     | —                                               | o diálogo só oferece insumos que ainda não estão na receita    |
| `insumos[].quantidade`      | número > 0 (mínimo do backend: 0,001)                                                                                               | no diálogo: "Obrigatório"; na linha: "Inválido" | mobile; backend `@Min(0.001)`                                  |

A web não envia o `margem_lucro` legado (markup): o campo "Margem de lucro (%)" saiu na FE-44. Na edição, `lucroPercentual` omitido (receita no lucro padrão) e embalagem ou perda iguais a 0 aparecem vazios. Os minutos salvos voltam em horas cheias e o resto em minutos (`minutosParaHorasEMinutos`: 80 vira 1 h 20 min; zero fica vazio).

### Detalhe da receita (`/receitas/[receitaId]`)

- "Custo de 1 unidade": `custo.unitario`, com Ingredientes, Contas do mês, Gastos por unidade (só se > 0), Embalagem, Perdas e "Custo do lote (<rendimento>)" (`custoProducao`), mais "Lucro desta receita: <x%> de cada R$ 1,00 vendido", com "(padrão da empresa)" quando a receita não tem lucro próprio.
- "Seu trabalho" (FE-77), logo depois de Contas do mês: `custo.trabalho` por unidade, com "R$ <trabalhoLote> no lote (<tempo>)" embaixo (`formatTempoDeTrabalho`: "1 h 20 min", "40 min", "2 h"). Some quando `custo.trabalhoLote` é 0 (sem minutos ou com o valor da hora em 0, `mostrarSeuTrabalho`). Exemplo (critério da FE-77): valor da hora R$ 18,75 e lote de 40 min que rende 50 un dão R$ 12,50 no lote e R$ 0,25 por unidade.
- "Preço sugerido por canal": um cartão por item de `precos` (canais **ativos**, Balcão primeiro), lado a lado, com o preço (`formatMoeda`) e "Para onde vai cada R$ 1,00".
- A barra (`montarBarraDoPreco`, `receitas.calculos.ts`) usa a `composicao` da API, só somando partes: Ingredientes (`ingredientes`), Contas do mês (`gastosMensais`), Seu trabalho (`trabalho`, FE-77), Embalagem e perdas (`embalagem + gastosPorUnidade + perdas`), Imposto, "Taxa da maquininha" no Balcão ou "Taxa do <canal>" nos outros (`taxaCanal`), Gastos em % da venda (`gastosPercentuais`) e Lucro. Parte com fração 0 não aparece, menos o lucro. A legenda mostra cada fração como reais de cada R$ 1,00 e em % (`R$ 0,15 (15,0%)`); a barra é só visual.
- Canal sem preço (`avisoSemPrecoPossivel`, FE-57): "Não existe preço que pague tudo: as taxas e o lucro já somam <percentuais> do preço. Diminua o lucro da receita ou as taxas em Ajustes de preço."
- Sem canal ativo: "Nenhuma forma de venda ativa. Ative uma em Ajustes de preço."
- Receita não vendida sozinha (FE-77): o custo por g, ml ou un para usar dentro de outra já inclui o trabalho dela (BE-46); com trabalho, o texto diz "Custo para usar dentro de outra receita (já com o seu trabalho):".
- Exemplo do seed (Pão Francês, 28 un, 0,2 fornada por lote, perda de 5%, lucro padrão de 15%): custo de R$ 0,38 por unidade, R$ 0,46 no Balcão e R$ 0,55 no iFood, com lucro de 15,0% nos dois.

### Textos

| Onde                           | Mobile                                                              | Web                                                                                                                                                                                                                                                                                                                                                   |
| ------------------------------ | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Título                         | "Nova receita" / "Editar receita"                                   | igual                                                                                                                                                                                                                                                                                                                                                 |
| Rótulos                        | "Nome", "Rendimento", "Unidade", "Margem de lucro (%)", "Insumos"   | "Nome", "Rende quantas unidades boas?", "Unidade", "Ingredientes e embalagens" (FE-57)                                                                                                                                                                                                                                                                |
| Ficha técnica (FE-44)          | —                                                                   | cartão "Custos e lucro": "Quantas fornadas um lote ocupa?" (ou "Quantos minutos de forno um lote ocupa?", conforme a `baseRateio`), "Embalagem por unidade", "Quanto costuma sobrar ou estragar?", "Lucro desta receita"                                                                                                                              |
| Textos de apoio (FE-44)        | —                                                                   | "Por lote, sem contar as que sobram ou estragam."; "Divide as contas do mês entre as receitas. Padrão: 1."; "Caixa, pote ou saquinho de cada unidade."; "Das unidades de cada lote. Vazio é 0%."; "De cada R$ 1,00 vendido. Vazio usa o padrão (<lucro padrão>)."                                                                                     |
| Botão de adicionar             | "Adicionar insumo" / "Todos os insumos adicionados" (desabilitado)  | "Adicionar ingrediente" / "Todos os ingredientes adicionados" (desabilitado) (FE-57)                                                                                                                                                                                                                                                                  |
| Diálogo de adicionar           | "Adicionar insumo", "Insumo", "Quantidade", "Cancelar", "Adicionar" | "Adicionar ingrediente", "Ingrediente", "Quantidade", "Cancelar", "Adicionar", com "Na unidade do ingrediente (<unidade>)."                                                                                                                                                                                                                           |
| Insumo fora do catálogo        | "Insumo #<id>"                                                      | "Ingrediente #<id>"                                                                                                                                                                                                                                                                                                                                   |
| Lista vazia                    | "Nenhum insumo adicionado."                                         | "Nenhum ingrediente adicionado."                                                                                                                                                                                                                                                                                                                      |
| Botão                          | "Salvar" / "Atualizar"                                              | igual; depois de salvar, abre o detalhe da receita                                                                                                                                                                                                                                                                                                    |
| Toasts                         | —                                                                   | "Receita criada com sucesso." / "Receita atualizada com sucesso."                                                                                                                                                                                                                                                                                     |
| Sair com alterações não salvas | —                                                                   | ConfirmDialog "Descartar alterações?" / "As alterações não salvas serão perdidas." / "Descartar"                                                                                                                                                                                                                                                      |
| Linha do insumo                | nome e unidade                                                      | nome, "Custo: R$ X", quantidade com a unidade e "Remover <nome>"                                                                                                                                                                                                                                                                                      |
| Tempo de trabalho (FE-77)      | —                                                                   | "Tempo de trabalho por lote", com "Horas" (h) e "Minutos" (min); ajuda "Quanto tempo você fica ocupada com esta receita: preparar, mexer, montar, embalar. Não conte o tempo em que ela fica sozinha no forno ou na geladeira."; na receita que usa outras, "Conte só o tempo de montar. O tempo das receitas que vão dentro já está no custo delas." |
| Detalhe (FE-44)                | —                                                                   | subtítulo "Custo de cada unidade e preço em cada lugar onde você vende"; "Voltar para receitas", "Simular", "Editar"; "Custo de 1 unidade", "Preço sugerido por canal", "Para onde vai cada R$ 1,00"; erro "Não foi possível carregar a receita."                                                                                                     |

### Receita dentro de receita (FE-70)

Backend: BE-39 e BE-40 (`create-receita.dto.ts`, `validarItensDaReceita` e `validarMudancaDeUnidade` de `receitas.calculos.ts` do monolito). Exemplo do seed: o **Brownie Dois Amores** leva 1 Brownie (un), 150 g de Brigadeiro preto, 150 g de Brigadeiro branco e 30 g de Leite em Pó Ninho.

- **Corpo**: `receitas: [{ receita_id, quantidade }]` e `vendavel` no `POST` e no `PUT /receitas/:id`; a web envia sempre os dois, com `insumos`. A `quantidade` é por lote, na unidade em que a receita usada rende (`unidadeRendimento`), e precisa ser > 0 (`@IsPositive`). Sem repetir a receita ("Receita repetida", garantia final; o diálogo já não oferece de novo).
- **Quem pode entrar** (`receitasQuePodemEntrar`, `receitas.calculos.ts`): todas as receitas da empresa menos a própria, as que já têm receitas dentro (um nível só) e as que já estão na lista. As não vendidas sozinhas também entram.
- **Quem não pode levar receitas** (`motivoSemReceitasDentro`): a receita que já vai dentro de outra (`usadaEm` não vazio). O botão "Adicionar receita" fica desabilitado, com o motivo embaixo; o mesmo acontece, sem texto, quando não há receita para oferecer.
- **Unidade do rendimento**: desabilitada quando a receita vai dentro de outra (o backend responde 409 `RECEITA_EM_USO` se mudar).
- **Lista do formulário**: ingredientes e receitas numa lista só (ingredientes primeiro), com o selo "receita" nas receitas. O custo da linha da receita é `round2(quantidade × receitas[].custoUnitario)` da API (BE-40, só ingredientes, forno e perda) e aparece só nas receitas já salvas: a web não recalcula o custo de uma receita (regra 10).
- **Vendável**: chave "Vendo esta receita sozinha", ligada por padrão. Desligada, a receita só vai dentro de outras (sem preço; a lista, o detalhe e as vendas são da FE-71 e da FE-72).
- O formulário não exige ao menos um item: com a receita vazia, o backend responde 400 `DADOS_INVALIDOS`, como antes.

| Onde                                        | Texto                                                                                                                                                                                                                   |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Botão                                       | "Adicionar receita", ao lado de "Adicionar ingrediente"                                                                                                                                                                 |
| Apoio embaixo dos botões                    | "Brigadeiro, recheio ou massa que você já cadastrou também pode entrar: é a receita dentro de receita." (Pitada `receita-dentro-de-receita`)                                                                            |
| Motivo do botão bloqueado                   | "A receita <nome> já vai dentro de <A, B e C>, então não pode levar outras receitas."                                                                                                                                   |
| Diálogo                                     | "Adicionar receita", "Receita", "Quantidade" (com a unidade do rendimento), "Cancelar", "Adicionar"; dica "A receita de <nome> rende <rendimento> <unidade>. Quanto vai em 1 lote desta?" (`dicaDaQuantidadeDaReceita`) |
| Selo na linha                               | "receita"                                                                                                                                                                                                               |
| Chave                                       | "Vendo esta receita sozinha", com "Desligue se ela só vai dentro de outras receitas, como um recheio."                                                                                                                  |
| Unidade bloqueada                           | "Não muda: esta receita vai dentro de outra."                                                                                                                                                                           |
| 422 `RECEITA_USA_ELA_MESMA`                 | "Uma receita não pode ir dentro dela mesma."                                                                                                                                                                            |
| 422 `RECEITA_DENTRO_DE_RECEITA_COM_RECEITA` | "Só dá para pôr dentro uma receita feita só de ingredientes. E uma receita que já vai dentro de outra não pode levar receitas."                                                                                         |
| 409 `RECEITA_EM_USO` (no formulário)        | "Esta receita já vai dentro de outra, então a unidade do rendimento não pode mudar."                                                                                                                                    |

As mensagens trocam o texto do backend pelo `code` (`traduzirErroDaReceita`, `receita-form.schema.ts`), só no formulário.

### Receita dentro de receita: detalhe e lista (FE-71)

Backend: BE-40 (`custo`, `receitas[].custoUnitario` e `custoCalculado`, `precos: []` com `vendavel: false`) e o 409 `RECEITA_EM_USO` do `DELETE` (BE-39).

- **Ingredientes de 1 lote** (detalhe): os ingredientes (nome do catálogo, quantidade na unidade do insumo, `itens[].custoCalculado`) e depois as receitas usadas (nome com link para o detalhe dela e o selo "receita", quantidade na unidade do rendimento, `receitas[].custoCalculado`), com "Total dos ingredientes" = `custo.ingredientesLote`, que já soma as receitas (no seed, Brownie Dois Amores: R$ 1,73 + 1,80 + 3,70 + 3,62 = R$ 10,85). Nada é recalculado.
- **Vai dentro de** (detalhe): com `usadaEm` não vazio, "Vai dentro de: <A>, <B>", cada nome com link.
- **Não vendida sozinha** (`vendavel: false`; `precoOuNaoVendida`, `receitas.calculos.ts`): no lugar de "Preço sugerido por canal", um cartão com o selo "Só vai dentro de outras", "Esta receita não é vendida sozinha. O custo dela entra nas receitas onde ela vai." e "Custo para usar dentro de outra receita: R$ 0,0241/g" (`formatCustoUnitario`, na unidade do rendimento). O custo é o `custoUnitario` do item na receita que a usa (`custoParaUsarDentro`; ver a lacuna 29 de [api-integration.md](api-integration.md#lacunas-do-backend)). Somem o botão "Simular" (detalhe e lista) e a linha "Lucro desta receita"; o subtítulo vira "Do que é feita e quanto custa".
- **Lista**: selo "Só vai dentro de outras" ao lado do nome e `—` no Preço no Balcão. Filtro "Todas", "Vendo sozinha" e "Só vai dentro de outras" (`passaNoFiltroDeVenda`), em `?tipo=vendo|dentro` (`receitasSearchSchema`); vazio pelo filtro: "Nenhuma receita vendida sozinha." / "Nenhuma receita só vai dentro de outras.", com "Ver todas".
- **Excluir receita usada em outra** (`motivoParaNaoExcluir`): no lugar da confirmação, o diálogo "Não dá para excluir esta receita" com "A receita <nome> vai dentro de <A e B>. Tire ela de lá antes de excluir.", um link para cada receita e o botão "Entendi". O `DELETE` não é chamado (a API daria 409 `RECEITA_EM_USO`).

### Receita dentro de receita: produção, vendas e avisos (FE-72)

Backend: BE-41 (`receitasUsadas` na `Producao`, `estoqueNegativo` e `vendavel` em `GET /estoque/produtos`, `produtosNegativos` em `GET /alertas` e o 422 `RECEITA_NAO_VENDIDA_SOZINHA` em `POST /vendas`). Produzir uma receita com receitas dentro tira cada uma do estoque pronto dela; o saldo pode ficar negativo (permitido, com aviso).

```
vai usar     = round6(quantidade por lote × lotes)    // na unidade do rendimento da receita usada
você tem     = saldo pronto (GET /estoque/produtos), 0 se ela nunca teve produção
saldo depois = round6(você tem − vai usar)            // < 0: aviso amarelo, sem bloquear
```

- **Anotar fornada** (`calcularUsoDoEstoquePronto`, `producoes.calculos.ts`): com uma receita com receitas dentro e os lotes preenchidos, o bloco "Sai do estoque pronto" mostra, por receita usada, "Vai usar 300 g de Brigadeiro branco; você tem 0 g.". Se o saldo for ficar negativo, a caixa amarela (`warning`) "Registre antes a produção de Brigadeiro branco." com "Se anotar assim, o estoque pronto fica em -300 g.". O botão continua liberado. A conta é só a prévia: o saldo gravado é o do backend.
- **Seu trabalho na fornada (FE-77)**: o detalhe mostra "Seu trabalho" com o `custoTrabalho` gravado (já somado ao custo total, BE-47) quando ele vem; nas produções antigas (`null`) a linha não aparece.
- **Detalhe da fornada**: com `receitasUsadas` não vazio, a seção "Receitas usadas (saíram do estoque pronto)", com o nome e a quantidade gravados (na unidade do rendimento), antes da "Parte das contas do mês".
- **Vendas**: a lista "Receita" de "Adicionar produto" não oferece a receita com `vendavel: false` (`receitasParaVender`, `vendas.calculos.ts`); o backend responderia 422 `RECEITA_NAO_VENDIDA_SOZINHA`.
- **Estoque pronto** (tela Estoque, seção "Receitas prontas", `montarEstoquePronto`, `estoque.calculos.ts`): um cartão por receita de `GET /estoque/produtos`, com o nome e "Disponível". A receita vendida mostra "un"; a que só vai dentro de outras, a unidade do rendimento (g, ml). Negativas primeiro, depois por nome. Com `estoqueNegativo`, o selo "Estoque negativo", "Disponível" em `danger` e o link "Registrar produção" (`/producoes?novo=1&receitaId=<id>`, que abre "Anotar fornada" com a receita escolhida). Sem saldo nenhum: "Nenhuma receita pronta ainda. Anote uma fornada para ela aparecer aqui.".
- **Aviso ao entrar**: o grupo `produtosNegativos` ([Aviso ao entrar](#aviso-ao-entrar)).

## Estoque de insumos

FE-13. Origem: `lib/features/estoques/domain/entities/estoque_com_insumo.dart`, `lib/features/estoques/presentation/widgets/estoque_card.dart`, `lib/features/estoques/presentation/pages/estoques_page.dart`, `lib/features/estoques/data/datasources/estoque_remote_datasource.dart`. Backend: `services/operations-service/src/modules/estoque/`.

### Composição dos dados

O mobile lista `GET /insumos` e, para cada insumo, `GET /estoque/insumos/:id`, em sequência. Desde a FE-39, a web faz duas chamadas para a lista inteira: `GET /insumos` (nome e unidade) e `GET /estoque/insumos` (saldo, mínimo e data de alteração), juntadas pelo `insumoId` em `useEstoques` (lacuna 5, resolvida). Um insumo sem registro de estoque (não acontece no monolito) mostra "Não foi possível carregar o estoque deste insumo." no cartão.

### Fórmulas

```text
isBaixoEstoque = quantidadeDisponivel < quantidadeMinima
percentual     = quantidadeMinima > 0 ? quantidadeDisponivel / quantidadeMinima × 100
               : quantidadeDisponivel < 0 ? 0 : 100     // saldo negativo com mínimo 0: 0 (FE-47)
status         = isBaixoEstoque ? 'Acabando' : percentual < 50 ? 'Baixo' : 'Adequado'   // 'Crítico' até a FE-57
barra          = clamp(percentual / 100, 0, 1)
```

- Como `Baixo` exige `percentual < 50`, e isso já implica `quantidadeDisponivel < quantidadeMinima`, o status **Baixo nunca aparece** com a regra atual do mobile: tudo abaixo do mínimo é Acabando (o antigo Crítico). A web reproduz a regra como está (critério da FE-13: "confere com o mobile") e mantém o ramo, que fica testado.
- Mínimo 0 (todo insumo criado pela API nasce com `quantidadeMinima = 0`) dá percentual 100 e status Adequado. O mínimo é definido no cartão, em "Definir mínimo" (FE-39, abaixo).
- O percentual é exibido sem casas (`toStringAsFixed(0)`): `86%`.
- `isBaixoEstoque` também é usado pelo painel (FE-22): as fórmulas ficam em `src/shared/domain/estoque.ts`. Como o ramo Baixo é inalcançável com números reais, ele é testado por `classificarStatusEstoque(baixoEstoque, percentual)`.

| Status   | Token     | Condição          |
| -------- | --------- | ----------------- |
| Acabando | `danger`  | `isBaixoEstoque`  |
| Baixo    | `warning` | `percentual < 50` |
| Adequado | `success` | demais casos      |

### Textos

| Onde               | Mobile                                                       | Web                                                                                                                                                                             |
| ------------------ | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Título e subtítulo | "Estoque" / "Acompanhe disponibilidade e alertas"            | "Estoque" / "O que tem na sua despensa" (FE-57)                                                                                                                                 |
| Ação               | "Atualizar"                                                  | igual (refaz as consultas)                                                                                                                                                      |
| Busca              | "Buscar insumos..."                                          | "Buscar ingredientes", pelo nome e sem acentos, em `?q=`; sem resultado, "Nenhum resultado para "<termo>"" com "Limpar busca" (FE-23)                                           |
| Cartão             | "Disponível", "Mínimo", `<quantidade> <unidade>` com 2 casas | "Disponível", "Mínimo", "Atualizado em dd/mm/aaaa" (a data não aparece no mobile)                                                                                               |
| Ação do cartão     | "Registrar entrada"                                          | igual                                                                                                                                                                           |
| Filtro             | "Status": "Todos" / "Baixo"; chip "Baixo Estoque" e "Limpar" | "Status": "Todos" / "Acabando"; chip "Acabando" e "Limpar" (FE-57); `baixo=1` na URL                                                                                            |
| Vazio              | "Nenhum estoque encontrado" / "Comece adicionando insumos"   | "Sua despensa está vazia" / "Comece cadastrando os ingredientes que você compra.", com a ilustração da despensa e o link "Adicionar ingrediente" para `/insumos?novo=1` (FE-59) |
| Erro               | "Erro ao carregar estoques" / "Tentar Novamente"             | "Não consegui buscar o estoque agora." / "Tentar de novo"                                                                                                                       |
| Erro em um insumo  | —                                                            | "Não foi possível carregar o estoque deste insumo." no próprio cartão (falha de uma das duas consultas vira o erro da tela)                                                     |

O filtro "Acabando" (o "Baixo" do mobile) mostra os itens com `isBaixoEstoque`. Na web, um item sem saldo continua visível com o filtro ativo, porque sem o saldo não dá para saber se ele está abaixo do mínimo.

- Vazio por filtro (só na web): "Nenhum estoque encontrado" / "Nenhum ingrediente acabando.", com "Limpar filtro".
- A ação do vazio é o link "Adicionar ingrediente" (`/insumos?novo=1`), no lugar do "Atualizar" do mobile, que continua no cabeçalho.
- O percentual aparece com `formatNumero(percentual, 0)` + `%` (`500%`) e as quantidades com `formatQuantidade` (`10 kg`), em vez das 2 casas fixas do mobile.
- Ações do cartão (FE-14): "Registrar entrada" (só com o saldo carregado, porque o diálogo mostra a quantidade atual) e "Histórico", que abre a gaveta de movimentações. No mobile, tocar no cartão ou no menu ⋮ abre a entrada; a web usa botões visíveis.

## Entrada de estoque e histórico

FE-14. Origem: `lib/features/estoques/presentation/widgets/registrar_entrada_modal.dart`, `lib/features/estoques/presentation/cubit/estoques_cubit.dart`, `movimentacao_estoque.dart`. Backend: `services/operations-service/src/modules/estoque/application/dto/registrar-entrada-estoque.dto.ts`.

- Corpo: `{ quantidade, observacao? }`, com `quantidade > 0` e a observação opcional, aparada e com até 200 caracteres ("Use até 200 caracteres"); vazia não é enviada (`toRegistrarEntradaBody`). O campo "Observação" (dica "Ex.: Compra de reposição, NF 4521") existe desde a FE-39 (lacuna 22, resolvida), e o histórico mostra a observação abaixo da data.
- Prévia do saldo: `saldoAposEntrada(quantidadeDisponivel, quantidade)` = `quantidadeDisponivel + quantidade`, arredondado a 6 casas para tirar o ruído de ponto flutuante (`entrada-estoque.schema.ts`). Com o campo vazio ou inválido, a prévia mostra o saldo atual.
- Depois da entrada, a web invalida `estoque` (saldo, status, histórico e painel) e `insumos`. A API grava tudo na mesma transação, então não há mais a segunda revalidação 2 s depois.
- Histórico: gaveta "Histórico" (o mobile busca as movimentações, mas não tem tela), com `GET /estoque/insumos/:id/movimentacoes`, já ordenado da mais recente para a mais antiga. Cada item: ícone de seta (para baixo em Entrada, verde; para cima em Saída, vermelha), tipo, origem, data `dd/mm/aaaa` e quantidade com sinal e unidade: `+` em Entrada, `−` em Saída. Referência: em `PRODUCAO`, "Fornada #<referenciaId>" (ex.: "Fornada #12", FE-57); em `COMPRA`, sem referência.
- **Definir mínimo** (FE-39, só na web; lacuna 14, resolvida): botão "Definir mínimo" no cartão (com o saldo carregado), que abre "Definir Estoque Mínimo" com o nome do insumo, o disponível, o campo "Estoque mínimo" (começa com o mínimo atual, aceita 0; dica "Abaixo deste valor, o ingrediente aparece como Acabando."; erro "Digite uma quantidade válida") e "Salvar". Envia `PATCH /estoque/insumos/:id/minimo` com `{ quantidadeMinima }` (`estoque-minimo.schema.ts`), mostra "Estoque mínimo atualizado com sucesso." e invalida `estoque` e `insumos`.
- Não existe endpoint para corrigir o saldo (`atualizarEstoque` lança `UnsupportedError` no mobile). Não crie essa ação.

| Onde            | Mobile                                                         | Web                                                  |
| --------------- | -------------------------------------------------------------- | ---------------------------------------------------- |
| Título          | "Registrar Entrada"                                            | igual                                                |
| Informações     | "Insumo", "Quantidade Atual", "Mínimo"                         | "Ingrediente", "Quantidade Atual", "Mínimo"          |
| Campo           | "Quantidade a Adicionar", dica "Ex: 10.5"                      | "Quantidade a Adicionar", dica "Ex.: 10,5"           |
| Validação       | "Digite uma quantidade válida" (o mobile não aceitava vírgula) | igual, aceitando vírgula                             |
| Prévia          | —                                                              | "Saldo após a entrada: <quantidade> <unidade>"       |
| Botão           | "Confirmar Entrada"                                            | igual                                                |
| Sucesso         | "Entrada de estoque registrada com sucesso"                    | "Entrada de estoque registrada com sucesso."         |
| Erro            | "Erro ao registrar entrada: <erro>"                            | `getErrorMessage(error)` no diálogo                  |
| Histórico vazio | —                                                              | "Nenhuma movimentação registrada."                   |
| Histórico       | —                                                              | título "Histórico", com o nome do insumo             |
| Histórico, erro | —                                                              | "Erro ao carregar o histórico", com "Tentar de novo" |

## Produções e rateio

FE-15. Origem: `lib/features/producoes/presentation/pages/producoes_page.dart`, `lib/features/producoes/presentation/cubit/producoes_cubit.dart`, `lib/features/producoes/data/datasources/producao_remote_datasource.dart`. Backend: `services/operations-service/src/modules/producoes/application/services/producao.service.ts`.

### Fórmulas do backend (para a prévia e o detalhe)

```text
totalUnidades = lotes × receita.rendimento
valorRateado  = round2(valor × usoPorLote × lotes ÷ capacidadeMensal), só dos gastos MENSAL
```

- Desde a FE-42 (BE-26 e BE-30 do monolito), só a conta do mês (`MENSAL`) entra na produção, dividida pela capacidade do mês (`capacidadeMensal` da configuração de custos) conforme o uso de forno do lote (`usoPorLote` da receita; 1 se ausente). Os gastos por unidade e os percentuais da venda ficam no custo da receita e da venda. Os chips do formulário mostram só as contas do mês; sem a configuração de custos, a prévia mostra só o total de unidades.
- Exemplo do seed (capacidade de 100 fornadas): 2 lotes de uma receita com `usoPorLote` 1 → energia R$ 450 = R$ 9,00; aluguel R$ 1.800 = R$ 36,00.
- A prévia do formulário é informativa: mostra o total de unidades e o rateio estimado por gasto. O valor gravado é o devolvido pelo backend.

### Seleção de gastos

| Escolha           | Corpo enviado                                                                                           |
| ----------------- | ------------------------------------------------------------------------------------------------------- |
| "Todos" (padrão)  | `{ receita_id, quantidade }`, **sem** `gasto_indireto_ids`: o backend rateia todos os gastos da empresa |
| Seleção de gastos | `{ receita_id, quantidade, gasto_indireto_ids: [ids] }`                                                 |

Origem: `_submeter` em `producoes_page.dart` (`_selecionarTodosGastos ? null : _gastosSelecionados`). Com "Todos" desmarcado e nenhum gasto escolhido, o mobile envia `[]` (nenhum rateio); a web faz o mesmo, mostrando "Nenhuma conta do mês entra nesta fornada." na prévia.

### Validações e textos

| Onde               | Mobile                                                                                   | Web                                                                                                                                                       |
| ------------------ | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Título e subtítulo | "Produções" / "Registre e acompanhe suas produções"                                      | "Fornadas" / "O que você produziu" (FE-57)                                                                                                                |
| Ação primária      | "Nova Produção"                                                                          | "Nova fornada"                                                                                                                                            |
| Linha              | nome da receita ou "Receita #<id>"; "N lote(s) · dd/mm/aaaa"; custo total; `R$ X/un`     | igual: "1 lote" / "N lotes"                                                                                                                               |
| Formulário         | "Registrar Produção" / "Informe quantos lotes foram produzidos"                          | "Anotar fornada" / "Informe quantos lotes foram produzidos"                                                                                               |
| Receita            | "Receita", obrigatória: "Selecione uma receita"                                          | igual                                                                                                                                                     |
| Lotes              | "Quantidade de lotes", inteiro > 0: "Informe a quantidade de lotes"                      | igual                                                                                                                                                     |
| Gastos             | "Gastos indiretos", interruptor "Todos" e um chip por gasto                              | "Contas do mês": chip "Todos" e um chip por conta do mês (FE-15, FE-42)                                                                                   |
| Botão              | "Registrar Produção"                                                                     | "Anotar fornada"                                                                                                                                          |
| Sucesso            | "Produção registrada com sucesso"                                                        | "Fornada anotada."                                                                                                                                        |
| Vazio              | "Nenhuma produção registrada" / "Registre sua primeira produção tocando no botão abaixo" | "Nenhuma fornada anotada" / "Anote a primeira fornada para o estoque e o custo baterem.", com a ilustração do forno e o botão "Registrar fornada" (FE-59) |
| Erro               | "Erro ao carregar produções" e a mensagem                                                | "Não consegui buscar suas fornadas agora.", com "Tentar de novo"                                                                                          |
| Filtro             | —                                                                                        | Select "Receita", com "Todas as receitas" (`receitaId` na URL)                                                                                            |
| Vazio no filtro    | —                                                                                        | "Nenhuma fornada desta receita"                                                                                                                           |
| Prévia             | —                                                                                        | "Total de unidades", "Parte das contas do mês nesta fornada" por conta e "Total das contas"; sem conta, "Nenhuma conta do mês entra nesta fornada."       |
| Detalhe            | —                                                                                        | Drawer com os custos, o total de unidades e os rateios (abaixo)                                                                                           |

Chips de gastos (web): escolher um gasto desmarca "Todos" e fica só com os gastos escolhidos; marcar "Todos" limpa a seleção. O formulário já vem com a receita do filtro da lista.

Detalhe (web): "Total de unidades", "Custo total", "Custo unitário" e "Parte das contas do mês" (descrição gravada do gasto; sem rateio, "Nenhuma conta do mês nesta fornada."); coluna "Fornada" na lista e erro "Não consegui buscar a fornada agora.". O total de unidades e a descrição de cada rateio são os gravados pela API na produção (`totalUnidades` e `rateios[].descricao`; lacuna 23, resolvida na FE-39).

O backend **não** bloqueia produção com estoque de insumo insuficiente: o saldo fica negativo (ver [lacunas](api-integration.md#lacunas-do-backend)). Mesmo assim, a tela mostra no formulário qualquer erro devolvido.

## Vendas: carrinho

FE-16. Origem: `lib/features/vendas/presentation/pages/vendas_page.dart` (`_buildAddItemForm`, `_onReceitaChanged`, carrinho, `_registrarVenda`, `_friendlyError`), `lib/features/vendas/presentation/cubit/vendas_state.dart` (`ItemCarrinho`), `lib/features/vendas/domain/entities/venda.dart` (`CreateVendaRequest`). Backend: `services/sales-service/src/modules/vendas/application/dto/create-venda.dto.ts`.

### Fórmulas

```text
subtotal = quantidade × precoUnitario
total    = Σ subtotal                       // o backend grava round2(Σ quantidade × preco_unitario_real)
```

- Ao escolher a receita, o preço é preenchido com o preço sugerido **no canal da venda** (FE-46, `receita.precos[].preco` do canal; antes, o `precoSugerido`) quando ele for > 0; senão, o campo fica vazio (`_onReceitaChanged`). O usuário pode alterar.
- Corpo: `{ canal_id?, itens: [{ receita_id, quantidade, preco_unitario_real }] }`. `quantidade` é **inteira** (`@IsInt`) e `preco_unitario_real` tem no máximo 2 casas (`@IsNumber({ maxDecimalPlaces: 2 })`): arredonde com `arredondarCentavos` antes de enviar.
- O carrinho vive só no estado do componente. Recarregar a página o descarta.
- Adicionar a mesma receita de novo cria outra linha, como no mobile.
- A venda nasce `PENDENTE`. Depois de criar, a tela limpa o carrinho e abre a confirmação (FE-17) com a venda devolvida.

### Validações e textos

| Onde                  | Mobile                                                                                      | Web                                                                                                                |
| --------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Título e subtítulo    | "Vendas" / "Registre vendas e acompanhe o histórico"                                        | igual                                                                                                              |
| Abas                  | "Registrar" / "Historico"                                                                   | "Registrar" / "Histórico"                                                                                          |
| Atalho                | "Produção"                                                                                  | "Fornadas", para `/producoes` (FE-57)                                                                              |
| Cartão                | "Adicionar produto"                                                                         | igual                                                                                                              |
| Produto               | "Produto/Receita": "Selecione um produto"                                                   | igual                                                                                                              |
| Quantidade            | "Quantidade" > 0: "Informe a quantidade" (aceitava decimal)                                 | igual, só inteiro                                                                                                  |
| Preço                 | "Preço unitário real" > 0: "Informe o preço"                                                | igual, 2 casas                                                                                                     |
| Botão                 | "Adicionar ao carrinho"                                                                     | igual                                                                                                              |
| Carrinho              | "Carrinho", "N item(ns)" ("1 item" / "N itens"); linha `qtd × R$ preço` e subtotal; "Total" | igual                                                                                                              |
| Registrar             | "Registrar Venda", desabilitado com carrinho vazio ou durante o envio                       | igual                                                                                                              |
| Sessão expirada (401) | "Sessão expirada. Faça login novamente."                                                    | tratado pelo cliente da API (FE-05/FE-07)                                                                          |
| Estoque insuficiente  | "Estoque insuficiente para registrar a venda. Cadastre a produção do item em Produções."    | "Estoque insuficiente para registrar a venda. Anote a fornada do produto em Fornadas.", com link para `/producoes` |
| Outros erros          | mensagem do backend                                                                         | `getErrorMessage(error)`                                                                                           |

Na web (FE-16):

- Os erros do registro aparecem num `Alert` dentro do cartão do carrinho (o mobile usa `SnackBar`), e o carrinho é mantido. No estoque insuficiente, o `Alert` traz o link "Ir para Fornadas" (a ação "Produção" do `SnackBar`).
- Carrinho vazio: o cartão continua visível, com "0 itens", "Adicione produtos para registrar a venda." e "Registrar Venda" desabilitado (o mobile esconde o cartão).
- O carrinho fica no componente da tela, não na aba: trocar de aba não o descarta; recarregar, sim.
- Depois de registrar, a tela abre a confirmação (FE-17); o Toast provisório "Venda #<id> registrada como pendente." saiu.
- A aba "Histórico" é a da FE-18 ([histórico e resumo](#vendas-histórico-e-resumo)).

### Canal da venda ("Onde vendeu?", FE-46)

Sem equivalente no mobile. Backend: `POST /vendas` com `canal_id` (BE-30); omitido, o backend grava o Balcão.

- "Onde vendeu?" fica no cartão "Adicionar produto" e vale para a venda inteira. Opções: só os canais **ativos** de `GET /canais`, na ordem da API; padrão, o Balcão (sem Balcão ativo, o primeiro ativo). Na web: `canaisParaVenda`, `canalPadrao`, `canalDaVendaSchema` e `precoSugeridoNoCanal` (`item-venda.schema.ts`) e `toCreateVendaBody(itens, canalId)`.
- Com itens no carrinho, o canal fica travado ("Para trocar o canal, esvazie o carrinho."): os preços sugeridos são do canal escolhido. Depois de registrar, volta ao Balcão.
- Se os canais não carregarem: "Não foi possível carregar os canais. A venda será registrada no Balcão."; a venda vai sem `canal_id`, e o preço sugerido é o do Balcão.
- Canal sem preço possível (`preco: null`) deixa o campo de preço vazio.

### Detector de estoque insuficiente

`isEstoqueInsuficiente(error)` (`src/shared/api/`, FE-05) reproduz `_isStockError` de `vendas_page.dart`: normaliza a mensagem (minúsculas, sem acentos) e retorna `true` se ela contém `estoque` **e** um destes: `insuficiente`, `indisponivel`, `nao ha`, `sem estoque`. É o único caso em que a tela decide pelo texto da mensagem.

## Vendas: confirmação e ciclo de vida

FE-17. Origem: `vendas_page.dart` (`_ConfirmacaoSheet`, `_concluirComValidacao`, `_acao`), `lib/features/vendas/presentation/cubit/vendas_cubit.dart` (`verificarEstoqueParaVenda`, `atualizarStatus`). Backend: `services/sales-service/src/modules/vendas/` e `services/operations-service/src/modules/estoque-produto-acabado/`.

### Ciclo de vida

```text
PENDENTE ──► CONCLUIDA   (baixa o produto acabado na mesma transação; sem saldo, 422 e continua PENDENTE)
         └─► CANCELADA   (sem efeito no estoque)
```

- `PATCH /vendas/:id/status` com `{ status: 'CONCLUIDA' | 'CANCELADA' }`.
- Só `PENDENTE` muda de status. Fora disso, o backend responde 422 `VENDA_FINALIZADA` "Venda já finalizada não pode ser alterada".
- Desde o monolito, a conclusão baixa o produto acabado **na mesma transação**: sem saldo, a API responde `422` `ESTOQUE_INSUFICIENTE` ("Estoque insuficiente para a receita <id>: disponível X, solicitado Y") e a venda continua `PENDENTE` (lacuna 9, resolvida). A web abre o mesmo diálogo "Estoque insuficiente" com essa mensagem seguida de ". Registre uma produção antes de concluir.".
- Cancelar não verifica estoque.

### Validação de estoque antes de concluir

O saldo de produto acabado vem da API, `GET /estoque/produtos` (lacuna 6, resolvida na FE-39), e `estoqueDisponivelDaReceita(receitaId, estoques)` em `features/vendas/vendas.calculos.ts` lê o da receita (receita que nunca teve produção não está na lista e vale 0).

Para cada receita da venda, se `disponivel < quantidade solicitada`, **não conclui** e mostra o diálogo "Estoque insuficiente":

> Estoque insuficiente para "<receita>": disponível X, solicitado Y. Anote uma fornada antes de concluir.

X e Y com `formatNumero`. O nome usa `Receita #<id>` quando a receita não está na lista. Botões: "Entendido" e o link "Ir para Fornadas".

Se a consulta de receitas ou de estoque falhar, a tela segue com a conclusão e deixa a API validar: o `422` `ESTOQUE_INSUFICIENTE` abre o mesmo diálogo.

Diferenças em relação ao mobile, registradas como decisão:

1. **Fonte do saldo.** O mobile calcula produções − vendas concluídas; a web usa o saldo da API (FE-39), que é o mesmo que a conclusão confere.
2. **Mesma receita em duas linhas.** O mobile confere cada item isoladamente. A web soma as quantidades da mesma receita antes de comparar.
3. **Falha na consulta.** A web segue com a conclusão, e a API valida.
4. **Depois de concluir ou cancelar, o diálogo continua aberto**, com o status devolvido pela API (Badge "Concluída" ou "Cancelada") e só o botão "Fechar"; o mobile fecha a folha.

### Textos

| Onde   | Mobile                                                                                                        | Web                                                                                                                                                            |
| ------ | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Título | "Confirmar venda" / "Revise os itens antes de concluir"                                                       | igual                                                                                                                                                          |
| Item   | nome ou "Produto #<id>"; `qtd × R$ preço`; subtotal; `X% margem` (`margemRealizada × 100`, 1 casa, se houver) | "Lucro real X%" (`lucroReal × 100`, 1 casa, se houver; FE-46) e "Onde vendeu" com o canal                                                                      |
| Total  | "Total"                                                                                                       | igual                                                                                                                                                          |
| Ações  | "Concluir Venda", "Cancelar Venda"                                                                            | "Concluir venda", "Cancelar venda" e "Fechar" (mantém pendente)                                                                                                |
| Toasts | "Venda concluída com sucesso.", "Venda cancelada."                                                            | "Venda anotada! O mês já soma R$ X." (total das vendas `CONCLUIDA` do mês, `mensagemVendaAnotada`; sem o total, "Venda anotada!") e "Venda cancelada." (FE-57) |

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
- Detalhe: por item, preço real, custo unitário (snapshot `custoUnitario`) e lucro real (FE-46; a margem realizada antiga saiu).

### Canal e lucro real (FE-46)

```text
lucroReal = 1 − percentuais do canal sem o lucro − custoUnitario / precoUnitarioReal   // fração do preço, calculada e gravada pelo backend (BE-30)
```

- A lista ("Canal" e "Lucro real"), o detalhe ("Onde vendeu" e "Lucro real") e a confirmação mostram o canal e o lucro real de cada item, em % do preço com 1 casa (`descreverLucroReal`). Com mais de um item, a coluna "Lucro real" da lista traz `<produto>: X%` por linha.
- Lucro real negativo (a venda não pagou o custo e as taxas): cor `danger` **e** o texto "(prejuízo)", como "-5,0% (prejuízo)".
- Sem `lucroReal` (vendas antigas): `—`. Sem `canalId` (vendas antigas ou canal excluído): "Não informado"; canal fora da lista: "Canal #<id>" (`nomeDoCanal`).
- Exemplo do seed: Quindim no iFood a R$ 3,69 com custo R$ 2,3326 → `21,6%`, já descontada a comissão de 15,2%.

| Onde   | Mobile                                    | Web                                                                                                                                                        |
| ------ | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Filtro | "Data inicial", "Data final"              | igual; status opcional ("Todos", "Pendente", "Concluída", "Cancelada")                                                                                     |
| Resumo | "Total vendido", "Vendas", "Ticket medio" | "Total vendido", "Vendas", "Ticket médio"                                                                                                                  |
| Vazio  | "Nenhuma venda encontrada no período."    | igual, com "Anote as vendas do dia para ver quanto sobrou pra você.", a ilustração da sacola e o botão "Anotar venda", que volta à aba "Registrar" (FE-59) |
| Erro   | "Não foi possível carregar as vendas."    | igual, com "Tentar de novo"                                                                                                                                |

Na web (FE-18):

- Sem `dataInicio`/`dataFim` na URL, vale o mês atual no fuso do navegador; a URL só recebe as datas quando o usuário muda o período. Data inválida ou período invertido vindo da URL voltam ao padrão.
- Com a data inicial depois da final (ou uma data apagada), a busca anterior continua na tela e o erro aparece no campo; nada vai para a URL.
- O resumo usa as vendas devolvidas pelo filtro (com status "Pendente" ou "Cancelada", ele fica zerado).
- Venda sem `total` usa `round2(Σ quantidade × precoUnitarioReal)`, como o `VendaModel.fromJson` do mobile.
- Cada linha tem "Confirmar" (só `PENDENTE`) e "Ver detalhes", que abre a gaveta "Venda #<id>" com a data, o status, o canal ("Onde vendeu"), os itens (nome ou "Produto #<id>", `qtd × preço`, "Custo unitário", "Lucro real", subtotal) e o total. O detalhe não existe no mobile.

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

Campo vazio conta como 0 (`_parseBR`); nenhum resultado pode virar `NaN`. No resultado ao vivo, texto inválido também conta como 0 (o mobile usa -1); o erro aparece ao salvar.

### Validações e textos

| Seção / campo          | Mobile                                                                                            | Web                                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Título e subtítulo     | "Calculo Real" / "Custo verdadeiro incluindo custos invisiveis"                                   | "Quanto custa de verdade" / "O custo de cada unidade, com o que não aparece na receita" (FE-57) |
| IDENTIFICAÇÃO          | "Nome da simulacao", obrigatório: "Informe um nome"                                               | "Nome da simulação": "Informe um nome"                                                          |
| CUSTO DOS INGREDIENTES | "Custo dos ingredientes" ≥ 0                                                                      | igual                                                                                           |
| CUSTOS INVISÍVEIS      | "Energia", "Agua", "Gas", "Horas", "Valor/hora mao de obra", todos ≥ 0: "Informe um valor valido" | "Energia", "Água", "Gás", "Horas", "Valor/hora mão de obra": "Informe um valor válido"          |
| RENDIMENTO             | "Unidades produzidas", inteiro > 0, padrão 1: "Informe um rendimento maior que zero"              | igual                                                                                           |
| Resultado              | "CUSTO POR UNIDADE"; "Custo Total"; "Custos Invisiveis" (só o %, 1 casa)                          | "CUSTO POR UNIDADE"; "Custo Total"; "Custos Invisíveis" (valor e %)                             |
| Ações                  | "Novo" (limpa e volta o rendimento para 1), "Salvar" (valida e guarda)                            | igual                                                                                           |
| Toast                  | "Simulacao salva."                                                                                | "Simulação salva."                                                                              |
| SIMULAÇÕES SALVAS      | `N un - total R$ X`, "Abrir" (recarrega os campos); vazio: "Nenhuma simulacao salva."             | igual; vazio: "Nenhuma simulação salva."                                                        |

No mobile, os registros ficam numa lista estática em memória e somem ao fechar o app. Na web, ficam no estado do cliente e podem ir para `localStorage` (com `try/catch`), porque não são dados pessoais nem sensíveis (ver [security.md](security.md#o-que-nunca-guardar-no-navegador)).

## Simulação de cenário da receita

FE-20, refeita na FE-45 (épico E8). Origem: `lib/features/receitas/presentation/pages/simulacao_page.dart`. Backend: `src/modules/receitas/` do monolito (`simular-cenario.dto.ts`, `receitas.calculos.ts`, `simularCenario`), regras em "Simulação e ponto de equilíbrio" do `docs/business-rules.md` de lá (BE-31). Rota `/receitas/[receitaId]/simular`.

A pergunta da tela é "quanto eu lucro se cobrar X?". A pessoa informa o preço que cobra, onde vende e quantas unidades vende por mês; tudo o que aparece no resultado vem da API.

### Cálculo (feito pelo backend; a tela não recalcula)

```text
canal                 = canalId ?? Balcão
preco                 = novoPreco ?? preço sugerido no canal
volume                = volume ?? receita.rendimento                  // unidades por mês
lucroPorUnidade       = preco − custoUnitario − (imposto + taxa do canal + gastos % da venda) × preco
lucroReal             = lucroPorUnidade ÷ preco                       // fração do preço
lucroMes              = lucroPorUnidade × volume
margemContribuicao    = preco − custoSemGastosMensais − percentuais × preco
pontoEquilibrio       = margemContribuicao ≤ 0 ? { unidades: null, motivo: MARGEM_NEGATIVA }
                                               : ceil(gastosMensais ÷ margemContribuicao)
```

Pelo preço sugerido do canal, o `lucroReal` é o lucro configurado (critério da BE-31 e da FE-45).

### Parâmetros

| Campo                     | Valor inicial                              | Envio                     |
| ------------------------- | ------------------------------------------ | ------------------------- |
| Preço que você cobra (R$) | preço sugerido do canal (`precos[].preco`) | `novoPreco`, número > 0   |
| Onde vende                | Balcão (ou o primeiro canal de `precos`)   | `canalId`, sempre enviado |
| Unidades vendidas por mês | `rendimento`                               | `volume`, **inteiro** > 0 |

Trocar "Onde vende" põe no campo de preço o sugerido daquele canal (vazio se o canal não tem preço possível). Os canais são os de `receita.precos` (os ativos). Campo vazio não é enviado (o backend usa o sugerido no canal e o rendimento). O preço igual ao sugerido do canal arredondado a centavos também não é enviado: o campo tem 2 casas e a API, 4, e sem isso o iFood a R$ 0,55 (sugerido 0,5513) daria 14,8% em vez dos 15% configurados. Dicas: "Ex.: 5,00" e "Ex.: 300". Mensagens: "Informe um valor maior que zero", "Escolha onde vende" e "Informe uma quantidade inteira maior que zero".

### Resultado e textos

Funções puras em `features/receitas/receitas.calculos.ts` (`formatarResultadoDaSimulacao`).

| Onde                | Texto                                                                                                                                                                                                                                                                                                                                                     |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Título e subtítulo  | "Simulação de cenário" / "Quanto você lucra cobrando este preço?", com o nome da receita                                                                                                                                                                                                                                                                  |
| Blocos e botão      | "Parâmetros", "Resultado"; "Simular"                                                                                                                                                                                                                                                                                                                      |
| Destaque            | "Lucro no mês" (`lucroMes`), verde se o lucro por unidade ≥ 0, vermelho se < 0                                                                                                                                                                                                                                                                            |
| Demais              | "Lucro por unidade", "Lucro real (do preço)" (`lucroReal × 100`, 1 casa), "Preço (<canal>)", "Custo por unidade", "Unidades por mês" (`N un.`), "Contas do mês" (`gastosMensais`)                                                                                                                                                                         |
| Ponto de equilíbrio | "Para pagar as contas do mês, você precisa vender N unidades." ("1 unidade" no singular); com 0 (sem gastos `MENSAL`): "Você não tem contas do mês cadastradas: qualquer venda já ajuda no lucro."                                                                                                                                                        |
| Aviso (vermelho)    | com `lucroPorUnidade < 0` (`avisoDePrejuizo`, FE-57): "Com esse preço você paga para vender. Que tal R$ Y? Assim sobram R$ Z por unidade.", com Y e Z do preço sugerido no canal (`sugestaoDoCanal`: `precos[].preco` e `composicao.lucro.valor`); sem preço sugerido com lucro, "Com esse preço você paga para vender. Você perde R$ X em cada unidade." |
| Erro                | mensagem do backend ou "Erro ao simular."                                                                                                                                                                                                                                                                                                                 |

Com o aviso, o ponto de equilíbrio **não** aparece, mesmo quando a API devolve unidades (preço entre o custo sem as contas do mês e o custo inteiro): critério da FE-45, "preço abaixo do custo mostra o aviso e nenhum ponto de equilíbrio". Com `MARGEM_NEGATIVA` o lucro por unidade também é negativo, então só o aviso aparece.

Mensagem de erro do backend (400 `RECEITA_SEM_PRECO`): "Receita sem preço sugerido definido. Informe novoPreco para simular."; antes de exibi-la, troque "Informe novoPreco" por "Informe o preço que você cobra".

### Custo para N lotes

| Bloco                 | Endpoint                           | Corpo                               | Resposta (nomes como vêm da API)                                                                 |
| --------------------- | ---------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------ |
| "Custo para N lotes"  | `POST /receitas/:id/custo/simular` | `{ quantidadeLotes }` (inteiro > 0) | `{ quantidade_lotes, total_unidades, custo_invisivel, custo_total_producao, custo_por_unidade }` |
| Custo atual de 1 lote | `GET /receitas/:id/custo`          | —                                   | mesmo formato do anterior                                                                        |

"Quantidade de lotes" começa em 1 ("Informe a quantidade de lotes"), botão "Calcular custo"; mostra o custo de 1 lote ao abrir e, depois, o simulado: "Custo total (N lote(s))", "Custo/unidade", "Custos invisíveis" e "Total de unidades".

O bloco "Preço para margem desejada" (`POST /receitas/:id/preco-venda`, markup sobre o custo) saiu na FE-45: a margem dele não é o lucro do preço do E8, e os preços sugeridos por canal já estão no detalhe da receita (FE-44).

A simulação não grava nada: mutação sem invalidação.

## Simulação interativa

FE-21. Origem: `lib/features/simulacao/presentation/pages/simulacao_page.dart` (`_ScenarioBase.fromReceita`, `_priceRangeFor`, `_volumeRangeFor`, `_buildSimulationContent`, `_ProjectionChartCard`, `_VolumePreviewCard`). Funções puras em `features/simulacao/simulacao.calculos.ts`. **Desde a FE-45** o lucro vem de `POST /receitas/:id/simular` (no Balcão, com o imposto, a maquininha e os gastos % da venda): as fórmulas locais de lucro e margem saíram.

Dados: `GET /receitas` e `GET /vendas` do mês atual (o mobile usa as vendas carregadas no histórico, que por padrão é o mês atual). Sem receitas: "Cadastre uma receita para simular cenários.", com a ilustração do caderno e o link "Criar receita" (FE-59). A receita selecionada fica em `receitaId` na URL; sem ela, usa a primeira da lista.

### Base da receita

```text
custo          = receita.custoUnitario ?? 0
precoBase      = receita.precoSugerido > 0 ? receita.precoSugerido : custo     // FE-45: sem o markup margemLucro
// vendas CONCLUIDA, itens desta receita:
quantidade     = Σ item.quantidade
receitaVendas  = Σ item.quantidade × item.precoUnitarioReal
precoAtual     = quantidade > 0 ? receitaVendas / quantidade : precoBase
volumeAtual    = quantidade > 0 ? quantidade : max(1, receita.rendimento)
```

O lucro atual é o `lucroMes` (e a margem, o `lucroReal`) da API simulada com `{ novoPreco: precoAtual, volume: volumeAtual }`; com `precoAtual = 0` não há chamada e o atual fica em 0.

### Faixas dos controles

```text
// preço
precoBase = receita.precoSugerido > 0 ? receita.precoSugerido : custo
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

Sem custo nem preço, a fórmula do mobile dá `max = 0 < min = 0,01` (o Slider do Flutter quebra); a web usa `max = max(…, min)` e passo `0,01`. Cada controle tem, embaixo, um campo com o mesmo valor ("Preço de venda (R$)", "Variação de custo (%)", "Volume projetado (unidades)"), aplicado ao sair do campo ou com Enter, preso à faixa (o volume é arredondado). A receita é escolhida num `Select` "Receita" (o mobile usa chips), que grava `receitaId` na URL.

### Resultado

```text
custoProjetado  = custo × (1 + variacao / 100)          // custoComVariacao, vai como novoCusto (só com variação ≠ 0)
corpo           = { novoPreco: preco, volume: max(1, round(volume)), novoCusto? }
                  // POST /receitas/:id/simular, 300 ms depois do último ajuste
lucroPorUnidade = resposta.lucroPorUnidade
lucroProjetado  = resposta.lucroMes
margemProjetada = resposta.lucroReal × 100
diferenca       = lucroProjetado − lucroAtual
```

Enquanto a primeira resposta não chega, o bloco do preço mostra um Skeleton; nos ajustes seguintes fica o resultado anterior até chegar o novo. Erro: "Não foi possível simular." com "Tentar de novo".

Cenários de volume, com o preço e o lucro por unidade da API:

| Cenário     | Volume                        | Receita     | Lucro                 |
| ----------- | ----------------------------- | ----------- | --------------------- |
| Conservador | `max(1, round(volume × 0,5))` | `preco × v` | `lucroPorUnidade × v` |
| Base        | `max(1, round(volume))`       | idem        | idem                  |
| Otimista    | `max(1, round(volume × 1,5))` | idem        | idem                  |

O mobile chama o cenário do meio de "Simulado" e, como usa os volumes como chave de um mapa, junta cenários com o mesmo volume (com volume 1, aparecem só dois). A web usa "Base", como pede a FE-21, e mostra sempre os três.

### Textos

| Onde               | Mobile                                                                                                                                                | Web                                                                                           |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Título e subtítulo | "Simulacao" / "Projete preco, custo e volume antes de agir"                                                                                           | "Simulação" / "Projete preço, custo e volume antes de agir"                                   |
| Produto            | "Produto"; "Custo unitario", "Preco atual", "Volume atual no periodo" (`N unidades`)                                                                  | "Produto"; "Custo unitário", "Preço atual", "Volume atual no período"                         |
| Controles          | "Preco de venda" ("Atual: R$ X"); "Variacao de custo" ("Custo projetado: R$ X", "-50%", "+100%"); "Volume projetado" (`N un.`, "Volume atual: N un.") | "Preço de venda"; "Variação de custo"; "Volume projetado", com os mesmos textos de apoio      |
| Resultado          | "PRECO SIMULADO", "Lucro: R$ X por unidade", "Lucro projetado", "Margem"                                                                              | "PREÇO SIMULADO", "Lucro: R$ X por unidade", "Lucro projetado", "Lucro real" (FE-45)          |
| Gráfico            | "Lucro projetado vs atual"; diferença com sinal; "Atual" / "Projetado", `X% margem`                                                                   | igual, com `X% do preço` (FE-57), "Diferença: +R$ X" e tabela equivalente para leitor de tela |
| Cenários           | "Simulacao de volume"; `N unidades`; receita; "Lucro: R$ X"                                                                                           | "Simulação de volume"; mesmos textos                                                          |
| Ação               | —                                                                                                                                                     | "Restaurar"                                                                                   |

A variação de custo é exibida com sinal e sem casas (`+20%`, `-10%`).

## Painel

FE-22. Origem: `lib/features/dashboard/presentation/pages/dashboard_page.dart` (`_DashboardData.fromStates`, `_calculateVendaProfit`, `_buildMonthlyValues`, `_buildMonthLabels`, `_buildTrendLabel`, `_buildTopProducts`, `_QuickActions`). Funções puras em `features/painel/painel.calculos.ts`.

Critério da FE-22: com o seed "Padaria Pão Feliz", os indicadores batem com o cálculo manual (vendas `PENDENTE` e `CANCELADA` ficam fora).

Não há endpoint de painel: o mobile chama `/vendas/dashboard` (`lib/core/network/api_constants.dart`), que não existe no backend. O painel é composto no cliente a partir de `GET /vendas` (dos últimos 6 meses, a partir do dia 1 de cinco meses atrás), `GET /receitas`, da query de estoque (FE-13) e, desde a FE-45, de `GET /vendas/resumo` (ponto de equilíbrio da empresa).

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

### Layout (FE-58)

O lucro do mês é o herói da tela. No celular, uma coluna nesta ordem; a partir de `lg`, duas colunas, com a saudação no topo: herói, cards e contas do mês à esquerda; "O que mais deu lucro", "Evolução mensal" e "Ações rápidas" à direita. Cada bloco tem `Skeleton` no próprio formato e `ErrorState` compacto. Em 360px, a saudação e o herói cabem na primeira tela, sem rolar.

1. **Saudação** (`h1`, Fredoka 600 de 22px): `saudacao(nome)` dá "Oi, {primeiro nome}!" (`primeiroNome`: primeira palavra de `usuario.nome`, do JWT) ou "Oi!" sem nome. Embaixo, em `ink-muted`, `textoFechamentoDoMes(hoje)`: "Faltam N dias para fechar o mês", "Falta 1 dia para fechar o mês" ou "Último dia do mês" (`diasParaFecharOMes` = último dia do mês − dia de hoje).
2. **Herói** (`StatCard` `heroi`, com o símbolo da marca em marca d'água), pelo `estadoDoHeroi` (textos em `heroiDoMes`):

| Estado       | Quando                      | Título                            | Fundo         | Extra                                                  |
| ------------ | --------------------------- | --------------------------------- | ------------- | ------------------------------------------------------ |
| `sem-vendas` | `faturamento == 0`          | "Ainda sem vendas este mês"       | Amora         | botão "Anotar uma venda" → `/vendas`                   |
| `negativo`   | `lucro < 0`                 | "Este mês ainda está no vermelho" | `danger-soft` | link "Ver como ajustar os preços" → `/simulacao`       |
| `positivo`   | o resto (inclusive lucro 0) | "Sobrou pra você este mês"        | Amora         | chip "R$ X de cada R$ 100" (`porCadaCemReais(margem)`) |

O valor é sempre `formatMoeda(lucro)`.

3. **Cards** (2 colunas): "Você vendeu" (`faturamento`, "Este mês") e "Pedidos na semana" (`vendas7dias`, "Últimos 7 dias"). Ocupando as 2 colunas, "Estoque", que leva a `/estoque?baixo=1`: `rotuloAcabando(n)` ("1 ingrediente acabando" / "N ingredientes acabando") e os nomes em chip `warning-soft`, até 3, depois "+N" (`ingredientesAcabando`, na ordem de `GET /insumos`, com "Ingrediente #<id>" sem o insumo; `chipsAcabando`). Sem itens acabando: "Estoque em dia", com ponto `success`. Erro do estoque: "Não foi possível carregar o estoque.".
4. **Contas do mês** (ver abaixo).
5. **"O que mais deu lucro"** (ver [Produtos mais rentáveis](#produtos-mais-rentáveis)): cada linha com o ícone de receita em quadrado `surface-alt`, nome 700 e valor `success` (ou `danger`) com `tabular-nums`.
6. **Evolução mensal**: barras `accent-soft`, o mês atual em `accent`, rótulos `ink-muted`, a partir do zero; o valor em R$ no tooltip de cada barra e na tabela `sr-only`.
7. **Ações rápidas**: "Nova receita" (primária, a única Amora cheia da tela) → `/receitas/nova` e "Anotar venda" (secundária) → `/vendas`.

Erro do herói e dos cards de venda: "Não consegui buscar seus números agora. Confira a internet e toque em Tentar de novo.".

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

Seção "O que mais deu lucro" (FE-58). Top 3 por lucro, decrescente, com "Ver tudo" → `/vendas?aba=historico`.

- **Com vendas** (nas faturáveis do mês): agrupa os itens por receita, somando quantidade, receita (`quantidade × preço`) e lucro (mesmo `lucroItem` acima); `margem = receita == 0 ? 0 : lucro / receita × 100`. Linha: `N un - R$ X de cada R$ 100` (`porCadaCemReais`; com margem negativa, `N un - abaixo do custo`). O mobile agrupa pelo nome e escreve `N unidades`; a web agrupa por `receitaId`, usa o nome atual da receita (ou "Receita #<id>") e escreve `N un`.
- **Sem vendas:** desde a FE-45, usa o lucro por unidade do preço do Balcão calculado pela API (`precos[balcao].composicao.lucro`): `lucro = lucro.valor`, `margem = lucro.fracao × 100`, só as receitas com `lucro > 0` (sem preço possível, a receita fica fora). Linha: `sem vendas no período - R$ X de cada R$ 100` (o `unitsLabel` do mobile sem vendas).
- **Vazio:** "Crie uma receita e anote as vendas para ver o que mais deu lucro." (FE-59; antes, "Cadastre receitas e registre vendas para ver rentabilidade."), com a ilustração da sacola e o link secundário "Criar receita" (a primária da tela é "Nova receita", das ações rápidas).

### Contas do mês (ponto de equilíbrio da empresa)

FE-45. `GET /vendas/resumo` (BE-31): o faturamento por mês que paga os gastos `MENSAL`, com o mix das vendas `CONCLUIDA` dos últimos 30 dias, calculado pelo backend. Desde a FE-58, um cartão com o título, uma `ProgressBar` do quanto o faturamento do mês já cobriu e uma frase (`pontoEquilibrioDoPainel(ponto, faturamento)`, textos da FE-57):

```text
progresso = valor <= 0 ? 1 : min(faturamento / valor, 1)   (faturamento do mês, dos indicadores)
```

| Resposta                                   | Título                                    | Barra       | Frase                                                                                                                |
| ------------------------------------------ | ----------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------- |
| `pontoEquilibrio.valor` presente           | "Para pagar as contas do mês, venda R$ X" | `progresso` | "Você já vendeu R$ Y este mês"; com `progresso` 1, "Contas do mês pagas. O que vender agora sobra pra você." (verde) |
| `valor: null`, `motivo: "SEM_VENDAS"`      | "Para pagar as contas do mês"             | —           | "Ainda sem vendas este mês"                                                                                          |
| `valor: null`, `motivo: "MARGEM_NEGATIVA"` | "Para pagar as contas do mês"             | —           | "Com os preços de hoje, você paga para vender." (vermelho)                                                           |

O valor vem da API sem recalcular; só a fração da barra é calculada na tela.

A query usa `staleTime: 0`: o resumo depende de vendas, gastos, configuração e custos, e é buscado de novo cada vez que o painel abre, em vez de ser invalidado por cada mutação desses módulos. Erro do bloco: "Não foi possível carregar quanto vender para pagar as contas.".

### Cabeçalho e ações rápidas

Desde a FE-58, o cabeçalho é a saudação, e as ações rápidas são só "Nova receita" (primária) e "Anotar venda" (secundária); ver [Layout](#layout-fe-58). Saíram o título "Doce Fatia", "Seu painel financeiro", o nome da empresa (que continua no menu da conta), o atalho "Simulação" (o herói no vermelho leva a `/simulacao`) e as ações "Novo ingrediente", "Nova fornada" e "Novo gasto", para a tela ter uma ação primária só ([marca.md](marca.md#checklist-de-revisão-de-tela)).

### Primeiros passos

FE-66. Cartão "Seus primeiros passos" entre o herói e os cards, com os 5 passos de `passosIniciais` (`features/aprender/primeiros-passos.ts`); a tabela, os textos e o `localStorage` estão em [aprender.md](aprender.md#primeiros-passos). Cada passo é feito pelos dados, nunca à mão:

```text
passo1 = insumos.length ≥ 3
passo2 = algum gasto com tipo == MENSAL
passo3 = configuracao.capacidadeMensal ≠ 40   (CONFIGURACAO_CUSTOS_PADRAO do monolito)
passo4 = receitas.length ≥ 1
passo5 = alguma venda com status == CONCLUIDA (de qualquer data)
```

O passo 3 deveria ser "configuração salva pela pessoa", mas a API não diz isso: `GET /configuracao-custos` devolve só os valores, e a empresa nova nasce com os padrões (BE-24). Vale a regra alternativa da issue: a capacidade diferente do padrão. Quem salvar 40 fornadas continua com o passo aberto.

### Cartão do Aprender

FE-67. Logo abaixo dos Primeiros passos (ou no lugar deles, quando não aparecem), um cartão discreto que leva a `/aprender`: "Dúvida em alguma palavra? Veja o Aprender". Aparece sempre; não tem estado nem requisição. Textos da página Aprender e dos guias em [aprender.md](aprender.md#página-aprender).

## Configurações de custo e formas de venda

FE-41 (épico E8, sem equivalente no mobile). Backend: `src/modules/configuracao-custos/` (BE-24) e `src/modules/canais/` (BE-25) do monolito; regras em `docs/business-rules.md` de lá ("Configuração de custos" e "Canais de venda"). Rota `/configuracoes`, "Ajustes de preço" desde a FE-57, no menu lateral e na gaveta "Mais" da barra inferior do celular.

A interface não usa termos técnicos (markup, rateio, custo fixo ou variável, margem de contribuição): fala em "contas do mês", "fornadas", "lucro em cada venda" e "formas de venda".

### Percentual da tela e fração da API

```text
fração da API = percentual digitado ÷ 100     (percentualDaTela, 1,36 → 0.0136)
texto do campo = fração × 100, sem arredondar (percentualDaApi, 0.0136 → "1,36")
```

Vale para `lucroPadrao`, `impostoPercentual`, `taxaMaquininha` e `comissaoPercentual`, todas frações do **preço de venda** (0 a 1). O ruído de ponto flutuante é cortado em 10 casas (`percentualParaFracao`, `fracaoParaPercentual`). A comissão na lista aparece com até 3 casas, sem zeros à direita (`15,2%`, `0%`).

### Valor da sua hora (FE-76)

Épico E12. Backend: BE-45 (`valorHora` em reais por hora, camelCase, padrão 0; o contrato lê 0 quando um backend anterior não manda o campo). O campo vem da configuração com 2 casas (`18,75`; empresa nova, `0,00`). É o valor do trabalho da dona: entra no **custo** (FE-77 e FE-78), não no lucro, e o lucro padrão continua 15%.

A ajuda "Não sabe? Faça a conta" (um `<details>` debaixo do campo) só preenche o campo; o ganho e as horas não são salvos:

```text
valor da hora = ganho do mês ÷ horas de produção no mês, com 2 casas   (calcularValorHora)
R$ 1.500 ÷ 80 h = R$ 18,75
```

Sem ganho, sem horas ou com horas ≤ 0, não calcula: mostra o motivo e esconde "Usar este valor". Ganho 0 dá R$ 0,00. "Usar este valor" põe o resultado no campo; salvar continua sendo o "Salvar" do formulário.

### Validações

Os limites são os de `validarConfiguracaoCustos` e do `CreateCanalVendaDto`; a web confere antes de enviar e mostra o erro no campo.

| Campo (contrato)                                            | Regra                           | Mensagem                                    |
| ----------------------------------------------------------- | ------------------------------- | ------------------------------------------- |
| `capacidadeMensal`                                          | número > 0                      | "Informe um número maior que zero"          |
| `lucroPadrao`, `impostoPercentual`, `taxaMaquininha` (em %) | de 0 a 100, inclusive           | "Informe um percentual de 0 a 100"          |
| `nome` do canal                                             | obrigatório, até 100 caracteres | "Informe o nome" / "Use até 100 caracteres" |
| `comissaoPercentual` (em %)                                 | de 0 a 100, inclusive           | "Informe um percentual de 0 a 100"          |
| `valorHora` (R$/h, FE-76)                                   | obrigatório, número ≥ 0         | "Informe um valor de R$ 0,00 ou mais"       |

A soma dos percentuais não é barrada: o backend devolve o canal sem preço (`PERCENTUAIS_ACIMA_DE_100`). O `PUT /configuracao-custos` envia os seis campos (com `valorHora` desde a FE-76). Ativar e desativar é `PUT /canais/:id` com `{ ativo }`; a edição envia `nome` e `comissaoPercentual`, sem o `ativo`. O Balcão não tem "Excluir" (o backend responde 422 `CANAL_BALCAO_NAO_EXCLUIVEL`), mas pode ser desativado e editado, como o backend permite.

### Textos

| Onde                 | Web                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Menu, título e aba   | "Ajustes de preço" (FE-57)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Subtítulo            | "Conte como o seu negócio funciona: o preço sugerido das receitas usa estas respostas."                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Cartão do formulário | "Como o seu negócio funciona"                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Base (`baseRateio`)  | "Como você quer dividir as contas do mês?": "Por fornadas" (`FORNADAS`, padrão) / "Por minutos de forno" (`MINUTOS`), com o apoio "Aluguel, luz, gás e as outras contas do mês são divididos pelas fornadas (ou pelos minutos de forno) que cada receita usa."                                                                                                                                                                                                                                                                                                                                        |
| Capacidade           | "Quantas fornadas você faz por mês?" (sufixo "fornadas") ou "Quantos minutos de forno você usa por mês?" (sufixo "min"); apoio "Uma estimativa já serve; dá para ajustar depois."                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Valor da hora        | "Valor da sua hora" (prefixo "R$"); apoio "Seu trabalho entra no custo. O lucro é o que sobra para o negócio depois de pagar tudo, inclusive você." (FE-76)                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Conta da hora        | "Não sabe? Faça a conta": "Quanto você quer ganhar por mês pelo seu trabalho?" (R$) e "Quantas horas por mês você passa produzindo?" (sufixo "h"), com o apoio "Conte só as horas em que você está fazendo os doces, não as 220 horas de um emprego de carteira. Se contar a mais, sua hora fica barata demais."; resultado "Sua hora vale R$ 18,75." e o botão "Usar este valor"; sem conta: "Diga quanto você quer ganhar por mês para fazer a conta.", "Diga quantas horas por mês você passa produzindo." ou "Com 0 horas não dá para fazer a conta. Conte as horas em que você está produzindo." |
| Lucro                | "Quanto você quer de lucro em cada venda?"; apoio "De cada R$ 1,00 vendido, quanto fica para você. Ex.: 15% são R$ 0,15."                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Imposto              | "Você paga imposto sobre as vendas?"; apoio "Se é informal ou MEI, deixe 0."                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Maquininha           | "Taxa da maquininha"; apoio "Quanto a maquininha de cartão cobra nas vendas do balcão."                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Toast                | "Ajustes salvos."                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Cartão dos canais    | "Onde você vende"; "Cada forma de venda ativa ganha um preço sugerido nas receitas, já com a comissão dela."                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Linha do canal       | nome, status "Ativo" / "Desativado", "Comissão: 15,2%"; no Balcão, "A taxa da maquininha entra no preço do balcão."; ações "Ativar"/"Desativar", "Editar", "Excluir"                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Ação e formulário    | "Nova forma de venda" / "Editar forma de venda"; apoio "A comissão é a parte de cada venda que fica com o aplicativo ou o parceiro."; "Nome" (exemplo "Ex.: Rappi, encomendas, feira") e "Comissão" ("Se não paga comissão, deixe 0.")                                                                                                                                                                                                                                                                                                                                                                |
| Toasts dos canais    | "Forma de venda criada.", "Forma de venda atualizada.", "Forma de venda excluída."                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Confirmação          | "Excluir forma de venda" / `Deseja excluir "<nome>"? As vendas já feitas nela continuam no histórico.`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Erros                | "Não foi possível carregar as configurações." / "Não foi possível carregar as formas de venda."                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |

### Valor da hora vazio (FE-78)

Backend: BE-47, `valorHoraVazio` em `GET /alertas` (`true` quando o `valorHora` é ≤ 0 e alguma receita, vendável ou não, tem `minutosTrabalhoPorLote > 0`; o contrato lê `false` quando um backend anterior não manda o campo). Nada é calculado na tela.

- Texto: "Você ainda não disse quanto vale sua hora. Sem isso, seu trabalho não entra no preço.", com o link "Dizer o valor da sua hora" (`/configuracoes`).
- Onde: no Início, logo abaixo da saudação e da dica na hora certa; no detalhe da receita, abaixo do cabeçalho, **só** na receita com `minutosTrabalhoPorLote > 0`.
- O componente é `AvisoValorHoraVazio` (`shared/avisos/aviso-valor-hora-vazio.tsx`), que lê os alertas já em cache pelo `AvisosProvider` (`useAvisos`): nenhuma requisição nova. Salvar os Ajustes de preço e salvar uma receita invalidam os alertas, e o aviso aparece ou some sozinho.
- Não entra no diálogo "Avisos" nem no contador do indicador: é um aviso fixo nas duas telas, até ela preencher o valor da hora.

### Aprender: seu trabalho (FE-78)

- Guia "Como cobrar pelo seu trabalho" (`/aprender/guias/cobrar-pelo-seu-trabalho`, [aprender.md](aprender.md#guias)): por que não é conta do mês, como achar o valor da hora, que tempo contar, o exemplo do brigadeiro (R$ 18,75/h, 40 min, 50 un → R$ 0,25 por unidade) e trabalho × lucro. A busca do Aprender acha o guia por "trabalho", "hora" e "salário".
- Dica na hora certa `tempo-de-trabalho` no formulário da receita, logo abaixo do campo "Tempo de trabalho por lote", quando o tempo digitado passa de 0: "Seu tempo também tem preço" / "Este tempo vezes o valor da sua hora entra no custo de cada unidade. Por isso seu salário não vai nas contas do mês." / "Como cobrar pelo seu trabalho" → o guia.

## Estoque negativo e avisos ao entrar

FE-47, só na web. Backend: BE-32 (`estoqueNegativo` em `Insumo` e `Estoque`, e `GET /alertas`; [Alertas](https://github.com/victorschmidt21/lucroai-backend/blob/main/docs/business-rules.md#alertas)). O estoque negativo **continua permitido** (decisão de 2026-11-21: produzir sem ter registrado a compra é comum no começo); a tela só avisa. Nada é recalculado na tela: o `estoqueNegativo`, o aumento e os preços vêm da API.

### Indicação visual

- Lista de insumos: o item com `estoqueNegativo` mostra, abaixo do nome, o selo "Estoque negativo" (Badge `critico`) e "Saldo: &lt;quantidade&gt;" em `danger`. No detalhe ("Compras e preços"), "Em estoque" fica em `danger`, com "Estoque negativo: registre a compra para acertar o saldo e o custo.".
- Estoque: o cartão mostra o selo "Estoque negativo" ao lado do status (que é Acabando) e "Disponível" em `danger`.
- Cor **e** texto: o selo sempre acompanha o vermelho.

### Aviso ao entrar

Na primeira leitura de `GET /alertas` da sessão, se alguma das listas tiver itens, abre o diálogo "Avisos":

| Lista                       | Texto                                                                                              | Cada item                                                                                                                                                                                           |
| --------------------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `estoqueNegativo`           | "Estes ingredientes estão com estoque negativo: registre a compra para acertar o saldo e o custo." | nome, selo "Estoque negativo", "Saldo: -500 g" e o link "Registrar compra" (`/insumos?compra=<id>`, que abre o detalhe com "Registrar compra")                                                      |
| `produtosNegativos` (FE-72) | "Estas receitas estão com estoque negativo: registre a produção para acertar o saldo."             | nome, selo "Estoque negativo", "Saldo: -300 g" (na unidade do rendimento) e o link "Registrar produção" (`/producoes?novo=1&receitaId=<id>`)                                                        |
| `precoDefasado`             | "Estes ingredientes ficaram mais caros: o preço destes produtos precisa subir."                    | nome e "25,0% mais caro" (`aumentoPercentual`); por receita, "Preço novo sugerido: R$ X (antes R$ Y)" (`precoSugerido` e `precoComCustoMedio`, no Balcão) e o link "Ver receita" (`/receitas/<id>`) |

- Sem preço possível (`precoSugerido: null`): "Sem preço que pague tudo: as taxas e o lucro passam de 100%." (FE-57). Insumo sem receita: "Nenhum produto usa este ingrediente.".
- Seguir um link ou "Fechar" fecha o aviso.
- **Uma vez por sessão** (`features/alertas/aviso-ao-entrar.ts`, `deveAbrirAviso`): a decisão é tomada uma vez, na primeira leitura dos alertas. Abre se houver alertas e a sessão ainda não tiver sido verificada; aberto ou não, a sessão fica marcada. Alertas que surgem durante o uso (uma produção que deixa o saldo negativo) não abrem o aviso: aparecem no indicador. A sessão é `<id do usuário>:<fim do token>`, que muda a cada login; ela é guardada no `sessionStorage` (só esse id, nenhum dado de negócio), para recarregar a página não reabrir o aviso. Sair e entrar de novo é outra sessão.
- **Indicador**: com algum alerta, um ícone de aviso com o contador (insumos negativos + insumos mais caros + receitas com estoque pronto negativo, desde a FE-72) fica no topo do menu lateral e no cabeçalho do celular ("Ver 2 avisos"); ele reabre o diálogo. Sem alertas, não aparece.
- **Dica na hora certa** (FE-68, [aprender.md](aprender.md#dica-na-hora-certa)): as dicas "Faltou anotar uma compra?" (Ingredientes e Estoque) e "Um ingrediente ficou mais caro" (Receitas) complementam o aviso. Só aparecem com o aviso resolvido e se ele não abriu sozinho na sessão (a sessão em que abriu fica em `lucroai:aviso-ao-entrar-abriu`, no `sessionStorage`); nunca junto com ele. As outras dicas (margem negativa, taxa do canal e primeiro mês) e as regras de uma por sessão e uma vez só estão na mesma seção.

## Login e mensagens de erro gerais

FE-05 e FE-07. Origem: `lib/features/auth/presentation/pages/login_page.dart`, `lib/core/auth/auth_session.dart`, `_buildException` dos datasources.

| Situação                | Texto                                                              |
| ----------------------- | ------------------------------------------------------------------ |
| E-mail vazio / inválido | "Informe seu e-mail" / "Informe um e-mail válido"                  |
| Senha vazia             | "Informe sua senha"                                                |
| Login 401               | "E-mail ou senha inválidos"                                        |
| Login, outros erros     | "Não foi possível entrar. Confira a internet e tente de novo."     |
| Login, botão do olho    | "Mostrar senha" / "Ocultar senha" (nome acessível do botão)        |
| Login, cabeçalho        | logo Doce Fatia e "Seu doce, seu preço justo." (FE-54)             |
| 401 em qualquer serviço | "Sessão expirada. Faça login novamente." (leva ao login)           |
| 404                     | "Não encontrei esse item. Ele pode ter sido excluído."             |
| 409                     | mensagem do backend ("CNPJ já cadastrado", "E-mail já cadastrado") |
| 400                     | mensagens de validação do backend, juntas                          |
| Rede ou timeout (10 s)  | "Sem conexão. Confira a internet e tente de novo."                 |
| 5xx                     | "O sistema falhou agora. Tente de novo em instantes."              |

Como a web aplica (FE-07, `features/auth/`):

- `loginFormSchema` (`schemas/login-form.schema.ts`): o e-mail é aparado e conferido com `z.email()`, o mesmo critério do `@IsEmail()` do backend (o mobile só confere o `@`); a senha não é aparada. Com erro, o foco vai para o primeiro campo inválido.
- `getLoginErrorMessage(error)`: `ApiError` 401 vira "E-mail ou senha inválidos"; qualquer outro erro (400, 5xx, rede), "Não foi possível entrar. Confira a internet e tente de novo.". O texto aparece num `Alert` acima do botão, e não num SnackBar.
- `?expirada=1` mostra "Sessão expirada. Faça login novamente." num aviso (`role="status"`) acima dos campos, que some quando há erro de login.
- Depois de entrar, a web vai para o `redirect` (só caminho interno) ou para `/`.
- Abaixo do botão "Entrar": "Ainda não tem conta? **Criar conta**", com link para `/cadastro` (FE-48).

## Criar conta com token de cadastro

FE-48. Não existe no mobile. Backend: `POST /auth/empresa` (BE-06, BE-36), `create-empresa.dto.ts`. Tela `/cadastro`, no layout e no card do login, só sem sessão (com sessão, o `proxy.ts` leva a `/`).

| Situação                                         | Texto                                                                                                                                         |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Cabeçalho                                        | "Criar conta" e "Cadastre sua empresa para começar a usar o Doce Fatia"                                                                       |
| Grupos                                           | "Sua empresa" e "Seu acesso"                                                                                                                  |
| Campos                                           | "Nome da empresa", "CNPJ (opcional)", "Segmento (opcional)", "Seu nome", "E-mail", "Senha", "Confirmar senha", "Token de cadastro"            |
| Dicas                                            | senha: "Pelo menos 6 caracteres"; token: "Você recebe esse código da equipe do Doce Fatia"                                                    |
| Vazios                                           | "Informe o nome da empresa", "Informe seu nome", "Informe seu e-mail", "Informe uma senha", "Confirme a senha", "Informe o token de cadastro" |
| E-mail inválido / senha curta                    | "Informe um e-mail válido" / "A senha precisa ter pelo menos 6 caracteres"                                                                    |
| Texto acima do limite                            | "Use até 100 caracteres" (empresa) ou "Use até 18/80 caracteres"                                                                              |
| Senhas diferentes                                | "As senhas não conferem" (na confirmação)                                                                                                     |
| 403 `TOKEN_CADASTRO_INVALIDO`                    | "Token de cadastro inválido", no campo do token, que é limpo                                                                                  |
| 409 `EMAIL_JA_CADASTRADO` / `CNPJ_JA_CADASTRADO` | "E-mail já cadastrado" no e-mail / "CNPJ já cadastrado" no CNPJ                                                                               |
| 429                                              | "Muitas tentativas. Aguarde um minuto e tente de novo."                                                                                       |
| 400 `DADOS_INVALIDOS`                            | um texto em português em cada campo do `details` (o do class-validator vem em inglês)                                                         |
| Outros erros (5xx, rede)                         | "Não foi possível criar a conta. Tente de novo."                                                                                              |
| Botões e links                                   | "Criar conta"; "Já tem conta? **Entrar**", para o login; "Mostrar token" / "Ocultar token"                                                    |

Como a web aplica (`features/auth/`):

- `cadastroFormSchema` (`schemas/cadastro-form.schema.ts`): obrigatórios o nome da empresa, o seu nome (opcional no backend, exigido pela issue), o e-mail, a senha (mínimo 6), a confirmação e o token; CNPJ e segmento são opcionais e, vazios, não vão no corpo (`toCadastroBody`). Os textos são aparados; a senha e o token, não. A confirmação só é comparada quando os outros campos estão válidos. Com erro, o foco vai para o primeiro campo inválido.
- `getCadastroErro(error)` decide o campo de cada erro da API pelo `code` e, sem ele, pelo status (409 sem `code` vai para o e-mail).
- O token de cadastro é um campo de senha com "Mostrar token", sem autocompletar; ele só vai no corpo do `POST /api/auth/cadastro` (nunca na URL, no `localStorage` nem em log).
- Com sucesso, o BFF grava o cookie da sessão e a web abre o painel (`/`) já logado.

## Diferenças intencionais em relação ao mobile

Resumo do que a web faz diferente, de propósito. Cada item está detalhado na seção da tela e entra na matriz de paridade da FE-23.

| Tela                 | Diferença                                                                                                                                                                                                                                                                          | Motivo                                           |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| Todas                | textos com acentuação correta                                                                                                                                                                                                                                                      | FE-02                                            |
| Todas                | linguagem de cozinha no lugar dos termos técnicos (Ingredientes, Fornadas, Contas do mês, Ajustes de preço, Acabando, Sobrou pra você), mensagens de erro que dizem o que fazer e "Tentar de novo"                                                                                 | FE-57 ([marca.md](marca.md#voz-e-tom))           |
| Todas                | busca ignora acentos                                                                                                                                                                                                                                                               | FE-05                                            |
| Navegação            | menu lateral no desktop; no celular, cabeçalho com a logo e o botão "Conta" (nome, empresa e "Sair"), que o mobile não tem; barra inferior com Início, Receitas, Vendas, Estoque e "Mais" (gaveta com o resto), rótulos de 12px (mobile: oito itens com 9px); 404 dentro do layout | FE-08, FE-57                                     |
| Login                | e-mail conferido com `z.email()` (o mobile só exige `@`); erro num `Alert` no formulário; volta à página de destino e avisa a sessão expirada                                                                                                                                      | FE-07 e backend `@IsEmail()`                     |
| Campos numéricos     | aceitam separador de milhar (`1.234,56`); ao sair do campo, mostram o valor lido no formato brasileiro (`1234.5` vira `1.234,50` no dinheiro)                                                                                                                                      | FE-06                                            |
| Formulários          | erro da API num `Alert` no topo do formulário, que continua aberto, e não num SnackBar                                                                                                                                                                                             | FE-06 ([ui.md](ui.md#toasts-depois-de-mutações)) |
| Insumos              | custo unitário com 4 casas fixas                                                                                                                                                                                                                                                   | FE-05                                            |
| Receitas             | rendimento só inteiro                                                                                                                                                                                                                                                              | backend `@IsInt`                                 |
| Estoque              | mostra a data da última alteração; erro isolado por cartão                                                                                                                                                                                                                         | FE-13                                            |
| Entrada de estoque   | prévia do saldo; gaveta "Histórico"; "Definir mínimo" (FE-39)                                                                                                                                                                                                                      | só na web                                        |
| Vendas               | quantidade só inteira; preço arredondado a 2 casas                                                                                                                                                                                                                                 | backend `@IsInt` e `maxDecimalPlaces: 2`         |
| Confirmação de venda | saldo de produto acabado da API e soma de itens da mesma receita                                                                                                                                                                                                                   | correção do cálculo (FE-39)                      |
| Histórico de vendas  | filtro de período enviado como início e fim do dia local                                                                                                                                                                                                                           | lacuna do backend com `dataFim`                  |
| Cálculo real         | simulações podem sobreviver ao recarregamento (`localStorage`)                                                                                                                                                                                                                     | FE-19                                            |
| Simulação            | cenário do meio chamado "Base"; sempre três cenários; receita num `Select`; cada controle tem um campo para digitar; faixa de preço nunca com `max < min`                                                                                                                          | FE-21                                            |
| Painel               | lucro com o snapshot de custo do item; seis meses reais no gráfico; vendas de 7 dias sobre os seis meses carregados                                                                                                                                                                | FE-22                                            |
