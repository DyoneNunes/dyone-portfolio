/**
 * ============================================================
 *  PORTFÓLIO INTERATIVO 3D — Cyberpunk / Scroll Storytelling
 * ------------------------------------------------------------
 *  Camada 3D : FIXA ao fundo — personagem à direita + parallax
 *  Camada UI : container com scroll nativo, 3 telas de 100vh
 *              alinhadas à esquerda, revelação via whileInView
 *  Nav       : âncoras de terminal (// about, // work) com
 *              destaque automático da seção visível
 * ============================================================
 */
import { Component, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Center, Html, Resize, useAnimations, useGLTF, useProgress } from '@react-three/drei'
import { motion, MotionConfig, useMotionValueEvent, useScroll } from 'framer-motion'
import { MathUtils } from 'three'

/* ============================================================
   CONSTANTES E DADOS
   ============================================================ */
const NEON_CIANO = '#00FFFF'
const NEON_MAGENTA = '#FF00FF'
const MODELO_URL = '/meu_cyberpunk.glb'

const meusProjetos = [
  {
    id: 1,
    nome: 'NirMind',
    descricao: 'SaaS HealthTech focado em conformidade psicossocial (NR-01).',
    tipo: 'Startup / SaaS',
    url: 'https://nirmind.com.br/',
    evento: 'Projeto-NirMind-Click',
    tags: ['HealthTech', 'SaaS'],
  },
  {
    id: 2,
    nome: 'Sentinela Ambiental',
    descricao: 'Projeto Integrador 3 (FAESA) - Monitoramento ambiental nacional em tempo real (API FIRMS NASA).',
    tipo: 'Acadêmico / Dados',
    url: 'https://github.com/DyoneNunes/Projeto-Integrador-III',
    evento: 'Projeto-Sentinela-Click',
    tags: ['Python 38%', 'TypeScript 28%', 'C++ 13%', 'Docker'],
  },
  {
    id: 3,
    nome: 'MaaS — Memory as a Service',
    descricao: 'Projeto Integrador 3 (FAESA) - Gerenciamento de memória como serviço.',
    tipo: 'Acadêmico / Baixo Nível',
    url: 'https://github.com/DyoneNunes/Projeto-Integrador-III',
    evento: 'Projeto-MaaS-Click',
    tags: ['Python', 'TypeScript', 'C++', 'CMake'],
  },
  {
    id: 4,
    nome: 'Calmou',
    descricao: 'Projeto Integrador 2 (FAESA) - Plataforma dedicada ao monitoramento de stress.',
    tipo: 'Acadêmico / Backend',
    url: 'https://github.com/DyoneNunes/banco_de_dados_calmou',
    evento: 'Projeto-Calmou-Click',
    tags: ['Python 95%', 'PLpgSQL', 'Docker'],
  },
  {
    id: 5,
    nome: 'MeuDim',
    descricao: 'Aplicativo prático para controle financeiro e gestão de despesas.',
    tipo: 'Projeto Pessoal',
    url: 'https://meudim.com.br/',
    evento: 'Projeto-MeuDim-Click',
    tags: ['FinTech', 'SaaS'],
  },
  {
    id: 6,
    nome: 'Amarelo',
    descricao: 'Implementação de Árvore Binária de Busca.',
    tipo: 'Colaboração (FAESA)',
    url: 'https://github.com/nicholetzs/amarelo',
    evento: 'Projeto-Amarelo-Click',
    tags: ['Java', 'Estrutura de Dados'],
  },
]

const TEXTO_SOBRE =
  'Co-founder e CTO da Quilombus Network. Mais de 9 anos escrevendo código e 5 anos moldando infraestruturas de mercado. Focado em ecossistemas escaláveis com React, FastAPI, Docker e Neo4j. Estudante de Análise e Desenvolvimento de Sistemas.'

const techStacks = [
  { categoria: 'Frontend & Mobile', tecnologias: 'HTML5, CSS3, JS, TS, React 19, Next.js 15, React Native, Flet, Tailwind, Vite' },
  { categoria: 'Backend & Alta Performance', tecnologias: 'Python (FastAPI), Node.js 18, C++20, gRPC, Protobuf, POSIX SHM, WebSockets' },
  { categoria: 'Bancos de Dados & ORM', tecnologias: 'PostgreSQL, Redis, Neo4j, Qdrant, ChromaDB, Prisma' },
  { categoria: 'IA & Eng. de Prompts', tecnologias: 'LangGraph, LangChain, MCP Node, Ollama, Gemini API, Chainlit, Langfuse' },
  { categoria: 'Infraestrutura, DevOps & Redes', tecnologias: 'Ubuntu, Linux Server, MacOS, Windows, Docker, Kubernetes, Terraform, GitHub Actions, Proxmox, Tailscale' },
]

const NAV_ANCORAS = [
  { id: 'sobre', rotulo: '// about', evento: 'Nav-About-Click' },
  { id: 'stack', rotulo: '// tech', evento: 'Nav-Tech-Click' },
  { id: 'projetos', rotulo: '// work', evento: 'Nav-Work-Click' },
  { id: 'contato', rotulo: '// contact', evento: 'Nav-Contact-Click' },
]

const minhasRedes = [
  { rotulo: '[ github ]', url: 'https://github.com/DyoneNunes', evento: 'Contato-GitHub-Click' },
  { rotulo: '[ linkedin ]', url: 'https://www.linkedin.com/in/dyone-andrade-0340462b6/', evento: 'Contato-LinkedIn-Click' },
]

/* ============================================================
   CAMADA 3D — fixa ao fundo, imune ao scroll
   ============================================================ */

/** Mouse global normalizado (-1..1) — escuta a window para o
 *  parallax continuar vivo com o cursor sobre o texto/scroll. */
