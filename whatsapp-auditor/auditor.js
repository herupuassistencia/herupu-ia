// ============================================================
//  HERUPU JARVIS - Auditor de WhatsApp (headless / sem abrir nada)
//  Le mensagens -> identifica (tipo/urgencia) -> te manda a
//  resposta sugerida no SEU proprio WhatsApp.
//
//  Escaneie o QR UMA vez; depois a sessao fica salva e roda sozinho.
//  Config em .env (veja .env.example).
// ============================================================

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const path = require('path');
require('dotenv').config();

// ---------- Configuracao ----------
const CFG = {
  // Seu numero (com DDI+DDD, sem +/espacos) para onde vao os alertas.
  // Ex.: 5511999998888  ->  vira 5511999998888@c.us
  destino: (process.env.AUDIT_TARGET || '').replace(/\D/g, ''),
  // Chave OpenAI (reaproveita a mesma do JARVIS). Se vazia, usa so as regras locais.
  openaiKey: process.env.OPENAI_API_KEY || '',
  openaiModel: process.env.AUDIT_MODEL || 'gpt-4o-mini',
  // Ignorar grupos? (true recomendado para auditoria de clientes)
  ignorarGrupos: (process.env.AUDIT_IGNORE_GROUPS || 'true') === 'true',
  // Caminho do Chromium no VPS Linux (deixe vazio no Windows).
  chromePath: process.env.CHROME_PATH || undefined,
  // Modo: 'avisar' (so te alerta) | 'responder' (responde sozinho - use com cuidado)
  modo: process.env.AUDIT_MODE || 'avisar',
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
client.on('ready', () => {
  console.log('[JARVIS] Conectado ao WhatsApp. Auditoria ativa (modo: ' + CFG.modo + ').');
});

// ---------- Classificador local (regras rapidas) ----------
function classificarLocal(texto) {
  const t = (texto || '').toLowerCase();
  let urgencia = 'normal';
  if (/(urgente|agora|imediato|emerg|parou|caiu|nao funciona|não funciona|problema|erro)/.test(t)) urgencia = 'alta';

  let tipo = 'geral';
  if (/(pix|boleto|pagar|pagamento|cobran|fatura|valor|preço|preco|orçamento|orcamento)/.test(t)) tipo = 'financeiro';
  else if (/(comprar|contratar|quero|interesse|proposta|plano)/.test(t)) tipo = 'venda';
  else if (/(duvida|dúvida|como|ajuda|suporte|nao consigo|não consigo)/.test(t)) tipo = 'suporte';
  else if (/(reclama|insatisf|cancelar|reembolso|péssimo|pessimo|horrível|horrivel)/.test(t)) tipo = 'reclamacao';

  return { tipo, urgencia };
}

// ---------- Enriquecimento com IA (opcional) ----------
async function analisarIA(texto, remetente) {
  if (!CFG.openaiKey) return null;
  const prompt =
    'Voce e um auditor de atendimento. Analise a mensagem de WhatsApp recebida e ' +
    'responda APENAS um JSON valido com as chaves: tipo (financeiro|venda|suporte|reclamacao|geral), ' +
    'urgencia (baixa|normal|alta), resumo (1 frase curta), sugestao (uma resposta educada e objetiva pronta para enviar em pt-BR).\n\n' +
    'Remetente: ' + remetente + '\nMensagem: "' + texto + '"';
  try {
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + CFG.openaiKey,
      },
      body: JSON.stringify({
        model: CFG.openaiModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
    });
    if (!resp.ok) {
      console.error('[JARVIS] OpenAI erro', resp.status, await resp.text());
      return null;
    }
    const data = await resp.json();
    return JSON.parse(data.choices[0].message.content);
  } catch (e) {
    console.error('[JARVIS] Falha na IA:', e.message);
    return null;
  }
}

// ---------- Handler de mensagens ----------
client.on('message', async (msg) => {
  try {
    if (msg.fromMe) return;                     // ignora o que voce mesmo envia
    const chat = await msg.getChat();
    if (CFG.ignorarGrupos && chat.isGroup) return;
    if (msg.isStatus) return;                   // ignora status/stories
    const texto = msg.body || '';
    if (!texto.trim()) return;                  // ignora midia sem legenda

    const contato = await msg.getContact();
    const nome = contato.pushname || contato.number || msg.from;

    // 1) Regras locais
    const local = classificarLocal(texto);
    // 2) IA (se disponivel) — sobrepoe as regras
    const ia = await analisarIA(texto, nome);

    const tipo = (ia && ia.tipo) || local.tipo;
    const urgencia = (ia && ia.urgencia) || local.urgencia;
    const resumo = (ia && ia.resumo) || texto.slice(0, 120);
    const sugestao = (ia && ia.sugestao) || '(sem sugestao automatica — responda manualmente)';

    const emoji = urgencia === 'alta' ? '🔴' : urgencia === 'baixa' ? '🟢' : '🟡';
    const alerta =
      emoji + ' *AUDITORIA JARVIS*\n' +
      '👤 De: ' + nome + '\n' +
      '🏷️ Tipo: ' + tipo + '  |  Urgência: ' + urgencia + '\n' +
      '📩 Msg: ' + resumo + '\n\n' +
      '💬 *Sugestão de resposta:*\n' + sugestao;

    // Envia o alerta para o SEU numero
    if (CFG.destino) {
      await client.sendMessage(CFG.destino + '@c.us', alerta);
    }
    console.log('[AUDITORIA] ' + nome + ' | ' + tipo + '/' + urgencia);

    // Modo responder automatico (opcional / cuidado)
    if (CFG.modo === 'responder' && ia && ia.sugestao) {
      await msg.reply(ia.sugestao);
    }
  } catch (e) {
    console.error('[JARVIS] Erro ao processar mensagem:', e.message);
  }
});

client.initialize();
