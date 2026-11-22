/**
 * HERUPU v2 — Lançamento nacional
 *  - Cobertura: quantos técnicos atendem uma área perto de um ponto
 *  - Lista de espera: cliente sem técnico na região é avisado quando chegar um
 *  - LGPD: aceite dos termos/privacidade (com versão, data e IP) e pedidos do titular
 *  - Origem do cadastro (utm) e painel de cobertura para o ERP
 * Montado em routes/index.js com: router.use(require('./lancamento'));
 */
const express = require('express');
const { pool } = require('../config/db');
const { authRequired, requireRole } = require('../middleware/auth');

const router = express.Router();
const RAIO_KM = parseFloat(process.env.DISPATCH_RADIUS_KM || '20');
const VERSAO_TERMOS = '2026-11-21';

const h = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ---------- tabelas (criadas uma vez, sem mexer nas existentes) ----------
let pronto = null;
function garantirTabelas() {
  if (!pronto) {
    pronto = pool.query(`
      CREATE TABLE IF NOT EXISTS lgpd_aceites (
        id SERIAL PRIMARY KEY,
        usuario_id INT NOT NULL,
        app TEXT,
        versao TEXT NOT NULL,
        documentos TEXT NOT NULL DEFAULT 'termos,privacidade',
        ip TEXT, user_agent TEXT,
        aceito_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS lgpd_aceites_usuario ON lgpd_aceites (usuario_id, versao);
      CREATE TABLE IF NOT EXISTS lgpd_solicitacoes (
        id SERIAL PRIMARY KEY,
        usuario_id INT NOT NULL,
        tipo TEXT NOT NULL,
        detalhe TEXT,
        status TEXT NOT NULL DEFAULT 'aberta',
        criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        atendido_em TIMESTAMPTZ
      );
      CREATE TABLE IF NOT EXISTS cadastro_origem (
        usuario_id INT NOT NULL,
        app TEXT NOT NULL,
        utm_source TEXT, utm_medium TEXT, utm_campaign TEXT, utm_content TEXT, ref TEXT,
        criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (usuario_id, app)
      );
      CREATE TABLE IF NOT EXISTS lista_espera (
        id SERIAL PRIMARY KEY,
        usuario_id INT NOT NULL,
        categoria_id INT NOT NULL,
        especialidade_id INT,
        descricao TEXT,
        cidade TEXT, estado TEXT,
        latitude DOUBLE PRECISION NOT NULL,
        longitude DOUBLE PRECISION NOT NULL,
        criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        notificado_em TIMESTAMPTZ,
        cancelado_em TIMESTAMPTZ
      );
      CREATE INDEX IF NOT EXISTS lista_espera_pendente ON lista_espera (notificado_em, cancelado_em);
    `).catch((e) => { pronto = null; throw e; });
  }
  return pronto;
}
router.use(['/cobertura', '/lista-espera', '/lgpd', '/admin/lancamento'], h(async (req, res, next) => { await garantirTabelas(); next(); }));

// ---------- cobertura ----------
// técnicos ativos que fazem a área (ou o serviço) com última posição até RAIO_KM do ponto
async function contarCobertura({ latitude, longitude, categoria_id, especialidade_id }) {
  const r = await pool.query(
    `SELECT COUNT(DISTINCT t.id)::int AS total,
            COUNT(DISTINCT t.id) FILTER (WHERE t.status IN ('disponivel','deslocamento'))::int AS online
       FROM tecnicos t
       JOIN tecnicos_localizacao tl ON tl.tecnico_id = t.id
       JOIN tecnicos_especialidades te ON te.tecnico_id = t.id
       JOIN especialidades e ON e.id = te.especialidade_id
      WHERE t.ativo = TRUE
        AND (CASE WHEN $4::int IS NOT NULL THEN e.id = $4::int ELSE e.categoria_id = $3::int END)
        AND tl.latitude IS NOT NULL
        AND 6371 * 2 * ASIN(SQRT(
              POWER(SIN(RADIANS(tl.latitude - $1) / 2), 2) +
              COS(RADIANS($1)) * COS(RADIANS(tl.latitude)) *
              POWER(SIN(RADIANS(tl.longitude - $2) / 2), 2))) <= $5`,
    [Number(latitude), Number(longitude), categoria_id ? Number(categoria_id) : null,
     especialidade_id ? Number(especialidade_id) : null, RAIO_KM]
  );
  return r.rows[0];
}

router.get('/cobertura', h(async (req, res) => {
  const { latitude, longitude, categoria_id, especialidade_id } = req.query;
  if (!latitude || !longitude || (!categoria_id && !especialidade_id)) {
    return res.status(400).json({ erro: 'latitude, longitude e categoria_id são obrigatórios' });
  }
  const c = await contarCobertura({ latitude, longitude, categoria_id, especialidade_id });
  res.json({ ...c, raio_km: RAIO_KM });
}));

