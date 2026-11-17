# Segurança

> **Status:** a sessão, o proxy autenticado e a proteção de rotas são entregues na **FE-07**; os cabeçalhos de segurança e o `Secure` obrigatório em produção, na **FE-24**. Hoje só existe a validação das variáveis de ambiente (`src/shared/config/`). A autenticação vale de verdade no backend (guard JWT global em `shared/src/infra/auth/`); aqui está como a interface a aplica.

## Princípios

1. **O servidor decide.** O front valida para dar resposta rápida, mas toda regra continua valendo no backend.
2. **O navegador não guarda credenciais.** O token fica em cookie `httpOnly`, inacessível ao JavaScript.
3. **Minimização.** Só chega ao navegador o que a tela usa.
4. **Uma empresa nunca vê dados de outra.** O isolamento vem do token, nunca de um id enviado pelo front.

## Sessão: BFF + cookie `httpOnly`

O navegador nunca fala direto com os microsserviços. O Next atua como BFF (_backend for frontend_):

```text
Navegador ── cookie httpOnly ──► Next (/api/auth, /api/backend/<servico>) ── Authorization: Bearer ──► serviço
```

| Rota do Next                       | O que faz                                                                  | Rota do backend                                                            |
| ---------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `POST /api/auth/login`             | autentica, desembrulha `data.access_token` e grava o cookie                | `POST {AUTH_API_URL}/auth/login`                                           |
| `POST /api/auth/logout`            | apaga o cookie (o backend não tem logout)                                  | —                                                                          |
| `GET /api/auth/sessao`             | devolve os dados do usuário e da empresa decodificados do JWT, sem o token | —                                                                          |
| `/api/backend/[servico]/[...path]` | injeta o token e repassa a chamada ao serviço                              | as rotas de [api-integration.md](api-integration.md#rotas-usadas-pela-web) |

O contrato do backend (`services/auth-service/src/modules/auth/OVERVIEW.md` e `shared/src/infra/auth/jwt.strategy.ts`):

- `POST /auth/login` com `{ email, senha }` devolve `{ data: { access_token } }`. Credenciais erradas: `401 "Credenciais inválidas"`.
- O token é um JWT **de 4 horas**, assinado com `JWT_SECRET`, com o payload `{ sub, email, nome, empresa: { id, nome, cnpj, segmento }, iat, exp }`.
- **Não há refresh token, logout nem `/auth/me`.**

Regras:

1. O token fica num único cookie `httpOnly`, `SameSite=Lax`, `Path=/` e `Secure` em produção (só o desenvolvimento em HTTP dispensa `Secure`), com `maxAge` igual ao tempo restante até o `exp` do JWT.
2. **Sem renovação.** Quando o token expira, qualquer serviço responde `401`; o proxy apaga o cookie e o cliente leva a `/login?redirect=<rota atual>` com o aviso "Sessão expirada. Faça login novamente.". O usuário perde o que não salvou: formulários longos (receita) devem avisar ao sair (FE-12), mas não há como estender a sessão.
3. **Usuário atual sem `/auth/me`.** `getUsuarioAtual()` (servidor) e `useUsuarioAtual()` (cliente, via `GET /api/auth/sessao`) **decodificam** o payload do JWT do cookie e conferem o `exp`. Isso serve só para exibir nome, e-mail e empresa; quem valida a assinatura é o backend, a cada chamada. Nunca use o payload decodificado para decidir acesso a dados.
4. **Só Route Handlers gravam ou apagam o cookie.** Server Components não conseguem gravá-lo durante a renderização.
5. `redirect` aceita só caminho interno (começa com `/` e não com `//`), para evitar redirecionamento aberto.
6. Em métodos que alteram dados, o proxy e as rotas de autenticação conferem o header `Origin` contra `NEXT_PUBLIC_APP_URL`. `SameSite=Lax` ajuda contra CSRF, mas Route Handlers não têm a checagem automática de origem das Server Actions.
7. **Ao sair**, além de apagar o cookie, limpe o cache do TanStack Query (`queryClient.clear()`), para os dados não aparecerem ao próximo usuário no mesmo navegador.

## Proxy BFF

O Route Handler `src/app/api/backend/[servico]/[...path]/route.ts` (FE-07) é a única porta do navegador para o backend. Ele:

1. **Aceita só os cinco serviços conhecidos** (`auth`, `catalog`, `recipe`, `operations`, `sales`); outro nome responde `404`.
2. **Bloqueia as rotas `internal`**: qualquer caminho com um segmento `internal` (`/insumos/internal/1`, `/gastos-indiretos/internal/empresa/1`, `/receitas/internal/1`) responde `403`. Essas rotas **não têm autenticação** no backend e expõem dados de qualquer empresa pelo id.
3. **Recusa caminhos com `..`, `//` ou barra invertida**, antes de montar a URL.
4. **Monta a URL só a partir da variável de ambiente do serviço** (`getServerEnv()`), nunca de host, URL ou header vindos da requisição (risco de SSRF).
5. Injeta `Authorization: Bearer <token>` e **não repassa** o header `Cookie` nem outros headers do navegador além de `Content-Type` e `Accept`.
6. Repassa método, query, corpo e status; não altera o corpo da resposta.
7. Em `401`, apaga o cookie e devolve `401`.
8. Não registra corpo, headers, query string nem o token em log.
9. Bloqueia também `POST /auth/login` e `POST /auth/empresa` pelo proxy: o login passa por `/api/auth/login`, que não devolve o token ao navegador.

## Proteção de rotas

São duas camadas, com papéis diferentes:

| Camada     | Arquivo                        | O que faz                                                                                                                               |
| ---------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| Otimista   | `src/proxy.ts`                 | lê só o cookie, sem chamar a API: sem cookie ou com `exp` vencido, redireciona para `/login?redirect=...`; com sessão, tira de `/login` |
| Definitiva | layout de `(app)`, no servidor | `getUsuarioAtual()`; sem sessão válida, redireciona para o login                                                                        |

- `src/proxy.ts` substitui o `middleware.ts`, porque a convenção antiga está depreciada no Next 16 (ver `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`). Ele roda em toda rota, inclusive em pré-carregamentos, e não deve fazer buscas lentas. Não o use como única proteção.
- O `matcher` dele exclui `/api`, `/_next` e arquivos estáticos. Rotas de API respondem `401`, sem redirecionar.
- A proteção que vale é a do backend: mesmo com a tela aberta, uma chamada com token vencido recebe `401`.
- **Não há perfis nem permissões por ação**: todo usuário autenticado acessa todas as telas da própria empresa. Não crie mapa de permissões nem componentes como `<Permitido>`.

## Isolamento multiempresa

O backend é multiempresa: cada serviço filtra pelo `empresa.id` do token (`@CurrentUser()`).

1. **O `empresaId` vem só do token.** Nunca o coloque em URL, query string, corpo ou estado do cliente para mandar ao backend. Os DTOs não o aceitam, e o `ValidationPipe` rejeita campos extras.
2. Ids nas rotas da tela (`/receitas/[receitaId]`) são de registros da própria empresa; um id de outra empresa responde `404`, tratado como "Registro não encontrado.".
3. O nome da empresa exibido no painel e no menu vem do payload do JWT.
4. Lacuna conhecida: `POST /producoes` não confere se a receita e os gastos são da empresa do token (ver [api-integration.md](api-integration.md#lacunas-do-backend), item 11). A web só oferece receitas e gastos listados para a própria empresa, mas a correção é do backend.

## O que nunca guardar no navegador

- **Em `localStorage`, `sessionStorage`, IndexedDB ou cookie legível por JavaScript:** o token, a senha e dados de negócio da empresa (insumos, receitas, vendas, custos).
- **No cache persistente do TanStack Query:** nada. O cache fica só em memória; não ative persistência em disco.
- **No carrinho de vendas:** o carrinho vive só no estado do componente; recarregar a página o descarta (FE-16).
- **No bundle:** segredos. Só variáveis `NEXT_PUBLIC_*` chegam ao navegador, e elas não podem conter segredo. As URLs dos serviços são de servidor.
- **Em props de Server para Client Component:** o token ou campos que a tela não usa.

**Exceção documentada:** as simulações salvas do cálculo real (FE-19) podem ir para `localStorage`, dentro de `try/catch`. São valores digitados à mão para uma conta local, sem dado pessoal e sem relação com o banco. A escolha deve ser registrada no PR da FE-19.

## Dados pessoais

O LucroAI trata poucos dados pessoais: nome e e-mail do usuário, e nome, CNPJ e segmento da empresa (no JWT). Mesmo assim:

1. **Nada de dado pessoal em URL nem em log.** Rotas usam ids. Sem `console.log` de usuário, de payload do JWT ou de resposta da API.
2. **Mensagens de erro** não repetem dado pessoal: "E-mail ou senha inválidos", sem indicar qual dos dois.
3. **Testes e desenvolvimento** usam só dados fictícios (o seed "Padaria Pão Feliz").

## Segredos e configuração

- Variáveis são validadas com Zod na inicialização (`src/shared/config/env.schema.ts`, chamado por `src/instrumentation-node.ts`); sem elas, a aplicação não sobe.
- Variável nova: adicione ao schema, ao `.env.example` (com valor fictício e comentário) e à tabela do README.
- Variável de servidor é lida com `getServerEnv()`; pública, com `publicEnv`. Não leia `process.env` direto no restante do código.
- `NEXT_PUBLIC_*` é incorporada ao bundle no build: não pode conter segredo, e mudar o valor exige novo build.
- `.env` e `.env.*` nunca são commitados (só `.env.example`). O repositório é público.
- O front não precisa do `JWT_SECRET`: ele só decodifica o payload para exibir dados, sem validar a assinatura.
- Não registre `process.env` em logs.

## Outras práticas

- Não use `dangerouslySetInnerHTML` com conteúdo vindo da API ou do usuário (nomes de insumo e receita são digitados pelo usuário).
- Valide search params e `params` com Zod: a URL é entrada do usuário.
- Em links externos abertos em nova aba, use `rel="noopener noreferrer"`.
- Cabeçalhos de segurança (CSP, `X-Frame-Options`, `Referrer-Policy`) entram no `next.config.ts` na FE-24.
- Dependências: não adicione pacotes sem manutenção; rode `npm audit` ao atualizar.