function usePonteiroGlobal() {
  const ponteiro = useRef({ x: 0, y: 0 })
  useEffect(() => {
    const aoMover = (evento) => {
      ponteiro.current.x = (evento.clientX / window.innerWidth) * 2 - 1
      ponteiro.current.y = -((evento.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('pointermove', aoMover)
    return () => window.removeEventListener('pointermove', aoMover)
  }, [])
  return ponteiro
}

/** Rig: desloca o personagem para a direita e aplica o parallax do
 *  mouse + a rotação sutil acoplada ao progresso do scroll.
 *  As luzes viajam junto para o retrato two-tone nunca descolar. */
function RigParallax({ progressoScroll, children }) {
  const ref = useRef()
  const ponteiro = usePonteiroGlobal()
  const { viewport } = useThree()
  const reduzMovimento = useMemo(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  )

  const offsetX = Math.min(viewport.width * 0.16, 1.5)

  useFrame((_, delta) => {
    if (!ref.current || reduzMovimento) return
    const progresso = progressoScroll?.current ?? 0 // 0 (hero) → 1 (fim)
    // Mouse (parallax) + scroll (storytelling): conforme a página desce,
    // o personagem gira sutilmente em direção à coluna de texto — como
    // se acompanhasse a leitura. Ajuste -0.5 (yaw) e 0.1 (pitch) a gosto.
    const alvoY = ponteiro.current.x * 0.45 + progresso * -0.5
    const alvoX = -ponteiro.current.y * 0.16 + progresso * 0.1
    ref.current.rotation.y = MathUtils.damp(ref.current.rotation.y, alvoY, 2.6, delta)
    ref.current.rotation.x = MathUtils.damp(ref.current.rotation.x, alvoX, 2.6, delta)
  })

  return (
    <group position={[offsetX, -0.25, 0]}>
      {/* Dueto frontal-lateral: esculpe rosto e jaqueta (CP2077 style).
          Ajuste intensity 100–400; z negativo = modo silhueta. */}
      <pointLight color={NEON_MAGENTA} position={[-3.2, 2.4, 2.6]} intensity={220} />
      <pointLight color={NEON_CIANO} position={[3.2, 1.5, 2.4]} intensity={220} />
      <group ref={ref}>{children}</group>
    </group>
  )
}

/** GLB normalizado (Center+Resize), de frente, com idle se existir. */
function ModeloCyberpunk() {
  const { scene, animations } = useGLTF(MODELO_URL)
  const { actions } = useAnimations(animations, scene)

  useEffect(() => {
    const nomes = Object.keys(actions)
    if (nomes.length === 0) return undefined
    const acao = actions[nomes[0]]
    acao?.reset().fadeIn(0.5).play()
    return () => acao?.fadeOut(0.3)
  }, [actions])

  return (
    <group scale={3.2}>
      <Resize>
        <Center>
          {/* Modelo v2 exportado de perfil (olhando p/ a esquerda da tela).
              -Math.PI/2 (≡ 270°) vira o personagem de frente para a câmera.
              Se trocar o GLB de novo e ele ficar de costas/perfil, ajuste
              apenas este Y em múltiplos de Math.PI/2. */}
          <primitive object={scene} rotation={[0, -Math.PI / 2, 0]} />
        </Center>
      </Resize>
    </group>
  )
}
useGLTF.preload(MODELO_URL)

function TelaDeCarregamento() {
  const { progress } = useProgress()
  return (
    <Html center>
      <div style={E.carregador} role="status" aria-live="polite">
        <span style={E.carregadorTexto}>Carregando a Matrix...</span>
        <div style={E.carregadorBarra}>
          <div style={{ ...E.carregadorBarraPreenchida, width: `${progress}%` }} />
        </div>
        <span style={E.carregadorProgresso}>{progress.toFixed(0)}%</span>
      </div>
    </Html>
  )
}

function PlaceholderNeon() {
  const ref = useRef()
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.4
  })
  return (
    <group ref={ref}>
      <mesh>
        <torusKnotGeometry args={[1, 0.3, 220, 28]} />
        <meshStandardMaterial color="#0b0b12" roughness={0.25} metalness={0.9} />
      </mesh>
      <mesh scale={1.003}>
        <torusKnotGeometry args={[1, 0.3, 220, 28]} />
        <meshBasicMaterial wireframe color={NEON_CIANO} transparent opacity={0.25} />
      </mesh>
      <Html center position={[0, -2.2, 0]}>
        <p style={E.avisoModelo}>
          [ modelo {MODELO_URL} não encontrado — coloque o arquivo na pasta /public ]
        </p>
      </Html>
    </group>
  )
}

class LimiteDeErro3D extends Component {
  state = { erro: false }

  static getDerivedStateFromError() {
    return { erro: true }
  }

  componentDidCatch(erro) {
    console.warn('[Cena3D] Falha ao carregar o modelo:', erro?.message ?? erro)
  }

  render() {
    return this.state.erro ? this.props.fallback : this.props.children
  }
}

function Cena3D({ progressoScroll }) {
  return (
    <Canvas
      style={{ width: '100vw', height: '100vh' }}
      camera={{ position: [0, 0.35, 5.5], fov: 42 }}
      dpr={[1, 2]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
    >
      <color attach="background" args={['#050505']} />
      <fog attach="fog" args={['#050505', 7, 18]} />

      <ambientLight intensity={0.05} />

      <RigParallax progressoScroll={progressoScroll}>
        <LimiteDeErro3D fallback={<PlaceholderNeon />}>
          <Suspense fallback={<TelaDeCarregamento />}>
            <ModeloCyberpunk />
          </Suspense>
        </LimiteDeErro3D>
      </RigParallax>
    </Canvas>
  )
}

/* ============================================================
   CAMADA UI — scroll storytelling
   ============================================================ */

/** Revelação padrão ao entrar na viewport: fade + slide up.
 *  once: false => re-anima ao rolar de volta (vibe storytelling). */
function RevelarAoScroll({ children, atraso = 0, ...resto }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.3 }}
      transition={{ duration: 0.6, ease: 'easeOut', delay: atraso }}
      {...resto}
    >
      {children}
    </motion.div>
  )
}

/* ---------- Seção 1: Hero ---------- */
function SecaoHero() {
  return (
    <section id="topo" style={{ ...E.secao, ...E.secaoHero }} className="secao">
      <RevelarAoScroll>
        <span style={E.overline}>{'/// PORTFOLIO_2026'}</span>
      </RevelarAoScroll>

      <RevelarAoScroll atraso={0.08}>
        <h1 style={E.heroTitulo}>
          HELLO,
          <br />
          {"I'M DYONE"}
          <span style={E.cursorPiscante}>_</span>
          {/* nome completo p/ SEO e leitores de tela — invisível no visual */}
          <span className="visualmente-oculto">
            {' — Dyone Nunes Andrade, Desenvolvedor Fullstack e DevOps'}
          </span>
        </h1>
      </RevelarAoScroll>

      <RevelarAoScroll atraso={0.16}>
        <h2 style={E.heroSubtitulo}>{'Fullstack Developer & DevOps'}</h2>
      </RevelarAoScroll>

      <span style={E.indicadorScroll}>{'[ scroll down para iniciar conexão ]'}</span>
    </section>
  )
}

