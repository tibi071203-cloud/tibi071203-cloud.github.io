// Az Android-alkalmazás (APK) beállításait készíti el a GitHub-repó nevéből – a GitHub Actions futtatja.
// Használat: node twa.js <owner> <repo> <verziószám> <helyi_szerver_url>
'use strict';
const fs = require('node:fs');
const [owner, repo, ver, local] = process.argv.slice(2);
const o = String(owner).toLowerCase();
const host = o + '.github.io';
const root = String(repo).toLowerCase() === host;              // FELHASZNÁLÓNÉV.github.io nevű repó → a cím gyökere
const base = root ? '/' : '/' + repo + '/';
const seg = o.replace(/[^a-z0-9_]/g, '_').replace(/^([^a-z])/, 'u$1');
const m = {
  packageId: 'io.github.' + seg + '.napihirek',
  host, name: 'Napi Hírek', launcherName: 'Napi Hírek', display: 'standalone', orientation: 'portrait',
  themeColor: '#0d1a33', themeColorDark: '#0d1a33', navigationColor: '#0b1426', navigationColorDark: '#0b1426',
  navigationDividerColor: '#0b1426', navigationDividerColorDark: '#0b1426', backgroundColor: '#0b1426',
  enableNotifications: true, startUrl: base,
  iconUrl: local + '/icon-512.png', maskableIconUrl: local + '/maskable-512.png',
  webManifestUrl: local + '/manifest.webmanifest',
  splashScreenFadeOutDuration: 300,
  signingKey: { path: './android.keystore', alias: 'napihirek' },
  appVersionName: String(ver), appVersionCode: Number(ver) || 1,
  shortcuts: [], generatorApp: 'bubblewrap-cli', fallbackType: 'customtabs', features: {},
  alphaDependencies: { enabled: false }, enableSiteSettingsShortcut: true, isChromeOSOnly: false, isMetaQuest: false,
  fullScopeUrl: 'https://' + host + base, minSdkVersion: 24,
};
fs.mkdirSync('build-android', { recursive: true });
fs.writeFileSync('build-android/twa-manifest.json', JSON.stringify(m, null, 2));
console.log('Csomag:', m.packageId, '| cím:', m.fullScopeUrl, root ? '' : '\nFIGYELEM: a repó neve nem ' + host + ', ezért az alkalmazás tetején böngészősáv fog látszani (lásd ANDROID.md).');
