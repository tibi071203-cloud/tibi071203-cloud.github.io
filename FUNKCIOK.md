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
