# Aprender no app

Como o Doce Fatia ensina os termos de custo, preço e venda dentro do próprio app. Fonte: proposta "Pitadas: aprender no Doce Fatia" de 2026-11-23. Implementação: épico **E10 Aprender no app** (FE-63 a FE-68).

> **Status:** a base de termos **existe** desde a FE-63 (`src/features/aprender/`) e a **Pitada no termo** desde a FE-64. As outras três camadas são previstas nas FE-66 a FE-68.

Público: a Mah, que vende de casa e não conhece termos de finanças ([marca.md](marca.md#público)). Cada explicação é escrita **uma vez só**, na base de termos, e todas as camadas leem dela.

## As quatro camadas

| Camada                 | O que é                                                                                          | Situação         |
| ---------------------- | ------------------------------------------------------------------------------------------------ | ---------------- |
| **Pitada no termo**    | `<Termo id>` em volta do termo na tela; ao tocar, mostra o `curto`, o `porQueImporta` e um link. | existe (FE-64)   |
| **Primeiros passos**   | lista do que falta para o primeiro preço certo, com o estado derivado dos dados da conta.        | previsto (FE-66) |
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
- A folha (`Pitada`): até `md`, `Drawer` de baixo com alça; a partir de `md`, `Popover` ancorado no termo, com até 360px (`useMediaQuery(MEDIA_COMPUTADOR)`). Conteúdo, nesta ordem: título (Fredoka 600), `explicacao`, "No seu caso" (só com a prop `exemplo`, que a FE-65 vai preencher), `porQueImporta` em `ink-muted`, a `acao` (escondida quando a tela atual já é o `href`), os relacionados como chips ("Veja também") e "Entendi". "Ver no Aprender" entra na FE-67.
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
};
```

O exemplo com os números dela (`exemplo(dados)`) entra na FE-65.

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
