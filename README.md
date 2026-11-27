# Napi Hírek – alkalmazás a telefonodra

> 📱 **Letölthető Android-alkalmazás (APK):** feltöltés után magától elkészül, és itt lesz: `https://FELHASZNÁLÓNEVED.github.io/napi-hirek.apk` – részletek: [ANDROID.md](ANDROID.md)

Saját hírösszefoglaló alkalmazás, amit a telefon kezdőképernyőjére telepítesz (Android és iPhone).
Minden nap **reggel 7-kor** és **este 6-kor** (budapesti idő) friss összefoglalót készít, és **értesítést küld**.

**Mit tud:**
- 4 rovat: 🇭🇺 Magyar politika · 🌍 Világpolitika · 📊 Magyar gazdaság és tőzsde · 💹 Világgazdaság és tőzsde
- „A nap híre” kiemelve, minden pontnál a forrás neve, és az eredeti cikkek linkjei
- Árfolyamok: BUX, OTP, MOL, Richter, Magyar Telekom, EUR/HUF, USD/HUF, S&P 500, Nasdaq, Dow Jones, DAX, Brent olaj, arany, bitcoin – napi változással és kis grafikonnal
- Archívum az elmúlt ~60 nap összefoglalóiból
- Lehúzással frissítés, sötét/világos mód (a telefon beállítását követi), internet nélkül a legutóbbit mutatja

**Források:** Telex, HVG, Index, 444, Magyar Nemzet, Mandiner, Portfolio, BBC, The Guardian, Euronews, CNBC; árfolyamok: Yahoo Finance.
A magyar politikához kormányközeli és független lapok is szerepelnek, és az összefoglaló semleges, tényszerű megfogalmazással készül.

**Költség:** a GitHub ingyenes. A Claude API-kulcs opcionális – vele Claude ír rövid összefoglalót (kis díj, a console.anthropic.com oldalon látod); nélküle válogatott hírcímeket kapsz.

---

## Beállítás (egyszer kell, kb. 15 perc)

### 1. GitHub-repó
1. Regisztrálj / lépj be: https://github.com
2. Jobb fent **+ → New repository**. A név legyen pontosan **`FELHASZNÁLÓNEVED.github.io`** (pl. ha a GitHub-neved `kovacsp`, akkor `kovacsp.github.io`) – így az alkalmazás a `https://kovacsp.github.io/` címen lesz (így az APK-s alkalmazás teljes képernyős lesz). Legyen **Public** (az ingyenes GitHub Pages ezt kéri – a titkos kulcsok ettől még titkosak maradnak), majd **Create repository**.
3. A repó oldalán: **uploading an existing file** (vagy **Add file → Upload files**) → húzd be a kibontott zip **összes fájlját** (Ctrl+A) → **Commit changes**.
   (A csomagban nincsenek mappák, így Firefoxból is működik.)
4. **Weboldal bekapcsolása:** **Settings → Pages → Build and deployment → Source: GitHub Actions.** (Ezt a következő lépés előtt csináld meg.)
5. **A két automatikus feladat a helyére tétele** – ez fontos, enélkül nem fut semmi:
   - Kattints a repóban a **`hirek.yml`** fájlra → jobb fent a **ceruza** ikon (Edit).
   - Felül a fájlnév mezőben kattints a név **elejére**, és írd elé: `.github/workflows/` – a `/` jeleknél magától mappa lesz belőle.
     A végén így néz ki: `.github / workflows / hirek.yml`
   - Jobb fent: **Commit changes…** → **Commit changes**.
   - Ugyanezt csináld meg az **`android.yml`** fájllal is.
   - Ellenőrzés: az **Actions** fülön bal oldalt megjelenik a „Hírek frissítése” és az „Android-alkalmazás (APK)”.

### 2. (kész – az 1/4. lépésben bekapcsoltad a weboldalt)

### 3. (Opcionális) Claude API-kulcs
1. https://console.anthropic.com → regisztráció, egyenleg feltöltése, **API Keys → Create Key**.
2. A repóban: **Settings → Secrets and variables → Actions → New repository secret**
   - Name: `ANTHROPIC_API_KEY`, Secret: a kulcs (`sk-ant-...`).

### 4. Első összefoglaló
**Actions** fül → (ha kéri, engedélyezd) → bal oldalt **Hírek frissítése** → **Run workflow** → `reggel` → **Run workflow**.
1–2 perc múlva kész. Az alkalmazás címe: `https://FELHASZNÁLÓNEVED.github.io/`
(a pontos címet a lefutott feladatnál, vagy a Settings → Pages oldalon látod).

### 5. Telepítés a telefonra
- **Android:** töltsd le az APK-t: `https://FELHASZNÁLÓNEVED.github.io/napi-hirek.apk` (az első feltöltés után kb. 5–8 perccel lesz kész) – lásd [ANDROID.md](ANDROID.md). Vagy Chrome-ban: zöld **Telepítés** gomb.
- **iPhone (Safari!):** nyisd meg a címet → **Megosztás** gomb → **Főképernyőhöz adás**. Utána mindig a kezdőképernyőről indítsd.

### 6. Értesítések
1. Az alkalmazásban: **⚙️ Beállítások → Értesítések bekapcsolása** → engedélyezd.
   (iPhone-on csak a kezdőképernyőről indított alkalmazásban működik, iOS 16.4 vagy újabb kell.)
2. Megjelenik egy szöveg → **Másolás**.
3. A GitHub-repóban: **Settings → Secrets and variables → Actions → New repository secret**
   - Name: `PUSH_CONFIG`, Secret: a kimásolt szöveg.
4. Kész. Ellenőrzés: Actions → Hírek frissítése → Run workflow – pár perc múlva jön az értesítés.

Több telefon/tablet: mindegyiken kapcsold be, és a kapott szövegeket tedd szögletes zárójelbe, vesszővel elválasztva: `[ {...}, {...} ]` – ez legyen a `PUSH_CONFIG`.

---

## Értesítés minden új hírről
A `friss.yml` feladat 5 percenként megnézi a hírforrásokat, és **minden új hírről** külön értesítést küld (éjjel-nappal); koppintásra megnyílik a cikk.
Egyszerre legfeljebb 20 értesítés megy, ha ennél több új hír jött, egy összesítő értesítés is érkezik. Az első futás csak megjegyzi a meglévő híreket.
Kikapcsolás: Actions → „Friss hírek értesítés” → jobb fent ••• → **Disable workflow**.

## Jó tudni
- A GitHub időzítése néha 5–20 percet késik, így az összefoglaló 7:00–7:30 / 18:00–18:30 között érkezik.
- Ha a repóban 60 napig semmi nem változik, a GitHub leállíthatja az időzítést. Mivel az alkalmazás minden nap ment új híreket, ez általában nem fordul elő; ha mégis, az Actions fülön egy gombbal újra bekapcsolható.
- Időpontok módosítása: `gen.js` elején `MORNING` / `EVENING`, és a `.github/workflows/hirek.yml` `cron` sora.
- Források és árfolyamok: `gen.js` elején a `FEEDS` és `QUOTES` lista. Ha egy forrás nem elérhető, kimarad, a többi működik.
- A `PUSH_CONFIG` titkos kulcsot tartalmaz – csak a GitHub titkok közé tedd.

*Tájékoztató jellegű összefoglaló, nem befektetési tanács.*
