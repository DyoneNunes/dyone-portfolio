# ============================================================
#  Site — build de produção do Vite servido por nginx
#  Estágio 1 gera o dist/ (JS minificado, com hash no nome);
#  estágio 2 é só nginx + arquivos estáticos + proxy da /api.
# ============================================================
FROM node:22-alpine AS build

WORKDIR /app

# Camada de dependências separada (cache de build eficiente)
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf
COPY nginx/cabecalhos.conf /etc/nginx/snippets/cabecalhos.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
