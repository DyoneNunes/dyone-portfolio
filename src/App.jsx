/**
 * ============================================================
 *  PORTFÓLIO INTERATIVO 3D — Cyberpunk / Scroll Storytelling
 * ------------------------------------------------------------
 *  Camada 3D : FIXA ao fundo — personagem + cenário (grade,
 *              anéis, partículas, bloom) coreografados pelo scroll
 *  Camada UI : container com scroll nativo, seções de 100svh
 *              em coluna à esquerda (largura total no mobile)
 *  Nav       : âncoras de terminal no topo (desktop) ou barra
 *              inferior (mobile), com destaque da seção visível
 * ============================================================
 */
import { Component, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import {
  Center,
  Grid,
  Html,
  PerformanceMonitor,
  Resize,
  Sparkles,
  useAnimations,
  useGLTF,
  useProgress,
} from '@react-three/drei'
import { Bloom, EffectComposer, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { motion, MotionConfig, useMotionValueEvent, useScroll, useTransform } from 'framer-motion'
import { Color, MathUtils } from 'three'

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
  {
    id: 7,
    nome: 'Skills Router',
    descricao:
      'Servidor MCP + meta-skill que indexa, busca e carrega skills de agentes de IA sob demanda, sem estourar a janela de contexto.',
    tipo: 'Open Source / IA',
    url: 'https://github.com/DyoneNunes/mcp-manage-router-skill',
    evento: 'Projeto-SkillsRouter-Click',
    tags: ['Python', 'MCP', 'FastMCP', 'uv'],
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
   UTILITÁRIOS DE MÍDIA
   ============================================================ */
const LARGURA_COMPACTA = 760 // px — abaixo disso o layout é "mobile"

const consultaMidia = (consulta) => window.matchMedia(consulta).matches

/** Media query reativa (ex.: '(hover: none)' para telas de toque). */
function useMidia(consulta) {
  const [bate, setBate] = useState(() => consultaMidia(consulta))
  useEffect(() => {
    const mq = window.matchMedia(consulta)
    const aoMudar = (evento) => setBate(evento.matches)
    mq.addEventListener('change', aoMudar)
    return () => mq.removeEventListener('change', aoMudar)
  }, [consulta])
  return bate
}

/* ============================================================
   CAMADA 3D — fixa ao fundo, imune ao scroll
   ============================================================ */

/** Ponteiro global normalizado (-1..1) — escuta a window para o
 *  parallax continuar vivo com o cursor/dedo sobre o texto. */
function usePonteiroGlobal() {
  const ponteiro = useRef({ x: 0, y: 0 })
  useEffect(() => {
    const atualizar = (clientX, clientY) => {
      ponteiro.current.x = (clientX / window.innerWidth) * 2 - 1
      ponteiro.current.y = -((clientY / window.innerHeight) * 2 - 1)
    }
    const aoMover = (evento) => atualizar(evento.clientX, evento.clientY)
    // No toque o pointermove é cancelado quando o scroll começa;
    // o touchmove (passivo) mantém o parallax vivo durante o arrasto.
    const aoTocar = (evento) => {
      const toque = evento.touches[0]
      if (toque) atualizar(toque.clientX, toque.clientY)
    }
    window.addEventListener('pointermove', aoMover)
    window.addEventListener('touchmove', aoTocar, { passive: true })
    return () => {
      window.removeEventListener('pointermove', aoMover)
      window.removeEventListener('touchmove', aoTocar)
    }
  }, [])
  return ponteiro
}

/* Coreografia: um enquadramento por seção (hero, about, tech, work,
   contact). x é multiplicador do deslocamento lateral; y/z movem o
   cenário (equivale a mover a câmera); giro é o yaw do personagem.
   Ajuste a gosto — a transição entre poses é interpolada pelo scroll. */
const POSES_AMPLO = [
  { x: 1.0, y: -0.25, z: 0.0, giro: 0.0 }, // hero: corpo inteiro
  { x: 1.05, y: -0.8, z: 1.3, giro: -0.38 }, // about: close no busto
  { x: 1.15, y: -0.25, z: 0.2, giro: -0.55 }, // tech: olha para os cards
  { x: 1.2, y: -0.05, z: -1.2, giro: -0.22 }, // work: recua, mostra o chão
  { x: 1.0, y: -0.6, z: 0.8, giro: -0.42 }, // contact: aproxima de novo
]
const POSES_COMPACTO = [
  { x: 0, y: 0.5, z: 0.0, giro: 0.0 }, // hero: personagem no topo
  { x: 0, y: 0.15, z: -1.2, giro: -0.3 }, // demais: recua atrás do texto
  { x: 0, y: 0.15, z: -1.6, giro: 0.3 },
  { x: 0, y: 0.15, z: -2.0, giro: -0.2 },
  { x: 0, y: 0.25, z: -1.0, giro: 0.0 },
]

/** Interpola a pose para uma posição fracionária de seção (0..n-1),
 *  escrevendo em `saida` para não alocar a cada frame. */
function interpolarPose(poses, secao, saida) {
  const ultimo = poses.length - 1
  const s = MathUtils.clamp(secao, 0, ultimo)
  const i = Math.min(Math.floor(s), ultimo - 1)
  const t = MathUtils.smootherstep(s - i, 0, 1)
  const a = poses[i]
  const b = poses[i + 1]
  saida.x = MathUtils.lerp(a.x, b.x, t)
  saida.y = MathUtils.lerp(a.y, b.y, t)
  saida.z = MathUtils.lerp(a.z, b.z, t)
  saida.giro = MathUtils.lerp(a.giro, b.giro, t)
  return saida
}

/** Anéis holográficos atrás do personagem — halo HUD que o bloom acende. */
function AneisHolo({ parado, compacto }) {
  const externo = useRef()
  const interno = useRef()
  // cores em HDR (>1) para ultrapassar o limiar do bloom
  const ciano = useMemo(() => new Color(NEON_CIANO).multiplyScalar(4), [])
  const magenta = useMemo(() => new Color(NEON_MAGENTA).multiplyScalar(4), [])

  useFrame((_, delta) => {
    if (parado || !externo.current || !interno.current) return
    externo.current.rotation.z -= delta * 0.08
    interno.current.rotation.z += delta * 0.12
  })

  return (
    // no mobile o halo encolhe e sobe para emoldurar o rosto sem estourar a tela
    <group position={[0, compacto ? 0.7 : 0.35, -1.4]} scale={compacto ? 0.6 : 1}>
      <mesh ref={interno}>
        <torusGeometry args={[1.75, 0.008, 8, 160, Math.PI * 1.6]} />
        <meshBasicMaterial color={ciano} toneMapped={false} transparent opacity={0.75} />
      </mesh>
      <mesh ref={externo}>
        <torusGeometry args={[2.1, 0.005, 8, 160, Math.PI * 1.15]} />
        <meshBasicMaterial color={magenta} toneMapped={false} transparent opacity={0.6} />
      </mesh>
      <mesh>
        <torusGeometry args={[1.45, 0.003, 8, 160]} />
        <meshBasicMaterial color={NEON_CIANO} transparent opacity={0.22} />
      </mesh>
    </group>
  )
}

/** Rig: move o cenário inteiro conforme a seção (coreografia do scroll)
 *  e gira só o personagem com o parallax do ponteiro. Luzes, chão e
 *  anéis viajam junto para o retrato two-tone nunca descolar. */
function RigCenario({ estadoScroll, compacto, parado, children }) {
  const mundo = useRef()
  const giro = useRef()
  const pose = useRef({ x: 0, y: 0, z: 0, giro: 0 })
  const ponteiro = usePonteiroGlobal()
  const { viewport } = useThree()

  const poses = compacto ? POSES_COMPACTO : POSES_AMPLO
  const deslocX = compacto ? 0 : Math.min(viewport.width * 0.16, 1.5)

  useFrame((estado, delta) => {
    if (!mundo.current || !giro.current || parado) return
    const secao = estadoScroll?.current?.secao ?? 0
    const alvo = interpolarPose(poses, secao, pose.current)
    const posicao = mundo.current.position
    posicao.x = MathUtils.damp(posicao.x, alvo.x * deslocX, 3, delta)
    posicao.y = MathUtils.damp(posicao.y, alvo.y, 3, delta)
    posicao.z = MathUtils.damp(posicao.z, alvo.z, 3, delta)

    // yaw = pose da seção + parallax + respiração lenta (vida no toque)
    const respiro = Math.sin(estado.clock.elapsedTime * 0.45) * 0.05
    const alvoY = alvo.giro + ponteiro.current.x * 0.4 + respiro
    const alvoX = -ponteiro.current.y * 0.14
    giro.current.rotation.y = MathUtils.damp(giro.current.rotation.y, alvoY, 2.6, delta)
    giro.current.rotation.x = MathUtils.damp(giro.current.rotation.x, alvoX, 2.6, delta)
  })

  return (
    <group
      ref={mundo}
      position={[poses[0].x * deslocX, poses[0].y, poses[0].z]}
      scale={compacto ? 0.8 : 1}
    >
      {/* Dueto frontal-lateral: esculpe rosto e jaqueta (CP2077 style).
          Ajuste intensity 100–400; z negativo = modo silhueta. */}
      <pointLight color={NEON_MAGENTA} position={[-3.2, 2.4, 2.6]} intensity={220} />
      <pointLight color={NEON_CIANO} position={[3.2, 1.5, 2.4]} intensity={220} />
      {/* Luz de recorte: vem de trás/cima e destaca a silhueta do fundo */}
      <pointLight color="#9fe8ff" position={[0.4, 2.6, -2.6]} intensity={150} />

      <AneisHolo parado={parado} compacto={compacto} />

      {/* Chão: grade neon que some na distância (base do busto ≈ y -1.6) */}
      <Grid
        position={[0, -1.6, 0]}
        infiniteGrid
        cellSize={0.5}
        cellThickness={0.6}
        cellColor="#0a2e33"
        sectionSize={2.5}
        sectionThickness={1.1}
        sectionColor="#0c8a94"
        fadeDistance={compacto ? 16 : 24}
        fadeStrength={1.6}
      />

      <group ref={giro}>{children}</group>
    </group>
  )
}

/** GLB normalizado (Center+Resize), de frente, com idle se existir.
 *  Entra em cena girando e subindo até a pose final. */
function ModeloCyberpunk({ parado }) {
  const { scene, animations } = useGLTF(MODELO_URL)
  const { actions } = useAnimations(animations, scene)
  const entrada = useRef()

  useEffect(() => {
    const nomes = Object.keys(actions)
    if (nomes.length === 0) return undefined
    const acao = actions[nomes[0]]
    acao?.reset().fadeIn(0.5).play()
    return () => acao?.fadeOut(0.3)
  }, [actions])

  useFrame((_, delta) => {
    const grupo = entrada.current
    if (!grupo) return
    grupo.rotation.y = MathUtils.damp(grupo.rotation.y, 0, 2.2, delta)
    grupo.position.y = MathUtils.damp(grupo.position.y, 0, 2.6, delta)
  })

  return (
    <group
      ref={entrada}
      scale={3.2}
      rotation={[0, parado ? 0 : -1.1, 0]}
      position={[0, parado ? 0 : -0.35, 0]}
    >
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

/** Conteúdo da cena — separado do <Canvas> para poder ler o tamanho
 *  do canvas e adaptar o enquadramento/efeitos ao mobile. */
function Palco({ estadoScroll }) {
  const compacto = useThree((estado) => estado.size.width < LARGURA_COMPACTA)
  const parado = useMemo(() => consultaMidia('(prefers-reduced-motion: reduce)'), [])
  const poeiraCiano = useMemo(() => new Color(NEON_CIANO).multiplyScalar(2.5), [])
  const poeiraMagenta = useMemo(() => new Color(NEON_MAGENTA).multiplyScalar(2.5), [])

  return (
    <>
      <color attach="background" args={['#050505']} />
      <fog attach="fog" args={['#050505', 7, 18]} />

      <ambientLight intensity={0.06} />

      <RigCenario estadoScroll={estadoScroll} compacto={compacto} parado={parado}>
        <LimiteDeErro3D fallback={<PlaceholderNeon />}>
          <Suspense fallback={<TelaDeCarregamento />}>
            <ModeloCyberpunk parado={parado} />
          </Suspense>
        </LimiteDeErro3D>
      </RigCenario>

      {/* Poeira neon em suspensão: dá profundidade ao vazio do fundo */}
      <Sparkles
        count={compacto ? 36 : 80}
        scale={[11, 6, 7]}
        position={[0, 0.4, -1]}
        size={2.4}
        speed={parado ? 0 : 0.28}
        opacity={0.55}
        color={poeiraCiano}
      />
      <Sparkles
        count={compacto ? 18 : 40}
        scale={[11, 6, 7]}
        position={[0, 0.2, -1.5]}
        size={3}
        speed={parado ? 0 : 0.2}
        opacity={0.4}
        color={poeiraMagenta}
      />

      {/* Bloom só no que é realmente brilhante (anéis, poeira, reflexos
          fortes do modelo). Suba luminanceThreshold se estourar demais.
          O ToneMapping ACES preserva o look original do renderer. */}
      <EffectComposer multisampling={compacto ? 0 : 4}>
        <Bloom
          mipmapBlur
          intensity={0.6}
          radius={0.7}
          luminanceThreshold={1.6}
          luminanceSmoothing={0.4}
        />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    </>
  )
}

function Cena3D({ estadoScroll }) {
  // DPR limitado (mais baixo no toque) e rebaixado se o FPS cair.
  const [dpr, setDpr] = useState(() =>
    Math.min(window.devicePixelRatio || 1, consultaMidia('(pointer: coarse)') ? 1.75 : 2),
  )

  return (
    <Canvas
      style={{ width: '100%', height: '100%' }}
      camera={{ position: [0, 0.35, 5.5], fov: 42 }}
      dpr={dpr}
      gl={{ antialias: false, powerPreference: 'high-performance' }}
    >
      <PerformanceMonitor onDecline={() => setDpr(1)} />
      <Palco estadoScroll={estadoScroll} />
    </Canvas>
  )
}

/* ============================================================
   CAMADA UI — scroll storytelling
   ============================================================ */

/** Revelação padrão ao entrar na viewport: fade + slide up curto,
 *  uma única vez (não re-anima a cada passagem). */
function RevelarAoScroll({ children, atraso = 0, ...resto }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, ease: 'easeOut', delay: atraso }}
      {...resto}
    >
      {children}
    </motion.div>
  )
}

/** Cabeçalho de seção: rótulo de terminal + título. */
function CabecalhoSecao({ rotulo, titulo, magenta = false }) {
  return (
    <RevelarAoScroll>
      <span className={`secao-rotulo${magenta ? ' secao-rotulo--magenta' : ''}`}>{rotulo}</span>
      <h2 className="secao-titulo">{titulo}</h2>
    </RevelarAoScroll>
  )
}

/* ---------- Seção 1: Hero ---------- */
const HERO_RESUMO =
  'Co-founder e CTO da Quilombus Network. Construo ecossistemas escaláveis com React, FastAPI, Docker e Neo4j.'
const HERO_CHIPS = ['CTO @ Quilombus Network', '9+ anos de código', 'Vitória, ES']

const HERO_PAI = {
  oculto: {},
  visivel: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } },
}
const HERO_FILHO = {
  oculto: { opacity: 0, y: 20 },
  visivel: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
}

