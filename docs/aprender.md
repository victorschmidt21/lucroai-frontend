# Aprender no app

Como o Doce Fatia ensina os termos de custo, preço e venda dentro do próprio app. Fonte: proposta "Pitadas: aprender no Doce Fatia" de 2026-11-23. Implementação: épico **E10 Aprender no app** (FE-63 a FE-68).

> **Status:** a base de termos **existe** desde a FE-63 (`src/features/aprender/`), a **Pitada no termo** desde a FE-64 e o bloco **"No seu caso"**, com os números da pessoa, desde a FE-65, e os **Primeiros passos** no Início desde a FE-66. As outras duas camadas são previstas nas FE-67 e FE-68.

Público: a Mah, que vende de casa e não conhece termos de finanças ([marca.md](marca.md#público)). Cada explicação é escrita **uma vez só**, na base de termos, e todas as camadas leem dela.

## As quatro camadas

| Camada                 | O que é                                                                                          | Situação         |
| ---------------------- | ------------------------------------------------------------------------------------------------ | ---------------- |
| **Pitada no termo**    | `<Termo id>` em volta do termo na tela; ao tocar, mostra o `curto`, o `porQueImporta` e um link. | existe (FE-64)   |
| **Primeiros passos**   | lista do que falta para o primeiro preço certo, com o estado derivado dos dados da conta.        | existe (FE-66)   |
| **Dica na hora certa** | uma dica curta quando a situação aparece (estoque negativo, preço que precisa subir etc.).       | previsto (FE-68) |
| **Página Aprender**    | `/aprender` com a busca e os termos por assunto, e `/aprender/[id]` com a explicação inteira.    | previsto (FE-67) |

Decisões do épico: **Pitada** é a ajuda no termo e **Aprender** é a página; sem tour nem carrossel de boas-vindas; conteúdo como código, sem CMS e sem endpoint novo; estado derivado dos dados ou guardado no `localStorage`/`sessionStorage`; voz e nomes de [marca.md](marca.md#voz-e-tom). Fora do escopo: assistente com IA, vídeos, gamificação, ferramentas pagas de onboarding, backend e o app Flutter.

## Pitada no termo

Desde a FE-64. Arquivos em `src/features/aprender/components/`: `termo.tsx` (`<Termo>`), `pitada.tsx` (a folha) e `termo.test.tsx`.

```tsx
<Termo id="margem">margem 29%</Termo>
```

- O texto do filho continua sendo o texto da tela. O `<Termo>` é um `<button type="button">` com sublinhado pontilhado `accent` (2px, `underline-offset-4`) e um "?" num círculo `accent-soft` de 18px; `aria-haspopup="dialog"`, `aria-expanded` e `aria-label` "O que é {título}?". Área de toque de 48px pelo `::before`, mesmo com texto pequeno.
- `tom="sobre-cor"`: sobre fundo `accent` (herói do painel), com sublinhado, "?" e foco em `on-accent`.
- **Abre só com toque, clique, Enter ou Espaço. Nunca por hover nem por foco**: no celular não existe hover, e abrir no foco atrapalha quem navega por teclado.
- **Uma vez por tela**: só a primeira ocorrência de cada termo ganha o `<Termo>`, para não poluir. Em listas, vai só no primeiro item (o primeiro selo "Estoque negativo"); em colunas da `DataTable`, só no cabeçalho da tabela (no celular, o rótulo repetido em cada cartão fica em texto).
- Em campo de formulário, o `<Termo>` fica no `label` (que aceita nó desde a FE-64), sem mudar o `htmlFor`. O campo ganha um texto escondido ligado por `aria-labelledby`, para ser anunciado pelo rótulo, e não pelo "O que é...?". O `Card` com título em nó faz o mesmo com `aria-label`.
- A folha (`Pitada`): até `md`, `Drawer` de baixo com alça; a partir de `md`, `Popover` ancorado no termo, com até 360px (`useMediaQuery(MEDIA_COMPUTADOR)`). Conteúdo, nesta ordem: título (Fredoka 600), `explicacao`, "No seu caso" (só quando o termo tem `exemplo` e a tela passa `dados`; ver [No seu caso](#no-seu-caso)), `porQueImporta` em `ink-muted`, a `acao` (escondida quando a tela atual já é o `href`), os relacionados como chips ("Veja também") e "Entendi". "Ver no Aprender" entra na FE-67.
- Tocar num chip troca o conteúdo sem fechar a folha, e o foco vai para o conteúdo novo; reabrir volta ao termo da tela.
- Fecha com "Entendi", Esc, toque fora ou arrastando a alça para baixo; o foco volta para o termo (o Radix devolve ao gatilho).
- Outras funcionalidades importam `@/features/aprender/components/termo`: é a exceção às [regras de dependência](architecture.md#regras-de-dependência), como os `*.queries.ts`.

| Tela                     | Termos                                                                                                                                                                                                                                                                        |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Início (painel)          | `sobrou-pra-voce` (herói, só com lucro), `faturamento` ("Você vendeu"), `para-pagar-as-contas`                                                                                                                                                                                |
| Receita, detalhe         | `custo-por-unidade` (cartão), `ficha-tecnica` ("Ingredientes"), `divisao-das-contas` ("Contas do mês"), `embalagem`, `perda` ("Perdas"), `rendimento` (no "Custo do lote"), `lucro-desejado` ("Lucro desta receita"), `preco-sugerido` e `canal-de-venda` (título dos preços) |
| Receita, formulário      | `rendimento` ("unidades boas"), `ficha-tecnica` ("Ingredientes e embalagens"), `divisao-das-contas` (fornadas do lote), `embalagem`, `perda`, `lucro-desejado`                                                                                                                |
| Simulação (`/simulacao`) | `margem` ("Lucro real", em %), `custo-por-unidade` ("Custo unitário"), `preco-sugerido` ("Preço atual")                                                                                                                                                                       |
| Custos (cálculo real)    | `contas-do-mes` ("Custos invisíveis"), `custo-da-receita` ("Custo Total")                                                                                                                                                                                                     |
| Vendas                   | `canal-de-venda` ("Onde vendeu?"), `lucro-real` (coluna do histórico, no computador)                                                                                                                                                                                          |
| Contas do mês            | `das-do-mei` (subtítulo), `contas-do-mes` ("Total por mês")                                                                                                                                                                                                                   |
| Ajustes de preço         | `divisao-das-contas`, `fornadas-por-mes`, `lucro-desejado`, `imposto`, `taxa-do-canal` ("Taxa da maquininha")                                                                                                                                                                 |
| Ingredientes             | `estoque-negativo` (primeiro selo e detalhe), `custo-medio` (detalhe do ingrediente)                                                                                                                                                                                          |
| Estoque                  | `estoque-negativo` (primeiro selo)                                                                                                                                                                                                                                            |
| Fornadas                 | `fornada` (subtítulo), `divisao-das-contas` ("Contas do mês" ao anotar a fornada)                                                                                                                                                                                             |

### Decisões da FE-64

- **Só onde a palavra aparece.** `margem` no cálculo real, `taxa-do-canal` em Vendas e `custo-medio` no Estoque ficaram de fora: essas telas não mostram margem, taxa nem custo médio, e o `<Termo>` não inventa texto. Nos outros casos, o termo foi no rótulo que mostra o mesmo valor com outro nome ("Lucro real" em % é a margem; "Preço atual" parte do preço sugerido).
- **"DAS do MEI" entrou no subtítulo de Contas do mês** ("Gás, luz, internet, aluguel, DAS do MEI e outros custos..."), para o termo ter onde aparecer e lembrar de cadastrar o DAS.
- **`sobrou-pra-voce` só no herói com lucro**: nos estados "sem vendas" e "no vermelho" o título não tem a expressão.
- **`lucro-real` só no computador**: no celular, o histórico vira cartões, e o rótulo "Lucro real" se repete em cada um; ali ele fica em texto.

## No seu caso

Desde a FE-65. Cada explicação usa os números da pessoa: "Na receita Bolo de pote, ficam com você R$ 29 de cada R$ 100 vendidos."

```tsx
<Termo id="custo-por-unidade" dados={receita}>
  Custo de 1 unidade
</Termo>
```

- O termo tem o campo opcional `exemplo`: função **pura** de `src/features/aprender/exemplos.ts`, que recebe os dados e devolve a frase, ou `null` quando faltam dados. `definirTermo()` guarda o tipo dos dados de cada termo, e `DadosDoExemplo<Id>` (de `termos/index.ts`) é o que o `<Termo dados>` aceita: dados errados dão erro de tipo, e termo sem exemplo não aceita `dados`.
- O `<Termo>` recebe `dados` (o que a tela **já carregou**; `null` enquanto carrega) e calcula a frase só com a folha aberta e no termo da tela (não nos relacionados). **Nenhuma requisição nova.**
- A folha mostra o bloco "No seu caso" com fundo `success-soft` e texto `ink`; valores em reais, percentuais e frações ("1/12") ficam em `success`, negrito e `tabular-nums`. Sem dados, ou com o exemplo devolvendo `null`, o bloco não aparece.
- Valores calculados pelo backend vêm da API como estão (custo e preços da receita, lucro real, ponto de equilíbrio). As fórmulas do cliente vêm de `shared/domain/`, para a base de termos não importar outra funcionalidade: `porCadaCemReais` (`margem.ts`), `descreverLucroReal` (`vendas.ts`) e `calcularTotalContasDoMes` (`contas-do-mes.ts`) saíram de `painel.calculos.ts`, `vendas.calculos.ts` e `gastos-indiretos.calculos.ts`, que as reexportam. O rateio de 1 fornada vem de `calcularPreviaProducao`, calculado na própria tela da fornada.
- Formatação com `formatMoeda`, `formatPercentual`, `formatMargem` e `formatNumero` ([business-rules.md](business-rules.md#formatação)).
- Teste: `exemplos.test.ts`, com o caso comum, sem dados (`null`), margem negativa e meta ainda não atingida.

| Termo                  | Tela que passa os dados                 | Dados                                                          | Frase                                                                                                             |
| ---------------------- | --------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `custo-por-unidade`    | Receita, detalhe; Simulação             | a receita (`nome`, `custo`)                                    | "Cada unidade da receita X custa R$ 5,10: R$ 3,90 de ingredientes, R$ 0,40 de embalagem, ... das contas do mês."  |
| `rendimento`           | Receita, detalhe                        | a receita (`nome`, `rendimento`, `unidadeRendimento`)          | "A receita X rende 12 unidades, então cada uma leva 1/12 dos ingredientes."                                       |
| `divisao-das-contas`   | Fornadas (ao anotar)                    | total das contas, configuração e o rateio de 1 fornada         | "Suas contas do mês somam R$ 240,00 e cabem 40 fornadas: cada fornada leva R$ 6,00."                              |
| `fornadas-por-mes`     | Ajustes de preço                        | a configuração salva                                           | "Você disse que faz 40 fornadas por mês."                                                                         |
| `contas-do-mes`        | Contas do mês ("Total por mês")         | `totalContas`                                                  | "Suas contas do mês somam R$ 240,00."                                                                             |
| `preco-sugerido`       | Receita, detalhe; Simulação             | a receita (`nome`, `lucroPercentual`, `precos`)                | "Para sobrar o lucro de 30,0%, cada unidade da receita X sai a R$ 7,29 (Balcão) e R$ 9,60 (iFood)."               |
| `margem`               | Simulação ("Lucro real")                | `nome`, `lucroReal` e `lucroPorUnidade` da simulação           | "Na receita X, ficam com você R$ 29 de cada R$ 100 vendidos." ou "..., cada venda tira R$ 0,20 do seu bolso."     |
| `taxa-do-canal`        | Ajustes de preço ("Taxa da maquininha") | `canal` ("A maquininha") e `taxa`                              | "A maquininha cobra 3,0%: de cada R$ 100 vendidos, R$ 3,00 ficam com eles."                                       |
| `lucro-real`           | Vendas, histórico (cabeçalho)           | o primeiro item com lucro real da lista (a venda mais recente) | "Na venda mais recente da lista, a receita X teve lucro real de 29,0%." ("(prejuízo)" quando negativo)            |
| `faturamento`          | Início                                  | os indicadores do mês                                          | "Você vendeu R$ 4.524,36 este mês e sobraram R$ 1.312,06."                                                        |
| `sobrou-pra-voce`      | Início (herói, com lucro)               | os indicadores do mês                                          | "Este mês sobraram R$ 1.312,06: R$ 29 de cada R$ 100 vendidos."                                                   |
| `para-pagar-as-contas` | Início                                  | `pontoEquilibrio.valor` e o faturamento do mês                 | "Você precisa vender R$ 830,00 no mês; já vendeu R$ 4.524,36." ou "Faltam R$ 310,00 para pagar as contas do mês." |

Os outros 12 termos não têm exemplo. Onde um termo com exemplo aparece numa tela sem os dados, a tela não passa `dados` e o bloco não aparece: `divisao-das-contas` no detalhe e no formulário da receita e em Ajustes de preço, `contas-do-mes` no cálculo real e `rendimento` no formulário da receita (os valores ainda estão sendo digitados).

### Decisões da FE-65

- **"A receita X" no lugar de "Seu X"**: a frase não sabe o gênero do produto ("seu torta"), então o nome vai depois de "receita".
- **Custo de 1 unidade com as mesmas partes do cartão**: embalagem e perdas aparecem separadas, como no cartão, e não somadas em "embalagem e perdas"; partes zeradas ficam de fora, e os "gastos por unidade" entram quando existem.
- **Canais entre parênteses** no preço sugerido ("R$ 7,29 (Balcão)"), para não errar "no" e "na" antes do nome do canal.
- **`divisao-das-contas` só ao anotar a fornada**: é a única tela com o total das contas e a configuração juntos. Ajustes de preço não carrega as contas do mês, e o detalhe da receita não carrega a configuração; buscar seria requisição nova.
- **`taxa-do-canal` com a maquininha**: é o único lugar do termo (FE-64); a frase recebe o sujeito com o artigo ("A maquininha"). Taxa 0 devolve `null`.
- **`fornadas-por-mes` usa o valor salvo**, não o que está sendo digitado.
- **`lucro-real` no cabeçalho da coluna**: o termo não está numa venda só, então o exemplo usa o primeiro item com lucro real da lista (as vendas vêm da mais recente para a mais antiga).
- **`faturamento` no vermelho**: "..., mas ficou R$ X no vermelho.", em vez de "sobraram -R$ X".
- **`margem` negativa** usa o `lucroPorUnidade` da simulação ("cada venda tira R$ 0,20 do seu bolso").
- **Moeda sempre com 2 casas** (`formatMoeda`), como manda a formatação; a issue escrevia "R$ 240" e "R$ 830".

## Primeiros passos

Desde a FE-66. Um cartão no Início leva a conta nova até o **primeiro preço justo** fazendo, e não lendo; não há tour nem carrossel de boas-vindas. Arquivos em `src/features/aprender/`: `primeiros-passos.ts` (`passosIniciais`, função pura), `primeiros-passos.test.ts` e `components/primeiros-passos.tsx` (`PrimeirosPassos`).

**Regra: o estado é derivado dos dados.** `passosIniciais(dados)` devolve os 5 passos com `feito` calculado a partir do que a conta tem; nada é marcado à mão.

| #   | Passo (título)                      | Apoio                                                 | Feito quando                                           | Botão                                   |
| --- | ----------------------------------- | ----------------------------------------------------- | ------------------------------------------------------ | --------------------------------------- |
| 1   | Cadastrar 3 ingredientes            | "Comece pelos que você mais usa."                     | ≥ 3 insumos                                            | "Adicionar ingrediente" → `/insumos`    |
| 2   | Anotar as contas do mês             | "Gás, luz, internet, DAS: o que você paga todo mês."  | ≥ 1 gasto do tipo `MENSAL`                             | "Adicionar conta" → `/gastos-indiretos` |
| 3   | Dizer quantas fornadas cabem no mês | "Assim dividimos as contas do mês entre os produtos." | `capacidadeMensal` diferente do padrão do backend (40) | "Responder" → `/configuracoes`          |
| 4   | Criar a primeira receita            | "Você vai ver quanto custa e quanto cobrar."          | ≥ 1 receita                                            | "Criar receita" → `/receitas/nova`      |
| 5   | Anotar a primeira venda             | "Para ver quanto sobrou pra você."                    | ≥ 1 venda `CONCLUIDA`                                  | "Anotar venda" → `/vendas`              |

O cartão:

- Fica entre o herói e os cartões do painel. A página (`app/(app)/page.tsx`) passa `<PrimeirosPassos />` ao `PainelTela` pela prop `primeirosPassos`, para o painel não importar outra funcionalidade.
- Título "Seus primeiros passos", `ProgressBar` e "N de 5 feitos". Passos feitos com ✓ em `success` e o título riscado em `ink-muted`; o primeiro não feito com borda `accent`, apoio e o botão (secundário: a primária da tela continua sendo "Nova receita"); os demais só com o título. A Pitada vai só no passo destacado: "fornadas" (título do passo 3) → `fornadas-por-mes` e "quanto cobrar" (apoio do passo 4) → `preco-sugerido`.
- Botão discreto "Esconder": grava `aprender:passos-escondidos` = `1` no `localStorage` e o cartão não volta.
- **Comemoração**: com os 5 feitos, "Seu primeiro preço justo está pronto!", com o símbolo da marca e "Ver minhas receitas" → `/receitas`. Some na próxima visita ao Início.
- Dados: `insumosListOptions`, `gastosIndiretosListOptions`, `configuracaoCustosOptions`, `receitasListOptions` (as mesmas chaves do painel e das telas, com cache) e `vendasListOptions({ status: 'CONCLUIDA' })`. Sem endpoint novo. Escondido ou depois da comemoração, as queries ficam desligadas.
- Enquanto carrega ou com erro, o cartão não aparece (sem `Skeleton` nem `ErrorState`): ele é um extra, e os blocos do painel já mostram o erro.

`aprender:passos-concluidos` no `localStorage` (lido uma vez ao abrir o Início, sempre com `try/catch`):

| Valor | Quando é gravado                     | Efeito na próxima visita                         |
| ----- | ------------------------------------ | ------------------------------------------------ |
| —     | nunca apareceu                       | com os 5 feitos, o cartão **não aparece** (seed) |
| `nao` | o cartão apareceu com passo faltando | com os 5 feitos, mostra a comemoração            |
| `sim` | a comemoração apareceu               | o cartão não aparece mais                        |

### Decisões da FE-66

- **Passo 3 pela capacidade**: a API não diz se a configuração foi salva pela pessoa (`GET /configuracao-custos` devolve só os valores, e a empresa nova já nasce com os padrões), então vale a regra alternativa da issue: feito quando `capacidadeMensal` ≠ 40 (`CONFIGURACAO_CUSTOS_PADRAO` do monolito). Quem salvar 40 de propósito continua com o passo aberto. Ver [business-rules.md](business-rules.md#primeiros-passos).
- **Conta com tudo feito na primeira visita não vê o cartão nem a comemoração** (o seed "Padaria Pão Feliz", e quem já usava o app antes da FE-66): a comemoração só aparece para quem viu o cartão com passo faltando (`aprender:passos-concluidos` = `nao`).
- **Vendas concluídas de qualquer data** (`GET /vendas?status=CONCLUIDA`), e não as dos últimos 6 meses do painel: uma venda antiga também conta.
- **Pitada só no passo destacado**, que é o único com o apoio; "fornadas" está no título do passo 3, e não no apoio como a issue sugeria.
- **Conta vazia** coberta pelo unitário de `passosIniciais`: o cadastro de empresa exige o token de cadastro (BE-36), então o teste manual foi com o seed, forçando o passo 3 aberto (capacidade 40 pela API, depois restaurada para 100).

## Regras de escrita

- **Linguagem simples** (Lei 15.263/2025): frases curtas, ordem direta, uma ideia por frase.
- **Fala de cozinha.** O termo técnico (`rateio`, `markup`, `gastos indiretos`, `insumo`) só aparece em `sinonimos`, para a busca achar.
- **Sempre "você".** Sem diminutivo, sem "amiga", sem exclamação.
- **Nomes da interface iguais aos do menu e das telas** (FE-57): "Contas do mês", "Fornadas", "Ajustes de preço", "Ingredientes". No rótulo da ação, o nome da tela vai com a inicial maiúscula, como no menu ("Ver Contas do mês").
- **Nenhuma promessa de número exato que o app não calcula.**

Limites (conferidos pelo schema): `curto` com 1 frase e até 140 caracteres; `explicacao` com até 3 frases e 360 caracteres; `porQueImporta` com 1 frase e até 160 caracteres.

## A base de termos

| Arquivo                                                   | O que tem                                                                                                                   |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `aprender.schema.ts`                                      | `termoSchema` (Zod), o tipo `Termo`, `ASSUNTOS`, `LIMITES`, `contarFrases` e `definirTermo()`                               |
| `termos/custos.ts`, `preco.ts`, `vendas.ts`, `estoque.ts` | os termos de cada assunto                                                                                                   |
| `termos/index.ts`                                         | `TERMOS` (lista), o tipo `TermoId` (união dos ids), `buscarTermo(id)` e `isTermoId(id)`                                     |
| `aprender.conteudo.test.ts`                               | ids únicos, limites, `relacionados` válidos, `acao.href` com rota em `src/app/(app)` e palavras proibidas só em `sinonimos` |

Formato do termo:

```ts
type Termo = {
  id: string; // kebab-case, estável (vai na URL /aprender/[id])
  titulo: string; // como aparece na tela
  assunto: 'custos' | 'preco' | 'vendas' | 'estoque';
  sinonimos: string[]; // palavras que ela usaria na busca
  curto: string; // 1 frase, até 140 caracteres
  explicacao: string; // até 3 frases, até 360 caracteres
  porQueImporta: string; // 1 frase, até 160 caracteres
  acao?: { rotulo: string; href: string }; // tela onde o termo se aplica
  relacionados: string[]; // ids de outros termos
  exemplo?: (dados) => string | null; // "No seu caso" (FE-65), tipado por termo
};
```

O campo opcional `exemplo` (FE-65) é uma função pura `(dados) => string | null`, fora do `termoSchema` (o schema confere só o texto); ver [No seu caso](#no-seu-caso).

`definirTermo()` valida o termo com o schema em desenvolvimento e nos testes (no build de produção só devolve o termo) e mantém o `id` literal, para `TermoId` ser a união dos ids: `<Termo id="nao-existe">` dá erro de tipo.

## Como adicionar um termo

1. Escolha o assunto e acrescente `definirTermo({ ... })` no arquivo dele em `src/features/aprender/termos/`.
2. Dê um `id` em kebab-case que não vá mudar (ele vai na URL).
3. Escreva os textos seguindo as regras acima; os termos técnicos vão em `sinonimos`.
4. Aponte a `acao` para uma rota que existe em `src/app/(app)` e preencha os `relacionados` (nos dois sentidos, quando fizer sentido).
5. Rode `npx vitest run src/features/aprender` e atualize a lista abaixo.

## Lista de termos

| Assunto | id                        | Título                      | Ação                                    |
| ------- | ------------------------- | --------------------------- | --------------------------------------- |
| custos  | `custo-da-receita`        | Custo da receita            | Ver Receitas → `/receitas`              |
| custos  | `rendimento`              | Rendimento                  | Ver Receitas → `/receitas`              |
| custos  | `custo-por-unidade`       | Custo de 1 unidade          | Ver Receitas → `/receitas`              |
| custos  | `ficha-tecnica`           | Ficha técnica               | Ver Receitas → `/receitas`              |
| custos  | `embalagem`               | Embalagem                   | Ver Ingredientes → `/insumos`           |
| custos  | `perda`                   | Perda                       | Ver Receitas → `/receitas`              |
| custos  | `contas-do-mes`           | Contas do mês               | Ver Contas do mês → `/gastos-indiretos` |
| custos  | `divisao-das-contas`      | Divisão das contas do mês   | Ver Ajustes de preço → `/configuracoes` |
| custos  | `fornadas-por-mes`        | Fornadas por mês            | Ver Ajustes de preço → `/configuracoes` |
| custos  | `custo-medio`             | Custo médio do ingrediente  | Ver Estoque → `/estoque`                |
| custos  | `imposto`                 | Imposto sobre as vendas     | Ver Ajustes de preço → `/configuracoes` |
| custos  | `das-do-mei`              | DAS do MEI                  | Ver Contas do mês → `/gastos-indiretos` |
| preco   | `preco-sugerido`          | Preço sugerido              | Ver Receitas → `/receitas`              |
| preco   | `lucro-desejado`          | Lucro que você quer         | Ver Ajustes de preço → `/configuracoes` |
| preco   | `margem`                  | Margem                      | Simular outro preço → `/simulacao`      |
| preco   | `canal-de-venda`          | Canal de venda              | Ver Ajustes de preço → `/configuracoes` |
| preco   | `taxa-do-canal`           | Taxa do canal               | Ver Ajustes de preço → `/configuracoes` |
| preco   | `preco-que-precisa-subir` | Preço que precisa subir     | Ver Receitas → `/receitas`              |
| vendas  | `faturamento`             | Faturamento                 | Ver Vendas → `/vendas`                  |
| vendas  | `lucro-real`              | Lucro real da venda         | Ver Vendas → `/vendas`                  |
| vendas  | `sobrou-pra-voce`         | Sobrou pra você             | Ir para o Início → `/`                  |
| vendas  | `para-pagar-as-contas`    | Para pagar as contas do mês | Ir para o Início → `/`                  |
| estoque | `fornada`                 | Fornada                     | Ver Fornadas → `/producoes`             |
| estoque | `estoque-negativo`        | Estoque negativo            | Ver Estoque → `/estoque`                |

## Decisões da FE-63

- **Rótulos das ações com o nome da tela como no menu** ("Ver Ajustes de preço", "Ver Contas do mês", "Ver Ingredientes", "Ver Fornadas"), no lugar das minúsculas da proposta ("Ver ajustes de preço"). "Ver início" virou "Ir para o Início".
- **`para-pagar-as-contas`**: o `curto` da proposta tinha duas frases; virou uma só, com ponto e vírgula ("...cobrir as contas do mês; daí em diante, é lucro.").
- **`relacionados`** não vinham na proposta: foram escolhidos pela FE-63 entre os termos que a pessoa precisa entender junto. A Mah revisa os textos depois; ajuste de texto não bloqueia o épico.
- **Palavras proibidas** são conferidas no título, no `curto`, na `explicacao`, no `porQueImporta` e no rótulo da ação, sem acento e sem maiúsculas; o `href` da ação fica de fora, porque as rotas continuam com os nomes do código (`/insumos`, `/gastos-indiretos`).
- **Exclamação** também é conferida pelo teste de conteúdo, seguindo a regra de escrita.
