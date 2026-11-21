#!/usr/bin/env bash
# ERP HERUPU no celular: menu em gaveta, topo compacto, páginas sem corte e acentos corrigidos.
# Aplica só as diferenças (erp-mobile.patch), com backup, e reconstrói apenas o painel do ERP.
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
ERP=${ERP:-/opt/herupu/FRONTEND/herupu-erp-web}
DEPLOY=${DEPLOY:-/opt/herupu/DEPLOY}
CARIMBO=$(date +%Y%m%d-%H%M%S)
cd "$ERP"
if patch -p1 --binary -R --dry-run -s < "$DIR/erp-mobile.patch" >/dev/null 2>&1; then
  echo "==> o ajuste de celular já estava aplicado"
else
  tar czf "/root/erp-src-antes-mobile-$CARIMBO.tgz" src
  echo "==> backup: /root/erp-src-antes-mobile-$CARIMBO.tgz"
  patch -p1 --binary --dry-run < "$DIR/erp-mobile.patch" || { echo "!! os arquivos do ERP no servidor estão diferentes do esperado — nada foi alterado. Me mande esta saída."; exit 1; }
  patch -p1 --binary < "$DIR/erp-mobile.patch"
fi
echo "==> reconstruindo o painel do ERP (1 a 3 minutos)"
cd "$DEPLOY"
if ! docker compose -f docker-compose.prod.yml up -d --build erp; then
  echo "!! falhou — restaurando o código anterior"
  [ -f "/root/erp-src-antes-mobile-$CARIMBO.tgz" ] && (cd "$ERP" && rm -rf src && tar xzf "/root/erp-src-antes-mobile-$CARIMBO.tgz")
  docker compose -f docker-compose.prod.yml up -d --build erp
  exit 1
fi
echo "==> PRONTO: abra https://erp.herupusistemas.com.br no celular e recarregue a página"