function SecaoHero({ irPara }) {
  return (
    <section id="topo" className="secao secao-hero">
      <motion.div className="hero-conteudo" variants={HERO_PAI} initial="oculto" animate="visivel">
        <motion.span variants={HERO_FILHO} style={E.overline}>
          {'/// PORTFOLIO_2026'}
        </motion.span>

        <motion.h1 variants={HERO_FILHO} className="hero-titulo">
          <span className="hero-ola">{"Hello, I'm"}</span>{' '}
          <span className="hero-nome-linha">
            <span className="hero-nome">Dyone</span>
            <span style={E.cursorPiscante} aria-hidden="true">
              _
            </span>
          </span>
          {/* nome completo p/ SEO e leitores de tela — invisível no visual */}
          <span className="visualmente-oculto">
            {' — Dyone Nunes Andrade, Desenvolvedor Fullstack e DevOps'}
          </span>
        </motion.h1>

        <motion.h2 variants={HERO_FILHO} style={E.heroSubtitulo}>
          {'Fullstack Developer & DevOps'}
        </motion.h2>

        <motion.p variants={HERO_FILHO} style={E.heroResumo}>
          {HERO_RESUMO}
        </motion.p>

        <motion.div variants={HERO_FILHO} className="hero-acoes">
          <button
            type="button"
            className="botao botao-primario"
            onClick={() => irPara('projetos')}
            data-umami-event="Hero-Projetos-Click"
          >
            {'ver_projetos →'}
          </button>
          <button
            type="button"
            className="botao botao-fantasma"
            onClick={() => irPara('contato')}
            data-umami-event="Hero-Contato-Click"
          >
            {'contato'}
          </button>
        </motion.div>

        <motion.ul variants={HERO_FILHO} className="hero-chips">
          {HERO_CHIPS.map((chip) => (
            <li key={chip} className="hero-chip">
              {chip}
            </li>
          ))}
        </motion.ul>
      </motion.div>

      <span className="indicador-scroll" aria-hidden="true">
        scroll
        <span className="indicador-linha" />
      </span>
    </section>
  )
}

