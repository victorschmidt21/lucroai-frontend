# Segurança

> **Status:** a sessão, o proxy autenticado e a proteção de rotas **existem** desde a **FE-07** (`src/shared/auth/`, `src/app/api/auth/`, `src/app/api/backend/[...path]/`, `src/proxy.ts` e `/login`), além da validação das variáveis de ambiente (`src/shared/config/`). Os cabeçalhos de segurança e a exigência de `https` em produção existem desde a **FE-24** (publicação em [deploy.md](deploy.md)). A autenticação vale de verdade no backend (guard JWT global do monolito); aqui está como a interface a aplica.

## Princípios

1. **O servidor decide.** O front valida para dar resposta rápida, mas toda regra continua valendo no backend.
2. **O navegador não guarda credenciais.** O token fica em cookie `httpOnly`, inacessível ao JavaScript.
3. **Minimização.** Só chega ao navegador o que a tela usa.
4. **Uma empresa nunca vê dados de outra.** O isolamento vem do token, nunca de um id enviado pelo front.

## Sessão: BFF + cookie `httpOnly`

O navegador nunca fala direto com a API. O Next atua como BFF (_backend for frontend_):

```text
Navegador ── cookie httpOnly ──► Next (/api/auth, /api/backend/<caminho>) ── Authorization: Bearer ──► API
```

| Rota do Next              | O que faz                                                                            | Rota do backend               |
| ------------------------- | ------------------------------------------------------------------------------------ | ----------------------------- |
| `POST /api/auth/login`    | autentica, lê o `access_token` e grava o cookie                                      | `POST {API_URL}/auth/login`   |
| `POST /api/auth/cadastro` | cria a empresa com o token de cadastro, lê o `access_token` e grava o cookie (FE-48) | `POST {API_URL}/auth/empresa` |
| `POST /api/auth/logout`   | apaga o cookie (o backend não tem logout)                                            | —                             |
| `GET /api/auth/sessao`    | devolve os dados do usuário e da empresa decodificados do JWT, sem o token           | —                             |

