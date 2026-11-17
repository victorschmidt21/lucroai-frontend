# syntax=docker/dockerfile:1

# ---------- base ----------
FROM node:24-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# ---------- deps: todas as dependências (dev incluso) ----------
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ---------- development: hot reload ----------
FROM deps AS development
ENV NODE_ENV=development
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# ---------- build ----------
# NEXT_PUBLIC_* é incorporada ao bundle aqui; sem ela o build falha com a mensagem da validação.
FROM deps AS build
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
COPY . .
RUN npm run build

# ---------- production: apenas o servidor standalone ----------
FROM base AS production
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
USER node
EXPOSE 3000
CMD ["node", "server.js"]
