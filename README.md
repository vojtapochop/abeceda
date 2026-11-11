# Abeceda

Česká aplikace pro iPad, se kterou se předškolák nebo prvňák učí **poznávat a psát písmena**.
Webová aplikace (PWA) bez závislostí – po přidání na plochu běží na celou obrazovku a funguje offline.

## Co umí

| Část | Co dítě dělá | Co se tím učí |
|---|---|---|
| **Karta písmena** | vidí velké i malé písmeno, slyší hlásku a slovo s obrázkem („M jako motýl“) | spojení tvar – zvuk – význam |
| **Piš** | obtahuje písmeno prstem po tazích ve správném pořadí a směru, 3 kola s ubývající nápovědou | tvar písmene a pohyb ruky |
| **Najdi písmeno** | slyší hlásku a hledá ji mezi 3–4 písmeny | rozpoznávání písmen |
| **Na co začíná?** | vidí obrázek, slyší slovo a vybírá první písmeno | sluchová analýza první hlásky |

Za každé písmeno jsou 3 hvězdičky (poznal – napsal – spolehlivě pozná) a obrázek do sbírky.

## Instalace na iPad

1. Na GitHubu: **Settings → Pages → Deploy from a branch**, vybrat větev s aplikací a složku `/ (root)`.
2. Na iPadu otevřít v Safari adresu `https://<uživatel>.github.io/abeceda/`.
3. **Sdílet → Přidat na plochu.** Aplikace se pak spouští jako běžná aplikace, i bez internetu.
4. Podržet tlačítko **Rodiče** (1,5 s) a v sekci *Namluvte hlásky* nahrát hlásky vlastním hlasem.
5. Kvalitnější český hlas: *Nastavení → Zpřístupnění → Předčítání obsahu → Hlasy → Čeština*.

Lokální spuštění: `python3 -m http.server` a otevřít `http://localhost:8000`.

## Z čeho návrh vychází

**Metodika čtení a psaní**
- Pořadí písmen (A, M, L, E, S, O, P, U, I, T, J, N, V, Z, D, K, Š, R, C, H, B, Č, Ž, Ř, F, G, CH, Ď, Ť, Ň…) kopíruje obvyklý postup českých slabikářů analyticko-syntetické metody, takže aplikace jde ruku v ruce se školou.
- Začíná se **velkými tiskacími písmeny** (jako genetická metoda): mají jednoduché tvary a nepletou se (b/d/p). Malé písmeno je na kartě jen na ukázku.
- Učí se **hláska, ne název písmene** („m“, ne „em“) – názvy písmen ztěžují pozdější skládání slabik. Proto lze hlásky namluvit hlasem rodiče.
- Samohlásky jsou červené, souhlásky modré – stejné rozlišení se používá ve školních pomůckách.
- Psaní: pevné pořadí a směr tahů (shora dolů, zleva doprava), nejprve ukázka, pak obtahování s ubývající nápovědou. Studie u předškoláků ukázaly, že psaní prstem na tabletu pomáhá zapamatovat si tvar písmen; úchop tužky ale natrénuje jen tužka (nebo stylus).

**Návrh pro děti**
- Podle rámce Hirsh-Pasek a kol. (2015) má dítě být *aktivní, soustředěné, učit se smysluplně a společně s někým*. Proto tu nejsou reklamy, vedlejší minihry, časomíra ani blikající prvky, které od učení odvádějí.
- Chyba se netrestá: špatná dlaždice jen zešedne a zadání se zopakuje; při psaní se nic nemaže. Žádný bzučák.
- Chválí se hned a krátce; odměnou je sbírka obrázků, ne body.
- Písmena, která dítěti nejdou, se ve hrách ptají častěji (rozložené opakování); tvarově podobná písmena (E/F, P/B/R) se přidávají až u těch, která už zná.
- Barvy: klidné krémové pozadí, vysoký kontrast písmen, málo barev s jasným významem. Zvuky: jemné tóny, žádné hlasité efekty.
- Po 15 minutách aplikace navrhne pauzu (lze změnit) – krátké každodenní procvičování je účinnější než dlouhé.

**Zdroje**
- Hirsh-Pasek, K. et al. (2015): [Putting Education in “Educational” Apps](https://www.psychologicalscience.org/publications/educational-apps.html)
- Meyer, M. et al. (2021): [How educational are “educational” apps for young children?](https://pubmed.ncbi.nlm.nih.gov/35282402/)
- Patchan, M., Puranik, C. (2016): [Using tablet computers to teach preschool children to write letters](https://researchconnections.org/childcare/resources/32955)
- Mayer, C. et al. (2020): [Literacy training of kindergarten children with pencil, keyboard or tablet stylus](https://www.frontiersin.org/articles/10.3389/fpsyg.2019.03054/pdf)
- [Metodický průvodce Čteme a píšeme s Agátou / Živá abeceda](https://nns.cz/agata/wp-content/uploads/1A-06-Metodický-průvodce-Čteme-a-píšeme-s-Agátou_web.pdf) (Nová škola)
- [Výuka počátečního čtení](https://is.muni.cz/el/ped/podzim2023/SP2001/um/Vyuka_pocatecniho_cteni_.pdf) (PdF MU)

## Struktura

- `index.html`, `css/style.css` – obrazovky a vzhled
- `js/data.js` – písmena, tahy, slova, pořadí
- `js/app.js` – logika (hlas, zvuky, psaní, hry, postup)
- `sw.js`, `manifest.webmanifest`, `icons/` – instalace a offline režim

Postup i nahrávky se ukládají jen v zařízení (localStorage, IndexedDB); nic se nikam neodesílá.
