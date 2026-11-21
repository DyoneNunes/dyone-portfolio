/**
 * ============================================================
 *  Plugin Vite — site legível por IA e buscadores
 * ------------------------------------------------------------
 *  O portfólio é renderizado em JavaScript; robôs que não rodam
 *  JS (GPTBot, ClaudeBot, PerplexityBot...) recebiam só um
 *  <div id="root"> vazio. A partir de src/conteudo.js, este
 *  plugin gera três coisas:
 *
 *   1. HTML semântico dentro do #root — o React substitui ao
 *      montar; fica invisível na tela e aparece se o JS estiver
 *      desligado (<noscript>)
 *   2. JSON-LD (schema.org ItemList) com os projetos
 *   3. /llms.txt — o mesmo conteúdo em Markdown (llmstxt.org)
 *
 *  Vale no build de produção (dist/) e no dev server local.
 * ============================================================
 */
import {
  CARGO,
  EMAIL_CONTATO,
  HERO_CHIPS,
  HERO_RESUMO,
  LOCAL,
  meusProjetos,
  minhasRedes,
  NOME,
  SITE_URL,
  techStacks,
  TEXTO_SOBRE,
} from './src/conteudo.js'

const NOMES_REDES = { github: 'GitHub', linkedin: 'LinkedIn' }

const esc = (texto) =>
  String(texto).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** '[ github ]' -> 'GitHub' */
const nomeRede = (rede) => {
  const chave = rede.rotulo.replace(/[^a-z0-9]/gi, '').toLowerCase()
  return NOMES_REDES[chave] ?? chave
}

function gerarHtmlEstatico() {
  const projetos = meusProjetos
    .map(
      (p) => `
          <li>
            <h3><a href="${esc(p.url)}">${esc(p.nome)}</a></h3>
            <p>${esc(p.tipo)}</p>
            <p>${esc(p.descricao)}</p>
            <p>Tecnologias: ${esc(p.tags.join(', '))}</p>
          </li>`,
    )
    .join('')
  const stacks = techStacks
    .map(
      (g) => `
          <dt>${esc(g.categoria)}</dt>
          <dd>${esc(g.tecnologias)}</dd>`,
    )
    .join('')
  const redes = minhasRedes
    .map(
      (r) => `
          <li><a href="${esc(r.url)}" rel="me">${esc(nomeRede(r))}</a></li>`,
    )
    .join('')

  return `<div id="root">
      <!-- Conteúdo estático gerado de src/conteudo.js (vite-plugin-legivel-ia.js).
           O React substitui este bloco ao montar a página. -->
      <main class="conteudo-estatico">
        <header>
          <h1>${esc(NOME)} — ${esc(CARGO)}</h1>
          <p>${esc(HERO_RESUMO)}</p>
          <ul>${HERO_CHIPS.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>
        </header>
        <section>
          <h2>Sobre</h2>
          <p>${esc(TEXTO_SOBRE)}</p>
        </section>
        <section>
          <h2>Tecnologias</h2>
          <dl>${stacks}
          </dl>
        </section>
        <section>
          <h2>Projetos</h2>
          <ol>${projetos}
          </ol>
        </section>
        <section>
          <h2>Contato</h2>
          <ul>
          <li>E-mail: <a href="mailto:${esc(EMAIL_CONTATO)}">${esc(EMAIL_CONTATO)}</a></li>${redes}
          </ul>
          <p>Formulário de contato disponível na seção final de <a href="${SITE_URL}/">${SITE_URL}</a>.</p>
        </section>
      </main>
    </div>`
}

function gerarJsonLd() {
  const dados = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Projetos de ${NOME}`,
    itemListElement: meusProjetos.map((p, indice) => ({
      '@type': 'ListItem',
      position: indice + 1,
      item: {
        '@type': 'CreativeWork',
        name: p.nome,
        description: p.descricao,
        url: p.url,
        genre: p.tipo,
        keywords: p.tags.join(', '),
        creator: { '@id': `${SITE_URL}/#dyone` }, // o Person declarado no index.html
      },
    })),
  }
  // '<' escapado para o JSON nunca fechar a tag <script>
  return JSON.stringify(dados, null, 2).replace(/</g, '\\u003c')
}

function gerarLlmsTxt() {
  const linhas = [
    `# ${NOME}`,
    '',
    `> ${CARGO} em ${LOCAL}. ${HERO_RESUMO}`,
    '',
    `Versão em texto de ${SITE_URL}, um portfólio 3D interativo renderizado em JavaScript. Este arquivo traz o mesmo conteúdo da página, sem a parte visual.`,
    '',
    '## Sobre',
    '',
    TEXTO_SOBRE,
    '',
    ...HERO_CHIPS.map((c) => `- ${c}`),
    '',
    '## Tecnologias',
    '',
    ...techStacks.map((g) => `- **${g.categoria}**: ${g.tecnologias}`),
    '',
    '## Projetos',
    '',
    ...meusProjetos.map(
      (p) => `- [${p.nome}](${p.url}): ${p.tipo}. ${p.descricao} Tecnologias: ${p.tags.join(', ')}.`,
    ),
    '',
    '## Contato',
    '',
    `- E-mail: [${EMAIL_CONTATO}](mailto:${EMAIL_CONTATO})`,
    ...minhasRedes.map((r) => `- [${nomeRede(r)}](${r.url})`),
    `- [Formulário de contato](${SITE_URL}/): na seção final do site`,
    '',
  ]
  return linhas.join('\n')
}

// Invisível na tela (o React troca o bloco em instantes), presente no HTML.
const CSS_OCULTO =
  '.conteudo-estatico{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}'

// Sem JavaScript não há React: o conteúdo estático vira a página.
const CSS_SEM_JS = `html,body,#root{height:auto}body{overflow:auto}
.conteudo-estatico{position:static;width:auto;height:auto;overflow:visible;clip-path:none;white-space:normal;max-width:70ch;margin:0 auto;padding:32px 20px;line-height:1.6}
.conteudo-estatico h1,.conteudo-estatico h2,.conteudo-estatico h3{margin:1.4em 0 .4em}
.conteudo-estatico ul,.conteudo-estatico ol{padding-left:1.4em}
.conteudo-estatico dt{margin-top:.8em;font-weight:600}
.conteudo-estatico a{color:#00ffff}`

export default function legivelPorIa() {
  return {
    name: 'legivel-por-ia',

    transformIndexHtml(html) {
      return {
        html: html.replace('<div id="root"></div>', gerarHtmlEstatico()),
        tags: [
          { tag: 'style', children: CSS_OCULTO, injectTo: 'head' },
          { tag: 'noscript', children: `<style>${CSS_SEM_JS}</style>`, injectTo: 'head' },
          {
            tag: 'link',
            attrs: {
              rel: 'alternate',
              type: 'text/markdown',
              href: '/llms.txt',
              title: 'Conteúdo do site em Markdown (para IAs)',
            },
            injectTo: 'head',
          },
          {
            tag: 'script',
            attrs: { type: 'application/ld+json' },
            children: gerarJsonLd(),
            injectTo: 'head',
          },
        ],
      }
    },

    // dev server local (em produção o nginx serve o llms.txt do build)
    configureServer(servidor) {
      servidor.middlewares.use('/llms.txt', (_req, res) => {
        res.setHeader('Content-Type', 'text/markdown; charset=utf-8')
        res.setHeader('Cache-Control', 'public, max-age=3600')
        res.end(gerarLlmsTxt())
      })
    },

    // build estático
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'llms.txt', source: gerarLlmsTxt() })
    },
  }
}
