# Deploy

> **Status:** a configuração de produção (https exigido no schema, cabeçalhos de segurança e `Secure` no cookie) existe desde a **FE-24**; a URL única da API (`API_URL`), desde a **FE-39**. O projeto na Vercel, as variáveis e o domínio são criados por quem publica, seguindo este guia. Nenhum segredo fica no repositório.

A web roda na **Vercel**, que detecta o Next sozinha (não há `vercel.json`). O `Dockerfile` standalone é a alternativa para outras plataformas ([abaixo](#alternativa-docker-render-railway-fly-ou-vps)).

```text
Navegador ──https──► Next na Vercel (BFF) ──https──► API do lucroai-backend (monolito)
```

O navegador só fala com o Next; quem chama o backend é o servidor do Next. Por isso o CORS do backend não importa, mas a API precisa ser alcançável pela internet a partir da Vercel.

## 1. Backend publicado

Antes do front, publique o [`lucroai-backend`](https://github.com/victorschmidt21/lucroai-backend), o monolito modular: uma imagem Docker e um Postgres (passo a passo no `docs/deploy.md` dele). Anote a URL base **https** da API, sem barra no fim e sem prefixo de versão.

| Item                        | Público?           | Por quê                                                                      |
| --------------------------- | ------------------ | ---------------------------------------------------------------------------- |
| a API (porta 3100 no local) | **sim**, com https | o Next a chama pelo `API_URL`                                                |
| `GET /health`               | sim                | é público; o `GET /api/health` do front o usa para saber se a API está no ar |
| Postgres                    | **não**            | só a API fala com ele                                                        |

O monolito não tem rotas `/internal/*`. O proxy do front continua recusando qualquer segmento `internal` com `403` ([security.md](security.md#proxy-bff)), por segurança.

O seed (`npm run db:seed` no backend) cria o usuário `joao@padariapaofeliz.com.br` / `123456`, usado na verificação. Em produção de verdade, troque a senha ou não rode o seed.

## 2. Projeto na Vercel

1. Em [vercel.com/new](https://vercel.com/new), importe o repositório `victorschmidt21/lucroai-frontend`. Framework: **Next.js** (detectado). Não mude o comando de build nem o diretório de saída.
2. **Production Branch**: `main` (Settings → Git). Todo merge na `main` publica sozinho; todo PR ganha um deploy de **preview** com URL própria, comentada no PR pelo bot da Vercel.
3. Em **Settings → Environment Variables**, cadastre:

| Variável              | Production                      | Preview                        | Observação                                            |
| --------------------- | ------------------------------- | ------------------------------ | ----------------------------------------------------- |
| `API_URL`             | `https://<api do backend>`      | igual (ou um backend de teste) | só no servidor                                        |
| `NEXT_PUBLIC_APP_URL` | `https://<domínio de produção>` | **não cadastre**               | incorporada no build; mudar o valor exige novo deploy |

- O build de produção (`NODE_ENV=production`) **recusa `http`** fora de `localhost`, `127.0.0.1` e `[::1]`: uma URL errada falha o deploy com a mensagem do schema ([README](../README.md#variáveis-de-ambiente)).
- **Previews:** sem `NEXT_PUBLIC_APP_URL`, o `next.config.ts` usa `https://$VERCEL_BRANCH_URL` (variável de sistema da Vercel; deixe ligada a opção "Automatically expose System Environment Variables"). O BFF confere o `Origin` contra essa URL, então **no preview entre pela URL da branch** (`<projeto>-git-<branch>-<time>.vercel.app`, listada em "Domains" no deploy). Pela URL única do deploy, a página abre, mas o login responde `403`.
- Nenhuma das variáveis é segredo do backend: o front não precisa do `JWT_SECRET`. Mesmo assim, não as escreva em arquivos do repositório.
- Quem ainda tem as cinco variáveis antigas (`AUTH_API_URL`, `CATALOG_API_URL`, `RECIPE_API_URL`, `OPERATIONS_API_URL`, `SALES_API_URL`) cadastra `API_URL` e pode apagá-las: o front não as lê mais.

4. Clique em **Deploy**. Ao terminar, abra `https://<url>/api/health` (ver [verificação](#5-verificação-pós-deploy)).

## 3. Domínio

Em **Settings → Domains**, adicione o domínio e crie no DNS o registro que a Vercel indicar (`CNAME` para `cname.vercel-dns.com`, ou `A` no domínio raiz). O https é automático. Depois, atualize `NEXT_PUBLIC_APP_URL` (Production) para o domínio novo e faça **Redeploy**: com o valor antigo, o login responde `403` (origem diferente).

## 4. Rollback

Em **Deployments**, escolha um deploy anterior que funcionava → **⋯ → Promote to Production** (ou "Instant Rollback"). É imediato e não refaz o build. Corrija na `main` em seguida: o próximo merge publica por cima. Variáveis alteradas por engano voltam em Settings → Environment Variables, seguidas de Redeploy.

## 5. Verificação pós-deploy

Checklist para quem publica (as verificações manuais da FE-24):

- [ ] `GET https://<produção>/api/health` responde `200` com `{ "status": "ok", "api": { "reachable": true } }`. Um `false` é rede, URL errada ou API fora do ar; confira o `API_URL` e o `GET /health` da API.
- [ ] `curl -I https://<produção>/login` mostra `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff` e `Referrer-Policy`.
- [ ] Login com `joao@padariapaofeliz.com.br` / `123456` funciona; nas ferramentas do navegador, o cookie `lucroai_sessao` aparece com `HttpOnly`, `Secure` e `SameSite=Lax`.
- [ ] Fluxo 5 da FE-23 (venda ponta a ponta, o mesmo de `e2e/fluxo-principal.spec.ts`): cadastrar um insumo (com entrada de estoque, se faltar saldo), criar uma receita com ele, registrar uma produção, registrar e concluir uma venda e ver o produto no painel.
- [ ] Um PR aberto ganha a URL de preview, e o login funciona pela URL da branch.
- [ ] Um merge na `main` gera um deploy de produção novo.
- [ ] O README do `lucroai_mobile` recebeu o [aviso](#aviso-para-o-readme-do-mobile), com a URL de produção.

## Alternativa: Docker (Render, Railway, Fly ou VPS)

O `Dockerfile` tem o target `production`, só com o servidor standalone, na porta `3000`. `NEXT_PUBLIC_APP_URL` é argumento de build; a URL da API, variável de execução:

```bash
docker build --target production --build-arg NEXT_PUBLIC_APP_URL=https://app.exemplo.com -t lucroai-frontend .
docker run -p 3000:3000 \
  -e API_URL=https://api.exemplo.com \
  lucroai-frontend
```

- **Render / Railway / Fly:** crie um serviço a partir do repositório usando o `Dockerfile` (target `production`; no Fly, `fly launch` gera o `fly.toml`). Passe `NEXT_PUBLIC_APP_URL` como build arg e `API_URL` como variável, e use `/api/health` como health check. Deploy automático e previews dependem da plataforma.
- **VPS:** rode a imagem atrás de um proxy reverso com https (Caddy ou Nginx + Let's Encrypt). O https é obrigatório: o cookie é `Secure`, e o navegador só o aceita em http no `localhost`.
- A imagem recusa subir com `http` fora de localhost (`NODE_ENV=production`). Para testá-la no próprio computador contra o backend local, use `http://localhost:3100` com `--network host` (Linux) ou rode o `npm run dev` em vez da imagem.
- Os cabeçalhos de segurança vêm do `next.config.ts` e valem em qualquer plataforma.

## Aviso para o README do mobile

Texto pronto para colar no topo do `README.md` do [`lucroai_mobile`](https://github.com/GrupoDoisENG/lucroai_mobile), substituindo `<URL de produção>` (a seção "Build de produção" dele deixa de ser o caminho de distribuição):

```markdown
> **Este app foi substituído pela versão web.** O LucroAI agora roda no navegador, no celular e no computador, sem instalar nada: **<URL de produção>**.
> O código da web está em [victorschmidt21/lucroai-frontend](https://github.com/victorschmidt21/lucroai-frontend). Este repositório fica como referência e não recebe novas versões nas lojas.
```
