# Napi Hírek – új funkciók és használatuk

## Első lépés: szinkronizálás (egyszer kell, kb. 3 perc)
Az értesítéseket a GitHub küldi. Ahhoz, hogy a telefonon beállított **szűrők, csendes idő, kulcsszavak, árfolyam-riasztások és a figyelőlista** hassanak az értesítésekre, a telefonnak fel kell tudnia tölteni őket a repódba. Ehhez kell egy GitHub-kulcs:

1. Gépen nyisd meg: **github.com/settings/personal-access-tokens/new**
2. **Token name:** `Napi Hírek` · **Expiration:** a leghosszabb, amit enged
3. **Repository access:** *Only select repositories* → válaszd ki a `….github.io` repódat
4. **Permissions → Repository permissions → Contents:** *Read and write*
5. **Generate token** → másold ki (`github_pat_…` kezdetű)
6. Küldd át a telefonodra (pl. e-mailben), és az alkalmazásban: **☰ Több → ☁️ Szinkronizálás** → illeszd be → **Mentés és próba**

Ha azt írja ki, hogy „✓ Szinkronizálva”, kész. Innentől minden beállítás magától, titkosítva feltöltődik: a nyilvános repóban senki más nem tudja elolvasni.
Ha a kulcs lejár, készíts egy újat, és illeszd be ugyanide.

---

## A funkciók

| Hol találod | Mit tud | Mire figyelj |
|---|---|---|
| **☰ Több → 🔔 Értesítések és szűrők** | Ki- és bekapcsolhatod az új hírek és az összefoglaló értesítéseit, rovatonként (magyar politika, világ, magyar tőzsde, világtőzsde) és lapanként. | 1–5 percen belül hat. |
| ugyanitt: **🌙 Csendes idő** | A megadott órák között csak a kulcsszavas hírek és az árfolyam-riasztások jönnek. | Pl. 23:00–07:00. |
| **(magától)** Egy esemény, egy értesítés | Ha több lap ugyanarról ír, egy értesítés jön, pl. „Telex +2 (Index, HVG)”. 3 órán belül ugyanarról nem szól újra. | Nem kell beállítani. |
| **☰ Több → 🔑 Kulcsszavak** | Pl. `OTP`, `kamatdöntés`, `MNB`. Ha egy hír tartalmazza, 🔔 jelöléssel kiemelt értesítés jön, csendes időben és kikapcsolt rovatnál is. A Friss fülön kékkel kiemelve látszik. | Kis- és nagybetű, ékezet mindegy. Több szót vesszővel is beírhatsz. |
| **☰ Több → 🚨 Árfolyam-riasztás** | Válaszd ki az árfolyamot (pl. OTP, EUR/HUF, Bitcoin vagy a figyelőlistád elemét), majd: *fölé megy*, *alá esik* vagy *napi mozgás legalább X%*. | Percenként ellenőrzi. A „fölé/alá” újra jelez, ha az ár visszament, majd megint átlépi a határt. A napi mozgás naponta egyszer jelez. |
| **☰ Több → ⭐ Figyelőlista** | Bármilyen részvény, deviza vagy kripto a Yahoo Finance jelölésével: `TSLA`, `AAPL`, `NVDA`, `OPUS.BD`, `4IG.BD`, `RHM.DE`, `EURUSD=X`, `ETH-USD`… Az Árfolyamok fül tetején jelenik meg, és riasztás is állítható rá. | Az első adat 1–5 perc múlva érkezik. Jelölést a finance.yahoo.com keresőjében találsz. |
| **⚡ Friss → Lapok összehasonlítása** | Ha több lap is írt ugyanarról, egymás alatt látod, melyik lap milyen címmel hozta. | |
| **🔍 (fent)** Keresés | A friss hírekben (kb. az utolsó 1–2 nap), a mai összefoglalóban és az archívumban keres. | |
| **☆ csillag** a Friss fülön → **🔖 Mentett** | Elmentheted a hírt későbbre. | Csak ezen a telefonon tárolódik. |
| **☰ Több → 💱 Pénzváltó** | Forint, euró, dollár, font, frank és bitcoin között vált, élő középárfolyammal. | A bankok ennél rosszabb árfolyamon váltanak. |
| **☰ Több → 📅 Gazdasági naptár** | Fontos amerikai, európai, brit, kínai, japán és svájci események: kamatdöntések, infláció, munkaerőpiac. Budapesti idő szerint, a várt és az előző értékkel. | Félóránként frissül. A magyar (MNB) eseményeket a forrás nem tartalmazza. |
| **☰ Több → 🗂️ Archívum** | A korábbi összefoglalók (a régi Archívum gomb ide került). | |
| **☰ Több → 📲 Telepítés, értesítés be** | Az értesítések bekapcsolása és a PUSH_CONFIG szöveg (a régi Beállítások ide került). | |

Új az árfolyamoknál: **GBP/HUF** és **CHF/HUF** is.

---

## Újabb funkciók (2. kör)

