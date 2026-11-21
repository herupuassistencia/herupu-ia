#!/usr/bin/env bash
# Busca de localização mais robusta no backend (tentativas em cascata) + recalcula o pino
# de clientes e técnicos que estão sem coordenadas. Backup automático; desfaz se der erro.
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
ALVO=/opt/herupu/BACKEND/src/v2/services/geocoder.service.js
DEPLOY=/opt/herupu/DEPLOY
BAK="$ALVO.bak-$(date +%Y%m%d-%H%M%S)"
cp "$ALVO" "$BAK"; echo "==> backup: $BAK"
cp "$DIR/geocoder.service.js" "$ALVO"
desfazer() { echo "!! erro — restaurando o geocoder anterior"; cp "$BAK" "$ALVO"; cd "$DEPLOY" && docker compose -f docker-compose.prod.yml up -d --build backend; exit 1; }
node --check "$ALVO" || desfazer
echo "==> reconstruindo o backend (1 a 3 minutos)"
cd "$DEPLOY" && docker compose -f docker-compose.prod.yml up -d --build backend || desfazer
for i in $(seq 1 30); do curl -s -m 3 http://127.0.0.1:4000/v2/health | grep -q '"ok":true' && break; sleep 2; done
curl -s -m 3 http://127.0.0.1:4000/v2/health | grep -q '"ok":true' || desfazer
echo "==> backend no ar. Recalculando pinos sem localização (1 por segundo, regra do OpenStreetMap)…"
docker exec herupu_backend node -e '
const { pool } = require("./src/v2/config/db");
const { garantirCoords } = require("./src/v2/services/geocoder.service");
(async () => {
  const c = await pool.query(`SELECT id, nome, endereco, numero, bairro, cidade, estado, cep FROM clientes WHERE latitude IS NULL OR longitude IS NULL OR latitude = 0`);
  for (const x of c.rows) {
    const g = await garantirCoords(x);
    if (g.latitude) await pool.query(`UPDATE clientes SET latitude=$1, longitude=$2 WHERE id=$3`, [g.latitude, g.longitude, x.id]);
    console.log("cliente", x.id, x.nome, "=>", g.latitude ? `${g.latitude},${g.longitude} (${g.precisao})` : "NÃO ENCONTRADO");
  }
  const t = await pool.query(`SELECT t.id, t.nome, t.endereco, t.cidade, t.estado, t.cep FROM tecnicos t LEFT JOIN tecnicos_localizacao tl ON tl.tecnico_id = t.id WHERE tl.tecnico_id IS NULL OR tl.latitude IS NULL`);
  for (const x of t.rows) {
    const g = await garantirCoords(x);
    if (g.latitude) await pool.query(`INSERT INTO tecnicos_localizacao (tecnico_id, latitude, longitude, atualizado_em) VALUES ($1,$2,$3,NOW()) ON CONFLICT (tecnico_id) DO UPDATE SET latitude=$2, longitude=$3, atualizado_em=NOW()`, [x.id, g.latitude, g.longitude]);
    console.log("técnico", x.id, x.nome, "=>", g.latitude ? `${g.latitude},${g.longitude} (${g.precisao})` : "NÃO ENCONTRADO");
  }
  console.log(`==> pronto: ${c.rows.length} cliente(s) e ${t.rows.length} técnico(s) sem localização processados`);
  await pool.end();
})().catch((e) => { console.error("!! falha no recálculo:", e.message); process.exit(1); });
'
