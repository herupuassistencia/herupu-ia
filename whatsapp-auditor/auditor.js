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

const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const agenda = require('./agenda');
const voz = require('./voz');
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
    const agora = new Date();
    const agoraLocal = agora.toLocaleString('pt-BR', { timeZone: agenda.timezone() });
    const instrucao =
      'Voce e um auditor de atendimento da HERUPU. No stdin vem uma mensagem de WhatsApp de um cliente. ' +
      'Hoje e ' + agoraLocal + ' (fuso ' + agenda.timezone() + ', offset ' + agenda.offset() + '). ' +
      'Responda APENAS um JSON valido (sem texto antes ou depois) com as chaves: ' +
      'tipo (financeiro|venda|suporte|reclamacao|agendamento|geral), ' +
      'urgencia (baixa|normal|alta), ' +
      'agendamento (true se o cliente pede/solicita um agendamento, horario ou atendimento; senao false), ' +
      'data_iso (se o cliente propos uma data/hora, converta para ISO 8601 COM o offset ' + agenda.offset() +
      ', ex.: "2026-08-05T14:00:00' + agenda.offset() + '"; se nao propos horario, use null), ' +
      'duracao_min (duracao estimada em minutos, ou null), ' +
      'resumo (1 frase curta em pt-BR), ' +
      'falar (1 frase natural, em pt-BR, dizendo QUEM esta pedindo e O QUE esta pedindo, como um secretario avisaria em voz alta), ' +
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

// Avalia a agenda (se for agendamento) e devolve { blocoAgenda, sugestao, falaAgenda }
function resolverResposta(nome, a) {
  let blocoAgenda = '';
  let falaAgenda = '';
  let sugestao = a.sugestao || '(responda manualmente)';
  if (a.agendamento) {
    try {
      const av = agenda.avaliarPedido({
        dataISO: a.data_iso || null,
        duracaoMin: a.duracao_min || null,
        nomeCliente: nome,
      });
      blocoAgenda = av.bloco + '\n\n';
      falaAgenda = av.fala || '';
      sugestao = av.resposta; // ja considera disponibilidade/conflito/sugestoes
    } catch (e) {
      blocoAgenda = '🗓️ (nao consegui avaliar a agenda: ' + e.message + ')\n\n';
    }
  }
  return { blocoAgenda, sugestao, falaAgenda };
}

// Frase que o "secretario" fala em voz alta
function textoFalado(nome, a) {
  let f = a.falar || (nome + ' enviou uma mensagem.');
  if (a.ehAudio) f = 'Áudio de ' + (nome || 'um contato') + '. ' + f;
  if (a.agendamento) {
    const { falaAgenda } = resolverResposta(nome, a);
    if (falaAgenda) f += ' ' + falaAgenda;
  }
  return f;
}

// Detecta se a mensagem e um audio (nota de voz ou arquivo de audio)
function ehAudioMsg(msg) {
  return msg.type === 'ptt' || msg.type === 'audio' ||
    (msg.hasMedia && /audio|ogg/.test(msg.mimetype || ''));
}

// Extrai o texto de uma mensagem: transcreve se for audio
async function extrairTexto(msg) {
  if (ehAudioMsg(msg)) {
    try {
      const media = await msg.downloadMedia();
      if (media && media.data) {
        const buf = Buffer.from(media.data, 'base64');
        const t = await voz.transcrever(buf, media.mimetype);
        if (t) return { texto: t, ehAudio: true };
      }
    } catch (e) {
      console.error('[JARVIS] Falha ao transcrever audio:', e.message);
    }
    return { texto: '(áudio recebido — não consegui transcrever)', ehAudio: true };
  }
  return { texto: msg.body || '', ehAudio: false };
}

