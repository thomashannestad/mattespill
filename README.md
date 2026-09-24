# Enhjørningsdalen

Et lite mattespill på norsk, med fire svarkort og en enhjørning som vokser og kan få nytt utstyr.

## Start spillet

Dobbeltklikk på `index.html` for å åpne spillet i Chrome, Safari, Firefox eller Edge. Ingen installasjon, innlogging eller internettilkobling er nødvendig. Behold `index.html`, `styles.css`, `game.js` og `app.js` i samme mappe.

Du kan også starte en lokal server fra denne mappen:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Åpne deretter <http://127.0.0.1:8765>. Stopp serveren med Ctrl+C.

## Slik spiller dere

- Velg et av de fire svarene. Riktig svar gir **3 stjerner totalt**, et annet svar gir **1 stjerne** for innsatsen. Bare første svar på oppgaven gir poeng.
- Et hint er alltid gratis. Ved feil vises riktig svar med en kort forklaring. Det er ingen tidtaking.
- Hver runde har åtte oppgaver. Spill en ny runde eller besøk butikken når runden er ferdig.
- Under **Min enhjørning** kan dere velge navn, kjøpe utstyr og ta utstyret av og på. Ett utstyr per kategori kan brukes om gangen. Det dere har kjøpt, beholdes.
- Enhjørningens nivå følger alle stjernene som er tjent. Kjøp reduserer ikke nivået. Nye nivåer nås ved 24, 60, 120 og 210 opptjente stjerner; enhjørningen vokser litt og får flere magiske detaljer.
- Tannhjulet åpner innstillinger for vanskelighetsgrad og mulighet til å starte på nytt. Sletting krever en ekstra bekreftelse.

## Oppgavene

Utklippene under `Grunnlag oppgaver` nevner tallene 1–50, tall til 1000 og søylediagrammer. Spillet lager nye oppgaver innen disse temaene, og supplerer dem med sentrale regnestrategier og representasjoner for 3. trinn. Utklippene inneholder ikke selve spillarket eller konkrete regnestykker, så oppgavene er laget til spillet.

Standard er nå **Tilpass til meg · automatisk**. Tema velges over oppgaven. Fast vanskelighetsgrad kan velges via tannhjulet og gjelder fra neste oppgave.

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
| Multiplikasjon | Like grupper med 2–5 i hver | Flere grupper og større tall |
| Deling | Dele bær likt mellom kurver | Flere grupper og større tall; divisjon henger sammen med multiplikasjon |
| Sammenligne | Regn ut to små uttrykk | Større tall og multiplikasjon før barnet velger størst verdi |
| Areal | Rektangel dekket av enhetsruter | Større rutenett; telle rader og kolonner |
| Koordinater | Finne et punkt og lese vannrett retning | Lese vannrett og loddrett retning på større rutenett |
| Diagrammer | Lese av søyler med 1–5 blomster | Søyler til 10, deretter summere fire søyler |

Tierbrettet har to rekker med fem ruter. Når svaret er valgt, fylles de manglende rutene med grønne blomster. Pluss- og minusoppgaver viser mellomregning med hopp. Multiplikasjon viser like grupper, areal viser ruter i et rektangel, og koordinater bruker et enkelt rutenett. Hint kan vise mellomregningsmodellen før svaret, med sluttallet skjult. I blandede runder fordeles øvingen mellom ferdighetene, så diagrammer er én av flere oppgavetyper.

## Automatisk tilpasning

Dette er en enkel startmodell som kan justeres etter utprøving med barnet, ikke en standardisert faglig vurdering.

- Hver ferdighet har sin egen profil og begynner på første faglige trinn. Tallrekker og plassverdi følges separat, selv om begge vises under Tallvenner. Hver ny oppgavetype kan derfor bli lettere eller vanskeligere uavhengig av de andre.
- Oppgaven lagrer ferdighet, trinn, egenskaper (for eksempel tierovergang), rolle i øvingen og om hint er brukt. Svartid brukes ikke.
- Minst 7 riktige uten hint blant de siste 8 oppgavene på gjeldende trinn øker trinnet med én. To feil på rad, eller tre feil blant de siste fem, senker trinnet med én og gir støtte. Trinnet går aldri utenfor ferdighetens grenser.
- Historikken som bestemmer nivåbytte tømmes ved bytte, slik at nye observasjoner kreves. Etter to riktige oppgaver med ekstra støtte går barnet tilbake til vanlig støtte for trinnet. Oppgaver med ekstra støtte teller ikke som selvstendig mestring.
- Omtrent 20 % av oppgavene kan være repetisjon ett trinn under. Omtrent 10 % kan være en utfordring ett trinn over, men bare etter minst fire riktige uten hint blant de siste fem observasjonene. Resten er på gjeldende trinn. Uten nok mestring eller ved ekstra støtte brukes gjeldende trinn i stedet for utfordringer.
- Repetisjon og utfordringer brukes ikke til å endre det etablerte trinnet. Feil på slike oppgaver utløser støtte i neste oppgave i ferdigheten. Manuell øving endrer heller ikke mestringstrinnet.
- Blandede runder velger blant ferdighetene med færrest besvarte oppgaver. Nye ferdigheter får dermed plass i øvingen. De siste oppgavene i samme ferdighet unngås når generatoren finner et alternativ.
- Hint gir fortsatt 3 stjerner ved riktig svar, men svaret teller ikke som selvstendig mestring. Hintbruk huskes selv om hintet skjules eller siden lastes på nytt.
- Faglige trinn vises ikke til barnet. Enhjørningens synlige nivå følger fortsatt bare stjerner.

Fast nivå bruker trinn 1 for «En rolig start», trinn 3 (eller ferdighetens høyeste trinn) for «Passe utfordring» og høyeste trinn for «Litt vanskeligere».

## Lagring

Spillet lagrer automatisk stjerner, navn, utstyr, innstillinger, mestring per ferdighet og den pågående runden i nettleserens `localStorage`. Det er ingen konto, analyseverktøy, eksterne skrifttyper eller nettverkstjenester.

Bruk samme nettleser og samme adresse hver gang. Direkte åpning av filen og serveradressen har separate lagringer. Fremgangen synkroniseres ikke mellom enheter og kan forsvinne hvis nettleserdata slettes, i privat modus, eller hvis filen flyttes. Hvis lagring blokkeres, vises en melding i spillet.

Lagringsformatet er versjon 2, med samme lagringsnøkkel som før. Versjon 1 oppgraderes automatisk: stjerner, utstyr, navn, samlet fremgang og aktiv oppgave/runde bevares. Automatisk tilpasning slås på, og de nye mestringsprofilene starter forsiktig. En gammel oppgave gir vanlig belønning, men påvirker ikke den nye faglige profilen. Allerede besvarte oppgaver kan ikke gi poeng på nytt.

## Videreutvikling og tester

`game.js` inneholder oppgavegenerator, poeng, nivåer og butikkregler. `app.js` inneholder grensesnittet og den interaktive SVG-enhjørningen. `styles.css` styrer utseende og mobiltilpasning.

Kjør testene med Node.js:

```sh
node --test game.test.cjs
```
