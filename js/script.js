// Data
const hardSkills = [
  { name: "Python", category: "Linguagem", icon: "code" },
  { name: "JavaScript", category: "Linguagem", icon: "code" },
  { name: "TypeScript", category: "Linguagem", icon: "code" },
  { name: "React", category: "Framework", icon: "code" },
  { name: "Java", category: "Linguagem", icon: "code" },
  { name: "C++", category: "Linguagem", icon: "code" },
  { name: "PostgreSQL", category: "Banco de Dados", icon: "database" },
  { name: "MySQL", category: "Banco de Dados", icon: "database" },
  { name: "Redis", category: "Banco de Dados", icon: "database" },
  { name: "Docker", category: "DevOps", icon: "cloud" },
  { name: "Git", category: "Ferramenta", icon: "terminal" },
  { name: "Linux Ubuntu", category: "Sistema", icon: "terminal" },
  { name: "Windows", category: "Sistema", icon: "terminal" },
  { name: "macOS", category: "Sistema", icon: "terminal" },
  { name: "CUDA 12.9", category: "GPU", icon: "zap" },
  { name: "AI Engineer", category: "Especialização", icon: "zap" },
  { name: "ML Engineer", category: "Especialização", icon: "zap" },
]

const softSkills = [
  { name: "Liderança", description: "Capacidade de guiar equipes e projetos" },
  { name: "Comunicação", description: "Habilidade para transmitir ideias claramente" },
  { name: "Resolução de Problemas", description: "Análise crítica e soluções criativas" },
  { name: "Trabalho em Equipe", description: "Colaboração efetiva em grupos" },
  { name: "Adaptabilidade", description: "Flexibilidade para mudanças e novos desafios" },
  { name: "Pensamento Crítico", description: "Avaliação objetiva de situações complexas" },
]

const projects = [
  {
    title: "API-Crud-RESTfull",
    description: "Esta é uma API CRUD RESTfull feita em PostgreSQL com controle de memória em cache com o Redis.",
    technologies: ["PostgreSQL", "Redis", "REST API"],
    github: "https://github.com/DyoneNunes/API-Crud-RESTfull",
    demo: "#",
    image: "assets/api-rest-database-interface.jpg",
  },
  {
    title: "QuilombusNetwork",
    description: "Website para instituição de desenvolvimento e engenharia de LLMs/IA.",
    technologies: ["JavaScript", "Web Development", "AI/ML"],
    github: "https://github.com/DyoneNunes/QuilombusNetwork",
    demo: "#",
    image: "assets/ai-network-website-interface.jpg",
  },
  {
    title: "Assistent-AI-Gemini-pro",
    description: "Assistente de IA utilizando o modelo Gemini Pro para processamento de linguagem natural.",
    technologies: ["Python", "Gemini AI", "NLP"],
    github: "https://github.com/DyoneNunes/Assistent-AI-Gemini-pro",
    demo: "#",
    image: "assets/ai-chatbot-interface.png",
  },
  {
    title: "CRM-ReactJS",
    description: "Sistema de gerenciamento de relacionamento com cliente desenvolvido em React.js.",
    technologies: ["JavaScript", "React", "CRM"],
    github: "https://github.com/DyoneNunes/CRM-ReactJS",
    demo: "#",
    image: "assets/crm-dashboard-interface.png",
  },
  {
    title: "Avengers-GenAI-API",
    description: "API de inteligência artificial generativa com temática dos Vingadores.",
    technologies: ["Python", "GenAI", "API"],
    github: "https://github.com/DyoneNunes/Avengers-GenAI-API",
    demo: "#",
    image: "assets/superhero-ai-api-interface.jpg",
  },
  {
    title: "Underground",
    description: "Website do projeto Underground com interface moderna e responsiva.",
    technologies: ["TypeScript", "Web Development"],
    github: "https://github.com/DyoneNunes/Underground",
    demo: "#",
    image: "assets/underground-project-website.jpg",
  },
  {
    title: "Stress-monitor-app",
    description: "Aplicativo para monitoramento de níveis de estresse com análise em tempo real.",
    technologies: ["JavaScript", "Health Tech", "Monitoring"],
    github: "https://github.com/DyoneNunes/Stress-monitor-app",
    demo: "#",
    image: "assets/health-monitoring-app-interface.png",
  },
  {
    title: "Nearby",
    description: "Aplicativo para descobrir locais próximos com funcionalidades de geolocalização.",
    technologies: ["TypeScript", "Mobile", "Geolocation"],
    github: "https://github.com/DyoneNunes/Nearby",
    demo: "#",
    image: "assets/location-discovery-mobile-app.jpg",
  },
]

