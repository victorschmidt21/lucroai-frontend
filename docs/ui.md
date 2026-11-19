# Interface

> **Status:** o design system ainda não existe. Os tokens, a tipografia e os componentes base são entregues na **FE-04**; os blocos de listagem e formulário (`ListPage`, `FormDialog`, campos numéricos, `ConfirmDialog`), na **FE-06**. Este documento define o que eles devem ser e como as telas os usam. As APIs de componente descritas aqui são o alvo: se a FE-04 ou a FE-06 precisarem mudá-las, atualizem este arquivo no mesmo PR. A referência visual é o app Flutter (`lib/main.dart` e as telas de `lib/features/*/presentation/`).

## Princípios

1. **Paridade visual com o mobile.** Tema escuro com destaque laranja, cartões de cantos arredondados, cabeçalho com título e subtítulo cinza. Ao lado do app Flutter (`flutter run -d chrome`), a web deve parecer o mesmo produto.
2. **Só tema escuro**, como o mobile. Não há tema claro nem alternância.
3. **Use o design system e os tokens.** Não recrie botão, campo ou diálogo dentro de uma funcionalidade; se faltar uma variação, adicione-a em `src/shared/ui/`. Nenhuma cor fixa fora de `src/app/globals.css`.
4. **Acessibilidade não é opcional**: teclado, foco visível, rótulos, contraste de 4,5:1 e status com cor **e** texto.
5. **Celular primeiro.** O público usa o celular na produção; toda tela funciona em 360px sem rolagem horizontal.

## Tokens (FE-04)

Extraídos de `lib/main.dart` e das telas do mobile. Ficam em variáveis CSS e no tema do Tailwind em `src/app/globals.css`; nas telas, use só as utilidades geradas (`bg-surface`, `text-ink-muted`, `border-border`). As utilidades prontas do Tailwind (`bg-orange-500`, `text-gray-400`) não devem ser usadas.

| Token            | Valor                  | Uso                                             |
| ---------------- | ---------------------- | ----------------------------------------------- |
| `bg`             | #050505                | fundo da página e da barra inferior             |
| `bg-alt`         | #0A0A0A                | fundo de telas internas (cálculo real, estoque) |
| `surface`        | #111111                | cartões                                         |
| `surface-alt`    | #171717                | campos e cartões internos                       |
| `surface-raised` | #1A1A1A                | Dialog, Drawer, Toast                           |
| `border`         | #272727                | borda de campo e de cartão                      |
| `border-strong`  | #2B2B2B                | divisores de destaque                           |
| `ink`            | #FFFFFF                | texto principal                                 |
| `ink-muted`      | #8A8A8A                | subtítulos, rótulos e texto secundário          |
| `ink-subtle`     | #7C7C7C                | legendas (ver contraste abaixo)                 |
| `accent`         | #FF6B3D                | cor primária: valores em destaque, foco, links  |
| `accent-strong`  | #E85D33                | botão primário e item ativo do menu             |
| `on-accent`      | a definir pela medição | texto e ícone sobre `accent` e `accent-strong`  |
| `success`        | #4CAF50                | lucro positivo, status Adequado e Concluída     |
| `warning`        | #FFB000                | status Baixo e Pendente                         |
| `danger`         | #FF5252                | erro, lucro negativo, status Crítico            |
| `danger-strong`  | #E53935                | botão de perigo                                 |

Medições preliminares de contraste (a FE-04 confirma e registra no PR):

| Combinação                      | Contraste | Conclusão                                                                            |
| ------------------------------- | --------- | ------------------------------------------------------------------------------------ |
| `ink-muted` sobre `surface`     | 5,47:1    | ok                                                                                   |
| `ink-subtle` sobre `surface`    | 4,52:1    | no limite; sobre `surface-raised` cai para 4,17:1 e **não** serve para texto pequeno |
| `accent` sobre `bg`             | 7,20:1    | ok em qualquer tamanho                                                               |
| branco sobre `accent-strong`    | 3,47:1    | **reprovado** para texto normal                                                      |
| preto sobre `accent-strong`     | 6,04:1    | ok: `on-accent` deve ser preto, salvo decisão registrada na FE-04                    |
| `danger-strong` sobre `surface` | 4,47:1    | só em fundo de botão, nunca como cor de texto                                        |