// ---------- Formata o alerta ----------
function montarAlerta(nome, a, prefixo) {
  const emoji = a.urgencia === 'alta' ? '🔴' : a.urgencia === 'baixa' ? '🟢' : '🟡';
  const tagAgenda = a.agendamento ? '📅 *AGENDAMENTO SOLICITADO*\n' : '';
  const { blocoAgenda, sugestao } = resolverResposta(nome, a);

  return (
    (prefixo || '') + emoji + ' *AUDITORIA JARVIS*\n' +
    tagAgenda +
    '👤 De: ' + nome + '\n' +
    '🏷️ Tipo: ' + (a.tipo || 'geral') + '  |  Urgência: ' + (a.urgencia || 'normal') + '\n' +
    '📩 ' + (a.resumo || '') + '\n\n' +
    blocoAgenda +
    '💬 *Sugestão de resposta:*\n' + sugestao
  );
}

async function enviarAlerta(texto) {
  if (CFG.destino) await client.sendMessage(CFG.destino + '@c.us', texto);
}

// Narra a solicitacao: fala no PC OU manda nota de voz no WhatsApp (ideal p/ servidor)
async function narrar(texto) {
  if (!texto) return;
  const saida = voz.vozSaida();
  if (saida === 'off') return;
  if (saida === 'pc') { await voz.falar(texto); return; }
  if (saida === 'whatsapp') {
    try {
      const ogg = await voz.sintetizarOgg(texto);
      if (ogg && CFG.destino) {
        const media = MessageMedia.fromFilePath(ogg);
        await client.sendMessage(CFG.destino + '@c.us', media, { sendAudioAsVoice: true });
        try { fs.unlinkSync(ogg); } catch (_) {}
      }
    } catch (e) {
      console.error('[VOZ] envio de nota de voz falhou:', e.message);
    }
  }
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
      const temConteudo = (last.body || '').trim() || ehAudioMsg(last);
      if (naoRespondido && temConteudo) {
        pendentes.push({ chat, msg: last, nome: chat.name || (last.author || last.from) });
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
    const { texto, ehAudio } = await extrairTexto(p.msg);
    if (!texto.trim()) continue;
    const a = await analisar(texto, p.nome);
    a.ehAudio = ehAudio;
    if (a.agendamento) agendamentos++;
    await enviarAlerta(montarAlerta(p.nome, a, ehAudio ? '🎤 ' : ''));
  }

  await enviarAlerta(
    '🏁 *Auditoria concluída.*\n' +
    'Total pendentes: ' + pendentes.length + '\n' +
    '📅 Agendamentos solicitados: ' + agendamentos
  );
  await narrar('Auditoria concluída. Encontrei ' + pendentes.length +
    ' conversa' + (pendentes.length === 1 ? '' : 's') + ' com pedido não respondido, sendo ' +
    agendamentos + ' de agendamento.');
  console.log('[JARVIS] Auditoria concluida. Pendentes: ' + pendentes.length + ' | Agendamentos: ' + agendamentos);
}

// ---------- Monitor em tempo real ----------
client.on('message', async (msg) => {
  try {
    if (msg.fromMe || msg.isStatus) return;
    const chat = await msg.getChat();
    if (CFG.ignorarGrupos && chat.isGroup) return;

    const { texto, ehAudio } = await extrairTexto(msg);
    if (!texto.trim()) return;

    const contato = await msg.getContact();
    const nome = contato.pushname || contato.number || msg.from;

    const a = await analisar(texto, nome);
    a.ehAudio = ehAudio;
    await enviarAlerta(montarAlerta(nome, a, ehAudio ? '🎤 ' : '🆕 '));
    await narrar(textoFalado(nome, a)); // secretario avisa (voz no PC ou nota de voz no WhatsApp)
    console.log('[TEMPO REAL] ' + nome + (ehAudio ? ' (audio)' : '') + ' | ' + a.tipo + '/' + a.urgencia + (a.agendamento ? ' | AGENDAMENTO' : ''));

    if (CFG.modo === 'responder') {
      const { sugestao } = resolverResposta(nome, a);
      if (sugestao) await msg.reply(sugestao);
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
