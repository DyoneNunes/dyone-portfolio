/**
 * ============================================================
 *  CONTEÚDO DO SITE — fonte única
 * ------------------------------------------------------------
 *  Usado pela interface (src/App.jsx) e pelo plugin
 *  vite-plugin-legivel-ia.js, que gera a versão em texto para
 *  buscadores e IAs (HTML estático, JSON-LD e /llms.txt).
 *  Editou aqui, atualiza nos dois lugares.
 *  Só dados: nada de React nem de API de navegador neste arquivo.
 * ============================================================
 */
export const SITE_URL = 'https://dyonedev.com.br'
export const NOME = 'Dyone Nunes Andrade'
export const CARGO = 'Desenvolvedor Fullstack e DevOps'
export const LOCAL = 'Vitória, ES, Brasil'

export const HERO_RESUMO =
  'Co-founder e CTO da Quilombus Network. Construo ecossistemas escaláveis com React, FastAPI, Docker e Neo4j.'
export const HERO_CHIPS = ['CTO @ Quilombus Network', '9+ anos de código', 'Vitória, ES']

export const meusProjetos = [
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
    id: 7,
    nome: 'Skills Router',
    descricao:
      'Servidor MCP + meta-skill que indexa, busca e carrega skills de agentes de IA sob demanda, sem estourar a janela de contexto.',
    tipo: 'Open Source / IA',
    url: 'https://github.com/DyoneNunes/mcp-manage-router-skill',
    evento: 'Projeto-SkillsRouter-Click',
    tags: ['Python', 'MCP', 'FastMCP', 'uv'],
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

export const TEXTO_SOBRE =
  'Co-founder e CTO da Quilombus Network. Mais de 9 anos escrevendo código e 5 anos moldando infraestruturas de mercado. Focado em ecossistemas escaláveis com React, FastAPI, Docker e Neo4j. Estudante de Análise e Desenvolvimento de Sistemas.'

export const techStacks = [
  { categoria: 'Frontend & Mobile', tecnologias: 'HTML5, CSS3, JS, TS, React 19, Next.js 15, React Native, Flet, Tailwind, Vite' },
  { categoria: 'Backend & Alta Performance', tecnologias: 'Python (FastAPI), Node.js 18, C++20, gRPC, Protobuf, POSIX SHM, WebSockets' },
  { categoria: 'Bancos de Dados & ORM', tecnologias: 'PostgreSQL, Redis, Neo4j, Qdrant, ChromaDB, Prisma' },
  { categoria: 'IA & Eng. de Prompts', tecnologias: 'LangGraph, LangChain, MCP Node, Ollama, Gemini API, Chainlit, Langfuse' },
  { categoria: 'Infraestrutura, DevOps & Redes', tecnologias: 'Ubuntu, Linux Server, MacOS, Windows, Docker, Kubernetes, Terraform, GitHub Actions, Proxmox, Tailscale' },
]

export const minhasRedes = [
  { rotulo: '[ github ]', url: 'https://github.com/DyoneNunes', evento: 'Contato-GitHub-Click' },
  { rotulo: '[ linkedin ]', url: 'https://www.linkedin.com/in/dyone-andrade-0340462b6/', evento: 'Contato-LinkedIn-Click' },
]
