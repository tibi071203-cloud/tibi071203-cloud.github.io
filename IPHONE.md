# Napi Hírek iPhone-on

Az alkalmazás iPhone-on és iPaden is működik, ingyen, App Store nélkül. Ugyanúgy saját ikonja lesz a kezdőképernyőn, teljes képernyőn nyílik meg, és értesítéseket is küld.
(Az App Store-ba tenni évi 99 dolláros Apple fejlesztői fiók és Mac gép kellene, ugyanazt tudná.)

## Telepítés (30 másodperc)
1. Nyisd meg az iPhone-on a **Safarit**, és írd be: **tibi071203-cloud.github.io**
   (iOS 16.4-től Chrome-ban és Edge-ben is működik.)
2. Koppints a **Megosztás** gombra: alul középen egy négyzet, belőle felfelé mutató nyíl (□↑).
   Ha nem látod az alsó sávot, görgess egy kicsit felfelé, vagy koppints a **•••** gombra.
3. Görgess le a menüben, és válaszd: **Főképernyőhöz adás** (*Add to Home Screen*).
4. Jobb fent: **Hozzáadás**.

Megjelenik a **Napi Hírek** ikon a kezdőképernyőn. **Mindig erről az ikonról indítsd**, ne a Safariból.

## Értesítések bekapcsolása
Ehhez **iOS 16.4 vagy újabb** kell (Beállítások → Általános → Szoftverfrissítés), és az alkalmazást a kezdőképernyő-ikonról kell indítani.
1. Nyisd meg az alkalmazást az ikonról. Felül megjelenik egy zöld sáv: **🔔 Értesítések → Bekapcsol**.
   (Vagy: **☰ Több → 📲 Telepítés, értesítés be → Értesítések bekapcsolása**.)
2. Az iPhone megkérdezi, engedélyezed-e az értesítéseket: **Engedélyezés**.
3. Megjelenik egy szöveg → **📋 Másolás**.
4. Ezt a szöveget hozzá kell adni a GitHubon a **`PUSH_CONFIG`** titokhoz:
   - **Ha ez az első készülék:** Settings → Secrets and variables → Actions → New repository secret → Name: `PUSH_CONFIG`, Secret: a kimásolt szöveg.
   - **Ha már van benne egy telefon** (pl. az Androidod): a titkot nem lehet megnézni, csak felülírni. Az Android-telefonon is másold ki újra a szöveget (☰ Több → 📲 Telepítés, értesítés be), majd a `PUSH_CONFIG`-ot írd felül így:
     `[ {az Android szövege}, {az iPhone szövege} ]`
     (szögletes zárójelben, a kettő között vessző).
5. Ha a szűrőket, kulcsszavakat és riasztásokat is használnád az iPhone-on: **☰ Több → ☁️ Szinkronizálás** → illeszd be a GitHub-kulcsot (`github_pat_…`) itt is.

## Jó tudni
- **Felolvasás:** ha nem magyarul olvas, a Beállítások → Kisegítő lehetőségek → Felolvasott tartalom → Hangok → Magyar menüben tölthetsz le magyar hangot.
- Az iPhone néha korlátozza a háttérben futó weboldalakat, de az értesítések ettől függetlenül megérkeznek, mert azokat az Apple szervere kézbesíti.
- Ha az ikont törlöd a kezdőképernyőről, a mentett hírek, a portfólió és a beállítások is törlődnek erről a telefonról.
