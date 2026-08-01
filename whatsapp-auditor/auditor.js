// ============================================================
//  HERUPU JARVIS - Auditor de WhatsApp (headless / sem abrir nada)
//
//  Faz auditoria das conversas usando o CLAUDE CLI ja instalado
//  (mesmo plano da extensao do Chrome -> SEM custo de OpenAI).
//
//  O que faz:
//   1) Varre as conversas e acha PEDIDOS NAO RESPONDIDOS
//   2) Identifica AGENDAMENTOS solicitados
//   3) Manda pra voce um relatorio + resposta sugerida
//   4) Tambem monitora mensagens novas em tempo real
//
//  Escaneie o QR UMA vez; depois a sessao fica salva e roda sozinho.
//  Config em .env (veja .env.example).
// ============================================================

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { spawn } = require('child_process');
const path = require('path');
require('dotenv').config();

// ---------- Configuracao ----------
const CFG = {
  // Seu numero (DDI+DDD+numero, so digitos) que RECEBE os alertas.
  destino: (process.env.AUDIT_TARGET || '').replace(/\D/g, ''),
  // Binario do Claude CLI (no Windows normalmente 'claude'; pode por o caminho completo).
  claudeBin: process.env.CLAUDE_BIN || 'claude',
  // Modelo do Claude (o mesmo do plano). Ex.: sonnet | opus
  claudeModel: process.env.AUDIT_MODEL || 'sonnet',
  // Ignorar grupos? (true recomendado)
  ignorarGrupos: (process.env.AUDIT_IGNORE_GROUPS || 'true') === 'true',
  // Caminho do Chromium no VPS Linux (no Windows deixe vazio).
  chromePath: process.env.CHROME_PATH || undefined,
  // Modo: 'avisar' (so te alerta) | 'responder' (responde sozinho - cuidado)
  modo: process.env.AUDIT_MODE || 'avisar',
  // Varredura completa a cada N minutos (0 = so na inicializacao).
  sweepMin: parseInt(process.env.AUDIT_SWEEP_MIN || '0', 10),
  // Maximo de conversas no relatorio de varredura.
  maxItens: parseInt(process.env.AUDIT_MAX_ITENS || '15', 10),
};

if (!CFG.destino) {
  console.warn('[AVISO] AUDIT_TARGET nao definido no .env — os alertas nao terao para onde ir.');
}

// ---------- Cliente WhatsApp (headless) ----------
const client = new Client({
  authStrategy: new LocalAuth({ dataPath: path.join(__dirname, 'wa-session') }),
  puppeteer: {
    headless: true,
    executablePath: CFG.chromePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  },
});

client.on('qr', (qr) => {
  console.log('\n[JARVIS] Escaneie este QR no WhatsApp (Aparelhos conectados):\n');
  qrcode.generate(qr, { small: true });
});
client.on('authenticated', () => console.log('[JARVIS] Autenticado. Sessao salva.'));
client.on('auth_failure', (m) => console.error('[JARVIS] Falha de auth:', m));
client.on('disconnected', (r) => console.warn('[JARVIS] Desconectado:', r));

// ---------- Classificador local (fallback rapido, sem IA) ----------
function classificarLocal(texto) {
  const t = (texto || '').toLowerCase();
  let urgencia = 'normal';
  if (/(urgente|agora|imediato|emerg|parou|caiu|nao funciona|não funciona|problema|erro)/.test(t)) urgencia = 'alta';

  const agendamento = /(agendar|agendamento|marcar|hor[áa]rio|que horas|amanh[ãa]|hoje|segunda|ter[çc]a|quarta|quinta|sexta|s[áa]bado|domingo|dispon[ií]vel|consulta|visita|atendimento)/.test(t);

  let tipo = 'geral';
  if (agendamento) tipo = 'agendamento';
  else if (/(pix|boleto|pagar|pagamento|cobran|fatura|valor|preço|preco|orçamento|orcamento)/.test(t)) tipo = 'financeiro';
  else if (/(comprar|contratar|quero|interesse|proposta|plano)/.test(t)) tipo = 'venda';
  else if (/(duvida|dúvida|como|ajuda|suporte|nao consigo|não consigo)/.test(t)) tipo = 'suporte';
  else if (/(reclama|insatisf|cancelar|reembolso|péssimo|pessimo|horrível|horrivel)/.test(t)) tipo = 'reclamacao';

  return { tipo, urgencia, agendamento, resumo: (texto || '').slice(0, 120), sugestao: '' };
}

// ---------- Analise com o CLAUDE CLI (plano, sem custo OpenAI) ----------
function analisarClaude(texto, remetente) {
  return new Promise((resolve) => {
    const instrucao =
      'Voce e um auditor de atendimento da HERUPU. No stdin vem uma mensagem de WhatsApp de um cliente. ' +
      'Responda APENAS um JSON valido (sem texto antes ou depois) com as chaves: ' +
      'tipo (financeiro|venda|suporte|reclamacao|agendamento|geral), ' +
      'urgencia (baixa|normal|alta), ' +
      'agendamento (true se o cliente pede/solicita um agendamento, horario ou atendimento; senao false), ' +
      'resumo (1 frase curta em pt-BR), ' +
      'sugestao (uma resposta educada, objetiva e pronta para enviar em pt-BR).';
    const args = ['-p', '--model', CFG.claudeModel];
    const opts = { timeout: 90000 };
    if (process.platform === 'win32') opts.shell = true; // resolve claude.cmd no Windows

    let out = '';
    let finished = false;
    const done = (val) => { if (!finished) { finished = true; resolve(val); } };

    let child;
    try {
      child = spawn(CFG.claudeBin, args, opts);
    } catch (e) {
      console.error('[JARVIS] Nao consegui iniciar o claude:', e.message);
      return done(null);
    }
    child.stdout.on('data', (d) => (out += d.toString()));
    child.stderr.on('data', (d) => process.env.AUDIT_DEBUG && console.error('[claude]', d.toString()));
    child.on('error', (e) => { console.error('[JARVIS] Erro no claude:', e.message); done(null); });
    child.on('close', () => {
      try {
        const m = out.match(/\{[\s\S]*\}/);
        done(m ? JSON.parse(m[0]) : null);
      } catch (e) { done(null); }
    });

    // Envia instrucao + mensagem via stdin (sem problemas de escape)
    child.stdin.write(instrucao + '\n\nMensagem de "' + remetente + '":\n' + texto);
    child.stdin.end();
  });
}