Os quatro ficam em `src/app/api/auth/<rota>/route.ts`. O login e o cadastro respondem `204` sem corpo (o token só vai para o cookie) e repassa o status de erro do backend (`401` com credenciais erradas); falha de rede ou token ilegível vira `502`. A sessão responde `UsuarioAtual` (`id`, `nome`, `email`, `empresa`, `expiraEm`) ou `401`, apagando um cookie vencido.
| `/api/backend/[...path]` | injeta o token e repassa a chamada à API | as rotas de [api-integration.md](api-integration.md#rotas-usadas-pela-web) |

O contrato do backend (monolito, `src/modules/auth/` e `docs/api.md`):

- `POST /auth/login` com `{ email, senha }` devolve `{ access_token }`. Credenciais erradas: `401` `CREDENCIAIS_INVALIDAS` "Credenciais inválidas"; mais de 10 tentativas por minuto: `429` `MUITAS_REQUISICOES`.
- `POST /auth/empresa` (BE-36) exige o `token_cadastro`, igual ao `CADASTRO_EMPRESA_TOKEN` do servidor; ausente ou errado: `403` `TOKEN_CADASTRO_INVALIDO`. Devolve o payload do JWT mais o `access_token`. O token de cadastro só passa pelo corpo do `POST` ao BFF: nunca vai para a URL, o `localStorage`, o `sessionStorage` nem log, e o campo é limpo depois do `403`. O BFF repassa o `details` do `400` para o formulário marcar os campos.
- O token é um JWT **de 4 horas**, assinado com `JWT_SECRET`, com o payload `{ sub, email, nome, empresa: { id, nome, cnpj, segmento }, iat, exp }`.
- **Não há refresh token, logout nem `/auth/me`.**

Regras:

1. O token fica num único cookie, `lucroai_sessao` (`SESSION_COOKIE` em `shared/auth/session-paths.ts`), `httpOnly`, `SameSite=Lax`, `Path=/` e `Secure` fora do desenvolvimento (`NODE_ENV !== 'development'`; o navegador aceita `Secure` em `http://localhost`, então o build roda nos e2e), com `maxAge` igual ao tempo restante até o `exp` do JWT (`gravarSessao`, em `session.server.ts`).
2. **Sem renovação.** Quando o token expira, a API responde `401`; o proxy apaga o cookie e o cliente leva a `/login?redirect=<rota atual>&expirada=1`, e o `expirada=1` mostra o aviso "Sessão expirada. Faça login novamente.". Quem faz isso é `handleSessaoExpirada` (`shared/auth/sessao-expirada.ts`), o `onSessaoExpirada` que o `QueryProvider` passa ao `QueryClient`. Ele não faz nada em `/login` (lá, `401` é senha errada) nem com uma navegação completa em curso (ao sair, o `queryClient.clear()` faz a sessão ser buscada de novo e receber `401`). O usuário perde o que não salvou: formulários longos (receita) devem avisar ao sair (FE-12), mas não há como estender a sessão.
3. **Usuário atual sem `/auth/me`.** `getUsuarioAtual()` (servidor, `usuario-atual.server.ts`) e `useUsuarioAtual()` (cliente, via `GET /api/auth/sessao`) **decodificam** o payload do JWT do cookie (`decodificarJwt` e `lerSessao`, em `jwt.ts`) e conferem o `exp`. Sem sessão, `getUsuarioAtual()` redireciona ao login com a rota atual (o header `x-lucroai-path`, preenchido pelo `src/proxy.ts`); `lerUsuarioAtual()` devolve `null` sem redirecionar, e `getTokenDaSessao()` entrega o token ao `apiFetch` do servidor em Server Components. Isso serve só para exibir nome, e-mail e empresa; quem valida a assinatura é o backend, a cada chamada. Nunca use o payload decodificado para decidir acesso a dados.
4. **Só Route Handlers gravam ou apagam o cookie.** Server Components não conseguem gravá-lo durante a renderização.
5. `redirect` aceita só caminho interno (começa com `/` e não com `//`), para evitar redirecionamento aberto.
6. Em métodos que alteram dados, o proxy e as rotas de autenticação conferem o header `Origin` contra `NEXT_PUBLIC_APP_URL` (`isOrigemPermitida`, em `bff.server.ts`); sem o header, ou com outra origem, `403`. Por isso, abra o front pela mesma URL de `NEXT_PUBLIC_APP_URL` (`localhost`, e não `127.0.0.1`). `SameSite=Lax` ajuda contra CSRF, mas Route Handlers não têm a checagem automática de origem das Server Actions.
7. **Ao sair** (`useLogout`), além de apagar o cookie, limpe o cache do TanStack Query (`queryClient.clear()`) e faça navegação completa (`navigateTo`), para os dados não aparecerem ao próximo usuário no mesmo navegador. Entrar também usa navegação completa.

## Proxy BFF

O Route Handler `src/app/api/backend/[...path]/route.ts` é a única porta do navegador para o backend; a lógica fica em `proxyParaBackend` (`src/shared/auth/backend-proxy.server.ts`). Ele:

1. Repassa `/api/backend/<caminho>` para `API_URL/<caminho>` (FE-39; antes havia um segmento por microsserviço). Rota que a API não tem volta com o `404` dela.
2. **Bloqueia as rotas `internal`**: qualquer caminho com um segmento `internal` (`/insumos/internal/1`) responde `403`. O monolito não tem essas rotas (nos microsserviços elas não tinham autenticação); o bloqueio fica por segurança.
3. **Recusa caminhos com `..`, `.`, segmento vazio (`//`), barra codificada ou barra invertida** com `400`, antes de montar a URL. A comparação com `internal` ignora maiúsculas, porque o Express do NestJS também ignora.
4. **Monta a URL só a partir da variável de ambiente `API_URL`** (`urlDaApi()`, com `getServerEnv()`), nunca de host, URL ou header vindos da requisição (risco de SSRF).
5. Injeta `Authorization: Bearer <token>` e **não repassa** o header `Cookie` nem outros headers do navegador além de `Content-Type` e `Accept`.
6. Repassa método, query, corpo e status; não altera o corpo da resposta.
7. Em `401`, apaga o cookie e devolve `401`. Sem cookie, ou com o `exp` vencido, responde `401` (e apaga o cookie) sem chamar a API.
8. API fora do ar vira `502` `SERVICO_INDISPONIVEL`, no formato de erro da API (`{ statusCode, code, message }`).
9. Não registra corpo, headers, query string nem o token em log.
10. Bloqueia também `POST /auth/login` e `POST /auth/empresa` pelo proxy: o login passa por `/api/auth/login` e o cadastro por `/api/auth/cadastro`, que não devolvem o token ao navegador.

## Proteção de rotas

São duas camadas, com papéis diferentes:

| Camada     | Arquivo                        | O que faz                                                                                                                                                |
| ---------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Otimista   | `src/proxy.ts`                 | lê só o cookie, sem chamar a API: sem cookie ou com `exp` vencido, redireciona para `/login?redirect=...`; com sessão, tira de `/login` e de `/cadastro` |
| Definitiva | layout de `(app)`, no servidor | `getUsuarioAtual()`; sem sessão válida, redireciona para o login (existe desde a FE-08)                                                                  |

- `src/proxy.ts` substitui o `middleware.ts`, porque a convenção antiga está depreciada no Next 16 (ver `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`). Ele roda em toda rota, inclusive em pré-carregamentos, e não deve fazer buscas lentas. Não o use como única proteção.
- O `matcher` dele exclui `/api`, `/_next` e arquivos estáticos. Rotas de API respondem `401`, sem redirecionar.
- Com um cookie vencido ou ilegível, ele leva a `/login?redirect=...&expirada=1`; sem cookie, sem o aviso. Ele não apaga o cookie (regra 4): o login o sobrescreve.
- `/design-system` e as rotas abaixo dele ficam abertas sem sessão: não usam dados da empresa e respondem `404` no build.
- A proteção que vale é a do backend: mesmo com a tela aberta, uma chamada com token vencido recebe `401`.
- **Não há perfis nem permissões por ação**: todo usuário autenticado acessa todas as telas da própria empresa. Não crie mapa de permissões nem componentes como `<Permitido>`.

## Isolamento multiempresa

O backend é multiempresa: cada módulo filtra pelo `empresa.id` do token, e recurso de outra empresa responde `404`.

1. **O `empresaId` vem só do token.** Nunca o coloque em URL, query string, corpo ou estado do cliente para mandar ao backend. Os DTOs não o aceitam, e o `ValidationPipe` rejeita campos extras.
2. Ids nas rotas da tela (`/receitas/[receitaId]`) são de registros da própria empresa; um id de outra empresa responde `404`, tratado como "Não encontrei esse item. Ele pode ter sido excluído.".
3. O nome da empresa exibido no painel e no menu vem do payload do JWT.
4. Lacuna conhecida: `POST /producoes` não confere se a receita e os gastos são da empresa do token (ver [api-integration.md](api-integration.md#lacunas-do-backend), item 11). A web só oferece receitas e gastos listados para a própria empresa, mas a correção é do backend.

## O que nunca guardar no navegador

- **Em `localStorage`, `sessionStorage`, IndexedDB ou cookie legível por JavaScript:** o token, a senha e dados de negócio da empresa (insumos, receitas, vendas, custos).
- **No cache persistente do TanStack Query:** nada. O cache fica só em memória; não ative persistência em disco.
- **No carrinho de vendas:** o carrinho vive só no estado do componente; recarregar a página o descarta (FE-16).
- **No bundle:** segredos. Só variáveis `NEXT_PUBLIC_*` chegam ao navegador, e elas não podem conter segredo. A URL da API é de servidor.
- **Em props de Server para Client Component:** o token ou campos que a tela não usa.

**Exceção documentada:** as simulações salvas do cálculo real (FE-19) podem ir para `localStorage`, dentro de `try/catch`. São valores digitados à mão para uma conta local, sem dado pessoal e sem relação com o banco. A escolha deve ser registrada no PR da FE-19.

**Preferências de interface (E10):** o Aprender guarda no navegador só o que a pessoa já viu ou escondeu, com prefixo `aprender:` (dicas vistas, Primeiros passos escondidos ou concluídos, primeiro acesso) e `lucroai:` (sessão em que o aviso ao entrar abriu). São ids e datas, sem dado de negócio nem token ([docs/aprender.md](aprender.md)). O e2e de login (`e2e/auth.spec.ts`) confere que toda chave tem um desses prefixos e que nenhum valor parece um JWT.

## Dados pessoais

O LucroAI trata poucos dados pessoais: nome e e-mail do usuário, e nome, CNPJ e segmento da empresa (no JWT). Mesmo assim:

1. **Nada de dado pessoal em URL nem em log.** Rotas usam ids. Sem `console.log` de usuário, de payload do JWT ou de resposta da API.
2. **Mensagens de erro** não repetem dado pessoal: "E-mail ou senha inválidos", sem indicar qual dos dois.
3. **Testes e desenvolvimento** usam só dados fictícios (o seed "Padaria Pão Feliz").

## Segredos e configuração

- Variáveis são validadas com Zod na inicialização (`src/shared/config/env.schema.ts`, chamado por `src/instrumentation-node.ts`); sem elas, a aplicação não sobe.
- Variável nova: adicione ao schema, ao `.env.example` (com valor fictício e comentário) e à tabela do README.
- Variável de servidor é lida com `getServerEnv()`; pública, com `publicEnv`. Não leia `process.env` direto no restante do código.
- Com `NODE_ENV=production` (build e servidor standalone), as seis URLs precisam ser `https`; `http` só em `localhost`, `127.0.0.1` e `[::1]`, que o CI e os e2e usam (FE-24).
- `NEXT_PUBLIC_*` é incorporada ao bundle no build: não pode conter segredo, e mudar o valor exige novo build.
- `.env` e `.env.*` nunca são commitados (só `.env.example`). O repositório é público.
- O front não precisa do `JWT_SECRET`: ele só decodifica o payload para exibir dados, sem validar a assinatura.
- Não registre `process.env` em logs.

## Outras práticas

- Não use `dangerouslySetInnerHTML` com conteúdo vindo da API ou do usuário (nomes de insumo e receita são digitados pelo usuário).
- Valide search params e `params` com Zod: a URL é entrada do usuário.
- Em links externos abertos em nova aba, use `rel="noopener noreferrer"`.
- **Cabeçalhos de segurança** (FE-24), em todas as rotas, pelo `headers()` do `next.config.ts`: CSP sem nonce (`default-src 'self'`; `script-src` com `'unsafe-inline'`, exigido pelos scripts inline do App Router, e `'unsafe-eval'` só no `next dev`; `frame-ancestors 'none'`; sem `upgrade-insecure-requests`, para os e2e em http), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff` e `Referrer-Policy: strict-origin-when-cross-origin`. Recurso externo (fonte, imagem, script de terceiro) exige ajustar a CSP.
- Dependências: não adicione pacotes sem manutenção; rode `npm audit` ao atualizar.
