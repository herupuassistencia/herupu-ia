// ============================================================
//  HERUPU JARVIS - Memoria / Conhecimento aprendido com a Joseane
//
//  Tudo que a Joseane ensina (procedimentos, duracoes, regras) fica
//  salvo em conhecimento.json e passa a ser usado nos agendamentos.
//  O arquivo NAO vai para o GitHub (dados do negocio) — veja .gitignore.
// ============================================================

const fs = require('fs');
const path = require('path');

const ARQ = path.join(__dirname, 'conhecimento.json');
const VAZIO = { procedimentos: {}, regras: [], observacoes: [], historico: [] };

function carregar() {
  try {
    return Object.assign(JSON.parse(JSON.stringify(VAZIO)), JSON.parse(fs.readFileSync(ARQ, 'utf8')));
  } catch (e) {
    return JSON.parse(JSON.stringify(VAZIO));
  }
}

function salvar(k) {
  try {
    fs.writeFileSync(ARQ, JSON.stringify(k, null, 2));
  } catch (e) {
    console.error('[CONHEC] nao consegui salvar:', e.message);
  }
}

function vazio() {
  const k = carregar();
  return Object.keys(k.procedimentos).length === 0 && k.regras.length === 0;
}

// Aplica um aprendizado (merge) e salva. update = { procedimentos, regras, observacoes, resposta, _texto }
function aplicar(update) {
  const k = carregar();
  if (update && update.procedimentos && typeof update.procedimentos === 'object') {
    for (const [nome, dur] of Object.entries(update.procedimentos)) {
      const d = parseInt(dur, 10);
      const n = String(nome).toLowerCase().trim();
      if (n && d > 0) k.procedimentos[n] = d;
    }
  }
  for (const campo of ['regras', 'observacoes']) {
    if (update && Array.isArray(update[campo])) {
      for (const item of update[campo]) {
        const s = String(item).trim();
        if (s && !k[campo].includes(s)) k[campo].push(s);
      }
    }
  }
  k.historico.push({
    ts: new Date().toISOString(),
    texto: (update && update._texto) || '',
    resumo: (update && update.resposta) || '',
  });
  salvar(k);
  return k;
}

// Duracao aprendida para um procedimento (ou null se nao souber)
function duracaoDe(nome) {
  if (!nome) return null;
  const k = carregar();
  const key = String(nome).toLowerCase().trim();
  if (k.procedimentos[key] != null) return k.procedimentos[key];
  for (const p of Object.keys(k.procedimentos)) {
    if (key.includes(p)) return k.procedimentos[p];
  }
  return null;
}

function textoProcedimentos() {
  const k = carregar();
  const e = Object.entries(k.procedimentos);
  return e.length ? e.map(([n, d]) => n + ' (~' + d + 'min)').join(', ') : '';
}

function textoRegras() {
  const k = carregar();
  return k.regras.length ? k.regras.join('; ') : '';
}

module.exports = { carregar, salvar, vazio, aplicar, duracaoDe, textoProcedimentos, textoRegras, ARQ };