// Icon SVGs
const icons = {
  code: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16,18 22,12 16,6"/><polyline points="8,6 2,12 8,18"/></svg>',
  database:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>',
  terminal:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4,17 10,11 4,5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>',
  cloud:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>',
  zap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"/></svg>',
  github:
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>',
  external:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15,3 21,3 21,9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>',
}

// DOM Elements
let activeSection = "home"
let isMenuOpen = false

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  initializeNavigation()
  initializeScrollTracking()
  populateSkills()
  populateProjects()
  initializeContactForm()
  initializeAnimations()
})

// Navigation
function initializeNavigation() {
  const mobileMenuBtn = document.querySelector(".mobile-menu-btn")
  const mobileMenu = document.querySelector(".mobile-menu")
  const navLinks = document.querySelectorAll(".nav-link, .mobile-nav-link")
  const heroButtons = document.querySelectorAll(".hero-buttons .btn")

  // Mobile menu toggle
  mobileMenuBtn.addEventListener("click", () => {
    isMenuOpen = !isMenuOpen
    mobileMenu.classList.toggle("active", isMenuOpen)

    // Animate hamburger
    const hamburger = mobileMenuBtn.querySelector(".hamburger")
    hamburger.style.transform = isMenuOpen ? "rotate(45deg)" : "rotate(0deg)"
  })

  // Navigation links
  navLinks.forEach((link) => {
    link.addEventListener("click", function () {
      const section = this.getAttribute("data-section")
      scrollToSection(section)
    })
  })

  // Hero buttons
  heroButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const section = this.getAttribute("data-section")
      if (section) {
        scrollToSection(section)
      }
    })
  })
}

function scrollToSection(sectionId) {
  const element = document.getElementById(sectionId)
  if (element) {
    element.scrollIntoView({ behavior: "smooth" })
  }

  // Close mobile menu
  if (isMenuOpen) {
    isMenuOpen = false
    document.querySelector(".mobile-menu").classList.remove("active")
    const hamburger = document.querySelector(".hamburger")
    hamburger.style.transform = "rotate(0deg)"
  }
}

// Scroll tracking
function initializeScrollTracking() {
  window.addEventListener("scroll", () => {
    const sections = ["home", "about", "skills", "projects", "contact"]
    const scrollPosition = window.scrollY + 100

    for (const section of sections) {
      const element = document.getElementById(section)
      if (element) {
        const offsetTop = element.offsetTop
        const offsetHeight = element.offsetHeight

        if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
          if (activeSection !== section) {
            activeSection = section
            updateActiveNavLink(section)
          }
          break
        }
      }
    }
  })
}

function updateActiveNavLink(section) {
  const navLinks = document.querySelectorAll(".nav-link")
  navLinks.forEach((link) => {
    link.classList.remove("active")
    if (link.getAttribute("data-section") === section) {
      link.classList.add("active")
    }
  })
}

