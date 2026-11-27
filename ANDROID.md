# Napi Hírek Android-telefonra – letölthető APK, ingyen

A letölthető **`napi-hirek.apk`** magától elkészül, amikor feltöltöd a repót a GitHubra (README, 1. lépés).
A GitHub a saját szerverein, a Google hivatalos Android-eszközeivel építi meg (kb. 5–8 perc), és felteszi az alkalmazásod mellé.

## Letöltés és telepítés
1. Várd meg, amíg a GitHubon az **Actions** fülön az **„Android-alkalmazás (APK)”** feladat mellett zöld pipa lesz.
2. A telefonon nyisd meg: `https://FELHASZNÁLÓNEVED.github.io/napi-hirek.apk`
   (vagy nyisd meg az alkalmazás címét, és nyomd meg a felül megjelenő zöld **Letöltés** gombot)
3. Nyisd meg a letöltött fájlt. A telefon megkérdezi, engedélyezed-e a telepítést ebből a forrásból:
   **Beállítások → Engedélyezés ebből a forrásból** → vissza → **Telepítés**.
4. A Google Play Protect figyelmeztethet, hogy ismeretlen fejlesztőtől származik. A saját alkalmazásodnál ez normális:
   **További részletek → Telepítés mindenképp**.
5. Nyisd meg az alkalmazást → **⚙️ Beállítások → Értesítések bekapcsolása**, és a kapott szöveget tedd be a GitHubon `PUSH_CONFIG` néven (README, 6. lépés).

A linket bárkinek elküldheted, ugyanígy telepítheti.

## Jó tudni
- **Frissítés:** a hírek és a kinézet a weboldalról jönnek, így az alkalmazás magától mindig friss. Új APK-ra nincs szükség.
- **Újraépítés:** ha valamiért új APK kell (Actions → „Android-alkalmazás (APK)” → **Run workflow**), az új APK más aláírást kap.
  Telepítés előtt a régit el kell távolítani a telefonról. Ha ezt el akarod kerülni, kérd, és beállítjuk, hogy mindig ugyanazzal a kulccsal készüljön.
- **Böngészősáv az alkalmazás tetején:** akkor jelenik meg, ha a repó neve nem pontosan `FELHASZNÁLÓNEVED.github.io`. Az alkalmazás így is működik, csak nem teljes képernyős.
- Az alkalmazás a telefonon lévő Chrome-ot használja a háttérben (ez a Google hivatalos megoldása webes alkalmazásokhoz). Ha nincs Chrome, a telefon másik böngészője nyitja meg.

## APK nélkül, még egyszerűbben
Chrome-ban nyisd meg az alkalmazás címét → zöld **Telepítés** gomb (vagy menü ⋮ → **Alkalmazás telepítése**).
Ez is igazi alkalmazást telepít az alkalmazásaid közé, értesítésekkel.
