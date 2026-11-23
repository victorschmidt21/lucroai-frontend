# Marca Doce Fatia

Manual de marca do produto (antes chamado LucroAI). Fonte: proposta de 2026-11-22, aprovada pela pessoa responsável.
Implementação: issues FE-50 a FE-60 (épico "E9 Marca Doce Fatia").

> **Status:** referência (FE-50). O tema claro com a paleta Confeitaria **existe** desde a FE-51 (`src/app/globals.css`) e o modo noite opcional desde a FE-52 ([ui.md](ui.md#aparência)). A tipografia Fredoka e Nunito, os raios e as áreas de toque de 48px **existem** desde a FE-53 ([ui.md](ui.md#tipografia)). O nome e o logo **existem** desde a FE-54 (`Logo`, ícones do app e manifesto; [ui.md](ui.md#logo)). O resto do código segue o visual antigo até cada issue do épico ser entregue: componentes (FE-55), ícones (FE-56), linguagem (FE-57), painel (FE-58), estados vazios (FE-59) e card de conquista (FE-60). O repositório, o pacote npm, as variáveis de ambiente, o cookie e as rotas continuam com `lucroai`.

## Nome

**Doce Fatia.** Todo bolo vendido é dividido em fatias: ingredientes, gás e luz, embalagem, taxa do app de entrega.
A fatia que sobra é o lucro de quem fez. O app mostra o tamanho dessa fatia e ajuda a deixá-la maior.

Escrita: sempre "Doce Fatia", duas palavras com iniciais maiúsculas. Nunca "DoceFatia", "Doce fatia" ou "DF".

Promessa: "Seu doce, seu preço justo." Assinatura alternativa: "Do forno ao lucro."

## Público

Pesquisa Sebrae-SP 2025 (900 MEIs de confeitaria e salgaderia):

- 75% mulheres; 45% têm de 30 a 39 anos; 58% produzem em casa; 70% trabalham sozinhas ou em dupla;
- 40% vendem principalmente pelas redes sociais;
- 63% veem a qualidade como chave do sucesso e só 16% citam o controle de custos;
- 32% querem aprender gestão financeira e 39% marketing digital.

Consequências: tema claro (cozinha iluminada, usuárias acima de 40 anos), números grandes, linguagem de cozinha, lucro celebrado e não auditado, visual que dá orgulho de mostrar.

Usuária de referência: a Mah, que vende produtos, é informal e não conhece termos de finanças.

## Personalidade

Uma amiga confeiteira que entende de números: acolhedora, alegre, clara, competente, feita com capricho.

A marca não é: infantil, "tudo rosa por ser para mulheres", banco ou contador, escura e técnica, cheia de emoji.

## Logo

- **Símbolo**: bolo visto de cima (círculo em Amora) com uma fatia servida e levemente afastada (Damasco) e quatro confeitos na cor do fundo. Também se lê como gráfico de pizza: a margem.
- **Logotipo**: "Doce" em Fredoka 500 na cor Amora + "Fatia" em Fredoka 600 na cor Cacau (sobre fundo claro).
- Versões: principal (fundo Chantilly), sobre Amora (bolo branco, fatia Damasco, confeitos Amora), modo noite (fundo Ganache, bolo #F291BD, fatia #F7A27B).
- Só o símbolo: ícone do app, favicon (funciona a partir de 16px), avatar de redes.
- Proibido: distorcer, girar, mudar a posição da fatia, trocar as cores, aplicar sobre Damasco ou foto sem contraste.
- Área de proteção: a largura da fatia em volta do logo.
- O desenho atual é direção; a arte final será feita por designer e só substitui os caminhos do SVG.

## Cores (paleta Confeitaria)

| Nome           | Claro (padrão)          | Noite             | Uso                                                                            |
| -------------- | ----------------------- | ----------------- | ------------------------------------------------------------------------------ |
| Chantilly      | #FFF8F3                 | Ganache #1F1519   | fundo da página                                                                |
| Forma          | #FFFFFF                 | #2A1C22           | cartões                                                                        |
| Merengue       | #FBEEE7                 | #352630           | campos, áreas agrupadas, superfícies elevadas no modo noite                    |
| Borda          | #EBD8CF                 | #4A3540           | borda de cartão                                                                |
| Borda de campo | #9C8279                 | #8E7480           | borda de campo (3:1 não textual)                                               |
| Cacau          | #3A2530                 | #FBEFE8           | texto principal (nunca preto puro)                                             |
| Cacau 2        | #7A5F69                 | #C2A9B2           | texto secundário                                                               |
| Amora          | #A3326E                 | #F291BD           | primária: botões, links, foco, aba ativa                                       |
| Amora forte    | #8A285C                 | #F7A8CB           | hover/pressionado da primária                                                  |
| Sobre Amora    | #FFFFFF                 | #1F1519           | texto sobre Amora                                                              |
| Amora suave    | #FADCE9                 | #4A2338           | chips selecionados, avatar, anel de foco                                       |
| Damasco        | #F08A5D                 | #F7A27B           | acento: fatia do símbolo, ilustração, destaques pequenos; nunca fundo de botão |
| Damasco texto  | #B04E25                 | #F7A27B           | texto em Damasco                                                               |
| Pistache       | #2A6F46 / suave #DDF1E3 | #7FD19D / #1E3A2A | lucro, Adequado, Concluída                                                     |
| Caramelo       | #8A5A00 / suave #FCEBC6 | #F2C46B / #3D2E10 | atenção, Baixo, Pendente                                                       |
| Cereja         | #B8342A / suave #FBE1DC | #FF8A7D / #47201C | erro, prejuízo, Crítico                                                        |

Proporção numa tela: 60% Chantilly/Merengue, 25% Forma, 10% Amora, 5% Damasco e status.

Rosa é tempero, não base. Todo par de texto passa de 4,5:1 (medido em `src/shared/ui/tokens.test.ts` desde a FE-51).

Status sempre com cor, ponto e texto. "Cancelada" é neutra (Cacau 2 sobre Merengue), para não parecer erro.

Os nomes dos tokens no código (`bg`, `surface`, `accent`…) e a correspondência com estes nomes ficam em [ui.md](ui.md#tokens), atualizada nas FE-51 e FE-52.

## Tipografia

- **Fredoka** (500, 600): títulos, números de destaque e logotipo. Nunca em texto corrido.
- **Nunito** (400 a 800): interface e texto. Valores em R$ sempre com `tabular-nums`.
- Escala: destaque 36px Fredoka 600; título 24px Fredoka 600; subtítulo 18px Nunito 800; texto 16px Nunito 400; legenda 13px Nunito 700. Campos com 16px no mínimo (evita zoom no iPhone). Nada abaixo de 12px.
- Caixa alta só em rótulos curtos, com 0,06em de espaçamento.

## Forma

- Raios: 14px campos, 20px cartões, 24px diálogos e gavetas, botões e chips em pílula.
- Sombra só em cartão de destaque, diálogo, gaveta e toast, sempre quente (tom Cacau), nunca preta.
- Áreas de toque de no mínimo 48px.
- Sem gradientes.

## Ícones

Traço de 2px, pontas arredondadas, contorno (lucide-react). Metáforas de cozinha quando existirem.

Na navegação, ícone sempre com rótulo.

## Ilustração e foto

- Ilustrações "spot" planas com as cores da paleta, em estados vazios, boas-vindas, conquistas e erros. Nunca enfeitando telas de trabalho.
- Pessoas: mulheres reais e diversas em idade, corpo e cor de pele, trabalhando.
- Fotos (site, loja de apps, redes): luz natural, mãos em ação, cozinha de casa de verdade. Nada de banco de imagens genérico.

## Voz e tom

1. **Fala como ela fala.** "Custos da casa", não "gastos indiretos". O termo técnico pode aparecer entre parênteses, uma vez.
2. **Um número por vez.** Cada tela responde uma pergunta: quanto custa, quanto cobrar, quanto sobrou.
3. **Comemora junto.** Lucro bom merece festa discreta; prejuízo merece um caminho, não um alarme.
4. **Respeita a profissional.** "Você", sem diminutivos, sem "amiga", sem excesso de exclamação ou emoji.

Glossário (interface → termo técnico, que fica no código e na API):

| Interface                                    | Código/API              |
| -------------------------------------------- | ----------------------- |
| Ingredientes e embalagens                    | insumos                 |
| Custos da casa                               | gastos indiretos        |
| Sobrou pra você                              | lucro líquido           |
| De cada R$ 100 vendidos, R$ X ficam com você | margem                  |
| Fornada                                      | produção                |
| Para pagar as contas do mês, venda R$ X      | ponto de equilíbrio     |
| Acabando                                     | estoque baixo / crítico |

Mensagens: dizem o que aconteceu e o que fazer, sem pedir desculpas e sem código de erro.
Ex.: "Não consegui buscar seus números agora. Confira a internet e toque em Tentar de novo."

Os textos exatos de cada tela continuam em [business-rules.md](business-rules.md) (atualizados na FE-57). Quando um texto de lá divergir desta seção, siga o de lá e corrija-o no mesmo PR que trocar a tela.

## Checklist de revisão de tela

- [ ] Só tokens (nenhuma cor fixa); funciona no claro e no noite.
- [ ] Uma ação primária (Amora) por tela.
- [ ] Números em R$ com `tabular-nums`; o número principal é o maior da tela.
- [ ] Textos sem jargão (glossário acima).
- [ ] Toque ≥ 48px; funciona em 360px sem rolagem horizontal.
- [ ] Estados vazio, carregando e erro desenhados.