// Populate skills
function populateSkills() {
  console.log("[v0] Starting populateSkills function")

  const hardSkillsContainer = document.getElementById("hardSkills")
  const softSkillsContainer = document.getElementById("softSkills")

  if (!hardSkillsContainer) {
    console.error("[v0] hardSkills container not found!")
    return
  }

  if (!softSkillsContainer) {
    console.error("[v0] softSkills container not found!")
    return
  }

  console.log("[v0] Containers found successfully")
  console.log("[v0] Hard skills array:", hardSkills)
  console.log("[v0] Hard skills count:", hardSkills.length)

  hardSkillsContainer.innerHTML = ""
  softSkillsContainer.innerHTML = ""

  hardSkills.forEach((skill, index) => {
    console.log(`[v0] Processing skill ${index + 1}:`, skill.name, skill.category)

    const skillCard = document.createElement("div")
    skillCard.className = "skill-card"
    skillCard.innerHTML = `
            <div class="skill-icon">${icons[skill.icon] || icons.code}</div>
            <div class="skill-name">${skill.name}</div>
            <div class="skill-category">${skill.category}</div>
        `
    hardSkillsContainer.appendChild(skillCard)
    console.log(`[v0] Added skill card for: ${skill.name}`)
  })

  // Soft skills
  softSkills.forEach((skill, index) => {
    console.log(`[v0] Processing soft skill ${index + 1}:`, skill.name)

    const skillCard = document.createElement("div")
    skillCard.className = "soft-skill-card"
    skillCard.innerHTML = `
            <div class="soft-skill-name">${skill.name}</div>
            <div class="soft-skill-description">${skill.description}</div>
        `
    softSkillsContainer.appendChild(skillCard)
  })

  console.log("[v0] Skills population completed")
  console.log("[v0] Hard skills container children count:", hardSkillsContainer.children.length)
  console.log("[v0] Soft skills container children count:", softSkillsContainer.children.length)
}

// Populate projects
function populateProjects() {
  const projectsContainer = document.getElementById("projectsGrid")

  projects.forEach((project) => {
    const projectCard = document.createElement("div")
    projectCard.className = "project-card"
    projectCard.innerHTML = `
            <div class="project-image">
                <img src="${project.image}" alt="${project.title}" onerror="this.onerror=null;this.src='https://via.placeholder.com/400x225/1e293b/94a3b8?text=${encodeURIComponent(project.title)}'">
            </div>
            <div class="project-content">
                <div class="project-title">${project.title}</div>
                <div class="project-description">${project.description}</div>
                <div class="project-technologies">
                    ${project.technologies.map((tech) => `<span class="tech-badge">${tech}</span>`).join("")}
                </div>
                <div class="project-links">
                    <a href="${project.github}" target="_blank" class="project-link project-link-outline">
                        ${icons.github}
                        Código
                    </a>
                </div>
            </div>
        `
    projectsContainer.appendChild(projectCard)
  })
}

// Contact form
function initializeContactForm() {
  const contactForm = document.getElementById("contactForm")

  contactForm.addEventListener("submit", (e) => {
    e.preventDefault()

    const formData = new FormData(contactForm)
    const name = formData.get("name")
    const email = formData.get("email")
    const message = formData.get("message")

    // Simulate form submission
    const submitBtn = contactForm.querySelector('button[type="submit"]')
    const originalText = submitBtn.textContent

    submitBtn.textContent = "Enviando..."
    submitBtn.disabled = true

    setTimeout(() => {
      alert(`Obrigado, ${name}! Sua mensagem foi enviada com sucesso. Entrarei em contato em breve.`)
      contactForm.reset()
      submitBtn.textContent = originalText
      submitBtn.disabled = false
    }, 1500)
  })
}

// Animations
function initializeAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  }

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("fade-in-up")
        observer.unobserve(entry.target) // Stop observing after animation
      }
    })
  }, observerOptions)

  // Observe elements for animation
  const animatedElements = document.querySelectorAll(".card, .skill-card, .soft-skill-card, .project-card")
  animatedElements.forEach((el) => {
    el.style.opacity = "0" // Set initial state to invisible to prevent flash
    observer.observe(el)
  })
}

// Utility functions
function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Performance optimization
window.addEventListener(
  "scroll",
  debounce(() => {
    // Additional scroll-based animations can be added here
  }, 10),
)