| Hol találod | Mit tud | Mire figyelj |
|---|---|---|
| **☰ Több → 💼 Portfólióm** | Add meg, miből mennyi van (pl. 50 OTP, 1000 EUR, 0,1 Bitcoin, figyelőlistás részvények), opcionálisan a vételárral. Mutatja az értékét forintban, a mai és az összes nyereséget/veszteséget. Az **Árfolyamok** fül tetején zöld kártyán is látszik. | Csak ezen a telefonon tárolódik. Ami nincs a listában, előbb tedd fel a ⭐ Figyelőlistára. |
| **Árfolyamok → koppints egy kártyára** | Részletes grafikon: 1 nap / 1 hét / 1 hónap / 1 év / 5 év. Ujjal végighúzva látod az árat az adott időpontban. | Az 1 napos és 1 hetes grafikon 10 percenként, a hosszabbak 6 óránként frissülnek. Új figyelőlistás elemnél pár perc, mire megjelenik. |
| **☰ Több → 🇭🇺 Gazdasági mutatók** | Infláció (éves), 3 hónapos bankközi kamat (BUBOR), 10 éves állampapír-hozam, munkanélküliség, mini grafikonnal, valamint az euró és a dollár árfolyama. | Havi adatok (OECD/Eurostat), 1–2 hónapos késéssel jelennek meg. Az MNB alapkamatát a forrás nem közli; a BUBOR jellemzően annak közelében mozog. |
| **☰ Több → 🗳️ Közvélemény-kutatások** | A pártok támogatottsága grafikonon és táblázatban, intézetenként, a nyilvánosan közzétett felmérések alapján (Wikipédia-összesítés). | Az intézetek eredményei eltérhetnek egymástól; az alkalmazás nem átlagol és nem kommentál. |
| **☰ Több → 🏛️ Parlament** | Az Országgyűlésről, törvényjavaslatokról és szavazásokról szóló friss hírek. | A hivatalos napirend a parlament.hu oldalon van; ez a lista a lapok híreiből válogat. |
| **Hírek → 🔊 Felolvasás** | A telefon hangosan felolvassa az összefoglalót. Még egy koppintás: leállítás. | Ha nincs magyar hang, a telefon Beállítások → Szövegfelolvasás (Google szövegfelolvasó) menüjében telepíthető. |
| **Hírek → 📅 Heti összefoglaló** | Vasárnap este a hét legfontosabb eseményei, értesítéssel. A Hírek oldalon 4 napig kártyán látszik, utána az Archívumban. | Claude-kulccsal valódi összefoglaló; kulcs nélkül a hét napi összefoglalóiból válogat. |
| **📤 gomb** | Megosztás: egy hír (Friss fül) vagy az egész összefoglaló (Hírek fül) elküldése Messengeren, Viberen, e-mailben stb. | |
| **☰ Több → 🔤 Megjelenés** | Téma (automatikus / világos / sötét) és betűméret (kicsi – nagyon nagy). | Csak ezen a telefonon. |
| **☰ Több → 🧠 Napi kvíz** | Claude-kulccsal este 5 kérdés a nap híreiből, magyarázattal. Kulcs nélkül: „Melyik lap hozta ezt a hírt?” kérdések a friss hírekből. | Az „Új kör” gombbal újrakezdheted. |

## Újabb funkciók (3. kör) + új kezdőlap

| Hol találod | Mit tud | Mire figyelj |
|---|---|---|
| **Hírek → Mind (kezdőlap)** | Köszönés és dátum, időjárás, mini piaci sáv (BUX, EUR/HUF, Bitcoin), a portfóliód értéke, „Neked szóló hírek”, „Most a legfontosabb” top 3, alatta a napi összefoglaló. A kártyákra koppintva a megfelelő oldalra ugrik. | |
| **Friss → 🔥 Legfontosabb** | Az elmúlt 24 óra eseményei aszerint, hány lap írt róluk (a szám a jobb oldalon). A kulcsszavas események előrébb kerülnek. | |
| **Friss → trendek (a lista tetején)** | 🔥 = most hirtelen sokat emlegetett szavak, a többi = a nap leggyakoribb témái. Koppintásra rákeres. | Kevés hír esetén üres lehet. |
| **🎯 Neked szóló hírek** | Azok a friss hírek, amelyekben szerepel a kulcsszavad, a figyelőlistád vagy a portfóliód valamelyik eleme (pl. „OTP”). | Kulcsszó / figyelőlista / portfólió nélkül nem jelenik meg. |
| **☰ Több → ➕ Saját források** | Bármelyik oldal RSS-hírfolyamát hozzáadhatod. Hírei ⭐ jellel a Friss fülön jelennek meg, és értesítést kapsz róluk (témaszűrés nélkül). A listában látszik, működik-e. | Kell hozzá a ☁️ Szinkronizálás. Az első hírek 1–5 perc múlva jönnek. A hírek a nyilvános repóba is bekerülnek, de csak nálad látszanak. |
| **🔔 Tőzsdezárás-összegzés** | Hétköznap kb. 17:10 és 18:00 között egy értesítés: BUX, OTP, MOL, Richter, Telekom, EUR/HUF napi változása és a portfóliód mai eredménye forintban. | Ki-be kapcsolható: ☰ Több → 🔔 Értesítések. Ünnepnapon (nincs kereskedés) nem jön. A portfólió szinkronizálva kerül át. |
| **Árfolyamok → 🔒 zárva** | Ha egy piacon nincs kereskedés (hétvége, ünnep), a kártyán látszik, mikor volt az utolsó kötés. | |
| **☰ Több → 🌤️ Időjárás** | Keresd meg a településed; a kezdőlapon látszik a hőmérséklet, az időjárás, a napi min/max és az eső esélye. | Ingyenes Open-Meteo adat, 20 percenként frissül. |
| **☰ Több → 🩺 Állapot** | Megmutatja, mikor futott utoljára a frissítés, melyik hírforrás és árfolyam működik, hány értesítés ment ki ma, és a legutóbbi hibákat. Ha 30 percnél régebben nem volt frissítés, a fejlécben piros ⚠️ jelzés jelenik meg (koppintásra ide visz). | Ha tartósan ⚠️, nézd meg a GitHubon az Actions fület, vagy küldj képet. |
