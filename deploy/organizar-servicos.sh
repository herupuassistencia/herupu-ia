#!/usr/bin/env bash
# Organiza o catálogo de serviços do HERUPU (áreas e serviços).
# 1) faz backup das tabelas  2) mostra uma prévia  3) só aplica se você confirmar.
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
SQL="$DIR/organizar-servicos.sql"
PSQL=(docker exec -i herupu_pg sh -c 'psql -q -U "$POSTGRES_USER" -d "$POSTGRES_DB"')
mkdir -p /opt/herupu/backups
BAK="/opt/herupu/backups/catalogo-$(date +%Y%m%d-%H%M%S).sql"
docker exec herupu_pg sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --data-only -t categorias -t especialidades -t tecnicos_especialidades -t ordens_servico' > "$BAK"
echo "==> backup salvo em $BAK"

echo "==> PRÉVIA (nada é gravado ainda):"
{ cat "$SQL"; echo "ROLLBACK;"; } | "${PSQL[@]}"

read -r -p "Aplicar essas mudanças de verdade? (s/n) " R
if [ "$R" != "s" ] && [ "$R" != "S" ]; then echo "Cancelado. Nada foi alterado."; exit 0; fi
{ cat "$SQL"; echo "COMMIT;"; } | "${PSQL[@]}" >/dev/null 2>&1
echo "==> Pronto. Catálogo organizado. Os apps já mostram a nova lista (é só atualizar a página)."
