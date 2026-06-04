/**
 * ============================================================
 *  PORTFOLIO BACKEND — microserviço de contato
 * ------------------------------------------------------------
 *  POST /api/contato:
 *    1. grava o lead no Postgres (tabela leads)
 *    2. disparo duplo via Nodemailer (Gmail):
 *       confirmação cyberpunk ao remetente + lead para o Dyone
 *  Rate-limit persistente via Redis (fallback em memória).
 *  Credenciais: ESTRITAMENTE via variáveis de ambiente (.env)
 * ============================================================
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import nodemailer from 'nodemailer'
import pg from 'pg'
import { createClient } from 'redis'

// Carrega .env local (backend/.env) e depois o .env da raiz do projeto.
// Variáveis já definidas no ambiente (ex: docker-compose env_file)
// têm precedência — dotenv nunca sobrescreve o que já existe.
const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '.env') })
dotenv.config({ path: path.join(__dirname, '..', '.env') })

const {
  GMAIL_USER,
  GMAIL_APP_PASS,
  PORT = 3002,
  // defaults apontam para as portas PUBLICADAS no host (dev local);
  // dentro do Docker, o .env injeta os hostnames dos serviços
  DATABASE_URL = 'postgresql://portfolio:portfolio_dev_2026@localhost:5440/portfolio_leads',
  REDIS_URL = 'redis://localhost:6386',
} = process.env

if (!GMAIL_USER || !GMAIL_APP_PASS) {
  console.error('[BOOT] GMAIL_USER e GMAIL_APP_PASS são obrigatórias — defina no .env da raiz.')
  process.exit(1)
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: GMAIL_USER, pass: GMAIL_APP_PASS },
})

/* ------------------------------------------------------------
   Postgres — persistência de leads (modo degradado se cair)
   ------------------------------------------------------------ */
const { Pool } = pg
const banco = new Pool({ connectionString: DATABASE_URL, max: 5 })
let bancoOnline = false

async function iniciarBanco(tentativas = 5) {
  for (let i = 1; i <= tentativas; i++) {
    try {
      await banco.query(`
        CREATE TABLE IF NOT EXISTS leads (
          id         SERIAL PRIMARY KEY,
          nome       TEXT NOT NULL,
          email      TEXT NOT NULL,
          mensagem   TEXT NOT NULL,
          criado_em  TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `)
      bancoOnline = true
      console.log('[BOOT] postgres conectado — tabela leads pronta')
      return
    } catch (erro) {
      console.warn(`[BOOT] postgres indisponível (tentativa ${i}/${tentativas}):`, erro.message)
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }
  }
  console.error('[BOOT] seguindo SEM persistência de leads (modo degradado)')
}

/* ------------------------------------------------------------
   Redis — rate-limit persistente (fallback em memória)
   ------------------------------------------------------------ */
const redis = createClient({ url: REDIS_URL })
let redisOnline = false
redis.on('error', () => {}) // sem handler, o client derruba o processo
redis.on('ready', () => {
  redisOnline = true
})
redis.on('end', () => {
  redisOnline = false
})
redis
  .connect()
  .then(() => console.log('[BOOT] redis conectado — rate-limit persistente'))
  .catch((erro) => console.warn('[BOOT] redis indisponível — rate-limit em memória:', erro.message))

const JANELA_S = 15 * 60 // 15 minutos
const MAX_ENVIOS_POR_IP = 5
const historicoMemoria = new Map() // fallback quando o Redis cai

async function limitarTaxa(req, res, next) {
  const ip = req.ip
  const recusar = () =>
    res.status(429).json({ erro: 'Limite de envios atingido. Tente novamente em alguns minutos.' })

  // Caminho preferencial: contador atômico no Redis
  if (redisOnline) {
    try {
      const chave = `ratelimit:${ip}`
      const total = await redis.incr(chave)
      if (total === 1) await redis.expire(chave, JANELA_S)
      if (total > MAX_ENVIOS_POR_IP) return recusar()
      return next()
    } catch {
      /* cai para o fallback em memória */
    }
  }

  const agora = Date.now()
  const registros = (historicoMemoria.get(ip) ?? []).filter((t) => agora - t < JANELA_S * 1000)
  if (registros.length >= MAX_ENVIOS_POR_IP) return recusar()
  registros.push(agora)
  historicoMemoria.set(ip, registros)
  next()
}

/* ------------------------------------------------------------
   Helpers de email
   ------------------------------------------------------------ */
const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Conteúdo do usuário entra em HTML de email — sempre escapar.
const escaparHtml = (texto = '') =>
  texto
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

function htmlConfirmacao(nome) {
  return `
  <div style="background:#050505;color:#e6ebf5;font-family:'Courier New',monospace;padding:32px 24px;border-radius:8px">
    <p style="color:#00ffff;letter-spacing:3px;font-size:12px;margin:0 0 18px">/// DYONE.DEV — SYS.CONTACT.PROTOCOL</p>
    <h2 style="color:#ffffff;margin:0 0 16px">&gt; conexão recebida_</h2>
    <p style="line-height:1.8;color:#b9c2d4">
      olá, <strong style="color:#00ffff">${escaparHtml(nome)}</strong> —<br>
      sua solicitação de conexão foi recebida e
      <strong style="color:#ff00ff">entrou em processo de triagem</strong>.<br>
      responderei pelo canal informado em breve.
    </p>
    <p style="margin-top:28px;color:#6b7385;font-size:12px">
      — dyone // fullstack developer &amp; devops<br>
      <span style="color:#00ffff">[ status: na fila de triagem ]</span>
    </p>
  </div>`
}