/* ---------- Seção 2: About System ---------- */
function SecaoSobre() {
  return (
    <section id="sobre" className="secao">
      <CabecalhoSecao rotulo="// sys.info.about" titulo="About" />

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
    <section id="stack" className="secao">
      <CabecalhoSecao rotulo="// sys.tech.stack" titulo="Tech Stack" magenta />

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
              initial={{ opacity: 0, x: -24 }}
              whileInView={{
                opacity: 1,
                x: 0,
                // transição da ENTRADA embutida aqui para o delay do stagger
                // não contaminar o hover (que usa o transition raiz, abaixo)
                transition: { duration: 0.5, ease: 'easeOut', delay: indice * 0.1 },
              }}
              viewport={{ once: true, amount: 0.35 }}
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
  // Toque não tem hover: os detalhes do card ficam sempre abertos.
  const semHover = useMidia('(hover: none)')

  return (
    <section id="projetos" className="secao">
      <CabecalhoSecao rotulo="// sys.work.executables" titulo="Work" magenta />

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
                initial={{ opacity: 0, y: 24 }}
                whileInView={{
                  opacity: 1,
                  y: 0,
                  // entrada com stagger embutida aqui; o transition raiz
                  // fica livre para o hover responder rápido
                  transition: { duration: 0.45, ease: 'easeOut', delay: indice * 0.05 },
                }}
                viewport={{ once: true, amount: 0.25 }}
                whileHover="hover"
                whileTap={{ scale: 0.99 }}
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
                    style={semHover ? E.itemExpansaoAberta : E.itemExpansao}
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
    <section id="contato" className="secao">
      <CabecalhoSecao rotulo="// sys.contact.protocol" titulo="Contact" />

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
function InterfaceUI({ estadoScroll }) {
  const scrollRef = useRef(null)
  const secoesRef = useRef([])
  const [secaoAtiva, setSecaoAtiva] = useState('topo')

  const { scrollY } = useScroll({ container: scrollRef })
  // Véu de leitura: escurece a cena atrás do texto assim que sai do hero.
  const opacidadeVeu = useTransform(scrollY, [0, 520], [0, 1])

  useEffect(() => {
    secoesRef.current = Array.from(scrollRef.current?.querySelectorAll('section[id]') ?? [])
  }, [])

  // Posição fracionária de seção (0 = hero … 4 = contato): alimenta a
  // coreografia 3D (via ref, sem re-render por frame) e o destaque da nav.
  useMotionValueEvent(scrollY, 'change', (y) => {
    const secoes = secoesRef.current
    if (secoes.length < 2) return
    let posicao = secoes.length - 1
    for (let i = 0; i < secoes.length - 1; i += 1) {
      const inicio = secoes[i].offsetTop
      const fim = secoes[i + 1].offsetTop
      if (y < fim) {
        posicao = i + Math.max(0, (y - inicio) / (fim - inicio))
        break
      }
    }
    if (estadoScroll) estadoScroll.current.secao = posicao
    const indice = Math.min(secoes.length - 1, Math.floor(posicao + 0.4))
    setSecaoAtiva(secoes[indice].id) // mesmo valor => React ignora
  })

  // Rolagem suave fica no CSS (scroll-behavior) — que também
  // respeita prefers-reduced-motion via media query.
  const irPara = (id) => {
    document.getElementById(id)?.scrollIntoView({ block: 'start' })
  }

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
      <motion.div className="veu-leitura" style={{ opacity: opacidadeVeu }} aria-hidden="true" />

      {/* Container de scroll: pointer-events AUTO é obrigatório para a
          wheel funcionar. O parallax não sofre — ele escuta a window. */}
      <div ref={scrollRef} style={E.uiScroll} className="ui-scroll">
        <SecaoHero irPara={irPara} />
        <SecaoSobre />
        <SecaoStack />
        <SecaoProjetos />
        <SecaoContato />
        <RodapeHud />
      </div>

      {/* Cabeçalho fixo: logo + âncoras (vira barra inferior no mobile) */}
      <header className="cabecalho">
        <button
          type="button"
          className="logo"
          onClick={() => irPara('topo')}
          data-umami-event="Header-Logo-Click"
        >
          {'DYONE.DEV //'}
        </button>

        <nav className="nav" aria-label="Seções">
          {NAV_ANCORAS.map((item) => (
            <button
              key={item.id}
              type="button"
              className="nav-botao"
              onClick={() => irPara(item.id)}
              data-umami-event={item.evento}
              aria-current={secaoAtiva === item.id ? 'true' : undefined}
            >
              <span className="nav-prefixo">{'// '}</span>
              {item.rotulo.replace('// ', '')}
            </button>
          ))}
        </nav>
      </header>

      {/* Status bar fixa (só em telas com mouse/teclado) */}
      <footer className="status-barra">
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
  const estadoScroll = useRef({ secao: 0 })

  return (
    <>
      <style>{CSS_GLOBAL}</style>
      <div style={E.camada3d}>
        <Cena3D estadoScroll={estadoScroll} />
      </div>
      <InterfaceUI estadoScroll={estadoScroll} />
    </>
  )
}

/* ============================================================
   ESTILOS — objetos inline + CSS global (layout e responsivo)
   Tokens (cores, fontes, escala) vivem em src/index.css (:root).
   Escala tipográfica: mínimo 12px (0.75rem); texto corrido 16px.
   ============================================================ */
const FONTE_TITULO = "'Orbitron', sans-serif"
const FONTE_TEXTO = "'Space Grotesk', system-ui, sans-serif"

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

  /* ---------- hero ---------- */
  overline: {
    fontSize: '0.75rem',
    fontWeight: 600,
    letterSpacing: '0.32em',
    textTransform: 'uppercase',
    color: NEON_CIANO,
    textShadow: '0 0 10px rgba(0, 255, 255, 0.55)',
  },
  cursorPiscante: {
    color: NEON_MAGENTA,
    textShadow: '0 0 14px rgba(255, 0, 255, 0.7)',
    animation: 'piscar 1.1s steps(2) infinite',
  },
  heroSubtitulo: {
    fontSize: 'clamp(0.875rem, 1.5vw, 1.0625rem)',
    fontWeight: 500,
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: NEON_MAGENTA,
    textShadow: '0 0 12px rgba(255, 0, 255, 0.55)',
    margin: 0,
  },
  heroResumo: {
    fontFamily: FONTE_TEXTO,
    fontSize: 'clamp(1rem, 1.3vw, 1.125rem)',
    lineHeight: 1.6,
    color: 'rgba(230, 235, 245, 0.8)',
    maxWidth: '44ch',
    margin: '20px 0 0',
  },

  /* ---------- console (about) ---------- */
  consoleBloco: {
    borderLeft: '2px solid rgba(0, 255, 255, 0.35)',
    paddingLeft: 24,
    maxWidth: '56ch',
  },
  consolePrompt: {
    fontSize: '0.75rem',
    letterSpacing: '0.06em',
    color: 'rgba(230, 235, 245, 0.5)',
    margin: '0 0 16px',
  },
  consoleTexto: {
    fontFamily: FONTE_TEXTO,
    fontSize: 'clamp(1rem, 1.25vw, 1.125rem)',
    lineHeight: 1.7,
    color: 'rgba(230, 235, 245, 0.86)',
    margin: 0,
  },

  /* ---------- tech stack (cards holográficos) ---------- */
  stackGrade: {
    display: 'grid',
    // 2 colunas na lateral esquerda; colapsa para 1 em telas estreitas
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: 16,
    width: '100%',
  },
  stackCard: {
    position: 'relative',
    overflow: 'hidden', // contém filete, varredura e bracket no raio do card
    backgroundColor: 'rgba(0, 0, 0, 0.45)', // (backgroundImage com tint vem por card)
    WebkitBackdropFilter: 'blur(8px)',
    backdropFilter: 'blur(8px)',
    borderWidth: 1,
    borderStyle: 'solid', // borderColor vem por card (ciano/magenta)
    borderRadius: 8,
    padding: '20px 20px 24px',
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
    top: 18,
    right: 18,
    fontSize: '0.75rem',
    letterSpacing: '0.1em',
    opacity: 0.75,
    textShadow: '0 0 8px currentcolor',
  },
  stackCategoria: {
    fontSize: '0.9375rem',
    fontWeight: 600,
    letterSpacing: '0.04em',
    lineHeight: 1.35,
    color: '#ffffff',
    margin: '0 0 14px',
    paddingRight: 36, // não colide com o índice
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomStyle: 'solid', // borderBottomColor neon 12% vem por card
  },
  stackChips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    listStyle: 'none',
    margin: 0,
    padding: 0,
  },
  stackChip: {
    fontSize: '0.75rem',
    letterSpacing: '0.03em',
    lineHeight: 1,
    padding: '6px 10px',
    borderRadius: 4,
    borderWidth: 1,
    borderStyle: 'solid', // borderColor/backgroundColor neon vêm por card
    color: 'rgba(205, 232, 238, 0.88)',
    whiteSpace: 'nowrap',
  },

  /* ---------- lista holograma (projetos) ---------- */
  listaHolo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12, // módulos independentes flutuando
    listStyle: 'none',
    margin: 0,
    padding: 0,
    width: '100%',
  },
  itemHolo: {
    display: 'flex',
    gap: 16,
    padding: '16px 16px 16px 20px',
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
    fontSize: '0.75rem',
    paddingTop: 7,
    opacity: 0.85,
    textShadow: '0 0 8px currentcolor',
  },
  itemNome: {
    fontFamily: FONTE_TITULO,
    fontWeight: 700,
    fontSize: 'clamp(1.125rem, 2.1vw, 1.5rem)', // nome em destaque grande
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    lineHeight: 1.2,
    color: 'rgba(255, 255, 255, 0.86)', // branco translúcido em repouso
    margin: '0 0 10px',
  },
  itemTags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
  },
  itemTag: {
    fontSize: '0.75rem',
    letterSpacing: '0.03em',
    lineHeight: 1,
    padding: '5px 8px',
    borderRadius: 4,
    borderWidth: 1,
    borderStyle: 'solid', // borderColor neon 35% vem por item
    background: 'transparent',
    color: 'rgba(205, 232, 240, 0.86)',
    whiteSpace: 'nowrap',
  },
  itemExpansao: {
    height: 0, // framer expande para 'auto' no hover
    opacity: 0,
    overflow: 'hidden',
  },
  itemExpansaoAberta: {
    height: 'auto', // toque não tem hover: detalhes sempre visíveis
    opacity: 1,
    overflow: 'hidden',
  },
  itemExpansaoConteudo: {
    paddingTop: 14, // padding no conteúdo interno (height anima limpo)
  },
  itemExpansaoTopo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  itemSetinha: {
    display: 'inline-block', // necessário p/ transform animar em span
    fontSize: '0.8125rem',
    opacity: 0.6,
  },
  itemTipo: {
    display: 'inline-block',
    fontSize: '0.75rem',
    fontWeight: 600,
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
  },
  itemDescricao: {
    fontFamily: FONTE_TEXTO,
    fontSize: '0.9375rem',
    lineHeight: 1.6,
    color: 'rgba(226, 232, 244, 0.74)',
    maxWidth: '54ch',
    margin: 0,
  },

  /* ---------- contato (janela de terminal HUD) ---------- */
  painelTransmissao: {
    width: 'min(560px, 100%)',
    backgroundColor: 'rgba(5, 6, 10, 0.55)',
    WebkitBackdropFilter: 'blur(10px)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(0, 255, 255, 0.18)', // acende via :focus-within
    borderRadius: 8,
    overflow: 'hidden',
  },
  terminalBarra: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '12px 16px',
    background: 'rgba(0, 255, 255, 0.04)',
    borderBottom: '1px solid rgba(0, 255, 255, 0.14)',
  },
  terminalLuz: {
    width: 8,
    height: 8,
    borderRadius: 2,
    display: 'inline-block',
    flexShrink: 0,
  },
  terminalTitulo: {
    marginLeft: 6,
    fontSize: '0.75rem',
    letterSpacing: '0.08em',
    color: 'rgba(230, 235, 245, 0.65)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  terminalStatus: {
    marginLeft: 'auto',
    fontSize: '0.75rem',
    letterSpacing: '0.08em',
    whiteSpace: 'nowrap',
    color: 'rgba(0, 255, 255, 0.7)',
    textShadow: '0 0 8px rgba(0, 255, 255, 0.35)',
  },
  formularioHud: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    width: '100%',
    padding: '16px 20px 20px',
  },
  formularioLinha: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr', // colapsa via .linha-campos no mobile
    gap: 16,
  },
  campoRotulo: {
    display: 'block',
    fontSize: '0.75rem',
    letterSpacing: '0.14em',
    color: 'rgba(0, 255, 255, 0.8)',
    textShadow: '0 0 8px rgba(0, 255, 255, 0.35)',
    margin: '8px 0 8px',
  },
  campoHud: {
    width: '100%',
    minHeight: 44,
    background: 'rgba(0, 0, 0, 0.25)',
    border: '1px solid rgba(255, 255, 255, 0.18)', // foco neon via .campo-hud:focus
    borderRadius: 4,
    padding: '10px 12px',
    fontFamily: 'inherit',
    fontSize: '1rem', // 16px: abaixo disso o iOS dá zoom ao focar
    color: '#e6ebf5',
    caretColor: NEON_CIANO,
  },
  botaoConexao: {
    width: '100%', // botão de "executar" da janela de terminal
    minHeight: 48,
    marginTop: 16,
    padding: '13px 20px',
    backgroundColor: 'rgba(0, 255, 255, 0)', // hover anima p/ 8%
    border: '1px solid rgba(0, 255, 255, 0.55)',
    borderRadius: 4,
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '0.8125rem',
    fontWeight: 600,
    letterSpacing: '0.16em',
    textAlign: 'center',
    color: NEON_CIANO,
  },
  statusEnvio: {
    minHeight: 20, // reserva espaço: feedback não desloca o layout
    margin: '8px 0 0',
    fontSize: '0.8125rem',
    lineHeight: 1.5,
    letterSpacing: '0.04em',
    color: 'rgba(0, 255, 255, 0.85)',
  },
  statusEnvioErro: {
    color: 'rgba(255, 110, 210, 0.95)',
  },
  contatoCanais: {
    marginTop: 32,
  },
  canaisLabel: {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: 600,
    letterSpacing: '0.24em',
    color: 'rgba(255, 0, 255, 0.8)',
    textShadow: '0 0 10px rgba(255, 0, 255, 0.4)',
    marginBottom: 4,
  },
  contatoLinks: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 24,
  },
  contatoLink: {
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: 44, // alvo de toque confortável
    background: 'none',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '0.875rem',
    letterSpacing: '0.12em',
    color: 'rgba(230, 235, 245, 0.7)',
    textDecoration: 'none',
  },

  /* ---------- rodapé HUD ---------- */
  rodape: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    width: '100%',
    // padding-bottom extra: o conteúdo flutua acima da status bar fixa
    padding: '24px clamp(20px, 4vw, 56px) 64px',
    borderTop: '1px solid rgba(0, 255, 255, 0.2)', // hairline ciano 20%
    backgroundColor: 'rgba(5, 6, 10, 0.2)', // glass quase imperceptível
    WebkitBackdropFilter: 'blur(6px)',
    backdropFilter: 'blur(6px)',
    fontSize: '0.75rem',
    letterSpacing: '0.08em',
  },
  rodapeCopyright: {
    color: 'rgba(230, 235, 245, 0.5)',
    textTransform: 'lowercase',
  },
  rodapeStatus: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    color: 'rgba(230, 235, 245, 0.6)',
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
    minHeight: 44,
    background: 'none',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '0.75rem',
    letterSpacing: '0.12em',
    color: 'rgba(230, 235, 245, 0.65)',
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
    fontSize: '0.75rem',
    letterSpacing: '0.06em',
    lineHeight: 1.6,
    color: 'rgba(230, 235, 245, 0.55)',
  },
}

