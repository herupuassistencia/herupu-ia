#!/usr/bin/env bash
# HERUPU — ajuste do financeiro
#  1) Conferência automática no Asaas a cada 10 min (se o webhook falhar, o pagamento entra mesmo assim)
#  2) Trava contra crédito em dobro da mesma cobrança na carteira
#  3) ERP: o Chrome deixa de preencher senha salva nos campos de chave/token
# Faz backup e desfaz sozinho se algo não subir.
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
BACK=${BACK:-/opt/herupu/BACKEND}
ERP=${ERP:-/opt/herupu/FRONTEND/herupu-erp-web}
DEPLOY=${DEPLOY:-/opt/herupu/DEPLOY}
C=$(date +%Y%m%d-%H%M%S)
LANC=$BACK/src/v2/routes/lancamento.js
ASA=$BACK/src/v2/services/asaas.service.js
FIN=$ERP/src/pages/Financeiro.jsx
for f in "$LANC" "$ASA" "$FIN"; do [ -f "$f" ] || { echo "!! não achei $f"; exit 1; }; cp "$f" "$f.bak-$C"; done
echo "==> backup: *.bak-$C"

cp "$DIR/lancamento/lancamento.js" "$LANC"
python3 - "$ASA" "$FIN" <<'PY'
import sys
asa, fin = sys.argv[1], sys.argv[2]
s = open(asa, encoding='utf-8').read()
if '[sem-credito-duplo]' not in s:
    a = "    if (c?.os_id) {\n      // Marca OS como paga"
    if a not in s: sys.exit('!! asaas.service: ponto de referência não encontrado')
    s = s.replace(a, "    // [sem-credito-duplo] só credita uma vez por cobrança (webhook repetido, CONFIRMED + RECEIVED, conferência automática)\n    const jaCreditada = c ? (await pool.query(`SELECT 1 FROM plataforma_movimentacoes WHERE asaas_cobranca_id=$1 LIMIT 1`, [c.id])).rows.length > 0 : false;\n    if (c?.os_id && !jaCreditada) {\n      // Marca OS como paga", 1)
    open(asa, 'w', encoding='utf-8').write(s)
    print('==> trava contra crédito em dobro aplicada')
f = open(fin, encoding='utf-8').read()
if 'new-password' not in f:
    a = '<input type={type} value={value} onChange={(e) => onChange(e.target.value)}'
    if a not in f: sys.exit('!! Financeiro.jsx: ponto de referência não encontrado')
    f = f.replace(a, '<input type={type} autoComplete={type === "password" ? "new-password" : "off"} value={value} onChange={(e) => onChange(e.target.value)}', 1)
    open(fin, 'w', encoding='utf-8').write(f)
    print('==> campos de chave do ERP protegidos contra preenchimento automático')
PY

desfaz() {
  echo "!! algo não subiu — voltando a versão anterior"
  for f in "$LANC" "$ASA" "$FIN"; do cp "$f.bak-$C" "$f"; done
  cd "$DEPLOY" && docker compose -f docker-compose.prod.yml up -d --build backend erp
  exit 1
}
echo "==> reconstruindo backend e ERP (2 a 5 minutos)"
(cd "$DEPLOY" && docker compose -f docker-compose.prod.yml up -d --build backend erp) || desfaz
for i in $(seq 1 40); do curl -s -m 3 http://127.0.0.1:4000/v2/health | grep -q '"ok":true' && break; sleep 3; done
curl -s -m 5 "http://127.0.0.1:4000/v2/cobertura?latitude=0.03&longitude=-51.06&categoria_id=2" | grep -q '"total"' || desfaz
echo
echo "==> PRONTO. Em até 2 minutos o servidor confere no Asaas as cobranças pendentes."
