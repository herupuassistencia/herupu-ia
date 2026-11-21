#!/usr/bin/env bash
# Troca a chave do Firebase (conta de serviço) do backend para o projeto herupu-31e01.
# Uso: bash trocar-fcm.sh /root/caminho/do/arquivo-baixado.json
set -e
NOVO="$1"
ATUAL=/opt/herupu/DEPLOY/fcm-service-account.json
DEPLOY=/opt/herupu/DEPLOY
[ -f "$NOVO" ] || { echo "!! Arquivo não encontrado: $NOVO"; exit 1; }
python3 - "$NOVO" <<'PY'
import json, sys
d = json.load(open(sys.argv[1]))
assert d.get('type') == 'service_account', 'não é uma chave de conta de serviço'
assert d.get('project_id') == 'herupu-31e01', f"projeto errado: {d.get('project_id')} (esperado herupu-31e01)"
assert 'private_key' in d, 'arquivo sem chave privada'
print('==> arquivo válido: projeto', d['project_id'])
PY
cp "$ATUAL" "$ATUAL.bak-$(date +%Y%m%d-%H%M%S)"
cat "$NOVO" > "$ATUAL"
chmod 600 "$ATUAL"
rm -f "$NOVO"
echo "==> chave trocada (backup da antiga ao lado). Reiniciando o backend…"
cd "$DEPLOY" && docker compose -f docker-compose.prod.yml up -d --force-recreate backend
for i in $(seq 1 30); do curl -s -m 3 http://127.0.0.1:4000/v2/health | grep -q '"ok":true' && break; sleep 2; done
curl -s -m 3 http://127.0.0.1:4000/v2/health | grep -q '"ok":true' && echo "==> backend no ar" || echo "!! backend não respondeu — me mande: docker logs --tail 50 herupu_backend"
docker logs --tail 80 herupu_backend 2>&1 | grep -i -E "fcm|firebase" | tail -5 || true
