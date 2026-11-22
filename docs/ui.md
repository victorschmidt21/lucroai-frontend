# Interface

> **Status:** os tokens, a tipografia, os ícones e os componentes base **existem** (FE-04), em `src/app/globals.css` e `src/shared/ui/`. Os blocos de listagem e formulário (`ListPage`, `DataTable`, `Form`, `FormDialog`, os campos numéricos e o `UnidadeSelect`) **existem** desde a FE-06, com o exemplo funcionando em [`/design-system/listagem`](http://localhost:3000/design-system/listagem). O layout das telas internas, com o menu, a `StatusPage` e o token `text-nav` **existem** desde a FE-08. A referência visual é o app Flutter (`lib/main.dart` e as telas de `lib/features/*/presentation/`).

## Princípios

1. **Paridade visual com o mobile.** Tema escuro com destaque laranja, cartões de cantos arredondados, cabeçalho com título e subtítulo cinza. Ao lado do app Flutter (`flutter run -d chrome`), a web deve parecer o mesmo produto.
2. **Só tema escuro**, como o mobile. Não há tema claro nem alternância.
3. **Use o design system e os tokens.** Não recrie botão, campo ou diálogo dentro de uma funcionalidade; se faltar uma variação, adicione-a em `src/shared/ui/`. Nenhuma cor fixa fora de `src/app/globals.css`.
4. **Acessibilidade não é opcional**: teclado, foco visível, rótulos, contraste de 4,5:1 e status com cor **e** texto.
5. **Celular primeiro.** O público usa o celular na produção; toda tela funciona em 360px sem rolagem horizontal.

## Tokens

Extraídos de `lib/main.dart` e das telas do mobile. Ficam em variáveis CSS (`:root`) e no tema do Tailwind em `src/app/globals.css`; nas telas, use só as utilidades geradas (`bg-surface`, `text-ink-muted`, `border-border`). As cores, sombras, raios e tamanhos de texto prontos do Tailwind foram removidos do tema: `bg-orange-500`, `text-white`, `shadow-md` e `text-sm` não geram estilo. O teste `src/shared/ui/sem-cores-fixas.test.ts` falha se aparecer cor fixa (hex, `rgb()`, paleta do Tailwind) fora de `globals.css`.

| Token            | Valor                         | Uso                                                       |
| ---------------- | ----------------------------- | --------------------------------------------------------- |
| `bg`             | #050505                       | fundo da página e da barra inferior                       |
| `bg-alt`         | #0A0A0A                       | fundo de telas internas (cálculo real, estoque)           |
| `surface`        | #111111                       | cartões                                                   |
| `surface-alt`    | #171717                       | campos e cartões internos; hover de botões                |
| `surface-raised` | #1A1A1A                       | Dialog, Drawer, Toast, lista do Combobox                  |
| `border`         | #272727                       | borda de campo e de cartão                                |
| `border-strong`  | #2B2B2B                       | divisores de destaque, trilho da `ProgressBar`            |
| `ink`            | #FFFFFF                       | texto principal                                           |
| `ink-muted`      | #8A8A8A                       | rótulos, texto secundário e status Cancelada              |
| `ink-subtle`     | **#858585** (mobile: #7C7C7C) | subtítulo do `PageHeader`, placeholder, trilho do Slider  |
| `accent`         | #FF6B3D                       | cor primária: valores em destaque, foco, aba ativa, links |
| `accent-strong`  | #E85D33                       | botão primário, item ativo do menu, SegmentedControl      |
| `on-accent`      | **#000000**                   | texto e ícone sobre `accent` e `accent-strong`            |
| `success`        | #4CAF50                       | lucro positivo, status Adequado e Concluída               |
| `warning`        | #FFB000                       | status Baixo e Pendente                                   |
| `danger`         | #FF5252                       | erro, lucro negativo, status Crítico                      |
| `danger-strong`  | #E53935                       | botão de perigo                                           |
| `on-danger`      | **#000000**                   | texto sobre `danger-strong`                               |
| `overlay`        | preto com 87%                 | fundo atrás de Dialog e Drawer (`Colors.black87`)         |

### Contraste

Medido em `src/shared/ui/tokens.test.ts`, que lê `globals.css` e calcula a razão do WCAG para cada par usado. Token ou combinação nova entra nesse teste. No navegador, o `axe` do `e2e/design-system.spec.ts` confere o contraste da página `/design-system` inteira.

| Combinação                                                          | Contraste                                | Decisão                                                                                    |
| ------------------------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------ |
| `ink-muted` sobre `surface`                                         | 5,47:1                                   | ok; passa de 4,5:1 em todos os fundos                                                      |
| `ink-subtle` original (#7C7C7C) sobre `surface-raised`              | 4,17:1                                   | **reprovado**: o token foi clareado para #858585, o cinza do painel e das vendas no mobile |
| `ink-subtle` (#858585) sobre `surface-raised`                       | 4,72:1                                   | ok em todos os fundos                                                                      |
| `accent` sobre `bg`                                                 | 7,20:1                                   | ok em qualquer tamanho e em todos os fundos; é a cor do foco                               |
| branco sobre `accent-strong` / `accent`                             | 3,47:1 / 2,83:1                          | **reprovado**: o mobile usa texto branco nos botões laranja; a web usa preto               |
| preto sobre `accent-strong`                                         | 6,04:1                                   | ok: `on-accent` é preto                                                                    |
| branco sobre `danger-strong`                                        | 4,23:1                                   | **reprovado**                                                                              |
| preto sobre `danger-strong`                                         | 4,97:1                                   | ok: `on-danger` é preto                                                                    |
| `accent-strong` sobre `bg` (item ativo do menu)                     | 5,87:1                                   | ok sobre `bg` e `bg-alt`                                                                   |
| texto do status sobre 12% da própria cor (como o `venda_card.dart`) | Cancelada: 4,30:1 sobre `surface-raised` | **reprovado**: o Badge usa 8% de fundo, que passa em todos os fundos                       |
| `accent-strong` sobre 20% dele (FilterChip do mobile)               | 3,89:1                                   | **reprovado**: o `ToggleChip` selecionado usa texto `accent` (4,77:1 ou mais)              |
| `danger`, `success`, `warning` sobre `surface`                      | ≥ 4,5:1                                  | ok como texto                                                                              |

A borda dos campos (`border` sobre `surface-alt`, 1,2:1) segue o mobile e não atinge os 3:1 de contraste não textual. O campo é identificado pelo rótulo visível acima dele e pelo fundo; no foco, a borda fica `accent`.

### Status

Badges usam sempre cor **e** texto, com os rótulos de [business-rules.md](business-rules.md#enumerações-e-rótulos). Cada status tem um token próprio (`status-critico`, `status-pendente` etc.), que aponta para o semântico:

| Domínio | Valor       | Texto     | Token              | Aponta para |
| ------- | ----------- | --------- | ------------------ | ----------- |
| Estoque | crítico     | Crítico   | `status-critico`   | `danger`    |
| Estoque | baixo       | Baixo     | `status-baixo`     | `warning`   |
| Estoque | adequado    | Adequado  | `status-adequado`  | `success`   |
| Venda   | `PENDENTE`  | Pendente  | `status-pendente`  | `warning`   |
| Venda   | `CONCLUIDA` | Concluída | `status-concluida` | `success`   |
| Venda   | `CANCELADA` | Cancelada | `status-cancelada` | `ink-muted` |

O mobile pinta "Cancelada" com #E53935; a web segue a issue e usa `ink-muted`, para uma venda cancelada não parecer um erro.

### Forma e profundidade

- **Cantos arredondados**, diferente da Urbizzi: `rounded-md` (12px) em cartões, campos e botões (padrão), `rounded-sm` (8px) em badges e chips, `rounded-lg` (14px) em cartões de resumo e no `StatCard`, `rounded-xl` (18px) no Dialog e no Drawer (o `Dialog` de cadastro do mobile usa 18px). `rounded-full` em `IconButton`, `SegmentedControl` e Spinner.
- **Sem gradientes.** Sombra (`shadow-elevacao`) só onde o mobile usa elevação: Dialog, Drawer, Toast e a lista do Combobox.
- Separação entre áreas por fundo e borda (`surface` com `border`).

### Tipografia

Roboto (a fonte padrão do Material no Flutter), via `next/font/google` em `src/app/fonts.ts`, nos pesos 400, 500, 600 e 700. O `next/font` hospeda os arquivos no próprio app: o navegador não chama o Google. Onde o mobile usa `w800`, a web usa 700.

| Classe               | Tamanho (mobile)      | Uso                                                                |
| -------------------- | --------------------- | ------------------------------------------------------------------ |
| `text-display-lg`    | 36px, 700             | destaque "CUSTO POR UNIDADE" do cálculo real                       |
| `text-display`       | 22px, 700             | valor dos indicadores do painel (`StatCard`)                       |
| `text-heading`       | 27px, 700             | título da página (`h1`), como "Insumos"; a `Logo`                  |
| `text-title`         | 18px, 700             | título de Dialog e Drawer, valor do Slider                         |
| `text-subtitle`      | 12,5px                | texto cinza sob o título (com `text-ink-subtle`)                   |
| `text-section-label` | 11px, 700, caixa alta | rótulos de seção, como "CUSTOS INVISÍVEIS"; nunca em texto corrido |
| `text-field`         | 16px                  | texto digitado nos campos (o iOS amplia a tela com menos de 16px)  |
| `text-body`          | 14px                  | texto, botões e rótulos                                            |
| `text-small`         | 12px                  | texto de apoio, dicas e erros dos campos                           |
| `text-caption`       | 11px                  | legendas, metadados e badges                                       |
| `text-nav`           | 10px (mobile: 9px)    | rótulo da barra inferior do celular, com oito itens (FE-08)        |

`text-section-label` já aplica a caixa alta: escreva o texto normal ("Custos invisíveis"), com acento. Em texto corrido, escreva **LucroAI**.

## Componentes (`src/shared/ui/`)

Componentes base da FE-04. Radix UI onde há foco e teclado (Dialog, Drawer, Tabs, Toast, Slider, SegmentedControl e ToggleChip); nativos onde já funcionam bem (Input, Select, Checkbox, datas). O `Combobox` é próprio, porque o Radix não tem combobox. Para ver tudo funcionando, abra [`/design-system`](http://localhost:3000/design-system), disponível só em desenvolvimento.

| Arquivo                              | Exporta                                                                     | Observações                                                                                                                                                                                                                                                                                  |
| ------------------------------------ | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `button.tsx`                         | `Button`, `IconButton`, `buttonClasses`                                     | variantes `primario`, `secundario`, `perigo`, `fantasma`; tamanhos `padrao`, `compacto`, `icone`; `loading` mantém o texto e desabilita; `type` padrão é `button`; `IconButton` exige `aria-label`                                                                                           |
| `input.tsx`, `textarea.tsx`          | `Input`, `Textarea`                                                         | `label` obrigatório; `error` e `hint` ligados ao campo (`aria-describedby`); `Input` aceita `icon` à esquerda, `trailing` à direita (um controle, como o "Mostrar senha" do login, FE-07) e `hideLabel` (rótulo só para leitor de tela, usado na busca)                                      |
| `number-input.tsx`                   | `NumberInput`, `MoneyInput`, `DecimalInput`, `IntegerInput`, `PercentInput` | `NumberInput` é a base: `type="text"`, `inputMode`, `prefixo` (`R$`) e `sufixo` (`kg`, `%`). Os outros quatro são controlados (`value`, `onValueChange`) e seguem [Campos numéricos brasileiros](#campos-numéricos-brasileiros)                                                              |
| `unidade-select.tsx`                 | `UnidadeSelect`                                                             | `Select` com os rótulos `g`, `kg`, `ml`, `L`, `un` e os valores `G \| KG \| ML \| L \| UN`; aceita `{...register('unidade')}`                                                                                                                                                                |
| `select.tsx`                         | `Select`                                                                    | `<select>` nativo, com as `<option>` como filhas; aceita `{...register('campo')}`                                                                                                                                                                                                            |
| `form.tsx`                           | `Form`, `FormDialog` e os campos `Form*`                                    | ver [`Form` e `FormDialog`](#form-e-formdialog) (FE-06)                                                                                                                                                                                                                                      |
| `list-page.tsx`, `data-table.tsx`    | `ListPage`, `DataTable`                                                     | ver [`ListPage`](#listpage) (FE-06); `DataTable` é a lista em cartões no celular e tabela a partir de `md`, sem estados                                                                                                                                                                      |
| `use-busca-na-url.ts`                | `useBuscaNaUrl`, `DEBOUNCE_BUSCA_MS`                                        | busca textual em `?q=`, com debounce de 300 ms; usado pela `ListPage` e por telas com busca fora dela                                                                                                                                                                                        |
| `combobox.tsx`                       | `Combobox`                                                                  | busca sem acentos para escolher receita ou insumo: `options` (`{ value, label }`), `value` (`string \| null`), `onValueChange`, `emptyMessage`; setas, Home/End, Enter e Esc                                                                                                                 |
| `checkbox.tsx`, `chip.tsx`           | `Checkbox`, `Chip`, `ToggleChip`                                            | `Checkbox` nativo; `Chip` é só texto; `ToggleChip` (`selected`, `onSelectedChange`) para os gastos da produção                                                                                                                                                                               |
| `segmented-control.tsx`              | `SegmentedControl`                                                          | filtro "Todos / Baixo" do estoque: `aria-label`, `options`, `value`, `onValueChange`; sempre há uma opção escolhida                                                                                                                                                                          |
| `slider.tsx`                         | `Slider`                                                                    | `label`, `value`, `min`, `max`, `step`, `formatValue` (exibido e anunciado), `hint`; setas, Page Up/Down, Home/End; usado na simulação                                                                                                                                                       |
| `label.tsx`                          | `Label`, `FieldError`                                                       | para campos fora dos componentes acima                                                                                                                                                                                                                                                       |
| `alert.tsx`                          | `Alert`                                                                     | erro que não pertence a um campo: formulário, diálogo, login                                                                                                                                                                                                                                 |
| `dialog.tsx`, `drawer.tsx`           | `Dialog`, `DialogClose`, `Drawer`, `ResponsiveDialog`                       | `title` obrigatório; `trigger`, ou controle com `open` e `onOpenChange`; `footer`; o `Drawer` (`side="bottom"`, padrão) sobe de baixo no celular e fica à direita a partir de `lg`; o `ResponsiveDialog` (FE-17) é Drawer de baixo no celular e Dialog a partir de `md`, como o `FormDialog` |
| `confirm-dialog.tsx`                 | `ConfirmDialog`                                                             | ver [Confirmação](#confirmação-de-exclusão-e-de-ações); entregue na FE-04, com a `consequence` opcional da FE-06                                                                                                                                                                             |
| `tabs.tsx`                           | `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`                            | "Registrar / Histórico" em Vendas; dê `aria-label` ao `TabsList`                                                                                                                                                                                                                             |
| `card.tsx`, `stat-card.tsx`          | `Card`, `StatCard`                                                          | `Card` com `title` vira seção com rótulo em caixa alta; `variant="resumo"` tem cantos de 14px. `StatCard`: `title`, `value`, `detail`, `detailTone` e `icon` (painel)                                                                                                                        |
| `badge.tsx`                          | `Badge`, `StatusEstoqueBadge`, `StatusVendaBadge`, `TipoGastoBadge`         | sempre com cor e texto; `StatusVenda` e `TipoGasto` e os rótulos vêm de `shared/api/contracts/enums.ts`; `StatusEstoque` fica aqui, porque é calculado no cliente (FE-13)                                                                                                                    |
| `progress-bar.tsx`                   | `ProgressBar`                                                               | `<progress>` nativo; `value` de 0 a 1 (limitado), `aria-label` obrigatório, `tone` (`accent` ou a cor do status) e `valueText`                                                                                                                                                               |
| `toast.tsx`                          | `ToastProvider`, `useToast`                                                 | `toast.success(texto)`, `toast.error(texto)`, `toast.info(texto)`; some em 4 s, como o `SnackBar`; o provider fica no layout de `(app)` (desde a FE-08) e em `/design-system`                                                                                                                |
| `skeleton.tsx`, `spinner.tsx`        | `Skeleton`, `Spinner`                                                       | `Skeleton` exige `aria-label`; `Spinner` tem `label` ("Carregando")                                                                                                                                                                                                                          |
| `empty-state.tsx`, `error-state.tsx` | `EmptyState`, `ErrorState`                                                  | `EmptyState`: `title`, `description`, `action`; `ErrorState`: `title`, `message`, `onRetry` ("Tentar novamente") e `retrying`                                                                                                                                                                |
| `page-header.tsx`                    | `PageHeader`                                                                | `title` (o `h1`), `subtitle` e `actions`                                                                                                                                                                                                                                                     |
| `status-page.tsx`                    | `StatusPage`                                                                | páginas 404 e de erro (FE-08): `code`, `title` (o `h1`), `description`, `alert` (anuncia a descrição) e `action`; `standalone` traz o `<main>` e a logo, para as páginas fora do layout de `(app)`                                                                                           |
| `date-picker.tsx`                    | `DateRangePicker`, `isPeriodoValido`                                        | período do histórico de vendas: `legend`, `value` e `onChange` com `{ inicio, fim }` em `YYYY-MM-DD`; dois `<input type="date">` ("Data inicial", "Data final") e o erro de data inicial depois da final                                                                                     |
| `logo.tsx`                           | `Logo`                                                                      | wordmark "LucroAI" do cabeçalho do painel, em texto (o mobile não tem logo em imagem); `size="compacto"` para o menu                                                                                                                                                                         |
| `icons/menu.tsx`, `icons/acoes.tsx`  | `IconHome`, `IconInsumos`… e `IconEditar`, `IconExcluir`…                   | SVGs locais equivalentes aos Material Icons do mobile; decorativos (`aria-hidden`); `icons/icone.tsx` tem o `criarIcone`. Do login (FE-07): `IconEmail`, `IconCadeado`, `IconMostrar`, `IconOcultar` e `IconSair`; do layout (FE-08): `IconConta` e `IconConstrucao`                         |
| `cn.ts`                              | `cn`                                                                        | junta classes condicionais                                                                                                                                                                                                                                                                   |

O favicon (`src/app/icon.svg`) repete a identidade: fundo `bg`, "L" branco e a linha de gráfico em `accent`. É um arquivo de imagem, por isso tem as cores escritas nele.

A página `/design-system` (`src/app/design-system/page.tsx`, com o catálogo em `src/features/design-system/`) mostra todos os tokens e componentes. `/design-system/listagem` (FE-06) é o exemplo funcionando da listagem de insumos com busca, cadastro, edição e exclusão, do `Form` em página e dos estados, sobre uma API em memória (`src/features/design-system/exemplo-api.ts`) com os cenários "Falhar ao carregar", "Lista vazia" e "Falhar ao salvar e excluir". As duas devolvem 404 no build de produção.

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

Blocos da FE-06, que fazem uma tela nova ser só configuração. O [exemplo completo de insumos](architecture.md#exemplo-completo-funcionalidade-insumos) usa todos eles, e `/design-system/listagem` (`src/features/design-system/components/list-form-showcase.tsx`) é o mesmo exemplo funcionando.

### `ListPage`

```tsx
<ListPage
  title="Insumos"
  subtitle="Gerencie quantidade, valor pago e custo unitário"
  actions={<Button variant="primario">Novo insumo</Button>}
  label="Insumos"                       // nome acessível da lista ("Carregando insumos" no esqueleto)
  query={query}                         // resultado de useQuery com a lista inteira
  searchField="nome"                    // campo de texto ou função; sem ele, não há busca
  searchPlaceholder="Buscar insumo"
  itemLabel={{ singular: 'insumo', plural: 'insumos' }} // contagem; padrão "resultado(s)"
  columns={[{ id, header, cell, align?: 'right', acoes?: true }]}
  getRowKey={(item) => item.id}
  emptyTitle="Nenhum insumo encontrado."
  emptyDescription="..."                // opcional
  emptyAction={<Button>Novo insumo</Button>}   // opcional
  errorTitle="Não foi possível carregar os insumos."
  filter={(item) => ...}                // opcional: filtro extra, como `baixo=1` no estoque
  filterEmptyTitle="..."                // opcional: quando só o `filter` esvazia a lista
  filterEmptyAction={<Button>...</Button>}     // opcional
  summary={<Card>...</Card>}            // opcional: cartão de resumo acima da lista (total de gastos)
/>
```

- Arquivo `shared/ui/list-page.tsx`, Client Component. Renderiza o `PageHeader`, a busca (`type="search"` dentro de `<search>`, com o rótulo visualmente oculto igual ao `searchPlaceholder`), a contagem ("12 insumos", num `<output>` para o leitor de tela anunciar o resultado da busca), a lista e os estados.
- A busca usa `useBuscaNaUrl` (`shared/ui/use-busca-na-url.ts`): o campo responde a cada tecla; 300 ms depois da última, o termo filtra a lista e é gravado em `q` com `router.replace` (sem `scroll`). Enter aplica na hora. Recarregar a página ou voltar no navegador mantém o filtro. Os outros parâmetros da URL são preservados.
- A busca filtra no cliente com `filtrarPorTexto`, sem diferenciar acentos nem maiúsculas, depois do `filter`.
- Estados: carregando (esqueleto de cartões num `<output aria-label="Carregando insumos">`), vazio (`emptyTitle`, sem contagem), vazio por busca (`Nenhum resultado para "x"`, com "Limpar busca", que devolve o foco ao campo), vazio por filtro (`filterEmptyTitle`) e erro (`ErrorState` com `errorTitle`, a mensagem de `getErrorMessage()` e "Tentar novamente", que chama `query.refetch`).
- A lista é o `DataTable` (`shared/ui/data-table.tsx`): **cartões no celular** e **tabela a partir de `md`** (768px), só com CSS. No cartão, a primeira coluna é o título, as outras levam o rótulo da coluna e as ações vão ao rodapé. Os papéis de tabela são explícitos, porque `display: block` apaga a semântica.
- `align: 'right'` em números e valores (com `tabular-nums`); `acoes: true` alinha os botões à direita e os leva ao rodapé do cartão no celular.
- A página que usa `ListPage` precisa ler `searchParams` (ou ficar dentro de um `<Suspense>`), porque a busca usa `useSearchParams`.

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
- `Form` é a versão sem diálogo (páginas `/receitas/nova` e `/receitas/[receitaId]/editar`, cálculo real), com `cancelHref` (link "Cancelar") ou `onCancel` (botão). `FormDialog` é **Drawer de baixo no celular** (como o `showModalBottomSheet`, até 90% da altura, com rolagem interna) e **Dialog centralizado a partir de `md`**, só com CSS, com "Cancelar" e a ação primária.
- O `FormDialog` monta o formulário a cada abertura, com os `defaultValues`: fechar e abrir de novo descarta o que foi digitado. Para editar outro item, mude a `key` (como no exemplo de insumos).
- Usa `react-hook-form` com `zodResolver` e `noValidate`. O erro aparece embaixo do campo (`FieldError`, `role="alert"`), ligado por `aria-describedby` e com `aria-invalid`, e o foco vai para o primeiro campo inválido, na ordem da tela (o `FormCombobox` também recebe o foco).
- Ao abrir, o Radix foca o primeiro controle do diálogo (o botão "Fechar"); o Tab leva ao primeiro campo. Enter num campo envia o formulário.
- O botão de envio fica desabilitado durante o envio, mantendo o texto. No `FormDialog`, "Cancelar", Esc e o clique fora também ficam inativos até a chamada terminar.
- `onSubmit` precisa **rejeitar** com o `ApiError` (use `mutateAsync`, não `mutate`): é assim que o formulário mostra a mensagem do backend (`getErrorMessage()`) num `Alert` no topo, sem perder o que foi digitado. O backend do LucroAI não devolve erro por campo, então não há mapeamento de campo.
- Os campos ligados ao formulário são `FormInput`, `FormTextarea`, `FormSelect`, `FormCombobox`, `FormMoneyInput`, `FormDecimalInput`, `FormIntegerInput`, `FormPercentInput` e `FormUnidadeSelect`, todos com `name` e `label`. Os de texto e seleção usam `register`; os numéricos e o `FormCombobox` usam `useController`.
- `FormDecimalInput` aceita `unidade` (o rótulo da unidade, como `kg`, exibido à direita do campo); `FormMoneyInput` e `FormPercentInput` já mostram `R$` e `%`.
- Prévias ao vivo usam `useWatch` do `react-hook-form` dentro dos filhos do formulário (ver o exemplo de insumos).
- Formulário com alterações não salvas pede confirmação antes de sair (FE-12).

### Toasts depois de mutações

- Sucesso: `toast.success` com o texto de [business-rules.md](business-rules.md) ("Insumo criado com sucesso."), chamado no `onSubmit` ou no `onConfirm` depois do `mutateAsync`, e antes de fechar o diálogo.
- Erro em formulário ou confirmação: **não** use Toast. O `Alert` dentro do diálogo, que continua aberto, mostra a mensagem; um Toast repetiria o anúncio ao leitor de tela.
- Erro de uma mutação disparada fora de diálogo (botão direto na linha, quando houver): `toast.error(getErrorMessage(error))` no `onError` da mutação.

### Campos numéricos brasileiros

Guardam o texto digitado e são convertidos pelo schema com `numeroBR()`, `numeroBROpcional()` ou `inteiroBR()` de `src/shared/format/numero-br.ts` ([business-rules.md](business-rules.md#leitura-de-números-digitados)). Ao editar, preencha o campo com `formatNumeroEditavel(valor)` (`formatNumeroEditavel(valor, 2)` no dinheiro).

| Campo           | Ao digitar                                   | Ao sair do campo                                 | Envia                                                                                             | Uso                                           |
| --------------- | -------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| `MoneyInput`    | `R$` à esquerda; dígitos, `.` e `,`          | 2 casas: `1234.5` vira `1.234,50`                | `number` (`numeroBR`)                                                                             | valor pago, valor do gasto, preço             |
| `DecimalInput`  | unidade à direita (`kg`); dígitos, `.` e `,` | padrão brasileiro, sem arredondar (`1.234,5678`) | `number` (`numeroBR` ou `numeroBROpcional`)                                                       | quantidade de insumo e de estoque             |
| `IntegerInput`  | só dígitos (`inputMode="numeric"`)           | —                                                | inteiro (`inteiroBR`)                                                                             | rendimento, lotes, quantidade vendida, volume |
| `PercentInput`  | `%` à direita; dígitos, `.` e `,`            | padrão brasileiro, sem arredondar (`12,5`)       | pontos percentuais; a fração (`30` → `0.3`) sai na função `to...Body`, com `percentualParaFracao` | margem de lucro                               |
| `UnidadeSelect` | rótulos `g`, `kg`, `ml`, `L`, `un`           | —                                                | `G \| KG \| ML \| L \| UN`                                                                        | unidade do insumo e do rendimento             |

- Os campos recusam letras e o sinal de menos na digitação, como o teclado `numberWithOptions(decimal: true)` do mobile; o `parseNumeroBR` ainda lê negativos, para o schema dar a mensagem certa se o valor vier de outro lugar.
- Texto que não é número (`1,2,3`) fica como foi digitado ao sair do campo, para a mensagem do schema apontar o que está errado.
- Reescrever ao sair mostra como o valor foi lido: sem vírgula, o ponto é decimal (`1.234` vira `1,234`), como no mobile.
- `MoneyInput`, `DecimalInput`, `IntegerInput` e `PercentInput` são controlados (`value` e `onValueChange` com o texto) e abrem o teclado numérico no celular (`inputMode="decimal"` ou `numeric`).

## Padrões de tela

### Cabeçalho

Toda tela interna começa com `PageHeader` (ou `ListPage`, que o inclui): título no `h1`, subtítulo cinza e, à direita, a ação primária. Os textos de cada tela estão em [business-rules.md](business-rules.md). Defina também `metadata.title` na página, com o título da tela: o layout raiz usa o modelo `%s | LucroAI` (desde a FE-08), e a aba mostra "Insumos | LucroAI". Sem título, a aba mostra só "LucroAI" (a Home).

### Menu

Oito destinos fixos, na ordem do mobile (`main_screen.dart`), em `features/navegacao/menu.ts` (existe desde a FE-08): Home (`/`), Insumos, Receitas, Custos, Vendas, Estoque, Produção (`/producoes`) e Gastos (`/gastos-indiretos`). `getItemAtivo(pathname)` marca também as subtelas (`/receitas/nova` marca Receitas); telas fora do menu, como `/simulacao`, não marcam nenhum.

| Onde                     | Como                                                                                                                                                                                                                                                         |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Celular (< 768px)        | barra inferior fixa (`MenuNavegacao variante="inferior"`), fundo `bg` com borda superior `surface-alt` (`app_bottom_nav.dart`), oito colunas iguais com ícone de 22px e rótulo `text-nav` (10px) sem quebrar, 64px de altura e `env(safe-area-inset-bottom)` |
| Celular, cabeçalho       | logo (leva à Home) e o botão "Conta", que abre o `UserMenu` numa gaveta (`MenuContaCelular`): a barra não tem espaço para ele                                                                                                                                |
| Desktop (a partir de md) | menu lateral de 240px (`MenuNavegacao variante="lateral"`) com a logo, os oito itens e o `UserMenu` no rodapé                                                                                                                                                |
| Os dois                  | item ativo em `accent-strong` (no lateral, sobre `surface-alt`) com `aria-current="page"`; inativos em `ink-muted`; links reais (`<a>`), sem pré-carregamento; atalho "Pular para o conteúdo" antes do menu                                                  |

O `next dev` mostra o indicador dele em cima, à esquerda (`devIndicators` no `next.config.ts`): na posição padrão, ele cobria o item Home da barra.

O mobile recarrega os dados ao trocar de aba (`_refreshTab`). Na web não há `IndexedStack`: cada link troca de rota, a tela monta as próprias queries ao entrar e o TanStack Query mostra o que já tem em cache e revalida o que passou do `staleTime` (30 s).

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
  description={`Deseja excluir "${gasto.descricao}"?`}
  consequence="Isso afetará o custo de todas as receitas." // opcional, numa linha própria
  confirmLabel="Excluir"
  onConfirm={async () => { ... }}   // rejeitar mantém aberto e mostra a mensagem
/>
```

- O título diz a ação; a descrição cita o item entre aspas; a `consequence`, se houver, aparece numa linha própria, em destaque, como o `\n` do mobile. As duas formam a descrição acessível do diálogo.
- O botão de confirmar usa a variante `perigo` e descreve a ação ("Excluir", "Cancelar venda"), nunca "OK".
- Ao falhar, o diálogo continua aberto, com a mensagem de erro num `Alert`. A mensagem vem de `getErrorMessage()` (FE-05): a do `ApiError`, ou "Não foi possível concluir a ação. Tente novamente." para qualquer outro erro.
- O botão de voltar diz "Cancelar" (`cancelLabel` muda o texto). Durante `onConfirm`, os dois botões ficam inativos e o diálogo não fecha.

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
