#!/usr/bin/env node
// Napi Hírek – folyamatos frissítés (a GitHub Actions 5 percenként indítja, egy futás kb. 4,5 perc, PERCENKÉNT dolgozik).
// Minden körben:
//   • hírek: új, témába vágó hírek → értesítés (készülékenként a saját szűrők, csendes idő és kulcsszavak szerint;
//     ha több lap ugyanarról ír, csak EGY értesítés megy „+N lap” jelöléssel)
//   • árfolyamok (+ a figyelőlisták szimbólumai) → árfolyam-riasztások
//   • gazdasági naptár (félóránként)
//   • minden adat feltöltése az „arfolyam” ágra (hirek.json, quotes.json, naptar.json) – innen frissül az alkalmazás
'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { STATUS, FEEDS, SECTIONS, QUOTES, readFeeds, readQuotes, sendPushDevice: sendPushDevice0, pushConfigs, get } = require('./gen.js');
const A = require('./adatok.js');
const B = require('./beallitas.js');

const STATE_FILE = process.env.SEEN_FILE || 'seen.json';
const RUN_MS = (+process.env.FUTASI_PERC || 4.5) * 60e3;
const STEP_MS = (+process.env.LEPES_MP || 60) * 1e3;
const MAX_PER_ROUND = 15;
const ICON = { ...Object.fromEntries(SECTIONS.map(([k, ic]) => [k, ic])), own: '⭐' };
const bpNow = () => { const d = new Date(), f = (o) => d.toLocaleString('en-GB', { timeZone: 'Europe/Budapest', ...o }); return { date: d.toLocaleDateString('en-CA', { timeZone: 'Europe/Budapest' }), h: +f({ hour: '2-digit', hour12: false }).slice(0, 2), m: +f({ minute: '2-digit' }), dow: f({ weekday: 'short' }) }; };
const ERRORS = [];
const logErr = (m) => { ERRORS.unshift({ t: Date.now(), m: String(m).slice(0, 160) }); ERRORS.length = Math.min(ERRORS.length, 15); };
const APP = process.env.APP_URL || './';
const key = (it) => (it.link || '').replace(/[?#].*$/, '').toLowerCase() || it.source + '|' + it.title.toLowerCase();
const fmt = (n) => n == null ? '–' : n.toLocaleString('hu-HU', { maximumFractionDigits: n >= 1000 ? 0 : n >= 10 ? 2 : 4 });

// ---------- témaszűrő (magyar lapok nem politikai/gazdasági rovatai kimaradnak) ----------
const OFF_TOPIC = /(^|[\/\s,-])(sport|foci|futball|kultur|kultura|kultúra|szorakozas|szórakozás|eletmod|életmód|egeszseg|egészség|celeb|bulvar|bulvár|sztar|sztár|gasztro|utazas|utazás|tech|tudomany|tudomány|auto|autó|totalcar|velemeny|vélemény|horoszkop|horoszkóp|idojaras|időjárás|kepek|képek|video|videó|podcast|recept|divat|lakberendezes|lakberendezés|hobbi|jatek|játék|film|zene|konyv|könyv|tv|sorozat|kvíz|kviz|szex|parkapcsolat|párkapcsolat)([\/\s,-]|$)/i;
function onTopic(it) {
  if (it.sec !== 'hu_pol') return true;
  let p = ''; try { p = new URL(it.link).pathname.split('/').slice(1, 3).join('/'); } catch (e) {}
  if (OFF_TOPIC.test('/' + p + '/')) return false;
  return !(it.cats || []).some((c) => OFF_TOPIC.test(' ' + c + ' '));
}

// ---------- azonos esemény felismerése (több lap ugyanarról) ----------
const STOP = new Set('hogy mint után előtt miatt szerint között ellen alatt felett nincs lesz volt lett most még már csak akár ezért mert vagy illetve valamint amely amelyet akik aki ahol amikor mindig minden egyik másik után után 2025 2026 2027 with from that this have will been were their about after into over says said than more most what when which while'.split(' ').map(B.fold));
function tokens(t) { return [...new Set(B.fold(t).replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length >= 4 && !STOP.has(w)).map((w) => w.slice(0, 6)))]; }
function similar(a, b) { const s = new Set(a); let n = 0; for (const w of b) if (s.has(w)) n++; return n >= 2 && n / Math.max(1, Math.min(a.length, b.length)) >= 0.5; }

// ---------- feltöltés az „arfolyam” ágra (mindig egyetlen commit marad) ----------
const PUB_DIR = path.join(os.tmpdir(), 'hirapp-elo');
function publish(files) {
  const repo = process.env.GITHUB_REPOSITORY, token = process.env.GH_TOKEN;
  fs.mkdirSync(PUB_DIR, { recursive: true });
  for (const [name, data] of Object.entries(files)) fs.writeFileSync(path.join(PUB_DIR, name), JSON.stringify(data));
  if (!repo || !token) return;
  const git = (...a) => execFileSync('git', a, { cwd: PUB_DIR, stdio: 'pipe' });
  const id = ['-c', 'user.name=hirapp-bot', '-c', 'user.email=hirapp-bot@users.noreply.github.com'];
  try {
    if (!fs.existsSync(path.join(PUB_DIR, '.git'))) git('init', '-q', '-b', 'arfolyam');
    git('add', '-A'); git(...id, 'commit', '-q', '--allow-empty', '-m', 'élő adatok');
    const c = git(...id, 'commit-tree', git('rev-parse', 'HEAD^{tree}').toString().trim(), '-m', 'élő adatok').toString().trim();
    git('push', '-q', '-f', 'https://x-access-token:' + token + '@github.com/' + repo + '.git', c + ':refs/heads/arfolyam');
  } catch (e) { console.warn('Feltöltés hiba:', String(e.stderr || e.message).slice(0, 300)); }
}

// ---------- gazdasági naptár (ForexFactory heti naptár; ha nem elérhető, kimarad) ----------
async function readCalendar() {
  const out = [];
  for (const w of ['thisweek', 'nextweek']) {
    try {
      const r = await get('https://nfs.faireconomy.media/ff_calendar_' + w + '.json');
      if (!r.ok) continue;
      for (const e of await r.json()) {
        if (!['High', 'Medium'].includes(e.impact) || !['USD', 'EUR', 'GBP', 'CNY', 'JPY', 'CHF'].includes(e.country)) continue;
        out.push({ t: e.date, c: e.country, title: e.title, imp: e.impact, fc: e.forecast || '', prev: e.previous || '', act: e.actual || '' });
      }
    } catch (e) { console.warn('Naptár hiba:', e.message); }
  }
  return out.sort((a, b) => Date.parse(a.t) - Date.parse(b.t));
}

let pushCount = null;
async function sendPushDevice(c, payloads, ttl) { const n = await sendPushDevice0(c, payloads, ttl); if (pushCount) { const d = bpNow().date; if (pushCount.date !== d) { pushCount.date = d; pushCount.n = 0; } pushCount.n += n; } return n; }
const pct = (x) => (x > 0 ? '+' : '') + x.toFixed(2).replace('.', ',') + '%';

(async () => {
  const t0 = Date.now();
  let st = null; try { st = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); } catch (e) {}
  if (Array.isArray(st)) st = { seen: st };                      // régi formátum
  let first = !st || !Array.isArray(st.seen);
  st = { seen: [], alerts: {}, recent: [], times: {}, ...(st || {}) };
  st.times = st.times || {}; st.push = st.push || { date: '', n: 0 }; pushCount = st.push;
  const seenSet = new Set(st.seen);
  const cfgs = pushConfigs();
  let settings = new Map(), latest = [], quotes = null, calendar = null, charts = null, macro = null, polls = null, round = 0;
  // a korábban közzétett adatok visszatöltése (így a ritkán frissülők nem tűnnek el, és nem kell mindent újra letölteni)
  const prevFile = async (name) => {
    try {
      if (process.env.GITHUB_REPOSITORY) { const r = await get('https://raw.githubusercontent.com/' + process.env.GITHUB_REPOSITORY + '/arfolyam/' + name + '?t=' + Date.now()); if (r.ok) return await r.json(); }
      else return JSON.parse(fs.readFileSync(path.join(PUB_DIR, name), 'utf8'));
    } catch (e) {}
    return null;
  };
  { const h = await prevFile('hirek.json'); if (h) latest = h.items || []; }
  { const c = await prevFile('charts.json'); if (c) charts = c.charts || null; }
  { const m = await prevFile('makro.json'); if (m) macro = m.items || null; }
  { const k = await prevFile('kozvelemeny.json'); if (k) polls = k; }
  { const n = await prevFile('naptar.json'); if (n) calendar = n.events || null; }
  const due = (k, ms) => !st.times[k] || Date.now() - st.times[k] > ms;

  for (;;) {
    round++;
    const rs = Date.now();
    try {
      if (round === 1 || round % 5 === 0) settings = await B.loadAll(cfgs, get);

      // 1) hírek
      const all = [];
      for (const k of Object.keys(FEEDS)) (await readFeeds(FEEDS[k], 12)).forEach((it) => all.push({ ...it, sec: k }));
      // saját források (készülékenként beállítva): név → mely készülékekhez tartozik
      const ownMap = new Map();
      settings.forEach((s, id) => s.feeds.forEach((f) => { const k2 = f.name + '\u0000' + f.url; if (!ownMap.has(k2)) ownMap.set(k2, { f, ids: new Set() }); ownMap.get(k2).ids.add(id); }));
      const owners = new Map();
      if (ownMap.size) {
        const list = [...ownMap.values()].map((x) => [x.f.name, x.f.url]);
        (await readFeeds(list, 24)).forEach((it) => all.push({ ...it, sec: 'own' }));
        ownMap.forEach((x) => owners.set(x.f.name, x.ids));
      }
      const topical = all.filter(onTopic);
      const fresh = topical.filter((it) => !seenSet.has(key(it))).sort((a, b) => (Date.parse(a.date || 0) || 0) - (Date.parse(b.date || 0) || 0));
      fresh.forEach((it) => { seenSet.add(key(it)); st.seen.push(key(it)); });
      if (st.seen.length > 6000) st.seen = st.seen.slice(-5000);

      const byKey = new Map(latest.map((x) => [x.k, x]));
      topical.forEach((it) => { const k = key(it); if (!byKey.has(k)) byKey.set(k, { k, t: it.date || new Date().toISOString(), title: it.title, source: it.source, link: it.link, sec: it.sec, d: (it.desc || '').slice(0, 160) }); });
      latest = [...byKey.values()].sort((a, b) => Date.parse(b.t) - Date.parse(a.t)).slice(0, 300);

      // azonos események csoportosítása; ami az elmúlt 3 órában már ment, az nem megy újra
      st.recent = (st.recent || []).filter((r) => Date.now() - r.t < 3 * 3600e3);
      const clusters = [];
      for (const it of fresh) {
        const tk = tokens(it.title);
        if (st.recent.some((r) => similar(r.tk, tk))) continue;
        const cl = clusters.find((c) => similar(c.tk, tk));
        if (cl) cl.items.push(it); else clusters.push({ tk, items: [it] });
      }
      clusters.forEach((c) => st.recent.push({ tk: c.tk, t: Date.now() }));

      if (first) { console.log('Első futás: ' + fresh.length + ' hír megjegyezve (értesítés nélkül).'); }
      else for (const c of cfgs) {
        const s = settings.get(B.deviceId(c)) || B.merge(null), quiet = B.inQuiet(s), out = [];
        for (const cl of clusters) {
          const items = cl.items.filter((it) => (it.sec === 'own' ? (owners.get(it.source) || new Set()).has(B.deviceId(c)) : s.sections[it.sec] !== false && s.sources[it.source] !== false));
          if (!items.length) continue;
          const kw = items.map((it) => B.keywordHit(s, it.title + ' ' + (it.desc || ''))).find(Boolean);
          if (!kw && (!s.newsNotif || quiet)) continue;
          const lead = items[0], others = [...new Set(items.slice(1).map((x) => x.source).filter((x) => x !== lead.source))];
          out.push({
            title: (kw ? '🔔 ' + kw + ' · ' : (ICON[lead.sec] || '📰') + ' ') + lead.source + (others.length ? ' +' + others.length : ''),
            body: lead.title + (others.length ? '\n(' + others.join(', ') + ')' : ''),
            url: lead.link || APP, tag: 'h-' + Buffer.from(key(lead)).toString('base64').slice(-40),
          });
        }
        const send = out.slice(-MAX_PER_ROUND);
        if (out.length > send.length) send.unshift({ title: '📰 Napi Hírek', body: '+' + (out.length - send.length) + ' további új hír – nyisd meg az alkalmazást.', url: APP, tag: 'h-tobb' });
        if (send.length) console.log(new Date().toISOString().slice(11, 19) + ' ' + B.deviceId(c) + ': ' + (await sendPushDevice(c, send)) + ' / ' + send.length + ' hír-értesítés elküldve');
      }
      first = false;

      // 2) árfolyamok + figyelőlisták + riasztások
      const extra = new Map();
      settings.forEach((s) => s.watch.forEach((w) => { if (!extra.has(w.sym)) extra.set(w.sym, [w.name, w.sym, 'wl']); }));
      const q = await readQuotes([...extra.values()].slice(0, 30)); if (q.length) quotes = q;
      if (quotes) for (const c of cfgs) {
        const s = settings.get(B.deviceId(c)); if (!s || !s.alerts.length) continue;
        const out = [];
        for (const a of s.alerts) {
          const x = quotes.find((qq) => qq.name === a.name || qq.sym === a.name); if (!x || x.price == null) continue;
          const v = +a.value, hit = a.kind === 'above' ? x.price >= v : a.kind === 'below' ? x.price <= v : (x.chg != null && Math.abs(x.chg) >= v);
          const sk = B.deviceId(c) + ':' + a.id + ':' + (a.kind === 'move' ? new Date().toISOString().slice(0, 10) : '');
          if (hit && !st.alerts[sk]) {
            st.alerts[sk] = Date.now();
            const what = a.kind === 'above' ? 'elérte: ' + fmt(v) : a.kind === 'below' ? 'leesett: ' + fmt(v) + ' alá' : (x.chg > 0 ? '+' : '') + x.chg.toFixed(2).replace('.', ',') + '% ma';
            out.push({ title: '🚨 ' + x.name + ' ' + what, body: 'Jelenlegi ár: ' + fmt(x.price) + ' ' + (x.unit || '') + (x.chg != null ? ' (' + (x.chg > 0 ? '+' : '') + x.chg.toFixed(2).replace('.', ',') + '%)' : ''), url: APP + '#arfolyamok', tag: 'a-' + a.id });
          } else if (!hit && a.kind !== 'move') delete st.alerts[sk];
        }
        if (out.length) console.log('Riasztás ' + B.deviceId(c) + ': ' + (await sendPushDevice(c, out, 6 * 3600)));
      }
      for (const k of Object.keys(st.alerts)) if (Date.now() - st.alerts[k] > 3 * 86400e3) delete st.alerts[k];

      // ha a GitHub kihagyta a reggeli/esti összefoglaló időzítését, itt pótoljuk (7:20 után / 18:20 után)
      if (process.env.GITHUB_REPOSITORY && process.env.GH_TOKEN && round % 3 === 1) {
        const b2 = bpNow(), mins = b2.h * 60 + b2.m;
        const want = mins >= 18 * 60 + 20 ? 'este' : mins >= 7 * 60 + 20 ? 'reggel' : '';
        const tk = 'sum-' + b2.date + '-' + want;
        if (want && !st.times[tk]) {
          try {
            const r = await get('https://raw.githubusercontent.com/' + process.env.GITHUB_REPOSITORY + '/main/data/latest.json?t=' + Date.now());
            const lj = r.ok ? await r.json() : null;
            if (lj && lj.id === b2.date + '-' + want) st.times[tk] = Date.now();
            else if (lj) {
              st.times[tk] = Date.now();
              execFileSync('gh', ['workflow', 'run', 'hirek.yml', '--repo', process.env.GITHUB_REPOSITORY, '-f', 'tipus=' + want], { stdio: 'pipe', env: process.env });
              st.sumLog = { t: Date.now(), kind: want }; console.log('Elmaradt ' + want + 'i összefoglaló – elindítva.');
            }
          } catch (e) { logErr('Összefoglaló pótlása: ' + String(e.stderr || e.message).slice(0, 120)); }
        }
      }

      // tőzsdezárás-összegzés hétköznap 17:10 és 17:59 között (egyszer naponta)
      const bp = bpNow();
      if (quotes && !['Sat', 'Sun'].includes(bp.dow) && bp.h === 17 && bp.m >= 10 && st.times.closeDay !== bp.date) {
        st.times.closeDay = bp.date;
        const Q = (n) => quotes.find((x) => x.name === n), bux = Q('BUX');
        if (bux && bux.mt && Date.now() - bux.mt * 1000 < 10 * 3600e3) {   // ha ma nem volt kereskedés (ünnep), nem küldünk
          const line = ['BUX', 'OTP', 'MOL', 'Richter', 'Magyar Telekom', 'EUR/HUF'].map((n) => { const x = Q(n); return x && x.chg != null ? n + ' ' + pct(x.chg) : null; }).filter(Boolean).join(' · ');
          const toHUF = (u) => ({ HUF: 1, Ft: 1, USD: (Q('USD/HUF') || {}).price, EUR: (Q('EUR/HUF') || {}).price, GBP: (Q('GBP/HUF') || {}).price, CHF: (Q('CHF/HUF') || {}).price }[u] || (u === 'GBp' && Q('GBP/HUF') ? Q('GBP/HUF').price / 100 : null));
          for (const c of cfgs) {
            const s = settings.get(B.deviceId(c)); if (s && !s.closeNotif) continue;
            let pfTxt = '';
            if (s && s.pf.length) {
              let v = 0, d = 0;
              for (const h of s.pf) { const x = Q(h.name); const m = x && toHUF(x.unit); if (!m) continue; const val = h.qty * x.price * m; v += val; if (x.chg != null) d += val - val / (1 + x.chg / 100); }
              if (v) pfTxt = '\n💼 Portfólió: ' + Math.round(v).toLocaleString('hu-HU') + ' Ft (ma ' + (d >= 0 ? '+' : '−') + Math.abs(Math.round(d)).toLocaleString('hu-HU') + ' Ft)';
            }
            await sendPushDevice(c, [{ title: '🔔 Tőzsdezárás – Budapest', body: line + pfTxt, url: APP + '#arfolyamok', tag: 'zaras-' + bp.date }], 6 * 3600);
          }
          console.log('Tőzsdezárás-összegzés elküldve.');
        } else console.log('Ma nem volt kereskedés a BÉT-en – nincs zárás-összegzés.');
      }

      // 3) ritkábban frissülő adatok
      if (due('cal', 30 * 60e3)) { st.times.cal = Date.now(); const cal = await readCalendar(); if (cal.length) calendar = cal; }
      const syms = QUOTES.map(([n, sy]) => [n, sy]).concat([...extra.values()].map(([n, sy]) => [n, sy]));
      const missing = syms.some(([, sy]) => !charts || !charts[sy] || !charts[sy]['1y']);
      if (due('chS', 10 * 60e3)) { st.times.chS = Date.now(); charts = await A.readCharts(syms, ['1d', '5d'], charts); }
      if (due('chL', 6 * 3600e3) || missing) { st.times.chL = Date.now(); charts = await A.readCharts(syms, ['1mo', '1y', '5y'], charts); }
      if (due('mac', 12 * 3600e3)) { st.times.mac = Date.now(); const m = await A.readMacro(); if (m.length) macro = m; }
      if (due('pol', 6 * 3600e3)) { st.times.pol = Date.now(); try { const p = await A.readPolls(); if (p.polls.length) polls = p; } catch (e) { console.warn('Közvélemény-kutatás hiba:', e.message); } }

      // 4) feltöltés
      const now = new Date().toISOString(), files = { 'hirek.json': { updated: now, items: latest } };
      if (quotes) files['quotes.json'] = { updated: now, quotes };
      if (calendar) files['naptar.json'] = { updated: now, events: calendar };
      if (charts) files['charts.json'] = { updated: now, charts };
      if (macro) files['makro.json'] = { updated: now, items: macro };
      if (polls) files['kozvelemeny.json'] = { updated: now, ...polls };
      if (STATUS.pushOk) st.pushOk = STATUS.pushOk;
      files['allapot.json'] = { updated: now, pushErr: STATUS.pushErr, pushOk: STATUS.pushOk || st.pushOk || null, summary: st.sumLog || null, runStart: new Date(t0).toISOString(), round, feeds: STATUS.feeds, quotes: STATUS.quotes, push: st.push, devices: cfgs.length, synced: [...settings.values()].filter((x) => x._synced).length, errors: ERRORS,
        data: { hirek: latest.length, arfolyam: quotes ? quotes.length : 0, grafikon: charts ? Object.keys(charts).length : 0, naptar: calendar ? calendar.length : 0, mutatok: macro ? macro.length : 0, kutatasok: polls ? polls.polls.length : 0 } };
      publish(files);
      fs.writeFileSync(STATE_FILE, JSON.stringify(st));
    } catch (e) { console.error('Kör hiba:', e && e.stack || e); logErr(e && e.message || e); }

    if (RUN_MS - (Date.now() - t0) < STEP_MS * 0.8) break;
    await new Promise((r) => setTimeout(r, Math.max(5e3, STEP_MS - (Date.now() - rs))));
  }
  console.log('Vége: ' + round + ' kör.');
})().catch((e) => { console.error('HIBA:', e); process.exitCode = 1; });