/* ============================================================
   CSS global — layout das seções, hero, nav, botões e responsivo
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

  @keyframes deslizar {
    0% { transform: translateX(-110%); }
    100% { transform: translateX(260%); }
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

  /* ---------- véu de leitura (aparece ao sair do hero) ---------- */
  .veu-leitura {
    position: fixed;
    inset: 0;
    z-index: 6;
    pointer-events: none;
    background: linear-gradient(
      90deg,
      rgba(5, 5, 5, 0.8) 0%,
      rgba(5, 5, 5, 0.55) 36%,
      transparent 62%
    );
  }

  /* ---------- seções: telas de 100svh, coluna à esquerda ---------- */
  .secao {
    position: relative;
    min-height: 100svh;
    width: min(680px, 56vw);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    padding: clamp(96px, 14vh, 148px) 16px clamp(72px, 10vh, 112px) var(--gutter);
  }
  .secao > * { max-width: 100%; }

  .secao-rotulo {
    display: block;
    font-size: var(--fs-xs);
    font-weight: 600;
    letter-spacing: 0.26em;
    color: var(--ciano);
    text-shadow: 0 0 10px rgba(0, 255, 255, 0.55);
    margin-bottom: 12px;
  }
  .secao-rotulo--magenta {
    color: var(--magenta);
    text-shadow: 0 0 10px rgba(255, 0, 255, 0.55);
  }
  .secao-titulo {
    font-family: var(--fonte-titulo);
    font-weight: 700;
    font-size: clamp(1.625rem, 3.2vw, 2.375rem);
    line-height: 1.1;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    color: #ffffff;
    margin-bottom: 32px;
  }

  /* ---------- hero ---------- */
  .secao-hero { isolation: isolate; }
  .hero-conteudo {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    width: 100%;
  }
  .hero-titulo {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 20px 0 20px;
    font-family: var(--fonte-titulo);
    text-transform: uppercase;
  }
  .hero-ola {
    font-weight: 600;
    font-size: clamp(0.9375rem, 1.7vw, 1.375rem);
    letter-spacing: 0.32em;
    color: rgba(230, 235, 245, 0.72);
  }
  .hero-nome-linha {
    display: flex;
    align-items: baseline;
    white-space: nowrap;
    font-weight: 900;
    font-size: clamp(3.25rem, 8.6vw, 6.5rem);
    line-height: 0.95;
    letter-spacing: -0.01em;
  }
  .hero-nome {
    background: linear-gradient(100deg, #ffffff 0%, ${NEON_CIANO} 48%, ${NEON_MAGENTA} 100%);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    filter: drop-shadow(0 0 22px rgba(0, 255, 255, 0.3));
  }
  .hero-acoes {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 32px;
  }
  .hero-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    list-style: none;
    margin-top: 32px;
  }
  .hero-chip {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: var(--fs-xs);
    letter-spacing: 0.04em;
    line-height: 1;
    padding: 8px 12px;
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 999px;
    background: rgba(5, 6, 10, 0.45);
    color: rgba(230, 235, 245, 0.78);
  }
  .hero-chip::before {
    content: '';
    width: 5px;
    height: 5px;
    border-radius: 999px;
    background: var(--ciano);
    box-shadow: 0 0 8px var(--ciano);
  }

  .indicador-scroll {
    position: absolute;
    left: var(--gutter);
    bottom: 72px;
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: var(--fs-xs);
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: rgba(230, 235, 245, 0.5);
  }
  .indicador-linha {
    position: relative;
    width: 64px;
    height: 1px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.18);
  }
  .indicador-linha::after {
    content: '';
    position: absolute;
    inset: 0;
    width: 40%;
    background: var(--ciano);
    animation: deslizar 2.4s ease-in-out infinite;
  }

  /* ---------- botões ---------- */
  .botao {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 48px;
    padding: 0 24px;
    border-radius: 4px;
    border: 1px solid transparent;
    cursor: pointer;
    font-family: inherit;
    font-size: 0.8125rem;
    font-weight: 600;
    letter-spacing: 0.14em;
    transition: transform 0.12s ease-out, box-shadow 0.2s ease-out,
      background-color 0.2s ease-out, border-color 0.2s ease-out;
  }
  .botao:active { transform: scale(0.97); }
  .botao-primario {
    background: var(--ciano);
    color: #021316;
    box-shadow: 0 0 28px -8px var(--ciano);
  }
  .botao-fantasma {
    background: rgba(5, 6, 10, 0.4);
    border-color: rgba(0, 255, 255, 0.5);
    color: var(--ciano);
  }

  /* ---------- cabeçalho / nav ---------- */
  .cabecalho {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 30;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: max(14px, env(safe-area-inset-top)) clamp(20px, 4vw, 56px) 22px;
    background: linear-gradient(180deg, rgba(5, 5, 5, 0.86), rgba(5, 5, 5, 0));
    pointer-events: none; /* só os botões capturam clique */
  }
  .logo {
    pointer-events: auto;
    min-height: 44px;
    background: none;
    border: none;
    cursor: pointer;
    font-family: inherit;
    font-size: 0.8125rem;
    font-weight: 600;
    letter-spacing: 0.28em;
    color: #e6ebf5;
    text-shadow: 0 0 12px rgba(0, 255, 255, 0.35);
    transition: text-shadow 0.2s ease-out;
  }
  .logo:active { transform: scale(0.96); }
  .nav {
    display: flex;
    gap: clamp(12px, 2.2vw, 28px);
  }
  .nav-botao {
    pointer-events: auto;
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: 0 4px;
    background: none;
    border: none;
    cursor: pointer;
    font-family: inherit;
    font-size: var(--fs-xs);
    letter-spacing: 0.16em;
    color: rgba(230, 235, 245, 0.62);
    box-shadow: inset 0 -1px 0 transparent;
    transition: color 0.2s ease-out, box-shadow 0.2s ease-out;
  }
  .nav-botao:active { transform: scale(0.95); }
  .nav-botao[aria-current='true'] {
    color: var(--ciano);
    text-shadow: 0 0 10px rgba(0, 255, 255, 0.7);
    box-shadow: inset 0 -1px 0 rgba(0, 255, 255, 0.6);
  }

  /* ---------- status bar (desktop) ---------- */
  .status-barra {
    position: fixed;
    left: clamp(20px, 4vw, 56px);
    bottom: clamp(16px, 2.6vw, 28px);
    z-index: 30;
    font-size: var(--fs-xs);
    letter-spacing: 0.12em;
    color: rgba(230, 235, 245, 0.42);
    pointer-events: none;
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
    color: rgba(230, 235, 245, 0.38);
  }

  /* Janela de transmissão: acende quando qualquer campo recebe foco */
  .painel-transmissao {
    transition: border-color 0.3s ease, box-shadow 0.3s ease;
  }
  .painel-transmissao:focus-within {
    border-color: rgba(0, 255, 255, 0.55);
    box-shadow: 0 0 38px -14px ${NEON_CIANO};
  }

  button:disabled {
    opacity: 0.55;
    cursor: progress;
  }

  /* Hover só onde existe hover de verdade (no toque ele "gruda") */
  @media (hover: hover) and (pointer: fine) {
    .logo:hover { text-shadow: 0 0 18px ${NEON_CIANO}; }
    .nav-botao:hover { color: var(--ciano); }
    .botao-primario:hover {
      background: #7dffff;
      box-shadow: 0 0 36px -6px var(--ciano);
    }
    .botao-fantasma:hover {
      background: rgba(0, 255, 255, 0.1);
      border-color: var(--ciano);
      box-shadow: 0 0 26px -8px var(--ciano);
    }
  }

  /* A status bar cita mouse e teclado: some em telas de toque */
  @media (hover: none) {
    .status-barra { display: none; }
  }

  /* Mobile: nome/email empilham em 1 coluna */
  @media (max-width: 560px) {
    .linha-campos {
      grid-template-columns: 1fr !important;
      gap: 0 !important;
    }
  }

  /* ---------- mobile: texto em largura total, personagem ao fundo ---------- */
  @media (max-width: 760px) {
    .secao {
      width: 100%;
      padding: 96px max(20px, env(safe-area-inset-right)) 72px
        max(20px, env(safe-area-inset-left));
    }
    .secao-titulo { margin-bottom: 24px; }

    /* Hero: personagem ocupa o topo; o texto assenta na base sobre degradê */
    .secao-hero {
      justify-content: flex-end;
      padding-bottom: calc(104px + env(safe-area-inset-bottom, 0px));
    }
    .secao-hero::before {
      content: '';
      position: absolute;
      inset: 24% 0 0 0;
      z-index: -1;
      pointer-events: none;
      background: linear-gradient(180deg, transparent, rgba(5, 5, 5, 0.72) 22%, rgba(5, 5, 5, 0.92) 50%);
    }
    .hero-titulo { margin: 16px 0 16px; }
    .hero-nome-linha { font-size: clamp(3rem, 16vw, 5rem); }
    .hero-acoes { margin-top: 24px; width: 100%; flex-wrap: nowrap; }
    .hero-acoes .botao { flex: 1 1 0; padding: 0 12px; white-space: nowrap; }
    .hero-chips { margin-top: 24px; }
    .indicador-scroll { display: none; }

    /* Fora do hero o véu cobre a tela toda para o texto ficar legível */
    .veu-leitura { background: rgba(5, 5, 5, 0.82); }

    /* Nav vira barra inferior, ao alcance do polegar */
    .nav {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      gap: 0;
      padding: 0 8px env(safe-area-inset-bottom, 0px);
      background: rgba(5, 6, 10, 0.86);
      -webkit-backdrop-filter: blur(14px);
      backdrop-filter: blur(14px);
      border-top: 1px solid rgba(0, 255, 255, 0.16);
      pointer-events: auto;
    }
    .nav-botao {
      flex: 1;
      justify-content: center;
      min-height: 56px;
      letter-spacing: 0.08em;
      box-shadow: inset 0 2px 0 transparent;
    }
    .nav-botao[aria-current='true'] {
      box-shadow: inset 0 2px 0 var(--ciano);
    }
    .nav-prefixo { display: none; }
    .status-barra { display: none; }

    .rodape-hud {
      flex-direction: column !important;
      align-items: center !important;
      text-align: center;
      gap: 8px !important;
      padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px)) !important;
    }
  }

  /* Telas baixas: enxuga o hero para o personagem continuar visível */
  @media (max-width: 760px) and (max-height: 720px) {
    .hero-chips { display: none; }
  }

  @media (prefers-reduced-motion: reduce) {
    * { animation: none !important; }
    .ui-scroll { scroll-behavior: auto; }
  }
`
