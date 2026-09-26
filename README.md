# Enhjørningsdalen

Et lite mattespill på norsk, med svarkort og en enhjørning som vokser og kan få nytt utstyr.

Se [PROSJEKT.md](PROSJEKT.md) for prosjektmål, faglig grunnlag, oppgaveoversikt, tilpasningsregler og videre arbeid.

## Start spillet

Dobbeltklikk på `index.html` for å åpne spillet i Chrome, Safari, Firefox eller Edge. Ingen installasjon, innlogging eller internettilkobling er nødvendig. Behold `index.html`, `styles.css`, `game.js`, `app.js`, `sw.js`, `manifest.webmanifest` og mappen `icons/` sammen.

Du kan også starte en lokal server fra denne mappen:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Åpne deretter <http://127.0.0.1:8765>. Stopp serveren med Ctrl+C.

## Ikoner og hjemskjerm

Nettsiden bruker ekte PNG-filer: `icons/apple-touch-icon.png` (180×180) for iOS, `icons/icon-192.png` og `icons/icon-512.png` i manifestet, og `icons/favicon-32.png` for nettleserfanen. Motivet er spillets lilla stjerne på heldekkende grønn bakgrunn. `icons/icon-source.svg` er kun tegningsgrunnlaget for PNG-eksportene; det brukes ikke som ikon i HTML eller manifestet.

Filbanene, startadressen og manifestets virkeområde er relative, slik at de fungerer under GitHub Pages-adressen `/mattespill/`. Manifestet angir visning som egen app fra hjemskjermen.

### Installer på iPad

1. Åpne nettsiden i Safari.
2. Trykk på Del-knappen og velg **Legg til på Hjem-skjerm**.
3. Start spillet fra ikonet etterpå. Da åpner det i fullskjerm uten adresselinje.

Appen på hjemskjermen har egen lagring, adskilt fra Safari. Stjerner tjent i Safari følger ikke med inn i appen, så bruk alltid ikonet etter installering. Safari sletter lokal lagring for nettsider som ikke er besøkt på sju dager, men hjemskjerm-apper er unntatt fra den regelen.

### Uten nett

`sw.js` er en service worker som henter alt fra nettet først og legger en kopi i nettleserens cache. Er nettet borte, brukes kopien, så spillet virker uten nett etter første besøk. Service workeren registreres bare over http og https, ikke når `index.html` åpnes direkte fra disk.

Når `styles.css`, `game.js` eller `app.js` endres, bump `?v=` i `index.html` og `CACHE` og `SHELL` i `sw.js` i samme commit. Da får installerte apper de nye filene ved neste besøk med nett.

Ikonlenkene følger [Apples veiledning for hjemskjermikoner](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html) og [manifestets ikonformat](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/icons).

## Slik spiller dere

- Velg ett av svarkortene. De fleste oppgaver har fire tall, men noen har tegn eller ord, for eksempel <, = og >, fargenavn eller plasser i rutenettet. Riktig svar gir **3 stjerner totalt**, et annet svar gir **1 stjerne** for innsatsen. Bare første svar på oppgaven gir poeng.
- Et hint er alltid gratis. Ved feil vises riktig svar med en kort forklaring. Det er ingen tidtaking.
- Hver runde har åtte oppgaver. Når runden er ferdig, kan dere spille en ny runde i samme tema, få et nytt tilfeldig tema, spille litt av alt, velge tema selv eller besøke butikken.
- Under **Min enhjørning** kan dere velge navn, prøve og kjøpe utstyr, og ta utstyret av og på. Et trykk på «Prøv» viser tingen på enhjørningen uten å bruke stjerner. Kjøpet skjer først når dere trykker «Kjøp». Butikken er delt i sammenleggbare grupper for pynt, manefarger, hover, halstilbehør, vinger og eventyrsteder. Ett utstyr per kategori kan brukes om gangen. Det dere har kjøpt, beholdes.
- Butikken har også **enhjørningsføll**: Kløver (150 stjerner), Fersken (210) og Månefnugg (280). Ett føll kan følge den voksne i engen om gangen. Føll kan forhåndsvises gratis, kjøpte føll beholdes, og det er gratis å bytte eller la dem hvile. «Ta av alt» fjerner utstyret, men lar føllet bli med.
- Enhjørningens nivå følger alle stjernene som er tjent. Kjøp reduserer ikke nivået. Nye nivåer nås ved 24, 60, 120 og 210 opptjente stjerner; enhjørningen vokser litt og får flere magiske detaljer.
- Tannhjulet åpner innstillinger for vanskelighetsgrad og mulighet til å starte på nytt. Sletting krever en ekstra bekreftelse.

## Oppgavene

Utklippene under `Grunnlag oppgaver` nevner tallene 1–50, tall til 1000 og søylediagrammer. Spillet lager nye oppgaver innen disse temaene, og supplerer dem med sentrale regnestrategier og representasjoner for 3. trinn. Utklippene inneholder ikke selve spillarket eller konkrete regnestykker, så oppgavene er laget til spillet.

