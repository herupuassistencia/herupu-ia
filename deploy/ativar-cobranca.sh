#!/usr/bin/env bash
# Liga a rota GET /v2/ordens/:id/cobranca no backend HERUPU (o app Cliente mostra o PIX da taxa por ela)
# e protege: cada cliente só vê a cobrança da própria OS. Faz backup e desfaz sozinho se der erro.
set -e
BACK=${BACK:-/opt/herupu/BACKEND}
DEPLOY=${DEPLOY:-/opt/herupu/DEPLOY}
ROTAS=$BACK/src/v2/routes/index.js
CTRL=$BACK/src/v2/controllers/ordens.controller.js
CARIMBO=$(date +%Y%m%d-%H%M%S)

[ -f "$ROTAS" ] && [ -f "$CTRL" ] || { echo "!! Não achei o backend em $BACK"; exit 1; }
cp "$ROTAS" "$ROTAS.bak-$CARIMBO"
cp "$CTRL" "$CTRL.bak-$CARIMBO"
echo "==> backup: *.bak-$CARIMBO"

python3 - "$ROTAS" "$CTRL" <<'PY'
import sys
rotas, ctrl = sys.argv[1], sys.argv[2]

s = open(rotas, encoding='utf-8').read()
if "/ordens/:id/cobranca" not in s:
    alvo = "router.post('/ordens/:id/anexos',     authRequired, ordens.adicionarAnexo);"
    if alvo not in s:
        sys.exit("!! linha de referência das rotas não encontrada — nada foi alterado")
    s = s.replace(alvo, alvo + "\nrouter.get ('/ordens/:id/cobranca',   authRequired, ordens.cobrancaDaOS);   // PIX da taxa (app cliente)")
    open(rotas, 'w', encoding='utf-8').write(s)
    print("==> rota /ordens/:id/cobranca ligada")
else:
    print("==> rota já estava ligada")

c = open(ctrl, encoding='utf-8').read()
marca = "// [dono-da-cobranca]"
if marca not in c:
    alvo = "const cobrancaDaOS = asyncHandler(async (req, res) => {\n"
    if alvo not in c:
        sys.exit("!! função cobrancaDaOS não encontrada — nada foi alterado")
    trava = alvo + """  """ + marca + """ cliente/técnico só vê a cobrança da OS dele; base (admin/operador) vê todas
  if (!['admin', 'operador'].includes(req.user?.perfil)) {
    const dono = await pool.query(`SELECT cliente_id, tecnico_id FROM ordens_servico WHERE id=$1`, [req.params.id]);
    const o = dono.rows[0];
    const ok = o && ((req.user?.cliente_id && Number(o.cliente_id) === Number(req.user.cliente_id))
                  || (req.user?.tecnico_id && Number(o.tecnico_id) === Number(req.user.tecnico_id)));
    if (!ok) return res.status(403).json({ erro: 'Sem acesso a esta cobrança' });
  }
"""
    c = c.replace(alvo, trava)
    open(ctrl, 'w', encoding='utf-8').write(c)
    print("==> trava de dono aplicada")
else:
    print("==> trava já estava aplicada")
PY

desfazer() {
  echo "!! Algo deu errado — restaurando os arquivos originais"
  cp "$ROTAS.bak-$CARIMBO" "$ROTAS"; cp "$CTRL.bak-$CARIMBO" "$CTRL"
  cd "$DEPLOY" && docker compose -f docker-compose.prod.yml up -d --build backend
  exit 1
}

node --check "$ROTAS" && node --check "$CTRL" || desfazer
echo "==> sintaxe ok — reconstruindo o backend (leva 1 a 3 minutos)"
cd "$DEPLOY"
docker compose -f docker-compose.prod.yml up -d --build backend || desfazer

echo "==> aguardando o backend subir"
for i in $(seq 1 30); do
  if curl -s -m 3 http://127.0.0.1:4000/v2/health | grep -q '"ok":true'; then break; fi
  sleep 2
done
curl -s -m 3 http://127.0.0.1:4000/v2/health | grep -q '"ok":true' || desfazer
CODIGO=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:4000/v2/ordens/1/cobranca)
echo "==> backend no ar. Teste da rota sem login (tem que dar 401): $CODIGO"
[ "$CODIGO" = "401" ] || echo "!! esperado 401 — me mande esta saída"
echo
echo "URL do webhook para cadastrar no Asaas:"
echo "  https://cliente.herupusistemas.com.br/v2/financeiro/asaas/webhook"
