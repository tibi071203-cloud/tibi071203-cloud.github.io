#!/usr/bin/env node
// Hír App – összefoglaló készítő. A GitHub Actions naponta kétszer futtatja:
//   node gen.js auto     → a budapesti idő alapján: 7 óra → reggeli, 18 óra → esti; egyébként nem csinál semmit
//   node gen.js reggel   → reggeli összefoglaló most
//   node gen.js este     → esti összefoglaló most
// Eredmény: data/latest.json, data/archive/<datum>-<tipus>.json, data/index.json; utána értesítést küld a telefon(ok)ra.
// Környezeti változók (GitHub secretek):
//   ANTHROPIC_API_KEY – opcionális; nélküle hírcím-válogatás készül
//   CLAUDE_MODEL      – opcionális, alapból claude-haiku-5-5
//   PUSH_CONFIG       – opcionális; az alkalmazás „Értesítések” gombja adja (egy vagy több, [ ]-be téve)
//   APP_URL           – opcionális; az értesítésre koppintva ez nyílik meg
'use strict';
const fs = require('node:fs');
const path = require('node:path');

const AI_KEY = process.env.ANTHROPIC_API_KEY || '';
const MODEL = process.env.CLAUDE_MODEL || 'claude-haiku-5-5';
const TZ = 'Europe/Budapest', MORNING = 7, EVENING = 18;
const DATA = path.join(__dirname, 'data');

// ---------- Források ----------
// A magyar politikához kormányközeli és független lapok is szerepelnek a kiegyensúlyozottság miatt.
const FEEDS = {
  hu_pol: [['Telex', 'https://telex.hu/rss'], ['HVG', 'https://hvg.hu/rss'], ['Index', 'https://index.hu/24ora/rss/'], ['444', 'https://444.hu/feed'], ['Magyar Nemzet', 'https://magyarnemzet.hu/feed/'], ['Mandiner', 'https://mandiner.hu/rss']],
  world: [['BBC World', 'https://feeds.bbci.co.uk/news/world/rss.xml'], ['The Guardian', 'https://www.theguardian.com/world/rss'], ['Euronews', 'https://www.euronews.com/rss?level=theme&name=news']],
  hu_mkt: [['Portfolio', 'https://www.portfolio.hu/rss/all.xml']],
  w_mkt: [['BBC Business', 'https://feeds.bbci.co.uk/news/business/rss.xml'], ['CNBC', 'https://www.cnbc.com/id/100003114/device/rss/rss.html']],
};
const QUOTES = [
  ['BUX', '^BUX.BD', 'hu'], ['OTP', 'OTP.BD', 'hu'], ['MOL', 'MOL.BD', 'hu'], ['Richter', 'RICHT.BD', 'hu'], ['Magyar Telekom', 'MTELEKOM.BD', 'hu'],
  ['EUR/HUF', 'EURHUF=X', 'fx'], ['USD/HUF', 'USDHUF=X', 'fx'],
  ['S&P 500', '^GSPC', 'w'], ['Nasdaq', '^IXIC', 'w'], ['Dow Jones', '^DJI', 'w'], ['DAX', '^GDAXI', 'w'],
  ['Brent olaj', 'BZ=F', 'c'], ['Arany', 'GC=F', 'c'], ['Bitcoin', 'BTC-USD', 'c'],
];
const SECTIONS = [
  ['hu_pol', '🇭🇺', 'Magyar politika'], ['world', '🌍', 'Világpolitika'], ['hu_mkt', '📊', 'Magyar gazdaság és tőzsde'], ['w_mkt', '💹', 'Világgazdaság és tőzsde'],
];

const UA = { 'User-Agent': 'Mozilla/5.0 (hirapp)', Accept: '*/*' };
async function get(url, opts = {}, ms = 15000) {
  const ac = new AbortController(), t = setTimeout(() => ac.abort(), ms);
  try { return await fetch(url, { ...opts, headers: { ...UA, ...(opts.headers || {}) }, signal: ac.signal }); }
  finally { clearTimeout(t); }
}