Standard er nå **Tilpass til meg · automatisk**. Øverst i oppgavekortet står temaet dere øver på, med knappen **Bytt tema**. I «Litt av alt» viser kortet også hvilket tema oppgaven er fra. Den åpner en oversikt med ett kort per tema, med ikon og kort beskrivelse. Et valg starter en ny runde på åtte oppgaver i temaet. Fast vanskelighetsgrad kan velges via tannhjulet og gjelder fra neste oppgave.

| Ferdighet | Start | Videre progresjon |
|---|---|---|
| Tiervenner | `8 + □ = 10` med et brett på ti ruter | Valgfritt brett; også 0 og 10; ukjent tall først |
| Fylle neste tier | `17 + □ = 20` med tierbrett | Andre tiere opp til 100, deretter uten automatisk brett, til slutt tall opp til 1000 |
| Pluss | Summer til 10 | Til 19 uten tierovergang, overgang ved 10, tosifrede tall uten og med overgang |
| Minus | Tall til 9 | Tall til 18 uten tierovergang, overgang ved 10, tosifrede tall uten og med overgang |
| Tallrekker | Telle med 1 til 20 | Til 50, deretter hopp på 2 og 5, til slutt også 10 opp til 100 |
| Plassverdi | Én tier og enere | Flere tiere, hundrere, deretter null på tierplassen |
| Dobling og halvering | Doble små tall | Større tall, og halvering når barnet er klart |
| Åpne regnestykker | Manglende tall sist i en addisjon | Ukjent tall først eller sist, også i subtraksjon |
| Likevekt | Hvilken side av skålvekten er tyngst, eller er de like tunge | Finne loddet som mangler for at vekten skal balansere, med større lodd og ukjent lodd på begge sider |
| Multiplikasjon | Like grupper med 2–5 i hver | Flere grupper og større tall |
| Deling | Dele bær likt mellom kurver | Flere grupper og større tall; divisjon henger sammen med multiplikasjon |
| Sammenligne | Sett riktig tegn (<, = eller >) mellom to tall opp til 20 | Uttrykk med pluss og minus, tall til 50, til slutt gangestykker innenfor gangetabellen. Omtrent hver fjerde oppgave har like sider |
| Areal | Rektangel dekket av enhetsruter | Større rutenett; telle rader og kolonner |
| Måling | Hvor mange ruter lang er en ting? | Lengde og bredde på et teppe i ruter, måle med linjal i centimeter fra 0, måle når tingen ikke ligger ved 0, og hvor mye lengre én ting er enn en annen |
| Koordinater | Hvor langt bortover står enhjørningen? | Også hvor høyt opp den står, på større rutenett. Hintet markerer ruten ned eller raden bort til tallet |
| Instruksjoner i rutenettet | Følge én instruksjon, for eksempel «gå 2 til høyre», og finne den nye plassen | To og tre instruksjoner etter hverandre på større rutenett |
| Diagrammer | Lese av søyler med 1–5 blomster | Søyler til 10, hvilken farge har flest eller færrest, forskjellen mellom to søyler, og summen av alle fire |

Tierbrettet har to rekker med fem ruter. Når svaret er valgt, fylles de manglende rutene med grønne blomster. Pluss- og minusoppgaver viser mellomregning med hopp. Multiplikasjon viser like grupper. Deling viser bærene i én haug og tomme kurver før svaret, og fordelingen etter svaret. Areal viser ruter i et rektangel. Koordinater og instruksjoner bruker et enkelt rutenett, der startpunktet vises etter svaret. Likevekt vises som en skålvekt med lodd; den holdes rett til barnet har svart, og vipper så mot den tyngste siden. Hint kan vise mellomregningsmodellen før svaret, med sluttallet skjult. I blandede runder fordeles øvingen mellom ferdighetene, så diagrammer er én av flere oppgavetyper.

## Automatisk tilpasning

Dette er en enkel startmodell som kan justeres etter utprøving med barnet, ikke en standardisert faglig vurdering.

