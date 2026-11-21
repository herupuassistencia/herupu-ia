#!/usr/bin/env bash
# Instala/atualiza os PWAs HERUPU Cliente e HERUPU Técnico no servidor.
#  - copia os arquivos para /var/www/herupu-cliente e /var/www/herupu-tecnico
#  - cria os sites no nginx (repassando /v2, /socket.io e /uploads para a API na porta 4000)
#  - liga o HTTPS com certbot (precisa do DNS dos subdomínios apontando para este servidor)
set -e
DIR="$(cd "$(dirname "$0")/.." && pwd)"
DOMINIO="herupusistemas.com.br"
API="http://127.0.0.1:4000"

for APP in cliente tecnico; do
  HOST="$APP.$DOMINIO"
  DEST="/var/www/herupu-$APP"
  echo "==> $HOST"
  mkdir -p "$DEST"
  rm -rf "$DEST".novo && cp -r "$DIR/dist/$APP" "$DEST".novo
  rm -rf "$DEST".antigo && mv "$DEST" "$DEST".antigo && mv "$DEST".novo "$DEST"
  rm -rf "$DEST".antigo
  chown -R www-data:www-data "$DEST"

  CONF="/etc/nginx/sites-available/herupu-$APP"
  if [ ! -f "$CONF" ]; then
    cat > "$CONF" <<NGINX
server {
  listen 80;
  server_name $HOST;
  root $DEST;
  index index.html;
  client_max_body_size 50m;

  location /v2/ {
    proxy_pass $API;
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
  }
  location /socket.io/ {
    proxy_pass $API;
    proxy_http_version 1.1;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host \$host;
    proxy_read_timeout 3600s;
  }
  location /uploads/ {
    proxy_pass $API;
  }
  # o service worker e o index nunca ficam em cache (senão o app não atualiza)
  location = /sw.js { add_header Cache-Control "no-cache"; try_files \$uri =404; }
  location = /firebase-messaging-sw.js { add_header Cache-Control "no-cache"; try_files \$uri =404; }
  location = /firebase-config.js { add_header Cache-Control "no-cache"; try_files \$uri =404; }
  location = /index.html { add_header Cache-Control "no-cache"; }
  location /assets/ { expires 1y; add_header Cache-Control "public, immutable"; }
  location / { try_files \$uri \$uri/ /index.html; }
}
NGINX
    ln -sf "$CONF" "/etc/nginx/sites-enabled/herupu-$APP"
    NOVO_SITE=1
  fi
done

if ! nginx -t; then
  echo "!! Configuração do nginx com erro — removendo os sites novos para não afetar os outros sistemas."
  [ -n "$NOVO_SITE" ] && rm -f /etc/nginx/sites-enabled/herupu-cliente /etc/nginx/sites-enabled/herupu-tecnico \
    /etc/nginx/sites-available/herupu-cliente /etc/nginx/sites-available/herupu-tecnico
  exit 1
fi
systemctl reload nginx
echo "==> nginx ok"

# HTTPS (só na primeira vez; precisa do DNS já apontado)
for APP in cliente tecnico; do
  HOST="$APP.$DOMINIO"
  if ! grep -q "listen 443" "/etc/nginx/sites-available/herupu-$APP"; then
    if getent hosts "$HOST" >/dev/null; then
      certbot --nginx -d "$HOST" --non-interactive --agree-tos --redirect --register-unsafely-without-email || echo "!! certbot falhou para $HOST"
    else
      echo "!! $HOST ainda não aponta para este servidor (DNS). Crie o registro no registro.br e rode este script de novo."
    fi
  fi
done

echo
echo "==> Teste da API pelos novos endereços:"
for APP in cliente tecnico; do
  printf "  %s: " "$APP"; curl -s -m 8 "https://$APP.$DOMINIO/v2/health" || curl -s -m 8 -H "Host: $APP.$DOMINIO" http://127.0.0.1/v2/health; echo
done
echo
echo "PRONTO:  https://cliente.$DOMINIO   e   https://tecnico.$DOMINIO"
