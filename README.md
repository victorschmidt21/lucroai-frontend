# Doce Fatia Frontend

Interface web do **Doce Fatia** (antes chamado LucroAI), que substitui o app Flutter [`lucroai_mobile`](https://github.com/GrupoDoisENG/lucroai_mobile). Construída com [Next.js](https://nextjs.org/docs) (App Router, TypeScript `strict`, ESM) e [Tailwind CSS](https://tailwindcss.com/docs) v4, rodando em containers Docker.

A marca (nome, logo, cores, tipografia e voz) está em [docs/marca.md](docs/marca.md). O repositório, o pacote npm, as variáveis de ambiente e as rotas continuam com `lucroai`.

## Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/) com Docker Compose v2.24+
- [Node.js](https://nodejs.org) 24 (para rodar lint, testes e o Playwright fora do container, e o seed do backend)
- [Git](https://git-scm.com/)

## Subindo o ambiente do zero

O front e o back ficam em repositórios separados, cada um com o seu compose. O front alcança a API (o monolito) pela porta que o backend publica no host (**3100**), então a ordem de subida não importa. O front usa a porta **3000**.

### 1. Backend

No repositório [`lucroai-backend`](https://github.com/victorschmidt21/lucroai-backend) (o monolito modular), em outro terminal:

```bash
git clone https://github.com/victorschmidt21/lucroai-backend.git
cd lucroai-backend
docker compose up --build
docker compose exec api npm run db:seed   # dados de exemplo
```

As migrations rodam sozinhas na subida. Confira se a API está no ar em [localhost:3100/health](http://localhost:3100/health) ou no Swagger, [localhost:3100/docs](http://localhost:3100/docs). O seed é idempotente: recria os dados da Padaria Pão Feliz. Depois dele, entre com `joao@padariapaofeliz.com.br` e senha `123456`.

### 2. Frontend

Neste repositório:

```bash
git clone https://github.com/victorschmidt21/lucroai-frontend.git
cd lucroai-frontend
cp .env.example .env
docker compose up --build
```

### 3. Confira

| O quê           | Endereço                                                                                                       |
| --------------- | -------------------------------------------------------------------------------------------------------------- |
| Aplicação       | [localhost:3000](http://localhost:3000) (leva ao `/login`; entre com `joao@padariapaofeliz.com.br` / `123456`) |
| Health do front | [localhost:3000/api/health](http://localhost:3000/api/health)                                                  |
| API (Swagger)   | [localhost:3100/docs](http://localhost:3100/docs)                                                              |

Com tudo no ar, o health responde:

```json
{ "status": "ok", "api": { "reachable": true } }
```

`reachable: false` indica que o front está no ar, mas não alcançou a API. Confira, no backend, `docker compose ps` e `docker compose logs api`. O front consulta o `GET /health` da API, e qualquer resposta HTTP conta como alcançada.

Alterações em `src/` e `public/` recarregam sozinhas, por polling (`WATCH_POLL_INTERVAL_MS`), porque eventos de arquivo não atravessam bind mounts no Docker Desktop. O polling consome mais CPU e I/O; se pesar, rode o front [fora do Docker](#desenvolvimento-local-fora-do-docker). Depois de mudar dependências ou arquivos de configuração da raiz, suba de novo com `docker compose up --build`.

Para parar: `docker compose down`.

## Variáveis de ambiente

Todas estão documentadas em [`.env.example`](.env.example) e são validadas com Zod em `src/shared/config/env.schema.ts`. Se alguma obrigatória faltar ou for inválida, a aplicação não inicia e mostra quais estão com problema:

```text
Variáveis de ambiente inválidas. Confira o .env.example.
✖ API_URL é obrigatória e deve ser uma URL http(s) válida
  → at API_URL
```

| Variável              | Obrigatória | Padrão no compose                  | Descrição                                            |
| --------------------- | ----------- | ---------------------------------- | ---------------------------------------------------- |
| `NEXT_PUBLIC_APP_URL` | sim         | `http://localhost:3000`            | URL pública do front; incorporada ao bundle no build |
| `API_URL`             | sim         | valor de `DOCKER_API_URL`          | URL base da API (o monolito `lucroai-backend`)       |
| `DOCKER_API_URL`      | compose     | `http://host.docker.internal:3100` | a API vista de dentro do container                   |
| `WEB_PORT`            | compose     | `3000`                             | Porta do front no host                               |

A URL da API é usada só no servidor, sem prefixo de versão (o backend não usa `/v1`). Dentro do compose, `API_URL` recebe o valor de `DOCKER_API_URL`, porque `localhost` no container é o próprio container. O `API_URL` do `.env` vale para o `npm run dev` fora do Docker. As cinco variáveis antigas (`AUTH_API_URL` e as outras) não são mais lidas.

Variáveis de servidor são lidas com `getServerEnv()` (`env.server.ts`), que não pode ser importado por código do navegador. Variáveis públicas vêm de `publicEnv` (`env.public.ts`).

## Desenvolvimento local (fora do Docker)

```bash
npm ci
cp .env.example .env
npm run dev
```

## Scripts

| Comando                | O que faz                                   |
| ---------------------- | ------------------------------------------- |
| `npm run dev`          | Servidor de desenvolvimento na porta 3000   |
| `npm run build`        | Build de produção (exige `.env` preenchido) |
| `npm run lint`         | oxlint                                      |
| `npm run format`       | Formata com Prettier                        |
| `npm run format:check` | Confere a formatação                        |
| `npm run typecheck`    | Gera os tipos de rota e roda o `tsc`        |
| `npm test`             | Testes unitários e de componente (Vitest)   |
| `npm run test:cov`     | Testes com relatório de cobertura           |
| `npm run test:e2e`     | Testes e2e (Playwright)                     |

Antes do primeiro `npm run test:e2e`, instale o navegador com `npx playwright install chromium`. O Playwright sobe sozinho o Next (porta 3000) e uma API falsa (porta 3999), então os testes e2e não dependem do backend no ar. Para reaproveitar servidores já abertos ou rodar contra o build de produção ou o backend local, veja as variáveis em [docs/testing.md](docs/testing.md).

## Estrutura

```text
src/
  app/            rotas do App Router: (auth)/login, api/health, api/auth e o proxy api/backend
  features/       módulos por funcionalidade
  shared/         código compartilhado (ex.: config/ com a validação de ambiente)
  test/           utilitários de teste
  instrumentation.ts   valida o ambiente ao subir o servidor
  proxy.ts        checagem otimista de sessão (o antigo middleware.ts)
e2e/              testes do Playwright
```

## Imagem de produção

O `Dockerfile` é multi-stage. O target `development` é usado pelo compose; o target `production` gera uma imagem só com o servidor [`standalone`](https://nextjs.org/docs/app/api-reference/config/next-config-js/output). Como `NEXT_PUBLIC_APP_URL` é incorporada no build, ela é um argumento da imagem, enquanto a URL da API é informada ao executar:

```bash
docker build --target production --build-arg NEXT_PUBLIC_APP_URL=https://app.exemplo.com -t lucroai-frontend .
docker run -p 3000:3000 \
  -e API_URL=https://api.exemplo.com \
  lucroai-frontend
```

## Deploy

A produção roda na Vercel, com preview por PR e deploy automático na `main`; o `Dockerfile` acima é a alternativa para Render, Railway, Fly ou VPS. Passo a passo, variáveis, domínio, rollback e checklist em [docs/deploy.md](docs/deploy.md). Em produção, as URLs precisam ser `https` (só `localhost` aceita `http`).

## Solução de problemas

**`Cannot find native binding` ao rodar o Vitest.** Bug do npm com dependências opcionais ([npm/cli#4828](https://github.com/npm/cli/issues/4828)): `npm install <pacote>` ou `npm uninstall <pacote>` com o `node_modules` já existente pode remover os binários nativos do `package-lock.json`. Depois de alterar dependências, confira se o lock ainda tem as entradas `@rolldown/binding-*`. Se não tiver, regenere:

```bash
rm -rf node_modules package-lock.json
npm install
```

**Porta 3000 ocupada.** Defina outra em `WEB_PORT` e ajuste `NEXT_PUBLIC_APP_URL` no `.env`. Não use a 3100, que é da API.

**Health com `reachable: false` no Docker.** Confira se a API está no ar (`curl http://localhost:3100/health` no host). No Linux, o `host.docker.internal` depende do `extra_hosts` do compose, já configurado.
