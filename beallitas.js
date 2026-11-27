// Napi Hírek – készülékenkénti beállítások (értesítés-szűrők, csendes idő, kulcsszavak, riasztások, figyelőlista).
// Az alkalmazás titkosítva menti őket a repó „beallitasok” ágára (<készülék-azonosító>.enc).
// A kulcs a készülék saját értesítési kulcsából készül, ami csak a telefonon és a PUSH_CONFIG titokban van meg,
// így a nyilvános repóban senki más nem tudja elolvasni.
'use strict';
const crypto = require('node:crypto');

const DEFAULTS = {
  v: 1,
  newsNotif: true,                       // értesítés az új hírekről
  summary: true,                         // értesítés a reggeli/esti összefoglalóról
  sections: { hu_pol: true, world: true, hu_mkt: true, w_mkt: true },
  sources: {},                           // forrásnév → false, ha ki van kapcsolva
  quiet: { on: false, from: 23, to: 7 }, // csendes idő: ekkor csak kulcsszavas hír és árfolyam-riasztás jön
  keywords: [],
  watch: [],                             // [{ sym: 'TSLA', name: 'Tesla' }]
  alerts: [],                            // [{ id, name, kind: 'above'|'below'|'move', value }]
};

const deviceId = (cfg) => crypto.createHash('sha256').update(String(cfg && cfg.sub && cfg.sub.endpoint || '')).digest('hex').slice(0, 16);
const keyOf = (cfg) => crypto.createHash('sha256').update(String(cfg.vapidPrivate || ''), 'utf8').digest();

function decrypt(cfg, b64) {
  const buf = Buffer.from(String(b64).trim(), 'base64');
  const iv = buf.subarray(0, 12), tag = buf.subarray(buf.length - 16), ct = buf.subarray(12, buf.length - 16);
  const d = crypto.createDecipheriv('aes-256-gcm', keyOf(cfg), iv); d.setAuthTag(tag);
  return JSON.parse(Buffer.concat([d.update(ct), d.final()]).toString('utf8'));
}
function encrypt(cfg, obj) {   // (teszteléshez)
  const iv = crypto.randomBytes(12), c = crypto.createCipheriv('aes-256-gcm', keyOf(cfg), iv);
  const ct = Buffer.concat([c.update(JSON.stringify(obj), 'utf8'), c.final()]);
  return Buffer.concat([iv, ct, c.getAuthTag()]).toString('base64');
}

function merge(s) {
  const o = JSON.parse(JSON.stringify(DEFAULTS));
  if (!s || typeof s !== 'object') return o;
  for (const k of Object.keys(o)) if (s[k] !== undefined) o[k] = (typeof o[k] === 'object' && !Array.isArray(o[k])) ? { ...o[k], ...s[k] } : s[k];
  o.keywords = (Array.isArray(o.keywords) ? o.keywords : []).map(String).map((x) => x.trim()).filter(Boolean).slice(0, 50);
  o.watch = (Array.isArray(o.watch) ? o.watch : []).filter((w) => w && w.sym).slice(0, 20).map((w) => ({ sym: String(w.sym).trim().toUpperCase(), name: String(w.name || w.sym).trim() }));
  o.alerts = (Array.isArray(o.alerts) ? o.alerts : []).filter((a) => a && a.name && ['above', 'below', 'move'].includes(a.kind) && isFinite(+a.value)).slice(0, 30);
  return o;
}

// Minden készülék beállításainak betöltése (a GitHubon fut; helyben a BEALLITAS_DIR mappából is olvas)
async function loadAll(cfgs, get) {
  const repo = process.env.GITHUB_REPOSITORY, out = new Map();
  for (const c of cfgs) {
    const id = deviceId(c); let s = null;
    try {
      let txt = null;
      if (process.env.BEALLITAS_DIR) { try { txt = require('node:fs').readFileSync(require('node:path').join(process.env.BEALLITAS_DIR, id + '.enc'), 'utf8'); } catch (e) {} }
      else if (repo) { const r = await get('https://raw.githubusercontent.com/' + repo + '/beallitasok/' + id + '.enc?t=' + Date.now()); if (r.ok) txt = await r.text(); }
      if (txt) s = decrypt(c, txt);
    } catch (e) { console.warn('Beállítás nem olvasható (' + id + '):', e.message); }
    out.set(id, merge(s));
  }
  return out;
}

// Budapesti óra → csendes időben vagyunk-e
function inQuiet(s, date = new Date()) {
  if (!s.quiet || !s.quiet.on) return false;
  const h = +date.toLocaleString('en-GB', { timeZone: 'Europe/Budapest', hour: '2-digit', hour12: false }).slice(0, 2);
  const f = +s.quiet.from, t = +s.quiet.to;
  return f === t ? false : f < t ? (h >= f && h < t) : (h >= f || h < t);
}

// Ékezet- és kisbetű-független kulcsszó-egyezés
const fold = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
function keywordHit(s, text) {
  const t = fold(text);
  return (s.keywords || []).find((k) => { const kk = fold(k); return kk && new RegExp('(^|[^a-z0-9])' + kk.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(t); }) || null;
}

module.exports = { DEFAULTS, deviceId, decrypt, encrypt, merge, loadAll, inQuiet, keywordHit, fold };
