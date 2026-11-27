#!/usr/bin/env node
// Napi Hírek – azonnali értesítés minden új hírről.
// A GitHub Actions 5 percenként futtatja: megnézi az összes hírforrást, és minden olyan hírről,
// amit még nem látott, értesítést küld a telefon(ok)ra. A már látott hírek listája a seen.json fájlban van
// (a GitHub a futások között eltárolja, nem kerül a repóba).
'use strict';
const fs = require('node:fs');
const { FEEDS, SECTIONS, readFeeds, sendPush } = require('./gen.js');

const SEEN_FILE = process.env.SEEN_FILE || 'seen.json';
const MAX_PER_RUN = 20;            // egy futásban legfeljebb ennyi külön értesítés; a többit egyben jelzi
const ICON = Object.fromEntries(SECTIONS.map(([k, ic]) => [k, ic]));
const key = (it) => (it.link || '').replace(/[?#].*$/, '').toLowerCase() || it.source + '|' + it.title.toLowerCase();

(async () => {
  let seen = null;
  try { seen = JSON.parse(fs.readFileSync(SEEN_FILE, 'utf8')); } catch (e) {}
  const first = !Array.isArray(seen);
  const seenSet = new Set(first ? [] : seen);

  // minden rovat hírei (az elmúlt 6 óra), rovat szerint megjelölve
  const all = [];
  for (const k of Object.keys(FEEDS)) (await readFeeds(FEEDS[k], 6)).forEach((it) => all.push({ ...it, sec: k }));
  const fresh = all.filter((it) => !seenSet.has(key(it)))
    .sort((a, b) => (Date.parse(a.date || 0) || 0) - (Date.parse(b.date || 0) || 0));   // régebbi elöl, így időrendben érkeznek

  // a látott lista frissítése (az utolsó 4000 marad meg)
  const next = (first ? [] : seen).concat(fresh.map(key));
  fs.writeFileSync(SEEN_FILE, JSON.stringify(next.slice(-4000)));

  if (first) { console.log('Első futás: ' + fresh.length + ' hír megjegyezve, értesítés most nem megy (különben egyszerre jönne mind).'); return; }
  if (!fresh.length) { console.log('Nincs új hír.'); return; }

  const items = fresh.slice(-MAX_PER_RUN);
  const payloads = items.map((it) => ({
    title: (ICON[it.sec] || '📰') + ' ' + it.source,
    body: it.title,
    url: it.link || process.env.APP_URL || './',
    tag: 'h-' + Buffer.from(key(it)).toString('base64').slice(-40),
  }));
  if (fresh.length > items.length) payloads.unshift({ title: '📰 Napi Hírek', body: '+' + (fresh.length - items.length) + ' további új hír – nyisd meg az alkalmazást.', url: process.env.APP_URL || './', tag: 'h-tobb' });
  const sent = await sendPush(payloads);
  console.log(fresh.length + ' új hír, ' + sent + ' értesítés elküldve.');
})().catch((e) => { console.error('HIBA:', e); process.exitCode = 1; });
