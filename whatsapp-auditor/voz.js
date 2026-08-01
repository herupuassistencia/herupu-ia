// ============================================================
//  HERUPU JARVIS - Modulo de Voz
//
//  OUVIR  (STT): transcreve audios que os clientes enviam no WhatsApp.
//  FALAR  (TTS): fala em voz alta as solicitacoes (como um secretario).
//
//  STT engines:  auto | openai | local | off
//     - openai: Whisper API (barato, ~centavos/min). Usa OPENAI_API_KEY.
//     - local : comando 'whisper' instalado na maquina (gratis, precisa ffmpeg).
//     - auto  : usa openai se houver chave, senao local.
//  Falar (TTS na propria maquina):
//     - Windows: usa a voz do sistema (System.Speech) — gratis.
//     - Linux/Mac: usa 'espeak-ng' se instalado — gratis.
// ============================================================

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, execFile } = require('child_process');

const CFG = {
  sttEngine: process.env.STT_ENGINE || 'auto',
  vozSaida: process.env.VOZ_SAIDA || 'pc', // pc | off
  openaiKey: process.env.OPENAI_API_KEY || '',
  whisperBin: process.env.WHISPER_BIN || 'whisper',
  whisperModel: process.env.WHISPER_MODEL || 'small',
  vozNome: process.env.VOZ_NOME || '', // nome da voz do sistema (opcional)
};

function sttAtivo() {
  const eng = CFG.sttEngine === 'auto' ? (CFG.openaiKey ? 'openai' : 'local') : CFG.sttEngine;
  return eng;
}

// ---------- OUVIR: transcricao ----------
async function transcrever(buffer, mimetype) {
  const eng = sttAtivo();
  if (eng === 'off') return null;
  const ext = /wav/.test(mimetype || '') ? 'wav' : 'ogg';
  const tmp = path.join(os.tmpdir(), 'jarvis-audio-' + Date.now() + '.' + ext);
  fs.writeFileSync(tmp, buffer);
  try {
    return eng === 'openai' ? await sttOpenAI(tmp) : await sttLocal(tmp);
  } finally {
    try { fs.unlinkSync(tmp); } catch (_) {}
  }
}

async function sttOpenAI(filePath) {
  if (!CFG.openaiKey) throw new Error('OPENAI_API_KEY ausente para transcricao');
  const buf = fs.readFileSync(filePath);
  const form = new FormData();
  form.append('file', new Blob([buf]), path.basename(filePath));
  form.append('model', 'whisper-1');
  form.append('language', 'pt');
  const r = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + CFG.openaiKey },
    body: form,
  });
  if (!r.ok) throw new Error('Whisper ' + r.status + ': ' + (await r.text()));
  const j = await r.json();
  return (j.text || '').trim();
}

function sttLocal(filePath) {
  return new Promise((resolve, reject) => {
    const outDir = path.dirname(filePath);
    const args = [filePath, '--model', CFG.whisperModel, '--language', 'Portuguese',
      '--output_format', 'txt', '--output_dir', outDir, '--fp16', 'False'];
    const opts = { timeout: 180000 };
    if (process.platform === 'win32') opts.shell = true;
    execFile(CFG.whisperBin, args, opts, (err) => {
      if (err) return reject(new Error('whisper local: ' + err.message));
      const txt = filePath.replace(path.extname(filePath), '') + '.txt';
      try {
        const t = fs.readFileSync(txt, 'utf8').trim();
        try { fs.unlinkSync(txt); } catch (_) {}
        resolve(t);
      } catch (e) { reject(e); }
    });
  });
}

// ---------- FALAR: voz na propria maquina ----------
function falar(texto) {
  return new Promise((resolve) => {
    if (CFG.vozSaida === 'off' || !texto) return resolve();
    let child;
    try {
      if (process.platform === 'win32') {
        // Le o texto do stdin -> sem problemas de escape
        const nome = CFG.vozNome ? "$s.SelectVoice('" + CFG.vozNome + "');" : '';
        const ps = 'Add-Type -AssemblyName System.Speech; $s = New-Object System.Speech.Synthesis.SpeechSynthesizer; ' +
          nome + ' $s.Rate = 0; $t = [Console]::In.ReadToEnd(); $s.Speak($t);';
        child = spawn('powershell', ['-NoProfile', '-Command', ps]);
      } else {
        // Linux/Mac: espeak-ng (gratis). Instale com: sudo apt install espeak-ng
        child = spawn('espeak-ng', ['-v', 'pt-br', '--stdin']);
      }
      child.on('error', (e) => { console.error('[VOZ] falha:', e.message); resolve(); });
      child.on('close', () => resolve());
      child.stdin.write(texto);
      child.stdin.end();
    } catch (e) {
      console.error('[VOZ] erro:', e.message);
      resolve();
    }
  });
}

module.exports = { transcrever, falar, sttAtivo };
