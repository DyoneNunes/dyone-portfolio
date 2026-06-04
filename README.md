# DYONE.DEV // Portfólio 3D Cyberpunk

Portfólio interativo fullstack com personagem 3D, scroll storytelling estilo awwwards e estética cyberpunk (neon ciano/magenta sobre breu).

## Stack

**Frontend** — React 19 · Vite · React Three Fiber + drei · framer-motion
**Backend** — Node.js · Express 5 · Nodemailer (Gmail) · PostgreSQL · Redis
**Infra** — Docker Compose (6 serviços) · Nginx como entrada única

## Destaques técnicos

- Modelo GLB comprimido com **Draco** (58MB → 7.9MB) e normalizado via `Resize`/`Center`
- **Parallax de mouse** + rotação acoplada ao progresso do scroll (`MathUtils.damp`, frame-rate independent)
- Iluminação two-tone (pointlights magenta/ciano) com `ambientLight 0.05`
- Formulário de contato com **disparo duplo** de email, lead persistido no Postgres e rate-limit no Redis (com degradação graciosa)
- `prefers-reduced-motion` respeitado em todas as animações

## Rodando

```bash
cp .env.example .env   # preencha GMAIL_USER e GMAIL_APP_PASS
docker compose up -d --build
```

| Porta | Serviço |
|---|---|
| **8087** | nginx — entrada única (app + `/api`) |
| 5179 | frontend (Vite dev) |
| 3008 | backend (API de contato) |
| 5440 | PostgreSQL (leads) |
| 6386 | Redis (rate-limit) |
| 8088 | Adminer (UI do banco) |

> As portas internas dos containers são as padrão; apenas o lado do host é deslocado.

Acesse **http://localhost:8087**.

### Dev local (sem Docker)

```bash
# terminal 1
cd backend && npm install && npm run dev
# terminal 2
npm install && npm run dev
```

## Estrutura

```
├── src/App.jsx          # toda a experiência (cena 3D + UI)
├── public/meu_cyberpunk.glb
├── backend/server.js    # API de contato (email + leads + rate-limit)
├── nginx/nginx.conf     # entrada única
└── docker-compose.yml   # 6 serviços
```