### Status

Badges usam sempre cor **e** texto, com os rótulos de [business-rules.md](business-rules.md#enumerações-e-rótulos).

| Domínio | Valor       | Texto     | Token       |
| ------- | ----------- | --------- | ----------- |
| Estoque | crítico     | Crítico   | `danger`    |
| Estoque | baixo       | Baixo     | `warning`   |
| Estoque | adequado    | Adequado  | `success`   |
| Venda   | `PENDENTE`  | Pendente  | `warning`   |
| Venda   | `CONCLUIDA` | Concluída | `success`   |
| Venda   | `CANCELADA` | Cancelada | `ink-muted` |

### Forma e profundidade

- **Cantos arredondados**, diferente da Urbizzi: `radius-md` 12px em cartões e campos (padrão), `radius-sm` 8px em badges e chips, `radius-lg` 14px em cartões de resumo.
- **Sem gradientes.** Sombra só onde o mobile usa elevação: Dialog e Drawer.
- Separação entre áreas por fundo e borda (`surface` com `border`).

### Tipografia

Roboto (a fonte padrão do Material no Flutter), via `next/font`, nos pesos 400, 500, 600 e 700.

| Classe               | Uso                                                                              |
| -------------------- | -------------------------------------------------------------------------------- |
| `text-display`       | valor dos indicadores do painel e destaque "CUSTO POR UNIDADE"                   |
| `text-heading`       | título da página (`h1`), como "Insumos"                                          |
| `text-subtitle`      | texto cinza sob o título                                                         |
| `text-section-label` | rótulos de seção em caixa alta, como "CUSTOS INVISÍVEIS"; nunca em texto corrido |
| `text-body`          | texto                                                                            |
| `text-small`         | texto de apoio e linhas de lista                                                 |
| `text-caption`       | legendas e metadados                                                             |

Em texto corrido, escreva **LucroAI**.

## Componentes (`src/shared/ui/`)

Componentes base da FE-04. Radix UI onde há foco e teclado (Dialog, Drawer, Tabs, Toast, Combobox, Slider, Select); nativos onde já funcionam bem (Checkbox, Input).

| Arquivo                              | Exporta                                                                | Observações                                                                                                                                                  |
| ------------------------------------ | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `button.tsx`                         | `Button`, `IconButton`                                                 | variantes `primario`, `secundario`, `perigo`, `fantasma`; `size="icone"` exige `aria-label`; `loading` mantém o texto e desabilita; `type` padrão é `button` |
| `input.tsx`, `textarea.tsx`          | `Input`, `Textarea`                                                    | `label` obrigatório; `error` e `hint` ligados ao campo (`aria-describedby`)                                                                                  |
| `number-input.tsx`                   | `NumberInput`                                                          | base dos campos numéricos brasileiros (FE-06)                                                                                                                |
| `select.tsx`, `combobox.tsx`         | `Select`, `Combobox`                                                   | `Combobox` com busca, para escolher receita ou insumo                                                                                                        |
| `checkbox.tsx`, `chip.tsx`           | `Checkbox`, `Chip`, `ToggleChip`                                       | `ToggleChip` para os gastos da produção                                                                                                                      |
| `segmented-control.tsx`              | `SegmentedControl`                                                     | filtro "Todos / Baixo" do estoque                                                                                                                            |
| `slider.tsx`                         | `Slider`                                                               | setas, Home/End e valor anunciado; usado na simulação                                                                                                        |
| `label.tsx`                          | `Label`, `FieldError`                                                  | para campos fora dos componentes acima                                                                                                                       |
| `dialog.tsx`, `drawer.tsx`           | `Dialog`, `Drawer`                                                     | `title` obrigatório; o `Drawer` abre de baixo no celular, como o `showModalBottomSheet`                                                                      |
| `confirm-dialog.tsx`                 | `ConfirmDialog`                                                        | ver [Confirmação](#confirmação-de-exclusão-e-de-ações)                                                                                                       |
| `tabs.tsx`                           | `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`                       | "Registrar / Histórico" em Vendas; dê `aria-label` ao `TabsList`                                                                                             |
| `card.tsx`, `stat-card.tsx`          | `Card`, `StatCard`                                                     | `StatCard`: título, valor, detalhe e cor do detalhe (painel)                                                                                                 |
| `badge.tsx`                          | `Badge`, `StatusEstoqueBadge`, `StatusVendaBadge`, `MetodoRateioBadge` | sempre com cor e texto                                                                                                                                       |
| `progress-bar.tsx`                   | `ProgressBar`                                                          | `value` de 0 a 1 e `aria-label` obrigatório                                                                                                                  |
| `toast.tsx`                          | `ToastProvider`, `useToast`                                            | `toast.success(texto)`, `toast.error(texto)`; equivale ao `SnackBar`                                                                                         |
| `skeleton.tsx`, `spinner.tsx`        | `Skeleton`, `Spinner`                                                  | `Skeleton` exige `aria-label`                                                                                                                                |
| `empty-state.tsx`, `error-state.tsx` | `EmptyState`, `ErrorState`                                             | `ErrorState` tem "Tentar novamente" (`onRetry`)                                                                                                              |
| `page-header.tsx`                    | `PageHeader`                                                           | `title` (o `h1`), `subtitle` e `actions`                                                                                                                     |
| `date-picker.tsx`                    | `DateRangePicker`                                                      | período do histórico de vendas, em `YYYY-MM-DD`                                                                                                              |
| `logo.tsx`                           | `Logo`                                                                 | wordmark "LucroAI" do cabeçalho do painel                                                                                                                    |
| `icons/`                             | `menu.tsx`, `acoes.tsx`                                                | SVGs locais equivalentes aos ícones Material do mobile; decorativos (`aria-hidden`)                                                                          |

A página `/design-system` (só em desenvolvimento, FE-04) mostra todos os tokens e componentes.

### Ações

Cada tela tem **uma** ação primária, no `PageHeader`. O que se repete em cada linha é discreto, para não competir com os dados.

| Onde                | Use                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------- |
| Ação principal      | `primario` ("Novo insumo", "Registrar Venda")                                               |
| Ações do cabeçalho  | `secundario` ("Atualizar", atalho "Produção")                                               |
| Ações por linha     | `fantasma` com `size="icone"` e `aria-label` com o nome do item ("Editar Farinha de Trigo") |
| Confirmar exclusão  | `perigo`, só dentro do `ConfirmDialog`                                                      |
| Durante uma chamada | `loading`: desabilita e mostra progresso, mantendo o texto                                  |

## Listagens e formulários

Blocos da FE-06, que fazem uma tela nova ser só configuração. O [exemplo completo de insumos](architecture.md#exemplo-completo-funcionalidade-insumos) usa todos eles.

### `ListPage`

```tsx
<ListPage
  title="Insumos"
  subtitle="Gerencie quantidade, valor pago e custo unitário"
  actions={<Button variant="primario">Novo insumo</Button>}
  label="Insumos"                       // nome acessível da lista
  query={query}                         // resultado de useQuery com a lista inteira
  searchField="nome"                    // campo da busca; sem ele, não há busca
  searchPlaceholder="Buscar insumo"
  columns={[{ id, header, cell, align?: 'right', acoes?: true }]}
  getRowKey={(item) => item.id}
  emptyTitle="Nenhum insumo encontrado."
  emptyAction={<Button>Novo insumo</Button>}   // opcional
  errorTitle="Não foi possível carregar os insumos."
  filter={(item) => ...}                // opcional: filtro extra, como `baixo=1` no estoque
  summary={<Card>...</Card>}            // opcional: cartão de resumo acima da lista (total de gastos)
/>
```

- Arquivo `shared/ui/list-page.tsx`. Renderiza o `PageHeader`, a busca (`type="search"`, com rótulo acessível igual ao `searchPlaceholder`) com debounce de 300 ms gravando `q` na URL, a contagem ("12 insumos"), a lista em **cartões no celular** e em **tabela no desktop**, e os estados.
- A busca filtra no cliente com `filtrarPorTexto`, sem diferenciar acentos nem maiúsculas.
- Estados: carregando (`Skeleton`), vazio (`emptyTitle`), vazio por busca ("Nenhum resultado para "x"", com "Limpar busca") e erro (`ErrorState` com `errorTitle` e "Tentar novamente", que chama `query.refetch`).
- `align: 'right'` em números e valores; `acoes: true` alinha os botões à direita e os leva ao rodapé do cartão no celular.

### `Form` e `FormDialog`

```tsx
<FormDialog
  open={aberto}
  onOpenChange={setAberto}
  title="Novo insumo"
  description="Texto de apoio opcional"
  schema={insumoFormSchema}             // Zod; entrada como texto, saída tipada
  defaultValues={insumoFormVazio}
  submitLabel="Salvar"                  // "Salvar" na criação, "Atualizar" na edição
  onSubmit={async (values) => { ... }}  // rejeitar mantém aberto e mostra o erro
>
  <FormInput name="nome" label="Nome" required />
  <FormMoneyInput name="valorPago" label="Valor pago" required />
</FormDialog>
```

- Tudo em `shared/ui/form.tsx`: `Form`, `FormDialog` e os campos ligados ao formulário.
- `Form` é a versão sem diálogo (páginas `/receitas/nova` e `/receitas/[receitaId]/editar`, cálculo real). `FormDialog` abre como Dialog no desktop e como Drawer de baixo no celular, com "Cancelar" e a ação primária.
- Usa `react-hook-form` com `zodResolver`. O erro aparece embaixo do campo, ligado por `aria-describedby`, e o foco vai para o primeiro campo inválido.
- O botão de envio fica desabilitado durante o envio, mantendo o texto.
- `onSubmit` precisa **rejeitar** com o `ApiError` (use `mutateAsync`, não `mutate`): é assim que o formulário mostra a mensagem do backend num `Alert` no topo.
- Os campos ligados ao formulário são `FormInput`, `FormTextarea`, `FormSelect`, `FormCombobox`, `FormMoneyInput`, `FormDecimalInput`, `FormIntegerInput`, `FormPercentInput` e `FormUnidadeSelect`, todos com `name` e `label`.
- `FormDecimalInput` aceita `unidade` (o rótulo da unidade, como `kg`, exibido à direita do campo); `FormMoneyInput` e `FormPercentInput` já mostram `R$` e `%`.
- Formulário com alterações não salvas pede confirmação antes de sair (FE-12).

### Campos numéricos brasileiros

Guardam o texto digitado e são convertidos pelo schema com `numeroBR()` ([business-rules.md](business-rules.md#leitura-de-números-digitados)).

| Campo           | Mostra                                | Envia                                        | Uso                                           |
| --------------- | ------------------------------------- | -------------------------------------------- | --------------------------------------------- |
| `MoneyInput`    | `R$` à esquerda, 2 casas (`1.234,56`) | `number`, 2 casas                            | valor pago, valor do gasto, preço             |
| `DecimalInput`  | unidade à direita (`kg`)              | `number`                                     | quantidade de insumo e de estoque             |
| `IntegerInput`  | só dígitos                            | inteiro                                      | rendimento, lotes, quantidade vendida, volume |
| `PercentInput`  | `%` à direita                         | fração (`30` → `0.3`), na função `to...Body` | margem de lucro                               |
| `UnidadeSelect` | rótulos `g`, `kg`, `ml`, `L`, `un`    | `G \| KG \| ML \| L \| UN`                   | unidade do insumo e do rendimento             |

Use `inputMode="decimal"` (ou `numeric`) para abrir o teclado numérico no celular.

## Padrões de tela

### Cabeçalho

Toda tela interna começa com `PageHeader` (ou `ListPage`, que o inclui): título no `h1`, subtítulo cinza e, à direita, a ação primária. Os textos de cada tela estão em [business-rules.md](business-rules.md). Defina também `metadata.title` na página. Hoje o layout raiz usa o título fixo "LucroAI"; a FE-08 passa a usar o modelo `%s | LucroAI`, para a aba mostrar "Insumos | LucroAI".

### Menu

Oito destinos fixos, na ordem do mobile, em `features/navegacao/menu.ts` (FE-08): Home, Insumos, Receitas, Custos, Vendas, Estoque, Produção e Gastos. No celular, barra inferior com ícone e rótulo; no desktop, menu lateral com a logo e o menu do usuário no rodapé. O item ativo usa `accent-strong` e `aria-current="page"`.

### Listagem

1. `ListPage` com título, subtítulo e ação primária.
2. Cartão de resumo, quando a tela tiver (total de gastos, resumo de vendas).
3. Busca e filtros na URL.
4. Linhas com as ações por item.
5. Estados de carregamento, vazio e erro.

### Formulário

- Cadastros curtos (insumo, gasto, entrada de estoque, produção) usam `FormDialog`, como os bottom sheets do mobile.
- Formulários longos (receita) usam página própria com `Form`; no celular, ocupam a tela inteira.
- Prévia de cálculo ao vivo ("Custo unitário: R$ X/un", custos da receita, rateio da produção) fica dentro do formulário, com `aria-live="polite"`.
- Depois de salvar: Toast de sucesso, fechar o diálogo ou voltar à listagem.

### Confirmação de exclusão e de ações

Exclusões e ações de negócio (excluir, concluir ou cancelar venda) usam `ConfirmDialog`:

```tsx
<ConfirmDialog
  open={aberto}
  onOpenChange={setAberto}
  title="Excluir gasto"
  description={`Deseja excluir "${gasto.descricao}"? Isso afetará o custo de todas as receitas.`}
  confirmLabel="Excluir"
  onConfirm={async () => { ... }}   // rejeitar mantém aberto e mostra a mensagem
/>
```

- O título diz a ação; a descrição cita o item entre aspas e, se houver, a consequência.
- O botão de confirmar usa a variante `perigo` e descreve a ação ("Excluir", "Cancelar venda"), nunca "OK".
- Ao falhar, o diálogo continua aberto, com a mensagem de erro.

## Estados

Toda tela ou bloco com dados trata os três estados, além do sucesso:

| Estado     | Como                                                                                                           | Texto                                                                |
| ---------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Carregando | `Skeleton` no formato do conteúdo; `Spinner` só em ações curtas                                                | sem texto visível, com `aria-label` ("Carregando insumos")           |
| Vazio      | `EmptyState`, com ação quando houver                                                                           | distingue "nenhum cadastro ainda" de "nenhum resultado para a busca" |
| Erro       | `ErrorState` com o título da tela, `getErrorMessage()` e "Tentar novamente"; em formulário ou diálogo, `Alert` | nunca mostra detalhes técnicos                                       |

Em telas compostas (painel, estoque), cada bloco tem o próprio estado: um bloco com erro não derruba os outros.

## Formatação brasileira

Sempre com os formatadores de `src/shared/format/` ([conventions.md](conventions.md#dinheiro-e-quantidades)):

| Dado                     | Exemplo       |
| ------------------------ | ------------- |
| Moeda                    | `R$ 1.234,56` |
| Moeda negativa           | `-R$ 12,30`   |
| Custo unitário de insumo | `R$ 0,0240/g` |
| Percentual               | `86,0%`       |
| Quantidade com unidade   | `1,5 kg`      |
| Data                     | `17/11/2026`  |
| Valor ausente            | `—`           |

Valores monetários e quantidades ficam alinhados à direita nas tabelas, com `tabular-nums`.

## Gráficos

O painel (evolução mensal) e a simulação (lucro projetado vs atual) usam **SVG próprio**, sem biblioteca nova:

- cores pelos tokens (`accent` para a série, `success` e `danger` para positivo e negativo);
- `role="img"` com `aria-label` resumindo o gráfico, e uma tabela ou lista equivalente para leitor de tela (pode ficar visualmente oculta);
- rótulos dos eixos com os formatadores brasileiros.

## Acessibilidade e responsividade

- Tudo funciona por teclado, com foco visível (anel em `accent`).
- Status nunca depende só da cor: o Badge traz cor **e** texto; lucro negativo leva o sinal `-`.
- Campo tem `<label>` associado, e o erro é anunciado e ligado ao campo.
- Elementos semânticos: `button` para ação, `a` para navegação, `table` para dados tabulares no desktop, um `h1` por tela.
- Alvos de toque de pelo menos 44px no celular.
- Sem rolagem horizontal da página em 360, 390, 768 e 1280px. A barra inferior com oito itens usa rótulos pequenos (9 a 11px, como o mobile), sem quebrar.
- Respeite `prefers-reduced-motion` nas animações de Dialog, Drawer e Toast.