// ---------- RSS ----------
const decode = (s) => String(s || '')
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]+>/g, ' ')
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&quot;/g, '"').replace(/&apos;|&#039;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
  .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const tag = (b, n) => { const m = b.match(new RegExp('<' + n + '(?:\\s[^>]*)?>([\\s\\S]*?)</' + n + '>', 'i')); return m ? m[1] : ''; };
function parseFeed(xml, source) {
  const out = [], blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) || [];
  for (const b of blocks) {
    const title = decode(tag(b, 'title')); if (!title) continue;
    let link = decode(tag(b, 'link')); if (!link) { const m = b.match(/<link[^>]*href="([^"]+)"/i); if (m) link = m[1]; }
    const ds = decode(tag(b, 'pubDate') || tag(b, 'updated') || tag(b, 'published') || tag(b, 'dc:date')), d = ds ? new Date(ds) : null;
    const cats = (b.match(/<category[^>]*>([\s\S]*?)<\/category>/gi) || []).map((c) => decode(c).toLowerCase());
    out.push({ source, title, link, cats, date: d && !isNaN(d) ? d.toISOString() : null, desc: decode(tag(b, 'description') || tag(b, 'summary')).slice(0, 260) });
  }
  return out;
}
async function readFeeds(list, hours) {
  const since = Date.now() - hours * 3600e3, out = [], seen = new Set();
  const res = await Promise.allSettled(list.map(async ([name, url]) => {
    const r = await get(url); if (!r.ok) throw new Error('HTTP ' + r.status);
    return parseFeed(await r.text(), name).filter((it) => !it.date || Date.parse(it.date) >= since).slice(0, 12);
  }));
  res.forEach((r, i) => { if (r.status === 'fulfilled') out.push(...r.value); else console.warn('Forrás hiba:', list[i][0], r.reason && r.reason.message); });
  return out.filter((it) => { const k = it.title.toLowerCase().slice(0, 60); if (seen.has(k)) return false; seen.add(k); return true; });
}
async function readQuotes() {
  const res = await Promise.allSettled(QUOTES.map(async ([name, sym, grp]) => {
    const r = await get('https://query1.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(sym) + '?range=1mo&interval=1d');
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const res0 = (await r.json()).chart.result[0], m = res0.meta;
    const closes = (res0.indicators.quote[0].close || []).filter((x) => x != null);
    const ref = closes.length >= 2 ? closes[closes.length - 2] : m.chartPreviousClose;
    return { name, grp, price: m.regularMarketPrice, chg: ref ? (m.regularMarketPrice / ref - 1) * 100 : null, unit: sym.startsWith('^') ? 'pont' : (grp === 'fx' ? 'Ft' : m.currency || ''), spark: closes.slice(-20).map((x) => +x.toFixed(4)) };
  }));
  return res.map((r, i) => (r.status === 'fulfilled' ? r.value : (console.warn('Árfolyam hiba:', QUOTES[i][0], r.reason && r.reason.message), null))).filter(Boolean);
}

// ---------- Összefoglaló ----------
async function aiSummary(kind, news, quotes) {
  const list = (arr) => arr.map((it, i) => (i + 1) + '. [' + it.source + '] ' + it.title + (it.desc ? ' – ' + it.desc : '')).join('\n') || '(nincs)';
  const prompt = `Magyar hírszerkesztő vagy. Készíts ${kind === 'reggel' ? 'reggeli' : 'esti'} hírösszefoglalót egy telefonos alkalmazásba az alábbi friss hírcímekből és árfolyamokból.

Szabályok:
- Csak az alábbi címekben szereplő tényekre támaszkodj, semmit ne találj ki.
- Politikailag semleges legyél: ne minősíts, ne foglalj állást, ne használj érzelmi jelzőket. Ha egy ügyben a kormány és az ellenzék vagy különböző lapok mást mondanak, röviden mindkét oldalt írd le.
- Rovatonként 3–5 pont, mindegyik 1–2 tömör mondat, a "sources" mezőben a forrásnevek.
- A tőzsdei rovatokban említsd a fontos árfolyamváltozásokat. Ne adj befektetési tanácsot.
- "headline": a nap egyetlen legfontosabb híre egy mondatban (ez lesz az értesítés szövege).
- KIZÁRÓLAG érvényes JSON-t adj vissza, semmi mást, ebben a formában:
{"headline":"...","sections":{"hu_pol":[{"text":"...","sources":["..."]}],"world":[...],"hu_mkt":[...],"w_mkt":[...]}}

MAGYAR POLITIKA:
${list(news.hu_pol)}

VILÁGPOLITIKA:
${list(news.world)}

MAGYAR GAZDASÁG/TŐZSDE:
${list(news.hu_mkt)}

VILÁGGAZDASÁG/TŐZSDE:
${list(news.w_mkt)}

ÁRFOLYAMOK (napi változás %): ${quotes.map((q) => q.name + ' ' + q.price + (q.chg == null ? '' : ' (' + q.chg.toFixed(2) + '%)')).join('; ') || 'nincs adat'}`;
  const r = await get('https://api.anthropic.com/v1/messages', {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': AI_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: MODEL, max_tokens: 2500, messages: [{ role: 'user', content: prompt }] }),
  }, 120000);
  if (!r.ok) throw new Error('Claude API: HTTP ' + r.status + ' ' + (await r.text()).slice(0, 300));
  const txt = ((await r.json()).content || []).filter((c) => c.type === 'text').map((c) => c.text).join('');
  const j = JSON.parse(txt.slice(txt.indexOf('{'), txt.lastIndexOf('}') + 1));
  const sections = {};
  for (const [k] of SECTIONS) sections[k] = (j.sections && Array.isArray(j.sections[k]) ? j.sections[k] : []).filter((p) => p && p.text).map((p) => ({ text: String(p.text), sources: (p.sources || []).map(String).slice(0, 4) }));
  return { headline: String(j.headline || ''), sections };
}
function headlinesOnly(news) {   // kulcs nélkül: forrásonként váltogatva válogatott címek
  const sections = {};
  for (const [k] of SECTIONS) {
    const by = {}; (news[k] || []).forEach((it) => (by[it.source] = by[it.source] || []).push(it));
    const pick = []; let i = 0; const n = 6;
    while (pick.length < n && Object.values(by).some((a) => a.length > i)) { for (const a of Object.values(by)) if (a[i] && pick.length < n) pick.push(a[i]); i++; }
    sections[k] = pick.map((it) => ({ text: it.title, sources: [it.source], link: it.link }));
  }
  const first = sections.hu_pol[0] || sections.world[0];
  return { headline: first ? first.text : '', sections };
}

async function build(kind) {
  const hours = kind === 'reggel' ? 14 : 12;
  const [hu_pol, world, hu_mkt, w_mkt, quotes] = await Promise.all([readFeeds(FEEDS.hu_pol, hours), readFeeds(FEEDS.world, hours), readFeeds(FEEDS.hu_mkt, hours), readFeeds(FEEDS.w_mkt, hours), readQuotes()]);
  const news = { hu_pol, world, hu_mkt, w_mkt };
  let sum = null, ai = false;
  if (AI_KEY && hu_pol.length + world.length + hu_mkt.length + w_mkt.length > 0) {
    try { sum = await aiSummary(kind, news, quotes); ai = true; } catch (e) { console.warn('AI összefoglaló nem sikerült, címválogatás lesz:', e.message); }
  }
  if (!sum) sum = headlinesOnly(news);
  // linkek a forrásokhoz (a hírek eredeti cikkeihez)
  const links = {}; for (const k of Object.keys(news)) links[k] = news[k].slice(0, 30).map((it) => ({ title: it.title, link: it.link, source: it.source }));
  const now = new Date(), date = now.toLocaleDateString('en-CA', { timeZone: TZ });
  return { id: date + '-' + kind, kind, date, created: now.toISOString(), ai, headline: sum.headline, sections: sum.sections, quotes, links };
}

function save(doc) {
  fs.mkdirSync(path.join(DATA, 'archive'), { recursive: true });
  fs.writeFileSync(path.join(DATA, 'latest.json'), JSON.stringify(doc));
  fs.writeFileSync(path.join(DATA, 'archive', doc.id + '.json'), JSON.stringify(doc));
  let idx = []; try { idx = JSON.parse(fs.readFileSync(path.join(DATA, 'index.json'), 'utf8')); } catch (e) {}
  idx = [{ id: doc.id, kind: doc.kind, date: doc.date, headline: doc.headline }].concat(idx.filter((x) => x.id !== doc.id)).slice(0, 120);
  // 120-nál régebbi archív fájlok törlése
  const keep = new Set(idx.map((x) => x.id + '.json'));
  for (const f of fs.readdirSync(path.join(DATA, 'archive'))) if (!keep.has(f)) fs.unlinkSync(path.join(DATA, 'archive', f));
  fs.writeFileSync(path.join(DATA, 'index.json'), JSON.stringify(idx));
}

// Értesítés küldése minden beállított készülékre (PUSH_CONFIG)
function pushConfigs() {
  try { const raw = (process.env.PUSH_CONFIG || '').trim(); if (!raw) return []; const j = JSON.parse(raw); return Array.isArray(j) ? j : [j]; }
  catch (e) { console.warn('PUSH_CONFIG nem érvényes JSON:', e.message); return []; }
}
async function sendPush(payloads, ttl = 3600) {
  const cfgs = pushConfigs(); if (!cfgs.length) { console.log('Nincs beállítva értesítés (PUSH_CONFIG).'); return 0; }
  let webpush; try { webpush = require('web-push'); } catch (e) { console.warn('A web-push csomag hiányzik (npm install).'); return 0; }
  let n = 0;
  for (const c of cfgs) for (const pl of payloads) {
    try { webpush.setVapidDetails('mailto:hirapp@example.com', c.vapidPublic, c.vapidPrivate); await webpush.sendNotification(c.sub, JSON.stringify(pl), { TTL: ttl, urgency: 'high' }); n++; }
    catch (e) { console.warn('Értesítés hiba:', e.statusCode || '', e.body || e.message); }
  }
  return n;
}

async function notify(doc) {
  let cfgs = [];
  try { const raw = (process.env.PUSH_CONFIG || '').trim(); if (raw) { const j = JSON.parse(raw); cfgs = Array.isArray(j) ? j : [j]; } }
  catch (e) { console.warn('PUSH_CONFIG nem érvényes JSON:', e.message); return; }
  if (!cfgs.length) { console.log('Nincs beállítva értesítés (PUSH_CONFIG).'); return; }
  let webpush; try { webpush = require('web-push'); } catch (e) { console.warn('A web-push csomag hiányzik (npm install).'); return; }
  const payload = JSON.stringify({ title: (doc.kind === 'reggel' ? '☀️ Reggeli hírek' : '🌙 Esti hírek'), body: doc.headline || 'Megérkezett a friss összefoglaló.', url: process.env.APP_URL || './', tag: doc.id });
  for (const c of cfgs) {
    try {
      webpush.setVapidDetails('mailto:hirapp@example.com', c.vapidPublic, c.vapidPrivate);
      await webpush.sendNotification(c.sub, payload, { TTL: 6 * 3600 });
      console.log('Értesítés elküldve.');
    } catch (e) { console.warn('Értesítés hiba:', e.statusCode || '', e.body || e.message); }
  }
}

const bpHour = () => +new Date().toLocaleString('en-GB', { timeZone: TZ, hour: '2-digit', hour12: false }).slice(0, 2);
module.exports = { FEEDS, SECTIONS, readFeeds, sendPush, get };
if (require.main === module) (async () => {
  let mode = (process.argv[2] || 'auto').toLowerCase();
  if (mode === 'auto') {
    const force = (process.env.KENYSZER || '').trim(), h = bpHour();
    mode = force || (h === MORNING ? 'reggel' : h === EVENING ? 'este' : '');
    if (!mode) { console.log('Most (' + h + ' óra Budapesten) nincs teendő.'); return; }
  }
  if (mode === 'push') {   // a legutóbbi összefoglalóról értesítés (a GitHub ezt a közzététel után hívja)
    try { await notify(JSON.parse(fs.readFileSync(path.join(DATA, 'latest.json'), 'utf8'))); } catch (e) { console.error('HIBA:', e.message); process.exitCode = 1; }
    return;
  }
  if (mode !== 'reggel' && mode !== 'este') { console.log('Használat: node gen.js auto|reggel|este|push'); return; }
  try {
    const doc = await build(mode); save(doc);
    if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, 'kesz=1\n');
    console.log('Kész:', doc.id, '| AI:', doc.ai, '|', Object.values(doc.sections).reduce((a, s) => a + s.length, 0), 'pont |', doc.quotes.length, 'árfolyam');
    if (process.env.NO_PUSH !== '1') await notify(doc);
  } catch (e) { console.error('HIBA:', e); process.exitCode = 1; }
})();