// ---------- lista de espera ----------
router.post('/lista-espera', authRequired, h(async (req, res) => {
  const { categoria_id, especialidade_id, descricao, cidade, estado, latitude, longitude } = req.body || {};
  if (!categoria_id || latitude == null || longitude == null) {
    return res.status(400).json({ erro: 'categoria_id, latitude e longitude são obrigatórios' });
  }
  const dup = await pool.query(
    `SELECT id FROM lista_espera WHERE usuario_id=$1 AND categoria_id=$2 AND notificado_em IS NULL AND cancelado_em IS NULL`,
    [req.user.id, categoria_id]
  );
  if (dup.rows.length) {
    await pool.query(`UPDATE lista_espera SET latitude=$2, longitude=$3, cidade=$4, estado=$5, descricao=COALESCE($6, descricao) WHERE id=$1`,
      [dup.rows[0].id, latitude, longitude, cidade || null, estado || null, descricao || null]);
    return res.json({ ok: true, id: dup.rows[0].id, atualizado: true });
  }
  const r = await pool.query(
    `INSERT INTO lista_espera (usuario_id, categoria_id, especialidade_id, descricao, cidade, estado, latitude, longitude)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
    [req.user.id, categoria_id, especialidade_id || null, descricao || null, cidade || null, estado || null, latitude, longitude]
  );
  res.status(201).json({ ok: true, id: r.rows[0].id });
}));

router.get('/lista-espera/minhas', authRequired, h(async (req, res) => {
  const r = await pool.query(
    `SELECT l.id, l.categoria_id, c.nome AS categoria, l.cidade, l.criado_em, l.notificado_em
       FROM lista_espera l LEFT JOIN categorias c ON c.id = l.categoria_id
      WHERE l.usuario_id=$1 AND l.cancelado_em IS NULL ORDER BY l.criado_em DESC`, [req.user.id]);
  res.json(r.rows);
}));

router.delete('/lista-espera/:id', authRequired, h(async (req, res) => {
  await pool.query(`UPDATE lista_espera SET cancelado_em=NOW() WHERE id=$1 AND usuario_id=$2`, [req.params.id, req.user.id]);
  res.json({ ok: true });
}));

// avisa quem está na lista quando aparece técnico na região (a cada 10 min)
async function verificarListaEspera() {
  await garantirTabelas();
  const r = await pool.query(
    `SELECT l.*, c.nome AS categoria FROM lista_espera l LEFT JOIN categorias c ON c.id = l.categoria_id
      WHERE l.notificado_em IS NULL AND l.cancelado_em IS NULL AND l.criado_em > NOW() - INTERVAL '180 days'
      LIMIT 500`);
  let push = null;
  try { push = require('../services/push.service'); } catch (_) { /* sem push */ }
  for (const l of r.rows) {
    const c = await contarCobertura(l);
    if (c.total > 0) {
      await pool.query(`UPDATE lista_espera SET notificado_em=NOW() WHERE id=$1`, [l.id]);
      if (push?.notificarUsuario) {
        await push.notificarUsuario(l.usuario_id, {
          titulo: 'Chegou técnico na sua região',
          corpo: `Já temos técnico de ${l.categoria || 'serviço'} perto de você. Abra o app e faça seu pedido.`,
          data: { tipo: 'lista_espera', categoria_id: String(l.categoria_id) },
        }).catch(() => {});
      }
    }
  }
}
if (!global.__herupuListaEspera) {
  global.__herupuListaEspera = setInterval(() => verificarListaEspera().catch((e) => console.warn('[lista-espera]', e.message)), 10 * 60 * 1000);
  setTimeout(() => verificarListaEspera().catch(() => {}), 60 * 1000);
}

// ---------- LGPD ----------
router.get('/lgpd/status', authRequired, h(async (req, res) => {
  const r = await pool.query(`SELECT versao, aceito_em FROM lgpd_aceites WHERE usuario_id=$1 ORDER BY aceito_em DESC LIMIT 1`, [req.user.id]);
  const ultimo = r.rows[0] || null;
  res.json({ versao_atual: VERSAO_TERMOS, aceito: !!ultimo && ultimo.versao === VERSAO_TERMOS, ultimo });
}));

router.post('/lgpd/aceite', authRequired, h(async (req, res) => {
  const { app, versao, origem } = req.body || {};
  if (versao !== VERSAO_TERMOS) return res.status(409).json({ erro: 'Versão dos termos desatualizada', versao_atual: VERSAO_TERMOS });
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').toString().split(',')[0].trim();
  await pool.query(
    `INSERT INTO lgpd_aceites (usuario_id, app, versao, ip, user_agent) VALUES ($1,$2,$3,$4,$5)`,
    [req.user.id, app || null, versao, ip, (req.headers['user-agent'] || '').slice(0, 300)]
  );
  if (origem && typeof origem === 'object' && app) {
    const o = (k) => (origem[k] ? String(origem[k]).slice(0, 120) : null);
    await pool.query(
      `INSERT INTO cadastro_origem (usuario_id, app, utm_source, utm_medium, utm_campaign, utm_content, ref)
       VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (usuario_id, app) DO NOTHING`,
      [req.user.id, app, o('utm_source'), o('utm_medium'), o('utm_campaign'), o('utm_content'), o('ref')]
    );
  }
  res.status(201).json({ ok: true, versao });
}));

router.post('/lgpd/solicitacao', authRequired, h(async (req, res) => {
  const { tipo, detalhe } = req.body || {};
  const tipos = ['exclusao', 'acesso', 'correcao', 'revogar_consentimento'];
  if (!tipos.includes(tipo)) return res.status(400).json({ erro: 'tipo inválido', tipos });
  const r = await pool.query(
    `INSERT INTO lgpd_solicitacoes (usuario_id, tipo, detalhe) VALUES ($1,$2,$3) RETURNING id, criado_em`,
    [req.user.id, tipo, (detalhe || '').toString().slice(0, 2000)]
  );
  res.status(201).json({ ok: true, protocolo: r.rows[0].id, criado_em: r.rows[0].criado_em, prazo_dias: 15 });
}));

// ---------- painel do ERP ----------
router.get('/admin/lancamento', authRequired, requireRole('admin', 'operador'), h(async (req, res) => {
  const q = (sql, p) => pool.query(sql, p).then((r) => r.rows);
  const [totais, porEstado, porCidade, porCategoria, espera, origem, lgpd] = await Promise.all([
    q(`SELECT
         (SELECT COUNT(*) FROM tecnicos WHERE ativo)::int AS tecnicos,
         (SELECT COUNT(*) FROM tecnicos WHERE ativo AND status IN ('disponivel','deslocamento'))::int AS tecnicos_online,
         (SELECT COUNT(*) FROM tecnicos WHERE ativo AND criado_em > NOW() - INTERVAL '7 days')::int AS tecnicos_7d,
         (SELECT COUNT(*) FROM clientes)::int AS clientes,
         (SELECT COUNT(*) FROM lista_espera WHERE notificado_em IS NULL AND cancelado_em IS NULL)::int AS em_espera`),
    q(`SELECT COALESCE(NULLIF(UPPER(TRIM(estado)),''),'—') AS estado, COUNT(*)::int AS tecnicos
         FROM tecnicos WHERE ativo GROUP BY 1 ORDER BY 2 DESC`),
    q(`SELECT COALESCE(NULLIF(TRIM(cidade),''),'—') AS cidade, COALESCE(UPPER(TRIM(estado)),'') AS estado,
              COUNT(DISTINCT t.id)::int AS tecnicos,
              STRING_AGG(DISTINCT c.nome, ', ') AS areas
         FROM tecnicos t
         LEFT JOIN tecnicos_especialidades te ON te.tecnico_id = t.id
         LEFT JOIN especialidades e ON e.id = te.especialidade_id
         LEFT JOIN categorias c ON c.id = e.categoria_id
        WHERE t.ativo GROUP BY 1, 2 ORDER BY 3 DESC LIMIT 200`),
    q(`SELECT c.id, c.nome, COUNT(DISTINCT t.id)::int AS tecnicos
         FROM categorias c
         LEFT JOIN especialidades e ON e.categoria_id = c.id
         LEFT JOIN tecnicos_especialidades te ON te.especialidade_id = e.id
         LEFT JOIN tecnicos t ON t.id = te.tecnico_id AND t.ativo
        WHERE c.ativo GROUP BY c.id ORDER BY c.ordem`),
    q(`SELECT COALESCE(NULLIF(TRIM(l.cidade),''),'—') AS cidade, COALESCE(UPPER(l.estado),'') AS estado,
              c.nome AS categoria, COUNT(*)::int AS pedidos, MIN(l.criado_em) AS desde
         FROM lista_espera l LEFT JOIN categorias c ON c.id = l.categoria_id
        WHERE l.notificado_em IS NULL AND l.cancelado_em IS NULL
        GROUP BY 1, 2, 3 ORDER BY 4 DESC LIMIT 200`),
    q(`SELECT app, COALESCE(utm_source,'direto') AS origem, COALESCE(utm_campaign,'') AS campanha, COUNT(*)::int AS cadastros
         FROM cadastro_origem WHERE criado_em > NOW() - INTERVAL '30 days'
        GROUP BY 1, 2, 3 ORDER BY 4 DESC LIMIT 100`),
    q(`SELECT s.id, s.tipo, s.detalhe, s.status, s.criado_em, u.nome, u.email
         FROM lgpd_solicitacoes s LEFT JOIN usuarios u ON u.id = s.usuario_id
        WHERE s.status = 'aberta' ORDER BY s.criado_em`),
  ]);
  res.json({ totais: totais[0], por_estado: porEstado, por_cidade: porCidade, por_categoria: porCategoria,
             lista_espera: espera, origem, lgpd_pendentes: lgpd, raio_km: RAIO_KM, versao_termos: VERSAO_TERMOS });
}));

router.post('/admin/lancamento/lgpd/:id/concluir', authRequired, requireRole('admin', 'operador'), h(async (req, res) => {
  await pool.query(`UPDATE lgpd_solicitacoes SET status='atendida', atendido_em=NOW() WHERE id=$1`, [req.params.id]);
  res.json({ ok: true });
}));

module.exports = router;
module.exports.VERSAO_TERMOS = VERSAO_TERMOS;
