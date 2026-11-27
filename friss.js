#!/usr/bin/env node
// Napi Hírek – folyamatos frissítés.
// A GitHub Actions 5 percenként indítja; egy futás kb. 4,5 percig tart, és közben PERCENKÉNT:
//   • megnézi az összes hírforrást, és minden új, témába vágó hírről értesítést küld,
//   • lekéri a friss árfolyamokat,
//   • a legfrissebb híreket és árfolyamokat feltölti az „arfolyam” ágra (hirek.json, quotes.json),
//     ahonnan az alkalmazás 30 másodpercenként frissít.
// A már látott hírek listája (seen.json) a futások között a GitHub tárában marad.
'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { FEEDS, SECTIONS, readFeeds, readQuotes, sendPush } = require('./gen.js');

const SEEN_FILE = process.env.SEEN_FILE || 'seen.json';
const RUN_MS = (+process.env.FUTASI_PERC || 4.5) * 60e3;     // egy futás hossza
const STEP_MS = (+process.env.LEPES_MP || 60) * 1e3;         // ellenőrzés gyakorisága
const MAX_PER_ROUND = 20;
const ICON = Object.fromEntries(SECTIONS.map(([k, ic]) => [k, ic]));
const key = (it) => (it.link || '').replace(/[?#].*$/, '').toLowerCase() || it.source + '|' + it.title.toLowerCase();

// Témaszűrő: a magyar lapok hírfolyamából kihagyjuk a nem politikai/gazdasági rovatokat
const OFF_TOPIC = /(^|[\/\s,-])(sport|foci|futball|kultur|kultura|kultúra|szorakozas|szórakozás|eletmod|életmód|egeszseg|egészség|celeb|bulvar|bulvár|sztar|sztár|gasztro|utazas|utazás|tech|tudomany|tudomány|auto|autó|totalcar|velemeny|vélemény|horoszkop|horoszkóp|idojaras|időjárás|kepek|képek|video|videó|podcast|recept|divat|lakberendezes|lakberendezés|hobbi|jatek|játék|film|zene|konyv|könyv|tv|sorozat|kvíz|kviz|szex|parkapcsolat|párkapcsolat)([\/\s,-]|$)/i;
function onTopic(it) {
  if (it.sec !== 'hu_pol') return true;
  let p = ''; try { p = new URL(it.link).pathname.split('/').slice(1, 3).join('/'); } catch (e) {}
  if (OFF_TOPIC.test('/' + p + '/')) return false;
  return !(it.cats || []).some((c) => OFF_TOPIC.test(' ' + c + ' '));
}

// ---------- feltöltés az „arfolyam” ágra ----------
const PUB_DIR = path.join(os.tmpdir(), 'hirapp-elo');
function publish(files) {
  const repo = process.env.GITHUB_REPOSITORY, token = process.env.GH_TOKEN;
  fs.mkdirSync(PUB_DIR, { recursive: true });
  for (const [name, data] of Object.entries(files)) fs.writeFileSync(path.join(PUB_DIR, name), JSON.stringify(data));
  if (!repo || !token) { console.log('(helyi futás: feltöltés kihagyva)'); return; }
  const git = (...a) => execFileSync('git', a, { cwd: PUB_DIR, stdio: 'pipe' });
  try {
    if (!fs.existsSync(path.join(PUB_DIR, '.git'))) git('init', '-q', '-b', 'arfolyam');
    git('add', '-A');
    git('-c', 'user.name=hirapp-bot', '-c', 'user.email=hirapp-bot@users.noreply.github.com', 'commit', '-q', '--allow-empty', '-m', 'élő adatok');
    // mindig egyetlen commit marad az ágon (nem nő a repó)
    const tree = git('rev-parse', 'HEAD^{tree}').toString().trim();
    const c = git('-c', 'user.name=hirapp-bot', '-c', 'user.email=hirapp-bot@users.noreply.github.com', 'commit-tree', tree, '-m', 'élő adatok').toString().trim();
    git('push', '-q', '-f', 'https://x-access-token:' + token + '@github.com/' + repo + '.git', c + ':refs/heads/arfolyam');
  } catch (e) { console.warn('Feltöltés hiba:', String(e.stderr || e.message).slice(0, 300)); }
}

(async () => {
  const t0 = Date.now();
  let seen = null; try { seen = JSON.parse(fs.readFileSync(SEEN_FILE, 'utf8')); } catch (e) {}
  let first = !Array.isArray(seen);
  let seenList = first ? [] : seen; const seenSet = new Set(seenList);
  let latest = [];   // a legfrissebb hírek az alkalmazás „Friss” fülére
  let quotes = null, round = 0;

  for (;;) {
    round++;
    const roundStart = Date.now();
    try {
      // 1) hírek
      const all = [];
      for (const k of Object.keys(FEEDS)) (await readFeeds(FEEDS[k], 12)).forEach((it) => all.push({ ...it, sec: k }));
      const topical = all.filter(onTopic);
      const fresh = topical.filter((it) => !seenSet.has(key(it))).sort((a, b) => (Date.parse(a.date || 0) || 0) - (Date.parse(b.date || 0) || 0));
      fresh.forEach((it) => { seenSet.add(key(it)); seenList.push(key(it)); });
      if (seenList.length > 5000) seenList = seenList.slice(-4000);
      // Friss lista: idő szerint, legújabb elöl
      const byKey = new Map(latest.map((x) => [x.k, x]));
      topical.forEach((it) => { const k = key(it); if (!byKey.has(k)) byKey.set(k, { k, t: it.date || new Date().toISOString(), title: it.title, source: it.source, link: it.link, sec: it.sec }); });
      latest = [...byKey.values()].sort((a, b) => Date.parse(b.t) - Date.parse(a.t)).slice(0, 80);

      if (first) { console.log('Első futás: ' + fresh.length + ' hír megjegyezve (értesítés nélkül).'); first = false; }
      else if (fresh.length) {
        const items = fresh.slice(-MAX_PER_ROUND);
        const payloads = items.map((it) => ({ title: (ICON[it.sec] || '📰') + ' ' + it.source, body: it.title, url: it.link || process.env.APP_URL || './', tag: 'h-' + Buffer.from(key(it)).toString('base64').slice(-40) }));
        if (fresh.length > items.length) payloads.unshift({ title: '📰 Napi Hírek', body: '+' + (fresh.length - items.length) + ' további új hír – nyisd meg az alkalmazást.', url: process.env.APP_URL || './', tag: 'h-tobb' });
        const sent = await sendPush(payloads);
        console.log(new Date().toISOString().slice(11, 19) + ' ' + fresh.length + ' új hír, ' + sent + ' értesítés.');
      }
      // 2) árfolyamok
      const q = await readQuotes(); if (q.length) quotes = q;
      // 3) feltöltés az alkalmazásnak
      const now = new Date().toISOString();
      const files = { 'hirek.json': { updated: now, items: latest } };
      if (quotes) files['quotes.json'] = { updated: now, quotes };
      publish(files);
      fs.writeFileSync(SEEN_FILE, JSON.stringify(seenList));
    } catch (e) { console.error('Kör hiba:', e.message); }

    const left = RUN_MS - (Date.now() - t0);
    if (left < STEP_MS * 0.8) break;
    await new Promise((r) => setTimeout(r, Math.max(5e3, STEP_MS - (Date.now() - roundStart))));
  }
  console.log('Vége: ' + round + ' kör.');
})().catch((e) => { console.error('HIBA:', e); process.exitCode = 1; });
