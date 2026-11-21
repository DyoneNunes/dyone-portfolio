#!/usr/bin/env bash
# =============================================================================
# update.bash — Atualização e deploy seguro do portfólio (dyonedev.com.br)
# =============================================================================
# Executa em 5 etapas:
#   1. Backup do PostgreSQL (leads do formulário de contato)
#   2. git pull, preservando alterações locais do servidor (stash → pull → pop)
#   3. Rebuild dos containers (build de produção do site dentro da imagem)
#   4. Healthcheck: site, API, /llms.txt e domínio público
#   5. Relatório final
#
# Uso:  ./update.bash
# Variáveis opcionais:
#   PORTA_LOCAL=8087                      porta do nginx no host
#   SITE_PUBLICO=https://dyonedev.com.br  vazio ("") pula a checagem pública
#   MANTER_BACKUPS=10                     quantos backups guardar
#   BACKUP_DIR=~/backups/dyone-portfolio  destino dos backups (fora do projeto)
# =============================================================================

set -euo pipefail

# Tudo dentro de main(): o bash lê o arquivo inteiro antes de executar, então
# o git pull pode atualizar este script no meio da execução sem quebrá-la.
main() {
  local ROOT
  ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  cd "$ROOT"

  local PORTA_LOCAL="${PORTA_LOCAL:-8087}"
  local SITE_PUBLICO="${SITE_PUBLICO-https://dyonedev.com.br}"
  local MANTER_BACKUPS="${MANTER_BACKUPS:-10}"
  local PG_CONTAINER="portfolio-postgres"

  local C_CYAN='\033[0;36m' C_GREEN='\033[0;32m' C_YELLOW='\033[1;33m' C_RED='\033[0;31m' C_RESET='\033[0m'
  log()  { printf "%b[INFO]%b  %s\n" "$C_CYAN" "$C_RESET" "$*"; }
  ok()   { printf "%b[OK]%b    %s\n" "$C_GREEN" "$C_RESET" "$*"; }
  warn() { printf "%b[WARN]%b  %s\n" "$C_YELLOW" "$C_RESET" "$*"; }
  die()  { printf "%b[ERRO]%b  %s\n" "$C_RED" "$C_RESET" "$*" >&2; exit 1; }

  printf '\n%b══════════════════════════════════════════════════════════════════%b\n' "$C_CYAN" "$C_RESET"
  printf '%b                 ATUALIZAÇÃO DO PORTFÓLIO 3D                      %b\n' "$C_CYAN" "$C_RESET"
  printf '%b══════════════════════════════════════════════════════════════════%b\n\n' "$C_CYAN" "$C_RESET"

  command -v docker >/dev/null || die "docker não encontrado"
  command -v git >/dev/null || die "git não encontrado"
  [ -f "$ROOT/docker-compose.yml" ] || die "docker-compose.yml não encontrado em $ROOT"

  # ── 1. BACKUP DO BANCO ─────────────────────────────────────────────────────
  log "1/5 — Backup do PostgreSQL"
  # FORA da pasta do projeto, de propósito: o dump contém dados dos leads
  # e não deve ir parar no contexto de build nem no repositório.
  local BACKUP_DIR="${BACKUP_DIR:-$HOME/backups/dyone-portfolio}"
  local BACKUP_FILE=""
  case "$BACKUP_DIR/" in "$ROOT"/*) die "BACKUP_DIR não pode ficar dentro do projeto ($ROOT): entraria no build da imagem." ;; esac
  mkdir -p "$BACKUP_DIR" && chmod 700 "$BACKUP_DIR"

  if docker ps --format '{{.Names}}' | grep -q "^${PG_CONTAINER}$"; then
    BACKUP_FILE="$BACKUP_DIR/portfolio_$(date +%Y%m%d_%H%M%S).sql.gz"
    # usuário e banco vêm do ambiente do próprio container (definidos no .env)
    if docker exec "$PG_CONTAINER" sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' | gzip -c > "$BACKUP_FILE" \
      && [ -s "$BACKUP_FILE" ] && gunzip -t "$BACKUP_FILE" 2>/dev/null; then
      chmod 600 "$BACKUP_FILE"
      ok "Backup salvo: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"
    else
      rm -f "$BACKUP_FILE"
      die "Backup do banco falhou — nada foi alterado. Verifique o container $PG_CONTAINER."
    fi
    # mantém só os N mais recentes
    ls -1t "$BACKUP_DIR"/portfolio_*.sql.gz 2>/dev/null | tail -n +"$((MANTER_BACKUPS + 1))" | xargs -r rm -f
  else
    warn "Container $PG_CONTAINER não está rodando — backup pulado."
  fi

  # ── 2. GIT PULL ────────────────────────────────────────────────────────────
  log "2/5 — Sincronizando o código (git pull)"
  local ANTES DEPOIS RAMO
  ANTES="$(git rev-parse HEAD)"
  RAMO="$(git rev-parse --abbrev-ref HEAD)"

  local TEM_STASH=0
  if ! git diff --quiet || ! git diff --cached --quiet; then
    warn "Alterações locais no servidor: guardando em stash para reaplicar depois"
    git --no-pager diff --stat | sed 's/^/        /'
    git stash push --quiet -m "update.bash $(date +%Y%m%d_%H%M%S)"
    TEM_STASH=1
  fi

  if ! git pull --ff-only --quiet origin "$RAMO"; then
    [ "$TEM_STASH" = 1 ] && git stash pop --quiet || true
    die "git pull falhou (sem fast-forward ou sem rede). Código local mantido como estava."
  fi
  DEPOIS="$(git rev-parse HEAD)"

  if [ "$TEM_STASH" = 1 ]; then
    if git stash pop --quiet 2>/dev/null; then
      ok "Alterações locais reaplicadas sobre o código novo"
    else
      # conflito: volta ao código do repositório; a alteração continua no stash
      git reset --hard --quiet HEAD
      warn "As alterações locais CONFLITAM com o código novo e não foram reaplicadas."
      warn "Elas continuam guardadas: veja 'git stash list' e 'git stash show -p'."
    fi
  fi

  if [ "$ANTES" = "$DEPOIS" ]; then
    ok "Código já estava atualizado ($(git rev-parse --short HEAD))"
  else
    ok "Atualizado: $(git rev-parse --short "$ANTES") → $(git rev-parse --short "$DEPOIS")"
    git --no-pager log --oneline "$ANTES..$DEPOIS" | sed 's/^/        /'
  fi

  # ── 3. REBUILD DOS CONTAINERS ──────────────────────────────────────────────
  log "3/5 — Rebuild e subida dos containers"
  # O site é um build estático dentro da imagem do nginx: o --build já o
  # refaz. Só o backend tem node_modules em volume anônimo, que o compose
  # reaproveita entre recriações — se as dependências mudaram, ele precisa
  # ser renovado, senão o container sobe com os pacotes antigos.
  local RENOVAR=()
  if [ "$ANTES" != "$DEPOIS" ]; then
    git diff --quiet "$ANTES" "$DEPOIS" -- backend/package.json backend/package-lock.json || RENOVAR+=(backend)
  fi

  # --remove-orphans: derruba containers de serviços que saíram do compose
  docker compose up -d --build --remove-orphans
  if [ "${#RENOVAR[@]}" -gt 0 ]; then
    log "  Dependências mudaram em: ${RENOVAR[*]} — renovando node_modules"
    docker compose up -d --no-deps --force-recreate --renew-anon-volumes "${RENOVAR[@]}"
  fi
  ok "Containers no ar"

  # ── 4. HEALTHCHECK ─────────────────────────────────────────────────────────
  log "4/5 — Verificando os serviços"
  local FALHAS=0

  # check_endpoint <nome> <url> [texto que o corpo deve conter]
  check_endpoint() {
    local nome="$1" url="$2" contem="${3:-}"
    local tentativas=30 espera=2 codigo="000" corpo i
    for i in $(seq 1 "$tentativas"); do
      corpo="$(curl -s --max-time 10 -w '\n%{http_code}' "$url" 2>/dev/null || true)"
      codigo="${corpo##*$'\n'}"
      if [ "$codigo" = "200" ] && { [ -z "$contem" ] || grep -qF -- "$contem" <<<"$corpo"; }; then
        ok "  $nome (HTTP 200)"
        return 0
      fi
      sleep "$espera"
    done
    warn "  $nome NÃO passou após $((tentativas * espera))s (HTTP $codigo) — $url"
    FALHAS=$((FALHAS + 1))
  }

  local BASE="http://127.0.0.1:${PORTA_LOCAL}"
  check_endpoint "Site (nginx)" "$BASE/" 'id="root"'
  check_endpoint "Build de produção" "$BASE/" '/assets/index-'
  check_endpoint "API de contato" "$BASE/api/saude"
  check_endpoint "llms.txt (IA)" "$BASE/llms.txt" "## Projetos"
  if [ -n "$SITE_PUBLICO" ]; then
    check_endpoint "Domínio público" "$SITE_PUBLICO/" 'id="root"'
  fi

  # ── 5. RELATÓRIO ───────────────────────────────────────────────────────────
  local COR="$C_GREEN"
  [ "$FALHAS" -gt 0 ] && COR="$C_RED"
  printf '\n%b══════════════════════════════════════════════════════════════════%b\n' "$COR" "$C_RESET"
  if [ "$FALHAS" -eq 0 ]; then
    ok "5/5 — Atualização do portfólio concluída"
  else
    warn "5/5 — Atualização aplicada, mas $FALHAS verificação(ões) falharam"
  fi
  echo "  • Diretório: $ROOT"
  echo "  • Versão:    $(git log -1 --format='%h %s')"
  echo "  • Backup:    ${BACKUP_FILE:-nenhum}"
  echo "  • Local:     $BASE"
  [ -n "$SITE_PUBLICO" ] && echo "  • Público:   $SITE_PUBLICO"
  if [ "$FALHAS" -gt 0 ]; then
    echo "  • Logs:      docker compose logs --tail=50 nginx backend"
  fi
  printf '%b══════════════════════════════════════════════════════════════════%b\n\n' "$COR" "$C_RESET"

  [ "$FALHAS" -eq 0 ]
}

main "$@"
exit $?
