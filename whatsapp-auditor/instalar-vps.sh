#!/usr/bin/env bash
# ============================================================
#  HERUPU JARVIS - Instalador do Auditor de WhatsApp (VPS Linux)
#  Instala e configura TUDO automaticamente. Rode uma vez.
#
#  Uso:
#    bash instalar-vps.sh
#  ou (baixando direto do GitHub):
#    curl -fsSL https://raw.githubusercontent.com/herupuassistencia/herupu-ia/main/whatsapp-auditor/instalar-vps.sh | bash
# ============================================================
set -e

SUDO=""
[ "$(id -u)" -ne 0 ] && SUDO="sudo"

log() { echo -e "\n\033[1;36m==> $1\033[0m"; }

log "1/6 Atualizando o sistema e instalando dependencias"
$SUDO apt-get update -y
$SUDO apt-get install -y git curl ffmpeg espeak-ng python3-pip \
  libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 \
  libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libpango-1.0-0 \
  libcairo2 libasound2 libatspi2.0-0 fonts-liberation

log "2/6 Instalando Whisper local (transcricao gratis)"
pip3 install -U openai-whisper 2>/dev/null || pip install -U openai-whisper

log "3/6 Instalando Node.js (se necessario)"
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | $SUDO -E bash -
  $SUDO apt-get install -y nodejs
fi
echo "Node: $(node -v)"

log "4/6 Instalando Claude CLI (se necessario)"
if ! command -v claude >/dev/null 2>&1; then
  curl -fsSL https://claude.ai/install.sh | bash || $SUDO npm install -g @anthropic-ai/claude-code
fi
export PATH="$HOME/.local/bin:$PATH"

log "5/6 Baixando/atualizando o projeto"
# Enquanto o PR nao e mergeado na main, usamos a branch de desenvolvimento.
BRANCH="${JARVIS_BRANCH:-claude/ola-mrew1b}"
REPO="https://github.com/herupuassistencia/herupu-ia.git"
DIR="$HOME/herupu-ia"
if [ -d "$DIR/.git" ]; then
  git -C "$DIR" fetch origin "$BRANCH"
  git -C "$DIR" checkout "$BRANCH"
  git -C "$DIR" pull --ff-only origin "$BRANCH" || true
else
  git clone -b "$BRANCH" "$REPO" "$DIR" || git clone "$REPO" "$DIR"
  git -C "$DIR" checkout "$BRANCH" 2>/dev/null || true
fi
cd "$DIR/whatsapp-auditor"

log "6/6 Configurando .env e instalando dependencias Node"
if [ ! -f .env ]; then
  cp .env.example .env
  echo ".env criado a partir do exemplo (numero e VOZ_SAIDA=whatsapp ja preenchidos)."
fi
# Puppeteer baixa o Chromium proprio no npm install; CHROME_PATH fica vazio.
export PUPPETEER_SKIP_DOWNLOAD=0
npm install --no-audit --no-fund

log "INSTALACAO CONCLUIDA. Faltam 2 passos interativos:"
cat <<'FIM'

  1) Logar o Claude (para a analise inteligente, mesmo plano):
       claude auth login
       claude -p "diga ok"        # deve responder: ok

  2) Iniciar e escanear o QR do WhatsApp:
       cd ~/herupu-ia/whatsapp-auditor
       node auditor.js            # escaneie o QR que aparecer

  Depois de funcionar, deixe rodando 24/7:
       npm install -g pm2
       pm2 start auditor.js --name jarvis-whatsapp
       pm2 save && pm2 startup

FIM
