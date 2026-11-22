#!/usr/bin/env bash
# HERUPU — preparação para o lançamento nacional
#  1) Backend: cobertura, lista de espera, aceite dos termos (LGPD), pedidos do titular e painel
#  2) ERP: tela "Lançamento" no menu
#  3) Apps Cliente e Técnico: termos, privacidade, lista de espera e origem do cadastro
# Faz backup de tudo e desfaz sozinho se o backend ou o ERP não subirem.
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
BACK=${BACK:-/opt/herupu/BACKEND}
ERP=${ERP:-/opt/herupu/FRONTEND/herupu-erp-web}
DEPLOY=${DEPLOY:-/opt/herupu/DEPLOY}
C=$(date +%Y%m%d-%H%M%S)
ROTAS=$BACK/src/v2/routes/index.js
[ -f "$ROTAS" ] || { echo "!! Não achei o backend em $BACK"; exit 1; }
[ -f "$ERP/src/App.jsx" ] || { echo "!! Não achei o ERP em $ERP"; exit 1; }

# ---------- 1. backend ----------
cp "$ROTAS" "$ROTAS.bak-$C"
[ -f "$BACK/src/v2/routes/lancamento.js" ] && cp "$BACK/src/v2/routes/lancamento.js" "$BACK/src/v2/routes/lancamento.js.bak-$C"
cp "$DIR/lancamento/lancamento.js" "$BACK/src/v2/routes/lancamento.js"
grep -q "require('./lancamento')" "$ROTAS" || \
  sed -i "s#^module.exports = router;#router.use(require('./lancamento'));   // lançamento nacional (cobertura, lista de espera, LGPD)\nmodule.exports = router;#" "$ROTAS"
grep -q "require('./lancamento')" "$ROTAS" || { echo "!! não consegui ligar as rotas"; cp "$ROTAS.bak-$C" "$ROTAS"; exit 1; }
echo "==> backup do backend: *.bak-$C"

desfaz_back() {
  echo "!! backend não subiu — voltando a versão anterior"
  cp "$ROTAS.bak-$C" "$ROTAS"
  if [ -f "$BACK/src/v2/routes/lancamento.js.bak-$C" ]; then cp "$BACK/src/v2/routes/lancamento.js.bak-$C" "$BACK/src/v2/routes/lancamento.js"; else rm -f "$BACK/src/v2/routes/lancamento.js"; fi
  cd "$DEPLOY" && docker compose -f docker-compose.prod.yml up -d --build backend
  exit 1
}
echo "==> reconstruindo o backend (1 a 3 minutos)"
(cd "$DEPLOY" && docker compose -f docker-compose.prod.yml up -d --build backend) || desfaz_back
for i in $(seq 1 40); do curl -s -m 3 http://127.0.0.1:4000/v2/health | grep -q '"ok":true' && break; sleep 3; done
curl -s -m 5 "http://127.0.0.1:4000/v2/cobertura?latitude=0.03&longitude=-51.06&categoria_id=2" | grep -q '"total"' || desfaz_back
echo "==> backend no ar com as novas funções"

# ---------- 2. ERP ----------
APPJ=$ERP/src/App.jsx; LAY=$ERP/src/layouts/MainLayout.jsx
cp "$APPJ" "$APPJ.bak-$C"; cp "$LAY" "$LAY.bak-$C"
cp "$DIR/lancamento/Lancamento.jsx" "$ERP/src/pages/Lancamento.jsx"
python3 - "$APPJ" "$LAY" <<'PY'
import re, sys
app, lay = sys.argv[1], sys.argv[2]
s = open(app, encoding='utf-8').read()
if 'pages/Lancamento' not in s:
    s = s.replace('import Tecnicos from "./pages/Tecnicos";', 'import Tecnicos from "./pages/Tecnicos";\nimport Lancamento from "./pages/Lancamento";', 1)
    s, n = re.subn(r'(\{\s*path:\s*"tecnicos",\s*element:\s*<Tecnicos\s*/>\s*\},)', r'\1\n      { path: "lancamento", element: <Lancamento /> },', s, count=1)
    if 'pages/Lancamento' not in s or n != 1: sys.exit('!! App.jsx: ponto de referência não encontrado')
    open(app, 'w', encoding='utf-8').write(s)
m = open(lay, encoding='utf-8').read()
if '"/lancamento"' not in m:
    m, n = re.subn(r'(path:\s*"/tecnicos"\s*\n\s*\},)', r'\1\n    {\n      name: "Lançamento",\n      icon: <BarChart3 size={18} />,\n      path: "/lancamento"\n    },', m, count=1)
    if n != 1: sys.exit('!! MainLayout.jsx: ponto de referência não encontrado')
    open(lay, 'w', encoding='utf-8').write(m)
print('==> tela "Lançamento" adicionada ao ERP')
PY
desfaz_erp() {
  echo "!! ERP não compilou — voltando a versão anterior"
  cp "$APPJ.bak-$C" "$APPJ"; cp "$LAY.bak-$C" "$LAY"; rm -f "$ERP/src/pages/Lancamento.jsx"
  cd "$DEPLOY" && docker compose -f docker-compose.prod.yml up -d --build erp
  exit 1
}
echo "==> reconstruindo o ERP (2 a 5 minutos)"
(cd "$DEPLOY" && docker compose -f docker-compose.prod.yml up -d --build erp) || desfaz_erp

# ---------- 3. apps ----------
echo "==> atualizando os apps Cliente e Técnico"
bash "$DIR/instalar.sh"

echo
echo "==> PRONTO."
echo "    Termos:      https://cliente.herupusistemas.com.br/legal/termos.html"
echo "    Privacidade: https://cliente.herupusistemas.com.br/legal/privacidade.html"
echo "    Painel:      ERP > menu Lançamento"