- Hver ferdighet har sin egen profil og begynner på første faglige trinn. Tallrekker og plassverdi følges separat, selv om begge vises under Tallvenner. Det samme gjelder avlesning og instruksjoner under Koordinater. Hver ny oppgavetype kan derfor bli lettere eller vanskeligere uavhengig av de andre.
- Oppgaven lagrer ferdighet, trinn, egenskaper (for eksempel tierovergang), rolle i øvingen og om hint er brukt. Svartid brukes ikke.
- Minst 7 riktige uten hint blant de siste 8 oppgavene på gjeldende trinn øker trinnet med én. I de første 16 svarene i en ferdighet holder det med 4 riktige på rad uten hint, så barnet raskt kommer til et passende trinn. To feil på rad, eller tre feil blant de siste fem, senker trinnet med én og gir støtte. Trinnet går aldri utenfor ferdighetens grenser.
- Historikken som bestemmer nivåbytte tømmes ved bytte, slik at nye observasjoner kreves. Ekstra støtte åpner hintet automatisk og viser modellen der den finnes. Etter to riktige oppgaver med ekstra støtte går barnet tilbake til vanlig støtte for trinnet. Oppgaver med ekstra støtte teller ikke som selvstendig mestring.
- Omtrent 20 % av oppgavene kan være repetisjon ett trinn under. Omtrent 10 % kan være en utfordring ett trinn over, men bare etter minst fire riktige uten hint blant de siste fem observasjonene. Resten er på gjeldende trinn. Uten nok mestring eller ved ekstra støtte brukes gjeldende trinn i stedet for utfordringer.
- Repetisjon og utfordringer brukes ikke til å endre det etablerte trinnet. Feil på slike oppgaver utløser støtte i neste oppgave i ferdigheten. Manuell øving endrer heller ikke mestringstrinnet.
- Blandede runder velger blant ferdighetene med færrest besvarte oppgaver. Nye ferdigheter får dermed plass i øvingen. De siste oppgavene i samme ferdighet unngås når generatoren finner et alternativ.
- Hint gir fortsatt 3 stjerner ved riktig svar, men svaret teller ikke som selvstendig mestring. Hintbruk huskes selv om hintet skjules eller siden lastes på nytt.
- Faglige trinn vises ikke til barnet. Enhjørningens synlige nivå følger fortsatt bare stjerner.

Fast nivå bruker trinn 1 for «En rolig start», trinn 3 (eller ferdighetens høyeste trinn) for «Passe utfordring» og høyeste trinn for «Litt vanskeligere».

## Foreldreoversikt og eksport

Tannhjulet har knappen **Foreldreoversikt og eksport**. Der kan trinnet i hver ferdighet flyttes med − og +. Oversikten viser trinn, antall svar, andel riktige og andel riktige uten hint per ferdighet, regnet fra de siste 30 svarene. Den viser også de siste åtte svarene som prikker, dato for siste spill og en kort vurdering: «Klar for mer» ved minst 85 % riktige uten hint, og «Trenger støtte» under 60 % riktige.

**Kopier eksport** legger en tekst på utklippstavlen med nøkkeltallene og de siste svarene i hver ferdighet, med dato, oppgavetekst og svaret barnet ga. På iPad kan den også deles til for eksempel Notater eller Meldinger. Eksporten inneholder enhjørningens navn, men ikke barnets, og sendes ingen steder av seg selv.

Dato og gitt svar lagres fra og med denne versjonen. Eldre svar vises uten dato. Den daglige loggen holder de siste 90 dagene.

## Lagring

Spillet lagrer automatisk stjerner, navn, utstyr, innstillinger, mestring per ferdighet og den pågående runden i nettleserens `localStorage`. Det er ingen konto, analyseverktøy, eksterne skrifttyper eller nettverkstjenester.

Bruk samme nettleser og samme adresse hver gang. Direkte åpning av filen og serveradressen har separate lagringer. Fremgangen synkroniseres ikke mellom enheter og kan forsvinne hvis nettleserdata slettes, i privat modus, eller hvis filen flyttes. Hvis lagring blokkeres, vises en melding i spillet.

Lagringsformatet er versjon 2, med samme lagringsnøkkel som før. Svarkort lagres som objekter med verdi og tekst, slik at svaret kan være et tall eller et tegn. Lagringer der kortene bare var tall, oppgraderes automatisk. Versjon 1 oppgraderes automatisk: stjerner, utstyr, navn, samlet fremgang og aktiv oppgave/runde bevares. Automatisk tilpasning slås på, og de nye mestringsprofilene starter forsiktig. En gammel oppgave gir vanlig belønning, men påvirker ikke den nye faglige profilen. Allerede besvarte oppgaver kan ikke gi poeng på nytt.

## Videreutvikling og tester

`game.js` inneholder oppgavegenerator, poeng, nivåer og butikkregler. `app.js` inneholder grensesnittet og den interaktive SVG-enhjørningen. `styles.css` styrer utseende og mobiltilpasning.

Kjør testene med Node.js. GitHub Actions kjører dem også automatisk ved hver push:

```sh
node --test *.test.cjs
```

Kvalitetskontrollen i `question-quality.test.cjs` løser 64 000 oppgaver fra oppgaveteksten med en fast tilfeldig sekvens. Den dekker alle 16 ferdigheter på alle 64 vanskelighetstrinn, kontrollerer forklaringer og svaralternativer, og undersøker HTML/SVG-visningen av figurene. Testene bruker isolert lagring og endrer ikke spillerens fremgang. Dette er automatiske kontroller; de erstatter ikke utprøving med barnet eller på en fysisk enhet.
