// Napi Hírek – ritkábban frissülő adatok: részletes árfolyam-grafikonok, magyar gazdasági mutatók, közvélemény-kutatások.
// A friss.js hívja időzítve (grafikonok 10 percenként / 6 óránként, mutatók 12 óránként, kutatások 6 óránként).
'use strict';
const { get } = require('./gen.js');

// ---------- Árfolyam-grafikonok (Yahoo Finance) ----------
const RANGES = { '1d': ['1d', '5m'], '5d': ['5d', '30m'], '1mo': ['1mo', '1d'], '1y': ['1y', '1d'], '5y': ['5y', '1wk'] };
function thin(pts, max = 160) { if (pts.length <= max) return pts; const step = (pts.length - 1) / (max - 1), out = []; for (let i = 0; i < max; i++) out.push(pts[Math.round(i * step)]); return out; }
async function chartOne(sym, range) {
  const [r, iv] = RANGES[range];
  const res = await get('https://query1.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(sym) + '?range=' + r + '&interval=' + iv);
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const x = (await res.json()).chart.result[0], ts = x.timestamp || [], cl = (x.indicators.quote[0].close || []);
  const pts = []; ts.forEach((t, i) => { if (cl[i] != null) pts.push([t, +cl[i].toFixed(4)]); });
  return thin(pts);
}
async function pool(tasks, n = 6) { const out = []; let i = 0; await Promise.all([...Array(n)].map(async () => { while (i < tasks.length) { const k = i++; try { out[k] = await tasks[k](); } catch (e) { out[k] = null; } } })); return out; }
// syms: [[név, szimbólum]], ranges: melyik időtávokat frissítse; prev: a korábbi charts objektum (a többi időtáv onnan marad)
async function readCharts(syms, ranges, prev) {
  const charts = JSON.parse(JSON.stringify(prev || {})), tasks = [];
  for (const [name, sym] of syms) for (const rg of ranges) tasks.push(async () => { const p = await chartOne(sym, rg); if (p && p.length > 1) { charts[sym] = charts[sym] || { name }; charts[sym].name = name; charts[sym][rg] = p; } });
  await pool(tasks);
  return charts;
}

// ---------- Magyar gazdasági mutatók (FRED: OECD / Eurostat adatok, havi) ----------
const MACRO = [
  ['inflacio', 'Infláció (éves, HICP)', 'CP0000HUM086NEST', '%', 'yoy'],
  ['bubor', '3 hónapos bankközi kamat (BUBOR)', 'IR3TIB01HUM156N', '%', 'lvl'],
  ['hozam10', '10 éves állampapír-hozam', 'IRLTLT01HUM156N', '%', 'lvl'],
  ['munkanelk', 'Munkanélküliségi ráta', 'LRHUTTTTHUM156S', '%', 'lvl'],
];
async function readMacro() {
  const out = [];
  for (const [id, name, series, unit, mode] of MACRO) {
    try {
      const r = await get('https://fred.stlouisfed.org/graph/fredgraph.csv?id=' + series); if (!r.ok) throw new Error('HTTP ' + r.status);
      let rows = (await r.text()).trim().split('\n').slice(1).map((l) => l.split(',')).filter((x) => x[1] && x[1] !== '.').map(([d, v]) => [d, +v]);
      if (mode === 'yoy') { const m = new Map(rows); rows = rows.map(([d, v]) => { const y = (+d.slice(0, 4) - 1) + d.slice(4); return m.has(y) ? [d, +((v / m.get(y) - 1) * 100).toFixed(2)] : null; }).filter(Boolean); }
      rows = rows.slice(-36);
      if (rows.length) out.push({ id, name, unit, date: rows[rows.length - 1][0], value: rows[rows.length - 1][1], prev: rows.length > 1 ? rows[rows.length - 2][1] : null, hist: rows.map((x) => x[1]), dates: rows.map((x) => x[0]) });
    } catch (e) { console.warn('Mutató hiba:', id, e.message); }
  }
  return out;
}

// ---------- Közvélemény-kutatások (Wikipédia táblázat) ----------
const MONTHS = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
function parseDate(s) {   // pl. "10–13 Nov 2026", "28 Oct – 2 Nov 2026"
  const m = [...String(s).matchAll(/(\d{1,2})\s+([A-Za-z]{3})[a-z]*\.?\s*(\d{4})?/g)]; if (!m.length) return null;
  const last = m[m.length - 1], y = last[3] || (String(s).match(/(\d{4})/) || [])[1]; const mo = MONTHS[last[2].toLowerCase()];
  return y && mo != null ? new Date(Date.UTC(+y, mo, +last[1])).toISOString().slice(0, 10) : null;
}
async function readPolls(page = 'Opinion_polling_for_the_2030_Hungarian_parliamentary_election') {
  const { parse } = require('node-html-parser');
  const r = await get('https://en.wikipedia.org/w/api.php?action=parse&format=json&formatversion=2&prop=text&page=' + page);
  if (!r.ok) throw new Error('HTTP ' + r.status);
  const root = parse((await r.json()).parse.text);
  const table = root.querySelectorAll('table.wikitable').find((t) => /polling firm/i.test(t.text));
  if (!table) throw new Error('nincs táblázat');
  const trs = table.querySelectorAll('tr');
  // fejléc: az első sor celláiból (a pártok neve a link címéből vagy a szövegből jön), colspan figyelembevételével
  const cols = [];
  for (const th of trs[0].querySelectorAll('th')) {
    const a = th.querySelector('a[title]'), img = th.querySelector('img[alt]');
    let name = th.text.replace(/\[.*?\]/g, '').trim() || (a && a.getAttribute('title')) || (img && img.getAttribute('alt')) || '';
    if (a && name.length <= 2) name = a.getAttribute('title');
    name = name.replace(/\s*\(.*?\)\s*$/, '').trim();
    for (let i = 0; i < (+th.getAttribute('colspan') || 1); i++) cols.push(name);
  }
  const iDate = cols.findIndex((c) => /date/i.test(c)), iFirm = cols.findIndex((c) => /firm|poll/i.test(c)), iSample = cols.findIndex((c) => /sample/i.test(c));
  const skip = new Set([iDate, iFirm, iSample, ...cols.map((c, i) => (/^(other|others|lead|undecided|don't know)$/i.test(c) ? i : -1))]);
  const parties = cols.map((c, i) => (skip.has(i) || !c ? null : c));
  const polls = [];
  for (const tr of trs.slice(1)) {
    const tds = tr.querySelectorAll('td'); if (tds.length < 4) continue;
    const cells = []; for (const td of tds) for (let i = 0; i < (+td.getAttribute('colspan') || 1); i++) cells.push(td.text.replace(/\[.*?\]/g, '').trim());
    if (cells.length < cols.length - 1) continue;
    const date = parseDate(cells[iDate]); if (!date) continue;
    const vals = {}; parties.forEach((p, i) => { if (!p) return; const v = parseFloat(String(cells[i] || '').replace(',', '.')); if (isFinite(v) && v >= 0 && v <= 100) vals[p] = v; });
    if (Object.keys(vals).length < 2) continue;
    polls.push({ date, firm: cells[iFirm] || '', sample: (cells[iSample] || '').replace(/[^\d]/g, ''), vals });
  }
  polls.sort((a, b) => b.date.localeCompare(a.date));
  const HU = { 'Respect and Freedom Party': 'TISZA', 'Tisza Party': 'TISZA', 'Our Homeland Movement': 'Mi Hazánk', 'Democratic Coalition': 'DK', 'Hungarian Two-tailed Dog Party': 'MKKP', 'Momentum Movement': 'Momentum', 'Hungarian Socialist Party': 'MSZP', 'LMP – Hungary\'s Green Party': 'LMP', 'Dialogue – The Greens\' Party': 'Párbeszéd', 'Jobbik': 'Jobbik', 'Second Reform Era Party': '2RK', 'Everybody\'s Hungary People\'s Party': 'MMN' };
  const nm = (x) => HU[x] || x;
  polls.forEach((p) => { const v = {}; for (const [k, x] of Object.entries(p.vals)) v[nm(k)] = x; p.vals = v; });
  return { page: 'https://en.wikipedia.org/wiki/' + page, parties: [...new Set(parties.filter(Boolean).map(nm))], polls: polls.slice(0, 80) };
}

module.exports = { RANGES, readCharts, readMacro, readPolls, parseDate };
