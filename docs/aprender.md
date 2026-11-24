# Aprender no app

Como o Doce Fatia ensina os termos de custo, preço e venda dentro do próprio app. Fonte: proposta "Pitadas: aprender no Doce Fatia" de 2026-11-23. Implementação: épico **E10 Aprender no app** (FE-63 a FE-68).

> **Status:** a base de termos **existe** desde a FE-63 (`src/features/aprender/`). As quatro camadas abaixo são previstas nas FE-64 a FE-68 e ainda não existem na tela.

Público: a Mah, que vende de casa e não conhece termos de finanças ([marca.md](marca.md#público)). Cada explicação é escrita **uma vez só**, na base de termos, e todas as camadas leem dela.

## As quatro camadas

| Camada                 | O que é                                                                                          | Situação         |
| ---------------------- | ------------------------------------------------------------------------------------------------ | ---------------- |
| **Pitada no termo**    | `<Termo id>` em volta do termo na tela; ao tocar, mostra o `curto`, o `porQueImporta` e um link. | previsto (FE-64) |
| **Primeiros passos**   | lista do que falta para o primeiro preço certo, com o estado derivado dos dados da conta.        | previsto (FE-66) |
| **Dica na hora certa** | uma dica curta quando a situação aparece (estoque negativo, preço que precisa subir etc.).       | previsto (FE-68) |
| **Página Aprender**    | `/aprender` com a busca e os termos por assunto, e `/aprender/[id]` com a explicação inteira.    | previsto (FE-67) |

Decisões do épico: **Pitada** é a ajuda no termo e **Aprender** é a página; sem tour nem carrossel de boas-vindas; conteúdo como código, sem CMS e sem endpoint novo; estado derivado dos dados ou guardado no `localStorage`/`sessionStorage`; voz e nomes de [marca.md](marca.md#voz-e-tom). Fora do escopo: assistente com IA, vídeos, gamificação, ferramentas pagas de onboarding, backend e o app Flutter.

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