// Combina IA (Claude) com fallback local
async function analisar(texto, remetente) {
  const ia = await analisarClaude(texto, remetente);
  if (ia && ia.tipo) return ia;
  return classificarLocal(texto);
}

// ---------- Formata o alerta ----------
function montarAlerta(nome, a, prefixo) {
  const emoji = a.urgencia === 'alta' ? '🔴' : a.urgencia === 'baixa' ? '🟢' : '🟡';
  const tagAgenda = a.agendamento ? '📅 *AGENDAMENTO SOLICITADO*\n' : '';
  return (
    (prefixo || '') + emoji + ' *AUDITORIA JARVIS*\n' +
    tagAgenda +
    '👤 De: ' + nome + '\n' +
    '🏷️ Tipo: ' + (a.tipo || 'geral') + '  |  Urgência: ' + (a.urgencia || 'normal') + '\n' +
    '📩 ' + (a.resumo || '') + '\n\n' +
    '💬 *Sugestão de resposta:*\n' + (a.sugestao || '(responda manualmente)')
  );
}

async function enviarAlerta(texto) {
  if (CFG.destino) await client.sendMessage(CFG.destino + '@c.us', texto);
}

// ---------- AUDITORIA COMPLETA (varredura das conversas) ----------
async function auditoriaCompleta() {
  console.log('[JARVIS] Iniciando auditoria completa das conversas...');
  let chats;
  try { chats = await client.getChats(); } catch (e) {
    console.error('[JARVIS] Falha ao listar conversas:', e.message); return;
  }

  const pendentes = [];
  for (const chat of chats) {
    if (CFG.ignorarGrupos && chat.isGroup) continue;
    try {
      const msgs = await chat.fetchMessages({ limit: 1 });
      const last = msgs[0];
      if (!last) continue;
      // "nao respondido" = tem mensagem nao lida OU a ultima msg NAO foi voce quem enviou
      const naoRespondido = (chat.unreadCount || 0) > 0 || !last.fromMe;
      if (naoRespondido && (last.body || '').trim()) {
        pendentes.push({ chat, texto: last.body, nome: chat.name || (last.author || last.from) });
      }
    } catch (_) { /* segue */ }
  }

  if (pendentes.length === 0) {
    await enviarAlerta('✅ *AUDITORIA JARVIS*\nNenhuma conversa com pedido não respondido no momento.');
    console.log('[JARVIS] Auditoria: nada pendente.');
    return;
  }

  const lista = pendentes.slice(0, CFG.maxItens);
  await enviarAlerta(
    '📋 *AUDITORIA JARVIS — Resumo*\n' +
    'Encontrei *' + pendentes.length + '* conversa(s) com pedido não respondido.' +
    (pendentes.length > lista.length ? ' Mostrando as ' + lista.length + ' primeiras.' : '') +
    '\nVou detalhar cada uma abaixo 👇'
  );

  let agendamentos = 0;
  for (const p of lista) {
    const a = await analisar(p.texto, p.nome);
    if (a.agendamento) agendamentos++;
    await enviarAlerta(montarAlerta(p.nome, a));
  }

  await enviarAlerta(
    '🏁 *Auditoria concluída.*\n' +
    'Total pendentes: ' + pendentes.length + '\n' +
    '📅 Agendamentos solicitados: ' + agendamentos
  );
  console.log('[JARVIS] Auditoria concluida. Pendentes: ' + pendentes.length + ' | Agendamentos: ' + agendamentos);
}

// ---------- Monitor em tempo real ----------
client.on('message', async (msg) => {
  try {
    if (msg.fromMe || msg.isStatus) return;
    const chat = await msg.getChat();
    if (CFG.ignorarGrupos && chat.isGroup) return;
    const texto = msg.body || '';
    if (!texto.trim()) return;

    const contato = await msg.getContact();
    const nome = contato.pushname || contato.number || msg.from;

    const a = await analisar(texto, nome);
    await enviarAlerta(montarAlerta(nome, a, '🆕 '));
    console.log('[TEMPO REAL] ' + nome + ' | ' + a.tipo + '/' + a.urgencia + (a.agendamento ? ' | AGENDAMENTO' : ''));

    if (CFG.modo === 'responder' && a.sugestao) {
      await msg.reply(a.sugestao);
    }
  } catch (e) {
    console.error('[JARVIS] Erro na mensagem:', e.message);
  }
});

// ---------- Inicializacao ----------
client.on('ready', async () => {
  console.log('[JARVIS] Conectado ao WhatsApp. Modo: ' + CFG.modo + ' | Motor: Claude CLI (' + CFG.claudeModel + ').');
  await auditoriaCompleta();
  if (CFG.sweepMin > 0) {
    console.log('[JARVIS] Varredura automatica a cada ' + CFG.sweepMin + ' min.');
    setInterval(auditoriaCompleta, CFG.sweepMin * 60 * 1000);
  }
});

client.initialize();
