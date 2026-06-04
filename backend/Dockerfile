# ============================================================
#  Backend — Node.js + Express + Nodemailer
# ============================================================
FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production

# Camada de dependências separada (cache de build eficiente)
COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 3002

# Container roda sem root
USER node

CMD ["node", "server.js"]