/* ---------- Seção 2: About System ---------- */
function SecaoSobre() {
  return (
    <section id="sobre" style={E.secao} className="secao">
      <RevelarAoScroll>
        <span style={E.secaoLabel}>{'// sys.info.about'}</span>
      </RevelarAoScroll>

      <RevelarAoScroll atraso={0.1}>
        <div style={E.consoleBloco}>
          <p style={E.consolePrompt}>{'dyone@quilombus:~$ cat about.txt'}</p>
          <p style={E.consoleTexto}>{TEXTO_SOBRE}</p>
        </div>
      </RevelarAoScroll>
    </section>
  )
}

/* ---------- Seção 3: Tech Stack ---------- */
function SecaoStack() {
  return (
    <section id="stack" style={E.secao} className="secao">
      <RevelarAoScroll>
        <span style={{ ...E.secaoLabel, color: NEON_MAGENTA, textShadow: '0 0 10px rgba(255, 0, 255, 0.55)' }}>
          {'// sys.tech.stack'}
        </span>
      </RevelarAoScroll>

      <div style={E.stackGrade}>
        {techStacks.map((grupo, indice) => {
          // Alterna o acento neon e expande o último card (lista mais longa)
          const neon = indice % 2 === 0 ? NEON_CIANO : NEON_MAGENTA
          const ultimo = indice === techStacks.length - 1
          return (
            <motion.div
              key={grupo.categoria}
              style={{
                ...E.stackCard,
                borderColor: `${neon}33`, // ~20% de opacidade (repouso)
                backgroundImage: `linear-gradient(180deg, ${neon}0D, transparent 42%)`, // tint sutil no topo
                ...(ultimo ? { gridColumn: '1 / -1' } : null),
              }}
              initial={{ opacity: 0, x: -50 }}
              whileInView={{
                opacity: 1,
                x: 0,
                // transição da ENTRADA embutida aqui para o delay do stagger
                // não contaminar o hover (que usa o transition raiz, abaixo)
                transition: { duration: 0.5, ease: 'easeOut', delay: indice * 0.1 },
              }}
              viewport={{ once: false, amount: 0.35 }}
              whileHover="hover"
              variants={{
                hover: {
                  y: -3,
                  scale: 1.015,
                  borderColor: neon, // borda "acende" para opacidade total
                  boxShadow: `0 0 28px -8px ${neon}, 0 12px 34px -22px ${neon}`,
                },
              }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {/* filete holográfico no topo do card */}
              <span
                aria-hidden="true"
                style={{ ...E.stackFilete, background: `linear-gradient(90deg, ${neon}, transparent)` }}
              />

              {/* varredura de luz diagonal — dispara via propagação do hover */}
              <motion.span
                aria-hidden="true"
                style={E.stackVarredura}
                variants={{
                  hover: { x: ['-130%', '170%'], transition: { duration: 0.65, ease: 'easeOut' } },
                }}
              />

              {/* bracket HUD no canto inferior direito — acende no hover */}
              <motion.span
                aria-hidden="true"
                style={{ ...E.stackBracket, borderColor: `${neon}4D` }}
                variants={{ hover: { borderColor: neon, opacity: 1 } }}
              />

              {/* índice estilo executável, ecoando a lista de projetos */}
              <span style={{ ...E.stackIndice, color: neon }}>
                {String(indice + 1).padStart(2, '0')}
              </span>

              <h3
                style={{
                  ...E.stackCategoria,
                  textShadow: `0 0 12px ${neon}59`,
                  borderBottomColor: `${neon}1F`,
                }}
              >
                <span style={{ color: neon, textShadow: `0 0 10px ${neon}` }}>{'$ '}</span>
                {grupo.categoria}
              </h3>

              {/* tecnologias como chips individuais (escaneável > parágrafo) */}
              <ul style={E.stackChips}>
                {grupo.tecnologias.split(', ').map((tecnologia) => (
                  <li
                    key={tecnologia}
                    style={{
                      ...E.stackChip,
                      borderColor: `${neon}26`,
                      backgroundColor: `${neon}0A`,
                    }}
                  >
                    {tecnologia}
                  </li>
                ))}
              </ul>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}

/* ---------- Seção 4: Executables ---------- */
function SecaoProjetos() {
  return (
    <section id="projetos" style={{ ...E.secao, ...E.secaoProjetos }} className="secao">
      <RevelarAoScroll>
        <span style={{ ...E.secaoLabel, color: NEON_MAGENTA, textShadow: '0 0 10px rgba(255, 0, 255, 0.55)' }}>
          {'// sys.work.executables'}
        </span>
      </RevelarAoScroll>

      <ul style={E.listaHolo}>
        {meusProjetos.map((projeto, indice) => {
          const neon = indice % 2 === 0 ? NEON_CIANO : NEON_MAGENTA
          return (
            <li key={projeto.id}>
              {/* Card-módulo expansível: comprimido em repouso (índice +
                  nome grande + tags), expande no hover revelando tipo,
                  descrição e [↗]. O card inteiro é um link externo. */}
              <motion.a
                href={projeto.url}
                target="_blank"
                rel="noopener noreferrer"
                data-umami-event={projeto.evento}
                style={E.itemHolo}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{
                  opacity: 1,
                  y: 0,
                  // entrada com stagger embutida aqui; o transition raiz
                  // fica livre para o hover responder rápido
                  transition: { duration: 0.45, ease: 'easeOut', delay: indice * 0.05 },
                }}
                viewport={{ once: false, amount: 0.25 }}
                whileHover="hover"
                variants={{
                  hover: {
                    x: 6,
                    backgroundColor: 'rgba(10, 10, 15, 0.8)', // glass escuro
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    borderLeftColor: neon, // borda-guia acende forte
                    borderTopColor: `${neon}40`, // contorno fino ao redor
                    borderRightColor: `${neon}40`,
                    borderBottomColor: `${neon}40`,
                    boxShadow: `0 0 32px -12px ${neon}`,
                  },
                }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                <span style={{ ...E.itemIndice, color: neon }}>
                  {String(indice + 1).padStart(2, '0')}
                </span>

                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* nome grande: branco translúcido → neon brilhante */}
                  <motion.h3
                    style={E.itemNome}
                    variants={{ hover: { color: neon, textShadow: `0 0 18px ${neon}` } }}
                  >
                    {projeto.nome}
                  </motion.h3>

                  {/* tags sempre visíveis, em linha */}
                  <div style={E.itemTags}>
                    {projeto.tags.map((tag) => (
                      <span key={tag} style={{ ...E.itemTag, borderColor: `${neon}59` }}>
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* região expansível: height 0 → auto via propagação do hover */}
                  <motion.div
                    style={E.itemExpansao}
                    variants={{
                      hover: {
                        height: 'auto',
                        opacity: 1,
                        transition: { duration: 0.3, ease: 'easeOut' },
                      },
                    }}
                    transition={{ duration: 0.22, ease: 'easeIn' }}
                  >
                    <div style={E.itemExpansaoConteudo}>
                      <div style={E.itemExpansaoTopo}>
                        <span style={{ ...E.itemTipo, color: neon, textShadow: `0 0 8px ${neon}66` }}>
                          {projeto.tipo}
                        </span>
                        {/* indicador de link externo — nudge diagonal */}
                        <motion.span
                          aria-hidden="true"
                          style={{ ...E.itemSetinha, color: neon }}
                          variants={{ hover: { opacity: 1, x: 2, y: -2 } }}
                        >
                          {'[↗]'}
                        </motion.span>
                      </div>
                      <p style={E.itemDescricao}>{projeto.descricao}</p>
                    </div>
                  </motion.div>
                </div>
              </motion.a>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

/* ---------- Seção 5: Contact Protocol ---------- */
function SecaoContato() {
  const [formulario, setFormulario] = useState({ nome: '', email: '', mensagem: '' })
  const [estado, setEstado] = useState('inativo') // inativo | enviando | sucesso | erro

  const aoMudar = (evento) => {
    const { name, value } = evento.target
    setFormulario((atual) => ({ ...atual, [name]: value }))
  }

  const aoEnviar = async (evento) => {
    evento.preventDefault()
    if (estado === 'enviando') return
    setEstado('enviando')
    try {
      // fetch relativo: o proxy do Vite repassa ao backend
      // (localhost:3001 local; http://backend:3001 no Docker)
      const resposta = await fetch('/api/contato', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formulario),
      })
      if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`)
      setEstado('sucesso')
      setFormulario({ nome: '', email: '', mensagem: '' })
    } catch (erro) {
      console.error('[Contato] Falha no envio:', erro)
      setEstado('erro')
    }
  }

  return (
    <section id="contato" style={E.secao} className="secao">
      <RevelarAoScroll>
        <span style={E.secaoLabel}>{'// sys.contact.protocol'}</span>
      </RevelarAoScroll>

      <RevelarAoScroll atraso={0.08}>
        {/* Janela de terminal HUD: acende inteira via :focus-within */}
        <div className="painel-transmissao" style={E.painelTransmissao}>
          <div style={E.terminalBarra} aria-hidden="true">
            <span style={{ ...E.terminalLuz, background: 'rgba(0, 255, 255, 0.7)' }} />
            <span style={{ ...E.terminalLuz, background: 'rgba(255, 0, 255, 0.7)' }} />
            <span style={{ ...E.terminalLuz, background: 'rgba(255, 255, 255, 0.25)' }} />
            <span style={E.terminalTitulo}>{'> nova_transmissao.sh'}</span>
            <span style={E.terminalStatus}>{'[ canal: seguro ]'}</span>
          </div>

          <form onSubmit={aoEnviar} style={E.formularioHud}>
            {/* nome + email lado a lado (colapsa em 1 coluna no mobile) */}
            <div className="linha-campos" style={E.formularioLinha}>
              <div>
                <label style={E.campoRotulo} htmlFor="campo-nome">
                  {'> nome'}
                </label>
                <input
                  id="campo-nome"
                  name="nome"
                  type="text"
                  required
                  maxLength={120}
                  autoComplete="name"
                  placeholder="seu_nome"
                  value={formulario.nome}
                  onChange={aoMudar}
                  className="campo-hud"
                  style={E.campoHud}
                />
              </div>
              <div>
                <label style={E.campoRotulo} htmlFor="campo-email">
                  {'> email'}
                </label>
                <input
                  id="campo-email"
                  name="email"
                  type="email"
                  required
                  maxLength={160}
                  autoComplete="email"
                  placeholder="voce@dominio.com"
                  value={formulario.email}
                  onChange={aoMudar}
                  className="campo-hud"
                  style={E.campoHud}
                />
              </div>
            </div>

            <label style={E.campoRotulo} htmlFor="campo-mensagem">
              {'> mensagem'}
            </label>
            <textarea
              id="campo-mensagem"
              name="mensagem"
              required
              maxLength={5000}
              rows={4}
              placeholder="me fale sobre sua ideia ou projeto..."
              value={formulario.mensagem}
              onChange={aoMudar}
              className="campo-hud"
              style={{ ...E.campoHud, resize: 'vertical', minHeight: 96 }}
            />

            <motion.button
              type="submit"
              disabled={estado === 'enviando'}
              data-umami-event="Contato-Form-Submit"
              style={E.botaoConexao}
              whileHover={{
                boxShadow: `0 0 26px -6px ${NEON_CIANO}`,
                backgroundColor: 'rgba(0, 255, 255, 0.08)',
                textShadow: `0 0 12px ${NEON_CIANO}`,
              }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              {estado === 'enviando' ? '[ ESTABELECENDO_LINK... ]' : '[ INICIAR_CONEXAO ]'}
            </motion.button>

            {/* feedback do envio — aria-live anuncia a leitores de tela */}
            <p
              aria-live="polite"
              style={{ ...E.statusEnvio, ...(estado === 'erro' ? E.statusEnvioErro : null) }}
            >
              {estado === 'sucesso' && '> conexão estabelecida — confirmação enviada ao seu email_'}
              {estado === 'erro' && '> falha no link — tente novamente ou use o email direto_'}
            </p>
          </form>
        </div>
      </RevelarAoScroll>

      <RevelarAoScroll atraso={0.16}>
        <div style={E.contatoCanais}>
          <span style={E.canaisLabel}>{'// canais_diretos'}</span>
          <div style={E.contatoLinks}>
            {minhasRedes.map((rede) => (
              <motion.a
                key={rede.url}
                href={rede.url}
                target="_blank"
                rel="noopener noreferrer"
                data-umami-event={rede.evento}
                style={E.contatoLink}
                whileHover={{ color: NEON_CIANO, textShadow: `0 0 12px ${NEON_CIANO}`, y: -1 }}
              >
                {rede.rotulo}
              </motion.a>
            ))}
          </div>
        </div>
      </RevelarAoScroll>
    </section>
  )
}

/* ---------- Rodapé HUD ---------- */
function RodapeHud() {
  const voltarAoTopo = () => {
    // scroll suave via CSS (scroll-behavior) — respeita reduced-motion
    document.getElementById('topo')?.scrollIntoView({ block: 'start' })
  }

  return (
    <footer className="rodape-hud" style={E.rodape}>
      <span style={E.rodapeCopyright}>
        {'© 2026 dyone dev // all rights reserved.'}
      </span>

      <span style={E.rodapeStatus}>
        {'sys.status: ['}
        <span style={E.rodapeLed} aria-hidden="true" />
        {'online ]'}
      </span>

      <motion.button
        type="button"
        onClick={voltarAoTopo}
        data-umami-event="Footer-VoltarTopo-Click"
        style={E.rodapeVoltar}
        whileHover={{ color: NEON_CIANO, textShadow: `0 0 12px ${NEON_CIANO}`, y: -1 }}
        whileTap={{ scale: 0.96 }}
      >
        {'[ retornar_ao_topo ]'}
      </motion.button>
    </footer>
  )
}

/* ---------- Orquestração da UI ---------- */
function InterfaceUI({ progressoScroll }) {
  const scrollRef = useRef(null)
  const [secaoAtiva, setSecaoAtiva] = useState('topo')

  // Progresso (0..1) do container de scroll → compartilhado com o rig 3D.
  // useMotionValueEvent lê o MotionValue sem causar re-render por frame.
  const { scrollYProgress } = useScroll({ container: scrollRef })
  useMotionValueEvent(scrollYProgress, 'change', (valor) => {
    if (progressoScroll) progressoScroll.current = valor
  })

  // Rolagem suave fica no CSS (scroll-behavior) — que também
  // respeita prefers-reduced-motion via media query.
  const irPara = (id) => {
    document.getElementById(id)?.scrollIntoView({ block: 'start' })
  }

  // Destaque automático da seção visível na navegação.
  useEffect(() => {
    const alvos = scrollRef.current?.querySelectorAll('section[id]')
    if (!alvos?.length) return undefined
    const observador = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((entrada) => {
          if (entrada.isIntersecting) setSecaoAtiva(entrada.target.id)
        })
      },
      { threshold: 0.35 },
    )
    alvos.forEach((alvo) => observador.observe(alvo))
    return () => observador.disconnect()
  }, [])

  // [esc] retorna ao topo — atalho de terminal.
  useEffect(() => {
    const aoTeclar = (evento) => {
      if (evento.key === 'Escape') irPara('topo')
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [])

  return (
    <MotionConfig reducedMotion="user">
      {/* Vinheta fixa: escurece bordas, abre spot na zona do personagem */}
      <div style={E.vinheta} aria-hidden="true" />

      {/* Container de scroll: pointer-events AUTO é obrigatório para a
          wheel funcionar. O parallax não sofre — ele escuta a window. */}
      <div ref={scrollRef} style={E.uiScroll} className="ui-scroll">
        <SecaoHero />
        <SecaoSobre />
        <SecaoStack />
        <SecaoProjetos />
        <SecaoContato />
        <RodapeHud />
      </div>

      {/* Cabeçalho fixo: logo + âncoras de terminal */}
      <header style={E.cabecalho}>
        <motion.button
          style={E.logo}
          onClick={() => irPara('topo')}
          data-umami-event="Header-Logo-Click"
          whileHover={{ textShadow: `0 0 18px ${NEON_CIANO}` }}
          whileTap={{ scale: 0.95 }}
        >
          {'DYONE.DEV //'}
        </motion.button>

        <nav style={E.nav} aria-label="Seções">
          {NAV_ANCORAS.map((item) => (
            <motion.button
              key={item.id}
              onClick={() => irPara(item.id)}
              data-umami-event={item.evento}
              aria-current={secaoAtiva === item.id ? 'true' : undefined}
              style={{ ...E.navBotao, ...(secaoAtiva === item.id ? E.navBotaoAtivo : null) }}
              whileHover={{ color: NEON_CIANO, y: -1 }}
              whileTap={{ scale: 0.94 }}
            >
              {item.rotulo}
            </motion.button>
          ))}
        </nav>
      </header>

      {/* Status bar fixa */}
      <footer style={E.statusBarra}>
        {'> sys.online — scroll p/ navegar · mouse: parallax · [esc] topo'}
      </footer>

      {/* Scanlines CRT por cima de tudo */}
      <div style={E.scanlines} aria-hidden="true" />
    </MotionConfig>
  )
}

/* ============================================================
   APP
   ============================================================ */
export default function App() {
  // Ponte entre as duas árvores (DOM ⇄ Canvas): ref mutável escrita pelo
  // scroll da UI e lida a cada frame pelo rig — sem re-renders do React.
  const progressoScroll = useRef(0)

  return (
    <>
      <style>{CSS_GLOBAL}</style>
      <div style={E.camada3d}>
        <Cena3D progressoScroll={progressoScroll} />
      </div>
      <InterfaceUI progressoScroll={progressoScroll} />
    </>
  )
}

/* ============================================================
   ESTILOS — objetos inline + micro CSS global
   ============================================================ */
const FONTE_TITULO = "'Orbitron', sans-serif"

const E = {
  /* ---------- camadas fixas ---------- */
  camada3d: { position: 'fixed', inset: 0, zIndex: 1 },
  vinheta: {
    position: 'fixed',
    inset: 0,
    zIndex: 5,
    pointerEvents: 'none',
    background: 'radial-gradient(ellipse at 66% 44%, transparent 42%, rgba(0, 0, 0, 0.62) 100%)',
  },
  scanlines: {
    position: 'fixed',
    inset: 0,
    zIndex: 40,
    pointerEvents: 'none',
    background: 'repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.02) 0 1px, transparent 1px 3px)',
  },

  /* ---------- container de scroll ---------- */
  uiScroll: {
    position: 'fixed',
    inset: 0,
    zIndex: 10,
    height: '100dvh',
    overflowY: 'auto',
    overscrollBehavior: 'none',
    pointerEvents: 'auto',
    scrollbarWidth: 'thin',
    scrollbarColor: 'rgba(0, 255, 255, 0.45) transparent',
  },

  /* ---------- seções (telas de 100vh, coluna esquerda) ---------- */
  secao: {
    minHeight: '100vh',
    width: 'min(640px, 54vw)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: '0 16px 0 clamp(20px, 4.5vw, 64px)',
  },
  secaoHero: { position: 'relative' },
  secaoProjetos: { paddingTop: '12vh', paddingBottom: '14vh' },

  /* ---------- cabeçalho / nav (fixos) ---------- */
  cabecalho: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 30,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 'clamp(18px, 3vw, 34px) clamp(20px, 4vw, 54px)',
    pointerEvents: 'none', // só os botões capturam clique
  },
  logo: {
    pointerEvents: 'auto',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '0.78rem',
    fontWeight: 600,
    letterSpacing: '0.3em',
    color: '#e6ebf5',
    textShadow: '0 0 12px rgba(0, 255, 255, 0.35)',
  },
  nav: { display: 'flex', gap: 'clamp(16px, 2.6vw, 34px)' },
  navBotao: {
    pointerEvents: 'auto',
    background: 'none',
    border: 'none',
    borderBottom: '1px solid transparent',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '0.72rem',
    letterSpacing: '0.18em',
    color: 'rgba(230, 235, 245, 0.55)',
    padding: '6px 2px',
  },
  navBotaoAtivo: {
    color: NEON_CIANO,
    textShadow: '0 0 10px rgba(0, 255, 255, 0.7)',
    borderBottom: '1px solid rgba(0, 255, 255, 0.6)',
  },

  /* ---------- hero ---------- */
  overline: {
    fontSize: '0.66rem',
    fontWeight: 600,
    letterSpacing: '0.46em',
    textTransform: 'uppercase',
    color: NEON_CIANO,
    textShadow: '0 0 10px rgba(0, 255, 255, 0.55)',
  },
  heroTitulo: {
    fontFamily: FONTE_TITULO,
    fontWeight: 900,
    fontSize: 'clamp(2.5rem, 6.6vw, 5rem)',
    lineHeight: 1.04,
    letterSpacing: '0.01em',
    color: '#ffffff',
    textShadow: '0 0 18px rgba(0, 255, 255, 0.42), 0 0 70px rgba(0, 255, 255, 0.16)',
    margin: '14px 0 18px',
  },
  cursorPiscante: {
    color: NEON_MAGENTA,
    textShadow: '0 0 14px rgba(255, 0, 255, 0.7)',
    animation: 'piscar 1.1s steps(2) infinite',
  },
  heroSubtitulo: {
    fontSize: 'clamp(0.85rem, 1.7vw, 1.05rem)',
    fontWeight: 500,
    letterSpacing: '0.22em',
    textTransform: 'uppercase',
    color: NEON_MAGENTA,
    textShadow: '0 0 12px rgba(255, 0, 255, 0.55)',
    margin: 0,
  },
  indicadorScroll: {
    position: 'absolute',
    bottom: '7vh',
    left: 'clamp(20px, 4.5vw, 64px)',
    fontSize: '0.68rem',
    letterSpacing: '0.18em',
    color: 'rgba(0, 255, 255, 0.65)',
    textShadow: '0 0 10px rgba(0, 255, 255, 0.45)',
    animation: 'piscar 1.5s steps(2) infinite',
  },

  /* ---------- labels e console ---------- */
  secaoLabel: {
    display: 'inline-block',
    fontSize: '0.7rem',
    fontWeight: 600,
    letterSpacing: '0.34em',
    color: NEON_CIANO,
    textShadow: '0 0 10px rgba(0, 255, 255, 0.55)',
    marginBottom: 10,
  },
  consoleBloco: {
    borderLeft: '2px solid rgba(0, 255, 255, 0.35)',
    paddingLeft: 20,
    marginTop: 16,
    maxWidth: '52ch',
  },
  consolePrompt: {
    fontSize: '0.7rem',
    letterSpacing: '0.06em',
    color: 'rgba(230, 235, 245, 0.42)',
    margin: '0 0 12px',
  },
  consoleTexto: {
    fontSize: '0.88rem',
    lineHeight: 1.95,
    color: 'rgba(230, 235, 245, 0.78)',
    margin: 0,
  },

  /* ---------- tech stack (cards holográficos) ---------- */
  stackGrade: {
    display: 'grid',
    // 2 colunas na lateral esquerda; colapsa para 1 em telas estreitas
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: 14,
    marginTop: 18,
    width: '100%',
  },
  stackCard: {
    position: 'relative',
    overflow: 'hidden', // contém filete, varredura e bracket no raio do card
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // (backgroundImage com tint vem por card)
    WebkitBackdropFilter: 'blur(8px)',
    backdropFilter: 'blur(8px)',
    borderWidth: 1,
    borderStyle: 'solid', // borderColor vem por card (ciano/magenta)
    borderRadius: 8,
    padding: '16px 18px 18px',
  },
  stackFilete: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '42%',
    height: 2,
    opacity: 0.9,
    pointerEvents: 'none',
  },
  stackVarredura: {
    position: 'absolute',
    top: -24,
    bottom: -24,
    left: 0,
    width: '55%',
    x: '-130%', // estaciona fora do card; o hover varre até 170%
    skewX: '-18deg',
    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.07), transparent)',
    pointerEvents: 'none',
  },
  stackBracket: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    width: 12,
    height: 12,
    borderRightWidth: 1,
    borderRightStyle: 'solid',
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    opacity: 0.55,
    pointerEvents: 'none',
  },
  stackIndice: {
    position: 'absolute',
    top: 12,
    right: 14,
    fontSize: '0.6rem',
    letterSpacing: '0.12em',
    opacity: 0.75,
    textShadow: '0 0 8px currentcolor',
  },
  stackCategoria: {
    fontSize: '0.88rem',
    fontWeight: 600,
    letterSpacing: '0.05em',
    color: '#ffffff',
    margin: '0 0 10px',
    paddingRight: 34, // não colide com o índice
    paddingBottom: 9,
    borderBottomWidth: 1,
    borderBottomStyle: 'solid', // borderBottomColor neon 12% vem por card
  },
  stackChips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    listStyle: 'none',
    margin: 0,
    padding: 0,
  },
  stackChip: {
    fontSize: '0.68rem',
    letterSpacing: '0.04em',
    lineHeight: 1,
    padding: '5px 8px',
    borderRadius: 3,
    borderWidth: 1,
    borderStyle: 'solid', // borderColor/backgroundColor neon vêm por card
    color: 'rgba(190, 225, 232, 0.78)',
    whiteSpace: 'nowrap',
  },

  /* ---------- lista holograma (projetos) ---------- */
  listaHolo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 18, // módulos independentes flutuando
    listStyle: 'none',
    margin: '18px 0 0',
    padding: 0,
    width: '100%',
  },
  itemHolo: {
    display: 'flex',
    gap: 14,
    padding: '14px 16px 14px 18px',
    backgroundColor: 'rgba(10, 10, 15, 0)', // repouso transparente → 0.8 no hover
    WebkitBackdropFilter: 'blur(0px)',
    backdropFilter: 'blur(0px)', // hover anima para blur(12px)
    borderLeftWidth: 2, // borda-guia: branca 10% → neon forte no hover
    borderLeftStyle: 'solid',
    borderLeftColor: 'rgba(255, 255, 255, 0.1)',
    borderTopWidth: 1, // contorno fino: invisível → neon 25% no hover
    borderTopStyle: 'solid',
    borderTopColor: 'rgba(255, 255, 255, 0)',
    borderRightWidth: 1,
    borderRightStyle: 'solid',
    borderRightColor: 'rgba(255, 255, 255, 0)',
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: 'rgba(255, 255, 255, 0)',
    borderRadius: 4,
    textDecoration: 'none', // é um <a>: sem sublinhado, cursor nativo
    color: 'inherit',
  },
  itemIndice: {
    fontSize: '0.7rem',
    paddingTop: 8,
    opacity: 0.85,
    textShadow: '0 0 8px currentcolor',
  },
  itemNome: {
    fontFamily: FONTE_TITULO,
    fontWeight: 700,
    fontSize: 'clamp(1.15rem, 2.1vw, 1.5rem)', // nome em destaque grande
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    lineHeight: 1.15,
    color: 'rgba(255, 255, 255, 0.82)', // branco translúcido em repouso
    margin: '0 0 8px',
  },
  itemTags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
  },
  itemTag: {
    fontSize: '0.6rem',
    letterSpacing: '0.05em',
    lineHeight: 1,
    padding: '3px 8px',
    borderRadius: 3,
    borderWidth: 1,
    borderStyle: 'solid', // borderColor neon 35% vem por item
    background: 'transparent',
    color: 'rgba(200, 232, 240, 0.8)',
    whiteSpace: 'nowrap',
  },
  itemExpansao: {
    height: 0, // framer expande para 'auto' no hover
    opacity: 0,
    overflow: 'hidden',
  },
  itemExpansaoConteudo: {
    paddingTop: 12, // padding no conteúdo interno (height anima limpo)
  },
  itemExpansaoTopo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  itemSetinha: {
    display: 'inline-block', // necessário p/ transform animar em span
    fontSize: '0.78rem',
    opacity: 0.6,
  },
  itemTipo: {
    display: 'inline-block',
    fontSize: '0.6rem',
    fontWeight: 600,
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
  },
  itemDescricao: {
    fontSize: '0.76rem',
    lineHeight: 1.65,
    color: 'rgba(226, 232, 244, 0.62)',
    maxWidth: '52ch',
    margin: 0,
  },

  /* ---------- contato (janela de terminal HUD) ---------- */
  painelTransmissao: {
    width: 'min(540px, 100%)',
    marginTop: 16,
    backgroundColor: 'rgba(5, 6, 10, 0.45)',
    WebkitBackdropFilter: 'blur(10px)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(0, 255, 255, 0.18)', // acende via :focus-within
    borderRadius: 8,
    overflow: 'hidden',
  },
  terminalBarra: {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    padding: '10px 14px',
    background: 'rgba(0, 255, 255, 0.04)',
    borderBottom: '1px solid rgba(0, 255, 255, 0.14)',
  },
  terminalLuz: {
    width: 8,
    height: 8,
    borderRadius: 2,
    display: 'inline-block',
  },
  terminalTitulo: {
    marginLeft: 6,
    fontSize: '0.66rem',
    letterSpacing: '0.12em',
    color: 'rgba(230, 235, 245, 0.6)',
  },
  terminalStatus: {
    marginLeft: 'auto',
    fontSize: '0.6rem',
    letterSpacing: '0.14em',
    color: 'rgba(0, 255, 255, 0.65)',
    textShadow: '0 0 8px rgba(0, 255, 255, 0.35)',
  },
  formularioHud: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    width: '100%',
    padding: '14px 16px 16px',
  },
  formularioLinha: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr', // colapsa via .linha-campos no mobile
    gap: 12,
  },
  campoRotulo: {
    display: 'block',
    fontSize: '0.66rem',
    letterSpacing: '0.18em',
    color: 'rgba(0, 255, 255, 0.75)',
    textShadow: '0 0 8px rgba(0, 255, 255, 0.35)',
    margin: '8px 0 6px',
  },
  campoHud: {
    width: '100%',
    background: 'transparent',
    border: '1px solid rgba(255, 255, 255, 0.16)', // foco neon via .campo-hud:focus
    borderRadius: 4,
    padding: '10px 12px',
    fontFamily: 'inherit',
    fontSize: '0.82rem',
    color: '#e6ebf5',
    caretColor: NEON_CIANO,
  },
  botaoConexao: {
    width: '100%', // botão de "executar" da janela de terminal
    marginTop: 14,
    padding: '13px 20px',
    backgroundColor: 'rgba(0, 255, 255, 0)', // hover anima p/ 8%
    border: '1px solid rgba(0, 255, 255, 0.55)',
    borderRadius: 4,
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '0.78rem',
    fontWeight: 600,
    letterSpacing: '0.18em',
    textAlign: 'center',
    color: NEON_CIANO,
  },
  statusEnvio: {
    minHeight: 18, // reserva espaço: feedback não desloca o layout
    margin: '6px 0 0',
    fontSize: '0.7rem',
    letterSpacing: '0.08em',
    color: 'rgba(0, 255, 255, 0.8)',
  },
  statusEnvioErro: {
    color: 'rgba(255, 80, 200, 0.9)',
  },
  contatoCanais: {
    marginTop: 30,
  },
  canaisLabel: {
    display: 'block',
    fontSize: '0.62rem',
    fontWeight: 600,
    letterSpacing: '0.3em',
    color: 'rgba(255, 0, 255, 0.75)',
    textShadow: '0 0 10px rgba(255, 0, 255, 0.4)',
    marginBottom: 12,
  },
  contatoLinks: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 18,
  },
  contatoLink: {
    background: 'none',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '0.75rem',
    letterSpacing: '0.14em',
    color: 'rgba(230, 235, 245, 0.6)',
    textDecoration: 'none',
  },

  /* ---------- rodapé HUD ---------- */
  rodape: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    width: '100%',
    // padding-bottom extra: o conteúdo flutua acima da status bar fixa
    padding: '26px clamp(20px, 4vw, 54px) 58px',
    borderTop: '1px solid rgba(0, 255, 255, 0.2)', // hairline ciano 20%
    backgroundColor: 'rgba(5, 6, 10, 0.2)', // glass quase imperceptível
    WebkitBackdropFilter: 'blur(6px)',
    backdropFilter: 'blur(6px)',
    fontSize: '0.66rem',
    letterSpacing: '0.1em',
  },
  rodapeCopyright: {
    color: 'rgba(230, 235, 245, 0.35)',
    textTransform: 'lowercase',
  },
  rodapeStatus: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    color: 'rgba(230, 235, 245, 0.5)',
  },
  rodapeLed: {
    width: 7,
    height: 7,
    borderRadius: 999,
    background: NEON_CIANO,
    boxShadow: '0 0 10px rgba(0, 255, 255, 0.9)',
    animation: 'pulsar 1.6s ease-in-out infinite', // LED piscando
  },
  rodapeVoltar: {
    background: 'none',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '0.66rem',
    letterSpacing: '0.14em',
    color: 'rgba(230, 235, 245, 0.55)',
  },

  /* ---------- status bar ---------- */
  statusBarra: {
    position: 'fixed',
    left: 'clamp(20px, 4vw, 54px)',
    bottom: 'clamp(16px, 2.6vw, 28px)',
    zIndex: 30,
    fontSize: '0.62rem',
    letterSpacing: '0.14em',
    color: 'rgba(230, 235, 245, 0.35)',
    pointerEvents: 'none',
  },

  /* ---------- loader / avisos (dentro do Canvas) ---------- */
  carregador: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 },
  carregadorTexto: {
    fontFamily: FONTE_TITULO,
    fontSize: '1.05rem',
    fontWeight: 700,
    letterSpacing: '0.12em',
    whiteSpace: 'nowrap',
    color: NEON_CIANO,
    textShadow: '0 0 12px rgba(0, 255, 255, 0.85), 0 0 32px rgba(0, 255, 255, 0.4)',
    animation: 'pulsar 1.3s ease-in-out infinite',
  },
  carregadorBarra: {
    width: 190,
    height: 2,
    borderRadius: 999,
    background: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
  },
  carregadorBarraPreenchida: {
    height: '100%',
    background: `linear-gradient(90deg, ${NEON_CIANO}, ${NEON_MAGENTA})`,
    boxShadow: '0 0 12px rgba(0, 255, 255, 0.8)',
    transition: 'width 0.25s ease',
  },
  carregadorProgresso: {
    fontSize: '0.82rem',
    color: NEON_MAGENTA,
    textShadow: '0 0 10px rgba(255, 0, 255, 0.6)',
  },
  avisoModelo: {
    width: 300,
    textAlign: 'center',
    fontSize: '0.68rem',
    letterSpacing: '0.08em',
    lineHeight: 1.6,
    color: 'rgba(230, 235, 245, 0.45)',
  },
}

/* ============================================================
   CSS mínimo — keyframes, scrollbar, focus e responsivo
   ============================================================ */
const CSS_GLOBAL = `
  @keyframes pulsar {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.35; }
  }

  @keyframes piscar {
    0%, 49% { opacity: 1; }
    50%, 100% { opacity: 0; }
  }

  /* Rolagem suave nas âncoras (// about, // work) */
  .ui-scroll { scroll-behavior: smooth; }

  .ui-scroll::-webkit-scrollbar { width: 4px; }
  .ui-scroll::-webkit-scrollbar-track { background: transparent; }
  .ui-scroll::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, ${NEON_CIANO}, ${NEON_MAGENTA});
    border-radius: 999px;
  }

  /* Oculta visualmente mantendo acessível p/ SEO e leitores de tela */
  .visualmente-oculto {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
    border: 0;
  }

  button:focus-visible,
  a:focus-visible {
    outline: 2px solid ${NEON_CIANO};
    outline-offset: 3px;
  }

  /* Campos do formulário HUD: foco com brilho neon ciano */
  .campo-hud {
    transition: border-color 0.25s ease, box-shadow 0.25s ease;
  }
  .campo-hud:focus {
    outline: none;
    border-color: ${NEON_CIANO};
    box-shadow: 0 0 16px -6px ${NEON_CIANO};
  }
  .campo-hud::placeholder {
    color: rgba(230, 235, 245, 0.28);
  }

  /* Janela de transmissão: acende quando qualquer campo recebe foco */
  .painel-transmissao {
    transition: border-color 0.3s ease, box-shadow 0.3s ease;
  }
  .painel-transmissao:focus-within {
    border-color: rgba(0, 255, 255, 0.55);
    box-shadow: 0 0 38px -14px ${NEON_CIANO};
  }

  /* Mobile: nome/email empilham em 1 coluna */
  @media (max-width: 560px) {
    .linha-campos {
      grid-template-columns: 1fr !important;
    }
  }

  button:disabled {
    opacity: 0.55;
    cursor: progress;
  }

  @media (prefers-reduced-motion: reduce) {
    * { animation: none !important; }
    .ui-scroll { scroll-behavior: auto; }
  }

  /* Mobile: coluna de texto ocupa a largura útil; personagem ao fundo */
  @media (max-width: 760px) {
    .secao {
      width: 92vw !important;
    }
    .rodape-hud {
      flex-direction: column !important;
      align-items: center !important;
      text-align: center;
      gap: 12px !important;
    }
  }
`
