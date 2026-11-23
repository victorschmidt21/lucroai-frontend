# Interface

> **Marca:** o visual e os textos seguem a marca **Doce Fatia**, descrita em [marca.md](marca.md). Leia-o antes de mexer em interface ou texto.

> **Status:** os tokens, a tipografia, os ícones e os componentes base **existem** (FE-04), em `src/app/globals.css` e `src/shared/ui/`. Os blocos de listagem e formulário (`ListPage`, `DataTable`, `Form`, `FormDialog`, os campos numéricos e o `UnidadeSelect`) **existem** desde a FE-06, com o exemplo funcionando em [`/design-system/listagem`](http://localhost:3000/design-system/listagem). O layout das telas internas, com o menu, a `StatusPage` e o token `text-nav` **existem** desde a FE-08. Desde a FE-50, a referência visual é a marca Doce Fatia ([marca.md](marca.md)), não mais o app Flutter; desde a FE-51, os tokens usam a paleta clara **Confeitaria** (as tabelas abaixo); o modo noite opcional **existe** desde a FE-52 ([Aparência](#aparência)); a tipografia Fredoka e Nunito, os raios da marca e as áreas de toque de 48px **existem** desde a FE-53; os ícones de traço arredondado (`lucide-react`) **existem** desde a FE-56 ([Ícones](#ícones)).

## Princípios

1. **A marca Doce Fatia guia o visual** ([marca.md](marca.md)).
2. **Tema claro é o padrão**; o modo noite é opcional ([Aparência](#aparência)).
3. **Use o design system e os tokens.** Não recrie botão, campo ou diálogo dentro de uma funcionalidade; se faltar uma variação, adicione-a em `src/shared/ui/`. Nenhuma cor fixa fora de `src/app/globals.css`.
4. **Acessibilidade não é opcional**: teclado, foco visível, rótulos, contraste de 4,5:1 e status com cor **e** texto.
5. **Celular primeiro.** O público usa o celular na produção; toda tela funciona em 360px sem rolagem horizontal.

## Tokens

Paleta **Confeitaria** da marca, em tema claro (FE-51, [marca.md](marca.md#cores-paleta-confeitaria)). Os nomes vêm do tema escuro antigo, para as telas não mudarem. Ficam em variáveis CSS (`:root`) e no tema do Tailwind em `src/app/globals.css`; nas telas, use só as utilidades geradas (`bg-surface`, `text-ink-muted`, `border-border-field`). As cores, sombras, raios e tamanhos de texto prontos do Tailwind foram removidos do tema: `bg-orange-500`, `text-white`, `shadow-md` e `text-sm` não geram estilo. O teste `src/shared/ui/sem-cores-fixas.test.ts` falha se aparecer cor fixa (hex, `rgb()`, paleta do Tailwind) fora de `globals.css`.

| Token            | Valor (nome na marca)    | Uso                                                                       |
| ---------------- | ------------------------ | ------------------------------------------------------------------------- |
| `bg`             | #FFF8F3 (Chantilly)      | fundo da página e da barra inferior                                       |
| `bg-alt`         | #FFF8F3                  | mesmo valor de `bg`, mantido por compatibilidade                          |
| `surface`        | #FFFFFF (Forma)          | cartões, botão secundário                                                 |
| `surface-alt`    | #FBEEE7 (Merengue)       | campos, áreas agrupadas, hover, badge "Cancelada"                         |
| `surface-raised` | #FFFFFF                  | Dialog, Drawer, Toast, lista do Combobox (a diferença vem da sombra)      |
| `border`         | #EBD8CF                  | borda de cartão                                                           |
| `border-strong`  | #D9C0B5                  | divisores, trilho da `ProgressBar`                                        |
| `border-field`   | #9C8279 (Borda de campo) | borda de campo, Checkbox, `SegmentedControl`, chip e botão secundário     |
| `ink`            | #3A2530 (Cacau)          | texto principal (nunca preto puro)                                        |
| `ink-muted`      | #7A5F69 (Cacau 2)        | rótulos, texto secundário e status Cancelada                              |
| `ink-subtle`     | #7A5F69                  | placeholder                                                               |
| `accent`         | #A3326E (Amora)          | cor primária: botão primário, valores em destaque, foco, aba ativa, links |
| `accent-strong`  | #8A285C (Amora forte)    | hover e pressionado da primária                                           |
| `on-accent`      | #FFFFFF                  | texto e ícone sobre `accent` e `accent-strong`                            |
| `accent-soft`    | #FADCE9 (Amora suave)    | `ToggleChip` selecionado, Badge `destaque`                                |
| `highlight`      | #F08A5D (Damasco)        | decorativo (fatia do símbolo, ilustração); **nunca texto nem botão**      |
| `highlight-ink`  | #B04E25                  | texto em Damasco                                                          |
| `success`        | #2A6F46 (Pistache)       | lucro positivo, status Adequado e Concluída                               |
| `success-soft`   | #DDF1E3                  | fundo dos status Adequado e Concluída                                     |
| `warning`        | #8A5A00 (Caramelo)       | status Baixo e Pendente                                                   |
| `warning-soft`   | #FCEBC6                  | fundo dos status Baixo e Pendente                                         |
| `danger`         | #B8342A (Cereja)         | erro, prejuízo, status Crítico                                            |
| `danger-strong`  | #9E2B22                  | botão de perigo                                                           |
| `on-danger`      | #FFFFFF                  | texto sobre `danger` e `danger-strong`                                    |
| `danger-soft`    | #FBE1DC                  | fundo do status Crítico                                                   |
| `overlay`        | `rgb(58 37 48 / 0.45)`   | fundo atrás de Dialog e Drawer, em tom Cacau                              |

Os valores do modo noite estão em [Aparência](#aparência).

### Contraste

Medido em `src/shared/ui/tokens.test.ts`, que lê `globals.css` e calcula a razão do WCAG para cada par usado. Token ou combinação nova entra nesse teste. No navegador, o `axe` do `e2e/design-system.spec.ts` confere o contraste da página `/design-system` inteira.

| Combinação                                          | Contraste       | Onde                                                                |
| --------------------------------------------------- | --------------- | ------------------------------------------------------------------- |
| `ink` sobre `bg`                                    | 13,43:1         | texto principal                                                     |
| `ink-muted` sobre `surface-alt`                     | 5,04:1          | pior caso do texto secundário; passa em todos os fundos             |
| `accent` sobre `surface` / `surface-alt`            | 6,48:1 / 5,71:1 | link, valor em destaque e foco (`outline: 2px solid var(--accent)`) |
| `on-accent` sobre `accent` / `accent-strong`        | 6,48:1 / 8,27:1 | botão primário e o hover dele                                       |
| `ink` sobre `accent-soft`                           | 11,08:1         | `ToggleChip` selecionado                                            |
| `highlight-ink` sobre `surface`                     | 5,30:1          | texto em Damasco; o próprio `highlight` não atinge 4,5:1            |
| `success` sobre `success-soft`                      | 5,13:1          | badges Adequado e Concluída                                         |
| `warning` sobre `warning-soft`                      | 5,03:1          | badges Baixo e Pendente                                             |
| `danger` sobre `danger-soft`                        | 4,75:1          | badge Crítico e "Estoque negativo"                                  |
| `on-danger` sobre `danger-strong`                   | 7,44:1          | botão de perigo                                                     |
| `border-field` sobre `surface` (não textual, ≥ 3:1) | 3,57:1          | borda de campo, Checkbox e `SegmentedControl`                       |

A borda de cartão (`border`) é decorativa e não precisa de 3:1: o cartão se separa pelo fundo. Campos, Checkbox e controles de seleção usam `border-field`, que passa de 3:1 sobre `surface`, `surface-alt` e `bg`.

### Aparência

Desde a FE-52. **O tema claro é o padrão**: a cozinha é iluminada e muita gente do público tem mais de 40 anos. O **modo noite** (fundo Ganache) é opcional, para quem anota pedidos à noite.

- Três escolhas: "Claro" (`claro`, padrão), "Noite" (`noite`) e "Igual ao celular" (`automatico`, segue `prefers-color-scheme`). Ficam em `src/shared/ui/tema.ts` (`TEMAS`, `OPCOES_TEMA`, `lerTema`, `cookieDoTema`).
- A escolha fica no cookie `tema` (1 ano, `SameSite=Lax`, `Path=/`, `Secure` em HTTPS, **sem** `HttpOnly`): é só preferência visual, não dado de negócio ([security.md](security.md#o-que-nunca-guardar-no-navegador)). O `RootLayout` lê o cookie no servidor (`lerTema`: ausente ou inválido vira `claro`) e põe `data-tema` no `<html>`; assim o modo noite não pisca o claro ao carregar, sem script inline. Sem cookie, o app abre claro mesmo com o celular no modo escuro.
- `TemaProvider` (no `RootLayout`) guarda a escolha; `useTema()` a lê e troca: atualiza o `data-tema` e o cookie na hora, sem recarregar. `SeletorAparencia` mostra a escolha com o toast "Aparência alterada": `SegmentedControl` no cartão "Aparência" de `/configuracoes` e `Select` "Aparência" (`variante="lista"`) no `UserMenu` (menu lateral e gaveta "Conta").
- Em `globals.css`, os tokens do noite ficam em `:root[data-tema='noite']` e, repetidos, em `@media (prefers-color-scheme: dark) { :root[data-tema='automatico'] }`, com `color-scheme: dark`. "Igual ao celular" acompanha a troca do sistema sem recarregar, pela própria media query. A sombra virou token (`--sombra-elevacao`, usada por `shadow-elevacao`) para trocar junto. As telas não mudam: os mesmos nomes de token valem nos dois modos.

| Token                                     | Noite                                                    |
| ----------------------------------------- | -------------------------------------------------------- |
| `bg`, `bg-alt`                            | #1F1519 (Ganache)                                        |
| `surface`                                 | #2A1C22                                                  |
| `surface-alt`, `surface-raised`           | #352630                                                  |
| `border` / `border-strong`                | #4A3540 / #5A4250                                        |
| `border-field`                            | #8E7480                                                  |
| `ink` / `ink-muted`, `ink-subtle`         | #FBEFE8 / #C2A9B2                                        |
| `accent` / `accent-strong`                | #F291BD / #F7A8CB                                        |
| `on-accent`, `on-danger`                  | #1F1519                                                  |
| `accent-soft`                             | #4A2338                                                  |
| `highlight`, `highlight-ink`              | #F7A27B                                                  |
| `success` / `success-soft`                | #7FD19D / #1E3A2A                                        |
| `warning` / `warning-soft`                | #F2C46B / #3D2E10                                        |
| `danger`, `danger-strong` / `danger-soft` | #FF8A7D / #47201C                                        |
| `overlay`                                 | `rgb(0 0 0 / 0.7)`                                       |
| `--sombra-elevacao`                       | `0 1px 2px rgb(0 0 0 / .3), 0 8px 24px rgb(0 0 0 / .35)` |

O `tokens.test.ts` mede os pares do noite (`ink`/`surface-raised` 12,65:1, `ink-muted`/`surface-raised` 6,53:1, `accent`/`bg` 8,11:1, `accent`/`surface-raised` 6,50:1, `on-accent`/`accent-strong` 9,68:1, `success`/`success-soft` 6,79:1, `warning`/`warning-soft` 8,07:1, `danger`/`danger-soft` 6,16:1, `on-danger`/`danger` 7,79:1, `ink`/`accent-soft` 11,72:1, `border-field`/`surface` 3,85:1 não textual), passa todas as combinações de texto e não textuais do claro também no noite e confere que os blocos `noite` e `automatico` são iguais. Token novo ganha valor nos dois modos.

### Status

Badges usam sempre cor **e** texto, com os rótulos de [business-rules.md](business-rules.md#enumerações-e-rótulos). Cada status tem um token próprio (`status-critico`, `status-pendente` etc.), que aponta para o semântico; o fundo do Badge é o `*-soft` correspondente:

| Domínio | Valor       | Texto     | Token              | Aponta para | Fundo do Badge |
| ------- | ----------- | --------- | ------------------ | ----------- | -------------- |
| Estoque | crítico     | Crítico   | `status-critico`   | `danger`    | `danger-soft`  |
| Estoque | baixo       | Baixo     | `status-baixo`     | `warning`   | `warning-soft` |
| Estoque | adequado    | Adequado  | `status-adequado`  | `success`   | `success-soft` |
| Venda   | `PENDENTE`  | Pendente  | `status-pendente`  | `warning`   | `warning-soft` |
| Venda   | `CONCLUIDA` | Concluída | `status-concluida` | `success`   | `success-soft` |
| Venda   | `CANCELADA` | Cancelada | `status-cancelada` | `ink-muted` | `surface-alt`  |

"Cancelada" é neutra (Cacau 2 sobre Merengue), para uma venda cancelada não parecer um erro.

### Forma e profundidade

- **Cantos macios**, da marca Doce Fatia ([marca.md](marca.md#forma), FE-53): `rounded-sm` (10px) em itens pequenos, `rounded-md` (14px) em campos, na lista do Combobox, no Toast e nas áreas agrupadas dentro de cartões, `rounded-lg` (20px) em cartões (`Card`, `StatCard`, cartões da `DataTable` e da `ListPage`) e `rounded-xl` (24px) no Dialog e no Drawer. Pílula (`rounded-full`) em botões, `IconButton`, chips, badges, `SegmentedControl`, itens do menu lateral e Spinner.
- **Áreas de toque de 48px** (`min-h-12`) em qualquer largura: botões (inclusive `compacto`), `IconButton` (`size-12`), campos (`CONTROL_HEIGHT_CLASSES`), `SegmentedControl`, abas, itens do menu lateral e opções do Combobox. O `ToggleChip` tem 32px de altura visível e chega a 48px pelo `::before`.
- **Sem gradientes.** Sombra (`shadow-elevacao`, quente, em tom Cacau) só em Dialog, Drawer, Toast e a lista do Combobox.
- Separação entre áreas por fundo e borda (`surface` com `border`).

### Tipografia

Duas fontes arredondadas da [marca](marca.md#tipografia), via `next/font/google` em `src/app/fonts.ts` (FE-53). O `next/font` hospeda os arquivos no próprio app: o navegador não chama o Google.

- **Fredoka** (500 e 600, variável `--font-fredoka`): títulos, números de destaque e logotipo. Os tokens `text-display-lg`, `text-heading` e `text-display` já trocam a fonte (regra em `@layer utilities` no `globals.css`, porque o Tailwind não aceita `--text-*--font-family`); fora deles, use o utilitário `font-display`. **Nunca em texto corrido.**
- **Nunito** (400, 600, 700 e 800, variável `--font-nunito`): todo o resto, pelo `font-sans` do `<body>`. Sem o peso 500: `font-medium` cai no 400.
- Valores em R$ e quantidades com `tabular-nums`: já vem no `StatCard`, no `Card`, na `DataTable` e nos campos numéricos.

| Classe               | Tamanho e fonte                        | Uso                                                                             |
| -------------------- | -------------------------------------- | ------------------------------------------------------------------------------- |
| `text-display-lg`    | 36px, altura 40px, Fredoka 600         | destaque "CUSTO POR UNIDADE" do cálculo real, código da `StatusPage`            |
| `text-heading`       | 24px, altura 30px, Fredoka 600         | título da página (`h1`, `PageHeader`), como "Insumos"; a `Logo`                 |
| `text-display`       | 22px, altura 28px, Fredoka 600         | valor dos indicadores do painel (`StatCard`) e preços em destaque               |
| `text-title`         | 18px, altura 24px, Nunito 800          | título de Dialog e Drawer, valor do Slider                                      |
| `text-field`         | 16px, altura 24px, Nunito 400          | texto digitado nos campos (não diminuir: o iOS amplia a tela com menos de 16px) |
| `text-body`          | 16px, altura 24px, Nunito 400          | texto, botões e rótulos                                                         |
| `text-small`         | 14px, altura 20px, Nunito 600          | texto de apoio, dicas e erros dos campos                                        |
| `text-subtitle`      | 14px, altura 20px, Nunito 600          | texto cinza sob o título (com `text-ink-subtle`)                                |
| `text-caption`       | 13px, altura 18px, Nunito 700          | legendas, metadados e badges                                                    |
| `text-section-label` | 12px, Nunito 800, caixa alta, `0.06em` | rótulos de seção, como "CUSTOS INVISÍVEIS"; nunca em texto corrido              |
| `text-nav`           | 12px, altura 16px, Nunito 700          | rótulo da barra inferior do celular, com cinco itens (FE-57)                    |

O peso de cada token vale quando não há um `font-*` explícito, que sempre vence. Nada abaixo de 12px.

`text-section-label` já aplica a caixa alta: escreva o texto normal ("Custos invisíveis"), com acento. Em texto corrido, escreva o nome do produto como manda a [marca](marca.md#nome): **Doce Fatia** (desde a FE-54).

## Componentes (`src/shared/ui/`)

Componentes base da FE-04. Radix UI onde há foco e teclado (Dialog, Drawer, Tabs, Toast, Slider, SegmentedControl e ToggleChip); nativos onde já funcionam bem (Input, Select, Checkbox, datas). O `Combobox` é próprio, porque o Radix não tem combobox. Para ver tudo funcionando, abra [`/design-system`](http://localhost:3000/design-system), disponível só em desenvolvimento.

| Arquivo                              | Exporta                                                                     | Observações                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------------------------------------ | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `button.tsx`                         | `Button`, `IconButton`, `buttonClasses`                                     | variantes `primario` (Amora, uma por tela), `secundario` (contorno Amora de 2px, fundo transparente, hover `accent-soft`), `fantasma` ("suave": `accent-soft` com texto `ink`), `perigo` e `icone` (base do `IconButton`); todas em pílula, `min-h-12`, Nunito 800; desabilitado com opacidade 0,5 e cursor padrão; tamanhos `padrao`, `compacto`, `icone`; `loading` mantém o texto e desabilita; `type` padrão é `button`; `IconButton` é um círculo de 48px `surface-alt` com ícone `ink` (hover `accent-soft`) e exige `aria-label`; `iconButtonClasses()` dá essa aparência a um link (FE-55)                 |
| `input.tsx`, `textarea.tsx`          | `Input`, `Textarea`                                                         | `label` obrigatório (Nunito 800 de 14px, acima do campo); `error` (borda `danger` e mensagem com ícone) e `hint` (13px `ink-muted`, abaixo) ligados ao campo (`aria-describedby`); `Input` aceita `icon` à esquerda, `trailing` à direita (um controle, como o "Mostrar senha" do login, FE-07) e `hideLabel` (rótulo só para leitor de tela, usado na busca). Todos os campos (`Input`, `Textarea`, `Select`, `NumberInput`, `Combobox`, datas, `UnidadeSelect`) usam `CONTROL_CLASSES`: `surface`, borda 2px `border-field`, 14px, `min-h-12`, 16px; no foco, borda `accent` e anel de 4px `accent-soft` (FE-55) |
| `number-input.tsx`                   | `NumberInput`, `MoneyInput`, `DecimalInput`, `IntegerInput`, `PercentInput` | `NumberInput` é a base: `type="text"`, `inputMode`, `prefixo` (`R$`) e `sufixo` (`kg`, `%`). Os outros quatro são controlados (`value`, `onValueChange`) e seguem [Campos numéricos brasileiros](#campos-numéricos-brasileiros)                                                                                                                                                                                                                                                                                                                                                                                    |
| `unidade-select.tsx`                 | `UnidadeSelect`                                                             | `Select` com os rótulos `g`, `kg`, `ml`, `L`, `un` e os valores `G \| KG \| ML \| L \| UN`; aceita `{...register('unidade')}`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `select.tsx`                         | `Select`                                                                    | `<select>` nativo, com as `<option>` como filhas; aceita `{...register('campo')}`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `form.tsx`                           | `Form`, `FormDialog` e os campos `Form*`                                    | ver [`Form` e `FormDialog`](#form-e-formdialog) (FE-06)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `list-page.tsx`, `data-table.tsx`    | `ListPage`, `DataTable`                                                     | ver [`ListPage`](#listpage) (FE-06); `DataTable` é a lista em cartões no celular e tabela a partir de `md`, sem estados; na tabela, cabeçalho `surface-alt` com rótulos em caixa alta de 12px `ink-muted` e divisores `border` (FE-55)                                                                                                                                                                                                                                                                                                                                                                             |
| `use-busca-na-url.ts`                | `useBuscaNaUrl`, `DEBOUNCE_BUSCA_MS`                                        | busca textual em `?q=`, com debounce de 300 ms; usado pela `ListPage` e por telas com busca fora dela                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `combobox.tsx`                       | `Combobox`                                                                  | busca sem acentos para escolher receita ou insumo: `options` (`{ value, label }`), `value` (`string \| null`), `onValueChange`, `emptyMessage`; setas, Home/End, Enter e Esc                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `checkbox.tsx`, `chip.tsx`           | `Checkbox`, `Chip`, `ToggleChip`                                            | `Checkbox` nativo; `Chip` é só texto; `ToggleChip` (`selected`, `onSelectedChange`) para os gastos da produção; os dois em pílula com borda `border`, e o selecionado em `accent-soft` com borda `accent` (FE-55)                                                                                                                                                                                                                                                                                                                                                                                                  |
| `segmented-control.tsx`              | `SegmentedControl`                                                          | filtro "Todos / Baixo" do estoque: `aria-label`, `options`, `value`, `onValueChange`; sempre há uma opção escolhida; trilho `surface-alt` em pílula e opção ativa `surface` com `shadow-elevacao` e texto `ink` 800 (FE-55); `larguraDoTexto` deixa cada opção com a largura do texto (aparência, FE-52)                                                                                                                                                                                                                                                                                                           |
| `slider.tsx`                         | `Slider`                                                                    | `label`, `value`, `min`, `max`, `step`, `formatValue` (exibido e anunciado), `hint`; setas, Page Up/Down, Home/End; trilho `border-strong`, preenchimento `accent` e polegar de 24px `accent` com borda de 3px `surface` (FE-55); usado na simulação                                                                                                                                                                                                                                                                                                                                                               |
| `label.tsx`                          | `Label`, `FieldError`                                                       | para campos fora dos componentes acima                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `alert.tsx`                          | `Alert`                                                                     | erro que não pertence a um campo: formulário, diálogo, login                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `dialog.tsx`, `drawer.tsx`           | `Dialog`, `DialogClose`, `Drawer`, `ResponsiveDialog`                       | `title` obrigatório (em Fredoka, `text-display`); `surface-raised`, cantos de 24px, `shadow-elevacao` e fundo `overlay` (FE-55); `trigger`, ou controle com `open` e `onOpenChange`; `footer`; o `Drawer` (`side="bottom"`, padrão) sobe de baixo no celular e fica à direita a partir de `lg`; o `ResponsiveDialog` (FE-17) é Drawer de baixo no celular e Dialog a partir de `md`, como o `FormDialog`                                                                                                                                                                                                           |
| `confirm-dialog.tsx`                 | `ConfirmDialog`                                                             | ver [Confirmação](#confirmação-de-exclusão-e-de-ações); entregue na FE-04, com a `consequence` opcional da FE-06                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `tabs.tsx`                           | `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`                            | "Registrar / Histórico" em Vendas; dê `aria-label` ao `TabsList`; a aba ativa tem texto `accent` e sublinhado arredondado de 3px (FE-55)                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `card.tsx`, `stat-card.tsx`          | `Card`, `StatCard`                                                          | `Card` com `title` vira seção com rótulo em caixa alta; `surface`, borda `border`, cantos de 20px, sem sombra e `tabular-nums`; `variant="destaque"` ganha `shadow-elevacao` (FE-55). `StatCard`: `title` (Nunito 700 de 13px `ink-muted`), `value` (Fredoka 600, `tabular-nums`), `detail` em chip `*-soft` com `detailTone`, `icon` e `variant` (`padrao` ou `heroi`: fundo `accent`, texto `on-accent`, valor de 36px, para o painel da FE-58)                                                                                                                                                                  |
| `badge.tsx`                          | `Badge`, `StatusEstoqueBadge`, `StatusVendaBadge`, `TipoGastoBadge`         | pílula com ponto de 8px na cor do texto (só nos tons de status) e texto Nunito 800 de 13px, sobre `*-soft`; "Cancelada" e `neutro` em `surface-alt` com `ink-muted` (FE-55); sempre com cor e texto; `StatusVenda` e `TipoGasto` e os rótulos vêm de `shared/api/contracts/enums.ts`; `StatusEstoque` fica aqui, porque é calculado no cliente (FE-13)                                                                                                                                                                                                                                                             |
| `progress-bar.tsx`                   | `ProgressBar`                                                               | `<progress>` nativo; `value` de 0 a 1 (limitado), `aria-label` obrigatório, `tone` (`accent` ou a cor do status) e `valueText`; trilho `border-strong` e pontas arredondadas (FE-55)                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `toast.tsx`                          | `ToastProvider`, `useToast`                                                 | `toast.success(texto)`, `toast.error(texto)`, `toast.info(texto)`; invertido (`bg-ink`, texto `bg`, cantos de 20px) com o ícone num círculo `success`, `danger` ou `accent` (FE-55); some em 4 s, como o `SnackBar`; o provider fica no layout de `(app)` (desde a FE-08) e em `/design-system`                                                                                                                                                                                                                                                                                                                    |
| `skeleton.tsx`, `spinner.tsx`        | `Skeleton`, `Spinner`                                                       | `Skeleton` (`surface-alt` com pulso, parado com `prefers-reduced-motion`) exige `aria-label`; `Spinner` em `accent` tem `label` ("Carregando")                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `empty-state.tsx`, `error-state.tsx` | `EmptyState`, `ErrorState`                                                  | caixa com borda tracejada de 2px `border`, cantos de 20px e conteúdo centralizado, título em Fredoka 600 de 18px (FE-55). `EmptyState`: `title`, `description`, `action`, `icon` e `ilustracao` (ReactNode decorativo no lugar do ícone; desenhos na FE-59); `ErrorState`: `title`, `message`, `onRetry` ("Tentar novamente") e `retrying`                                                                                                                                                                                                                                                                         |
| `page-header.tsx`                    | `PageHeader`                                                                | `title` (o `h1`, Fredoka 600), `subtitle` (`ink-muted`) e `actions` (abaixo no celular e à direita a partir de `sm`, FE-55)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `status-page.tsx`                    | `StatusPage`                                                                | páginas 404 e de erro (FE-08), na caixa tracejada do `EmptyState` (FE-55): `code`, `title` (o `h1`), `description`, `alert` (anuncia a descrição) e `action`; `standalone` traz o `<main>` e a logo, para as páginas fora do layout de `(app)`                                                                                                                                                                                                                                                                                                                                                                     |
| `date-picker.tsx`                    | `DateRangePicker`, `isPeriodoValido`                                        | período do histórico de vendas: `legend`, `value` e `onChange` com `{ inicio, fim }` em `YYYY-MM-DD`; dois `<input type="date">` ("Data inicial", "Data final") e o erro de data inicial depois da final                                                                                                                                                                                                                                                                                                                                                                                                           |
| `logo.tsx`                           | `Logo`                                                                      | logo Doce Fatia (FE-54): símbolo e logotipo, `variante`, `size` e `tom`; ver [Logo](#logo)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `icons/menu.tsx`, `icons/acoes.tsx`  | `IconHome`, `IconInsumos`… e `IconEditar`, `IconExcluir`…                   | contorno do `lucide-react` com traço de 2px (FE-56, [Ícones](#ícones)); decorativos (`aria-hidden`); `icons/icone.tsx` tem o `criarIcone(nome, IconeDoLucide)`. Do login (FE-07): `IconEmail`, `IconCadeado`, `IconMostrar`, `IconOcultar` e `IconSair`; do layout (FE-08): `IconConta` e `IconConstrucao`; dos avisos (FE-56): `IconAvisos`                                                                                                                                                                                                                                                                       |
| `cn.ts`                              | `cn`                                                                        | junta classes condicionais                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |

### Logo

O desenho, as versões e as proibições estão em [marca.md](marca.md#logo). No código (FE-54), `Logo` é um `role="img"` com `aria-label="Doce Fatia"` (o SVG e o logotipo ficam `aria-hidden`), e as cores vêm dos tokens, então o modo noite troca sozinho:

- `variante`: `completo` (símbolo + "Doce" em Fredoka 500 `accent` + "Fatia" em Fredoka 600 `ink`, padrão) ou `simbolo`;
- `size`: `padrao` (login, páginas de erro) ou `compacto` (menu lateral e topo do celular);
- `tom`: `normal` ou `sobre-cor`, sobre fundo `accent` (bolo `on-accent`, fatia `highlight`, confeitos `accent`, logotipo `on-accent`).

Os ícones do app são arquivos de imagem, por isso têm as cores escritas neles: `src/app/icon.svg` (favicon, só o símbolo), `src/app/apple-icon.png` (180px) e `public/icon-192.png` e `icon-512.png` (do `src/app/manifest.ts`), com o símbolo sobre Chantilly e 15% de margem. O manifesto também tem as cores fixas (`theme_color` Amora, `background_color` Chantilly) e é a única exceção do `sem-cores-fixas.test.ts` além do `globals.css`. Se a arte final do símbolo mudar, troque os caminhos no `logo.tsx` e no `icon.svg` e gere os PNGs de novo a partir do `icon.svg` (com o `sharp`, que já vem com o Next).

A página `/design-system` (`src/app/design-system/page.tsx`, com o catálogo em `src/features/design-system/`) mostra todos os tokens e componentes, com o seletor de aparência no topo (claro e noite) e a seção "Estados dos componentes" (padrão, hover, foco, erro ou carregando e desabilitado lado a lado; hover e foco simulados com classes `!`, FE-55). `/design-system/listagem` (FE-06) é o exemplo funcionando da listagem de insumos com busca, cadastro, edição e exclusão, do `Form` em página e dos estados, sobre uma API em memória (`src/features/design-system/exemplo-api.ts`) com os cenários "Falhar ao carregar", "Lista vazia" e "Falhar ao salvar e excluir". As duas devolvem 404 no build de produção.

### Ícones

Desde a FE-56, os ícones são do [`lucide-react`](https://lucide.dev) (licença ISC, versão exata no `package.json`), importados um a um (`lucide-react/icons/<nome>`) para não pesar o bundle. As telas não importam o `lucide-react`: usam os `Icon…` de `src/shared/ui/icons/`, que passam pelo `criarIcone`. A regra ([marca.md](marca.md#ícones)):

- contorno, traço de 2px (`strokeWidth={2}`) com pontas arredondadas, cor `currentColor` (a cor vem do texto, por classe de token);
- 20px (`size-5`, o padrão) em botões, campos e textos; 24px (`size-6`) no menu lateral e na barra inferior;
- sempre decorativos (`aria-hidden`): o nome vem do texto ao lado ou do `aria-label` do botão; na navegação, ícone sempre com rótulo;
- nada de ícone preenchido nem desenhado à mão; um ícone novo entra em `menu.tsx` ou `acoes.tsx` com `criarIcone`, preferindo metáforas de cozinha.

| Export              | Lucide              | Por quê                              |
| ------------------- | ------------------- | ------------------------------------ |
| `IconHome`          | `House`             | início                               |
| `IconInsumos`       | `Wheat`             | ingredientes                         |
| `IconReceitas`      | `BookOpen`          | caderno de receitas                  |
| `IconCustos`        | `ChartPie`          | a fatia: quanto custa cada parte     |
| `IconVendas`        | `ShoppingBag`       | sacola de entrega                    |
| `IconEstoque`       | `Archive`           | despensa                             |
| `IconProducao`      | `CookingPot`        | fornada                              |
| `IconGastos`        | `Receipt`           | contas da casa                       |
| `IconConfiguracoes` | `SlidersHorizontal` | ajustes                              |
| `IconAdicionar`     | `Plus`              | criar                                |
| `IconEditar`        | `Pencil`            | editar                               |
| `IconExcluir`       | `Trash2`            | excluir                              |
| `IconBusca`         | `Search`            | busca                                |
| `IconFechar`        | `X`                 | fechar diálogo, gaveta e chip        |
| `IconCheck`         | `Check`             | confirmado, opção marcada            |
| `IconChevronBaixo`  | `ChevronDown`       | abrir lista                          |
| `IconSeta`          | `ChevronRight`      | links "Ver tudo"                     |
| `IconMaisOpcoes`    | `EllipsisVertical`  | mais opções                          |
| `IconAvisos`        | `Bell`              | avisos ao entrar (`IndicadorAvisos`) |
| `IconAlerta`        | `TriangleAlert`     | atenção                              |
| `IconInfo`          | `Info`              | informação                           |
| `IconErro`          | `CircleAlert`       | erro                                 |
| `IconSucesso`       | `CircleCheck`       | sucesso                              |
| `IconSimular`       | `FlaskConical`      | simular cenário                      |
| `IconAtualizar`     | `RefreshCw`         | atualizar                            |
| `IconFiltro`        | `ListFilter`        | filtro                               |
| `IconCalendario`    | `Calendar`          | datas                                |
| `IconVazio`         | `Inbox`             | estados vazios                       |
| `IconDinheiro`      | `Banknote`          | faturamento                          |
| `IconTendencia`     | `TrendingUp`        | lucro                                |
| `IconEmail`         | `Mail`              | e-mail                               |
| `IconCadeado`       | `Lock`              | senha                                |
| `IconMostrar`       | `Eye`               | mostrar senha                        |
| `IconOcultar`       | `EyeOff`            | ocultar senha                        |
| `IconSair`          | `LogOut`            | sair                                 |
| `IconConta`         | `User`              | conta                                |
| `IconConstrucao`    | `Construction`      | tela provisória                      |
| `IconEntrada`       | `ArrowDown`         | entrada de estoque                   |
| `IconSaida`         | `ArrowUp`           | saída de estoque                     |
| `IconHistorico`     | `History`           | histórico                            |

### Ações

Cada tela tem **uma** ação primária, no `PageHeader`. O que se repete em cada linha é discreto, para não competir com os dados.

| Onde                | Use                                                                                                              |
| ------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Ação principal      | `primario` ("Novo insumo", "Registrar Venda")                                                                    |
| Ações do cabeçalho  | `secundario` ("Atualizar", atalho "Produção")                                                                    |
| Ações por linha     | `IconButton` (ou `iconButtonClasses()` num link) com `aria-label` com o nome do item ("Editar Farinha de Trigo") |
| Confirmar exclusão  | `perigo`, só dentro do `ConfirmDialog`                                                                           |
| Durante uma chamada | `loading`: desabilita e mostra progresso, mantendo o texto                                                       |

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

Toda tela interna começa com `PageHeader` (ou `ListPage`, que o inclui): título no `h1`, subtítulo cinza e, à direita, a ação primária. Os textos de cada tela estão em [business-rules.md](business-rules.md). Defina também `metadata.title` na página, com o título da tela: o layout raiz usa o modelo `%s | Doce Fatia` (desde a FE-08; o nome mudou na FE-54), e a aba mostra "Insumos | Doce Fatia". Sem título, a aba mostra só "Doce Fatia" (a Home).

### Menu

Oito destinos fixos, na ordem do mobile (`main_screen.dart`), em `features/navegacao/menu.ts` (existe desde a FE-08): Home (`/`), Insumos, Receitas, Custos, Vendas, Estoque, Produção (`/producoes`) e Gastos (`/gastos-indiretos`). `getItemAtivo(pathname)` marca também as subtelas (`/receitas/nova` marca Receitas); telas fora do menu, como `/simulacao`, não marcam nenhum.

| Onde                     | Como                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Celular (< 768px)        | barra inferior fixa (`MenuNavegacao variante="inferior"`), fundo `bg` com borda superior `surface-alt` (`app_bottom_nav.dart`), cinco colunas iguais com ícone de 24px (FE-56) e rótulo `text-nav` (12px) sem quebrar, 64px de altura e `env(safe-area-inset-bottom)`. Desde a FE-57, os oito destinos com 12px não cabiam em 360px: a barra tem Início, Receitas, Vendas, Estoque e o botão "Mais", que abre uma gaveta com Ingredientes, Custos, Fornadas, Contas do mês e Ajustes de preço (`ITENS_BARRA_INFERIOR` e `ITENS_MAIS`, `features/navegacao/menu.ts`); "Mais" ganha a pílula quando a tela atual está na gaveta |
| Celular, cabeçalho       | logo (leva à Home) e o botão "Conta", que abre o `UserMenu` numa gaveta (`MenuContaCelular`): a barra não tem espaço para ele                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Desktop (a partir de md) | menu lateral de 240px (`MenuNavegacao variante="lateral"`) com a logo, os oito itens e o `UserMenu` no rodapé                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Os dois                  | item ativo em `ink` com o ícone `accent` e `aria-current="page"` (no lateral, sobre a pílula `accent-soft`, em 800; na barra inferior, a pílula fica atrás do ícone; FE-55); lateral e barra em `surface` com borda `border`; inativos em `ink-muted`; links reais (`<a>`), sem pré-carregamento; atalho "Pular para o conteúdo" antes do menu                                                                                                                                                                                                                                                                                |

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
- Alvos de toque de pelo menos 48px (`min-h-12`), em qualquer largura ([Forma e profundidade](#forma-e-profundidade)).
- Sem rolagem horizontal da página em 360, 390, 768 e 1280px. A barra inferior com oito itens usa rótulos pequenos (9 a 11px, como o mobile), sem quebrar.
- Respeite `prefers-reduced-motion` nas animações de Dialog, Drawer e Toast.
