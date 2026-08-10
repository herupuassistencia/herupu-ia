#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Deploy do app VIDRAP em VPS Contabo (Ubuntu/Debian + Nginx + Let's Encrypt).
# Rode ESTE script NO SEU VPS, via SSH. Nenhuma credencial passa por terceiros.
#
#   1) Ajuste as 3 variáveis abaixo (DOMAIN, EMAIL e como obter os arquivos).
#   2) chmod +x deploy-contabo.sh && sudo ./deploy-contabo.sh
#
# Pré-requisito de DNS: crie um registro A do seu subdomínio apontando para o
# IP do VPS ANTES de rodar (o Let's Encrypt precisa resolver o domínio).
# ---------------------------------------------------------------------------
set -euo pipefail

# ===== AJUSTE AQUI =========================================================
DOMAIN="app.vidrap.com.br"          # subdomínio que vai servir o app
EMAIL="seu-email@dominio.com"        # e-mail para o certificado SSL
WEBROOT="/var/www/vidrap"            # pasta pública no servidor
# Origem dos arquivos do app (escolha UMA das formas na seção "OBTER ARQUIVOS")
SRC="/opt/vidrap-src/sistema-vidracaria"
# ===========================================================================

echo ">> Publicando ${DOMAIN}"

# 1) Copia o app para o webroot
sudo mkdir -p "$WEBROOT"
sudo cp -r "${SRC}/." "$WEBROOT/"
sudo chown -R www-data:www-data "$WEBROOT"

# 2) Configura o site no Nginx
sudo tee /etc/nginx/sites-available/vidrap >/dev/null <<NGINX
server {
    listen 80;
    server_name ${DOMAIN};
    root ${WEBROOT};
    index index.html;

    # PWA: não cachear o service worker (para atualizações chegarem rápido)
    location = /sw.js { add_header Cache-Control "no-cache"; }
    location = /manifest.webmanifest { default_type application/manifest+json; }

    location / { try_files \$uri \$uri/ /index.html; }
}
NGINX
sudo ln -sf /etc/nginx/sites-available/vidrap /etc/nginx/sites-enabled/vidrap
sudo nginx -t && sudo systemctl reload nginx

# 3) HTTPS (obrigatório para instalar como app / PWA)
if ! command -v certbot >/dev/null 2>&1; then
  sudo apt-get update && sudo apt-get install -y certbot python3-certbot-nginx
fi
sudo certbot --nginx -d "${DOMAIN}" -m "${EMAIL}" --agree-tos --redirect -n

echo ">> Pronto! Acesse: https://${DOMAIN}"
echo ">> No celular do Haroldo: abrir o link e 'Adicionar à tela inicial'."

# ---------------------------------------------------------------------------
# OBTER ARQUIVOS (rode uma vez, antes deste script, para preencher \$SRC):
#
#  A) Enviando do seu computador (mais simples, repositório privado):
#       rsync -avz ./sistema-vidracaria/  usuario@IP_DO_VPS:/opt/vidrap-src/sistema-vidracaria/
#     (ou use scp -r ./sistema-vidracaria usuario@IP_DO_VPS:/opt/vidrap-src/)
#
#  B) Clonando no VPS (repo privado precisa de token ou deploy key):
#       sudo git clone -b claude/sistema-vidracaria-w3dw2m \
#         https://github.com/herupuassistencia/herupu-ia.git /opt/vidrap-src-repo
#       ln -s /opt/vidrap-src-repo/sistema-vidracaria /opt/vidrap-src/sistema-vidracaria
#
# ATUALIZAR depois (nova versão): repita o passo de OBTER ARQUIVOS e rode:
#       sudo cp -r /opt/vidrap-src/sistema-vidracaria/. /var/www/vidrap/
# ---------------------------------------------------------------------------
