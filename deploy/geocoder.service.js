/**
 * Geocoder — converte endereço em coordenadas (lat/lng) para o mapa e o dispatch.
 * Usa OpenStreetMap Nominatim (gratuito, sem chave).
 *
 * 2026-11-21: tentativas em cascata. A consulta única com complemento/bairro/CEP
 * ("Av. X, 3150 - Casa - Jardim Felicidade, Macapá, AP, 68909009") muitas vezes
 * não retorna nada no Nominatim. Agora tenta, em ordem:
 *   1) rua + número + cidade/UF      2) rua + cidade/UF
 *   3) bairro + cidade/UF             4) CEP (busca estruturada)
 *   5) centro da cidade (aproximado — melhor um pino na cidade que nenhum)
 *
 * Política de uso: <=1 req/s — cache em memória + espaçamento entre chamadas.
 */

const CACHE = new Map();   // key: consulta-normalizada -> { lat, lng, ts } | { vazio, ts }
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 dias

let ultimaChamada = 0;
const MIN_GAP_MS = 1100;   // ~1 req/s

function normalizar(s) {
  return String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

async function esperarRateLimit() {
  const gap = Date.now() - ultimaChamada;
  if (gap < MIN_GAP_MS) await new Promise((r) => setTimeout(r, MIN_GAP_MS - gap));
  ultimaChamada = Date.now();
}

/** Separa "Rua X, 123 - Casa - Bairro" em { rua, numero, bairro }. */
function decompor(endereco) {
  const s = String(endereco || '').replace(/\(.*?\)/g, ' ').trim();
  if (!s) return { rua: '', numero: '', bairro: '' };
  const [antesVirgula, ...resto] = s.split(',');
  // formato do GPS: "Rua X - Bairro, 123"  |  formato do cadastro: "Rua X, 123 - Compl - Bairro"
  const [rua, ...bairroAntes] = antesVirgula.split(' - ').map((x) => x.trim());
  const depois = resto.join(',').trim();
  const numero = (depois.match(/^\s*(\d+[a-zA-Z]?)/) || [])[1] || '';
  const pedacos = depois.split(' - ').map((x) => x.trim()).filter(Boolean);
  const bairro = bairroAntes.length ? bairroAntes.join(' - ') : (pedacos.length > 1 ? pedacos[pedacos.length - 1] : '');
  return { rua, numero, bairro };
}

async function consultar(params) {
  const qs = new URLSearchParams({ format: 'jsonv2', limit: '1', countrycodes: 'br', ...params });
  const key = normalizar(qs.toString());
  const hit = CACHE.get(key);
  if (hit && Date.now() - hit.ts < CACHE_TTL_MS) {
    return hit.vazio ? null : { latitude: hit.lat, longitude: hit.lng, cached: true };
  }
  await esperarRateLimit();
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/search?${qs}`, {
      headers: { 'User-Agent': 'HERUPU-Platform/2.0 (suporte@herupu.com.br)', 'Accept-Language': 'pt-BR' },
    });
    if (!r.ok) return null;
    const arr = await r.json();
    const lat = Number(arr?.[0]?.lat);
    const lng = Number(arr?.[0]?.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      CACHE.set(key, { vazio: true, ts: Date.now() });
      return null;
    }
    CACHE.set(key, { lat, lng, ts: Date.now() });
    return { latitude: lat, longitude: lng, cached: false };
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[geocoder] falha:', e.message);
    return null;
  }
}

/**
 * Geocodifica um endereço. Retorna { latitude, longitude, precisao } ou null.
 * precisao: 'endereco' | 'rua' | 'bairro' | 'cep' | 'cidade'
 */
async function geocodificar(partes) {
  const d = decompor(partes.endereco);
  const rua = d.rua;
  const numero = String(partes.numero || d.numero || '').trim();
  const bairro = String(partes.bairro || d.bairro || '').trim();
  const cidade = String(partes.cidade || '').trim();
  const estado = String(partes.estado || '').trim();
  const cep = String(partes.cep || '').replace(/\D/g, '');
  const local = [cidade, estado, 'Brasil'].filter(Boolean).join(', ');

  const tentativas = [];
  if (rua && numero && cidade) tentativas.push(['endereco', { q: `${rua}, ${numero}, ${local}` }]);
  if (rua && cidade) tentativas.push(['rua', { q: `${rua}, ${local}` }]);
  if (bairro && cidade) tentativas.push(['bairro', { q: `${bairro}, ${local}` }]);
  if (cep.length === 8) tentativas.push(['cep', { postalcode: `${cep.slice(0, 5)}-${cep.slice(5)}`, country: 'Brasil' }]);
  if (cidade) tentativas.push(['cidade', { q: local }]);
  // último recurso: o texto como veio (compatível com o comportamento antigo)
  if (!tentativas.length && partes.endereco) tentativas.push(['endereco', { q: [partes.endereco, local].filter(Boolean).join(', ') }]);

  for (const [precisao, params] of tentativas) {
    const r = await consultar(params);
    if (r) return { ...r, precisao };
  }
  return null;
}

/**
 * Garantir coords: usa as informadas se válidas; senão tenta geocodificar.
 */
async function garantirCoords(payload) {
  const lat = Number(payload.latitude);
  const lng = Number(payload.longitude);
  if (Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0) {
    return { latitude: lat, longitude: lng, fonte: 'cliente' };
  }
  const out = await geocodificar(payload);
  if (!out) return { latitude: null, longitude: null, fonte: 'nao_encontrado' };
  return { latitude: out.latitude, longitude: out.longitude, precisao: out.precisao, fonte: out.cached ? 'cache' : 'nominatim' };
}

module.exports = { geocodificar, garantirCoords, decompor };
