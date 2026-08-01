// ============================================================
//  HERUPU JARVIS - Motor de Agenda (avaliacao de horarios)
//
//  Le a agenda da atendente (agenda.json): expediente + compromissos.
//  Dado um pedido de agendamento, decide:
//    - horario DISPONIVEL  -> confirma
//    - CONFLITO / fora do expediente -> sugere os melhores horarios livres
//
//  Sem dependencias externas. Fuso configurado em agenda.json.
// ============================================================

const fs = require('fs');
const path = require('path');

const ARQ = path.join(__dirname, 'agenda.json');

function carregar() {
  try {
    return JSON.parse(fs.readFileSync(ARQ, 'utf8'));
  } catch (e) {
    // Padrao seguro caso o arquivo nao exista
    return {
      atendente: 'Joseane',
      timezone: 'America/Sao_Paulo',
      offset: '-03:00',
      duracaoPadraoMin: 60,
      passoMin: 30,
      expediente: { '1': [['08:00', '18:00']], '2': [['08:00', '18:00']], '3': [['08:00', '18:00']], '4': [['08:00', '18:00']], '5': [['08:00', '18:00']], '6': [['08:00', '12:00']], '0': [] },
      compromissos: [],
    };
  }
}

let AG = carregar();

function recarregar() { AG = carregar(); return AG; }
function atendente() { return AG.atendente || 'Atendente'; }
function duracaoPadrao() { return AG.duracaoPadraoMin || 60; }
function offset() { return AG.offset || '-03:00'; }
function timezone() { return AG.timezone || 'America/Sao_Paulo'; }

// ---- Partes locais (dia da semana + minutos do dia) no fuso configurado ----
function partesLocais(date) {
  const s = date.toLocaleString('en-US', { timeZone: timezone() });
  const d = new Date(s);
  return { dow: d.getDay(), min: d.getHours() * 60 + d.getMinutes() };
}

function hhmmParaMin(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

// Slot [inicio, fim) cabe em alguma janela de expediente do dia?
function dentroExpediente(inicio, fim) {
  const pI = partesLocais(inicio);
  const janelas = (AG.expediente && AG.expediente[String(pI.dow)]) || [];
  const durMin = Math.round((fim - inicio) / 60000);
  const fimMin = pI.min + durMin;
  return janelas.some(([ini, f]) => pI.min >= hhmmParaMin(ini) && fimMin <= hhmmParaMin(f));
}

// Conflito com algum compromisso existente?
function haConflito(inicio, fim) {
  return (AG.compromissos || []).some((c) => {
    const ci = new Date(c.inicio).getTime();
    const cf = new Date(c.fim).getTime();
    return inicio.getTime() < cf && fim.getTime() > ci;
  });
}

function estaLivre(inicio, durMin) {
  const fim = new Date(inicio.getTime() + durMin * 60000);
  return dentroExpediente(inicio, fim) && !haConflito(inicio, fim);
}

// Proximo(s) horario(s) livre(s) a partir de uma data
function proximosLivres(durMin, quantos, aPartirDe) {
  const passo = (AG.passoMin || 30) * 60000;
  let t = new Date(Math.max(Date.now(), (aPartirDe ? aPartirDe.getTime() : 0)));
  // arredonda pra cima no passo
  t = new Date(Math.ceil(t.getTime() / passo) * passo);
  const limite = t.getTime() + 14 * 24 * 60 * 60 * 1000; // ate 14 dias
  const achados = [];
  while (t.getTime() <= limite && achados.length < quantos) {
    if (estaLivre(t, durMin)) achados.push(new Date(t));
    t = new Date(t.getTime() + passo);
  }
  return achados;
}

// ---- Formatacao ----
function fmtCurto(date) {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: timezone(), weekday: 'short', day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit',
  }).format(date);
}
function fmtHumano(date) {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: timezone(), weekday: 'long', day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit',
  }).format(date);
}

// ---- Avaliacao de um pedido de agendamento ----
// Retorna { bloco (texto p/ relatorio), resposta (texto p/ enviar ao cliente) }
function avaliarPedido({ dataISO, duracaoMin, nomeCliente }) {
  const dur = duracaoMin || duracaoPadrao();
  const quem = atendente();
  const cliente = nomeCliente ? nomeCliente.split(' ')[0] : '';

  const dt = dataISO ? new Date(dataISO) : null;
  const dataValida = dt && !isNaN(dt.getTime());

  if (dataValida) {
    if (estaLivre(dt, dur)) {
      return {
        bloco: '🗓️ Agenda (' + quem + '): ✅ DISPONÍVEL em ' + fmtCurto(dt),
        fala: 'O horário pedido, ' + fmtHumano(dt) + ', está livre na agenda da ' + quem + '.',
        resposta: 'Perfeito' + (cliente ? ', ' + cliente : '') + '! Consigo encaixar você com a ' + quem +
          ' em ' + fmtHumano(dt) + '. Posso confirmar esse horário?',
      };
    }
    const motivo = haConflito(dt, new Date(dt.getTime() + dur * 60000)) ? 'horário já ocupado' : 'fora do expediente';
    const sug = proximosLivres(dur, 3, dt);
    return {
      bloco: '🗓️ Agenda (' + quem + '): ❌ INDISPONÍVEL (' + motivo + ') para ' + fmtCurto(dt) +
        '\n   Sugestões livres: ' + (sug.map(fmtCurto).join('  |  ') || 'nenhuma nos próximos 14 dias'),
      fala: 'O horário pedido está ' + (motivo === 'horário já ocupado' ? 'ocupado' : 'fora do expediente') +
        '. Sugeri outros horários livres.',
      resposta: 'Obrigado' + (cliente ? ', ' + cliente : '') + '! Nesse horário a agenda da ' + quem +
        ' está ' + (motivo === 'horário já ocupado' ? 'ocupada' : 'fora do atendimento') +
        '. Consigo estes horários: ' + sug.map(fmtHumano).join('; ') + '. Qual fica melhor pra você?',
    };
  }

  // Cliente pediu agendamento mas sem horario especifico
  const sug = proximosLivres(dur, 3);
  return {
    bloco: '🗓️ Agenda (' + quem + '): horários livres -> ' + (sug.map(fmtCurto).join('  |  ') || 'nenhum nos próximos 14 dias'),
    fala: 'O cliente não indicou horário. Sugeri as próximas vagas livres da ' + quem + '.',
    resposta: 'Claro' + (cliente ? ', ' + cliente : '') + '! A ' + quem + ' tem estes horários disponíveis: ' +
      sug.map(fmtHumano).join('; ') + '. Qual prefere?',
  };
}

module.exports = {
  recarregar, atendente, duracaoPadrao, offset, timezone,
  estaLivre, proximosLivres, avaliarPedido, fmtCurto, fmtHumano,
};