function htmlLead(nome, email, mensagem) {
  return `
  <div style="background:#050505;color:#e6ebf5;font-family:'Courier New',monospace;padding:32px 24px;border-radius:8px">
    <p style="color:#ff00ff;letter-spacing:3px;font-size:12px;margin:0 0 18px">/// NOVO LEAD — PORTFOLIO</p>
    <p style="margin:6px 0"><span style="color:#00ffff">nome:</span> ${escaparHtml(nome)}</p>
    <p style="margin:6px 0"><span style="color:#00ffff">email:</span> ${escaparHtml(email)}</p>
    <p style="margin:18px 0 6px;color:#00ffff">mensagem:</p>
    <p style="white-space:pre-wrap;line-height:1.7;color:#b9c2d4;border-left:2px solid #ff00ff;padding-left:12px">${escaparHtml(mensagem)}</p>
  </div>`
}

/* ------------------------------------------------------------
   App
   ------------------------------------------------------------ */
const app = express()
app.set('trust proxy', 1) // atrás do nginx: req.ip = IP real do cliente
app.use(cors()) // dev: libera chamadas do frontend (local ou container)
app.use(express.json({ limit: '50kb' }))

app.get('/api/saude', async (_req, res) => {
  let totalLeads = null
  if (bancoOnline) {
    try {
      const resultado = await banco.query('SELECT count(*)::int AS total FROM leads')
      totalLeads = resultado.rows[0].total
    } catch {
      /* contagem é opcional no diagnóstico */
    }
  }
  res.json({
    ok: true,
    servico: 'contato',
    postgres: bancoOnline ? 'online' : 'offline',
    redis: redisOnline ? 'online' : 'offline',
    leads: totalLeads,
  })
})

app.post('/api/contato', limitarTaxa, async (req, res) => {
  const { nome = '', email = '', mensagem = '' } = req.body ?? {}

  // Validação de entrada
  if (!nome.trim() || !email.trim() || !mensagem.trim()) {
    return res.status(400).json({ erro: 'Campos obrigatórios: nome, email e mensagem.' })
  }
  if (nome.length > 120 || email.length > 160 || mensagem.length > 5000) {
    return res.status(400).json({ erro: 'Algum campo excede o tamanho máximo permitido.' })
  }
  if (!EMAIL_VALIDO.test(email)) {
    return res.status(400).json({ erro: 'Endereço de email inválido.' })
  }

  // 1) Persiste o lead (fonte da verdade) — emails são notificações
  let leadSalvo = false
  if (bancoOnline) {
    try {
      await banco.query('INSERT INTO leads (nome, email, mensagem) VALUES ($1, $2, $3)', [
        nome,
        email,
        mensagem,
      ])
      leadSalvo = true
    } catch (erro) {
      console.error('[Leads] falha ao gravar no postgres:', erro.message)
    }
  }

  // 2) Disparo duplo em paralelo (não deixa um email travar o outro)
  const resultados = await Promise.allSettled([
    transporter.sendMail({
      from: `"DYONE.DEV //" <${GMAIL_USER}>`,
      to: email,
      subject: '[ DYONE.DEV ] Conexão recebida — protocolo em triagem',
      text: `> olá, ${nome}\n\n> sua solicitação de conexão foi recebida e entrou em processo de triagem.\n> responderei pelo canal informado em breve.\n\n— dyone // fullstack & devops`,
      html: htmlConfirmacao(nome),
    }),
    transporter.sendMail({
      from: `"Portfolio // Lead" <${GMAIL_USER}>`,
      to: GMAIL_USER,
      replyTo: email, // responder o lead direto da caixa de entrada
      subject: `[ LEAD ] Novo contato de ${nome}`,
      text: `Nome: ${nome}\nEmail: ${email}\n\nMensagem:\n${mensagem}`,
      html: htmlLead(nome, email, mensagem),
    }),
  ])

  const emailsEnviados = resultados.filter((r) => r.status === 'fulfilled').length
  resultados
    .filter((r) => r.status === 'rejected')
    .forEach((r) => console.error('[Contato] falha de email:', r.reason?.message ?? r.reason))

  // Falha total (nem banco, nem email) → erro real para o usuário
  if (!leadSalvo && emailsEnviados === 0) {
    return res.status(502).json({ erro: 'Falha ao processar o contato. Tente novamente.' })
  }

  res.json({ ok: true, leadSalvo, emailsEnviados })
})

/* ------------------------------------------------------------
   Boot
   ------------------------------------------------------------ */
await iniciarBanco()
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[BOOT] backend de contato online na porta ${PORT}`)
})
