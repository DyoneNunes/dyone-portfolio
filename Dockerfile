# ============================================================
#  Frontend — Vite (modo desenvolvimento, porta padrão 5173)
# ============================================================
FROM node:22-alpine

WORKDIR /app

# Camada de dependências separada (cache de build eficiente)
COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 5173

# --host 0.0.0.0: expõe o dev server para fora do container
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
