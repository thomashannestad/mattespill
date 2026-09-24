# Prosjektbeskrivelse: Enhjørningsdalen

## Hva vi lager

Enhjørningsdalen er et lite mattespill på norsk for et barn rundt åtte år, først og fremst til øving på matematikkstoff som møter eleven på 3. trinn. Barnet løser korte oppgaver ved å velge ett av svarkortene. Kortene viser tall, eller tegn der oppgaven handler om å sammenligne. Riktig svar gir tre stjerner, og et forsøk gir én stjerne. Stjernene kan brukes i en butikk til å pynte og utvikle en enhjørning.

Spillet skal gjøre mengdetrening lystbetont og oversiktlig. Det er ingen tidtaking, konto eller straff for feil svar. Oppgavene viser hint og forklaring, og barnet kan prøve igjen i nye runder.

## Faglig grunnlag

Oppgavene bygger på to typer kilder, som har ulike roller:

1. **Lekseutklipp fra hjemmet.** Bildene som er gitt i arbeidsmappen `Grunnlag oppgaver/` beskriver arbeid med tallene 1–50, å gjøre ferdig former etter instruksjoner, og å spille flere runder. Et annet utklipp nevner en ny tallbok med tall til 100, søylediagrammer, å lese av og tolke data, sammenligne mengder, sortere og gruppere data, samt repetisjon og automatisering. Dette er korte utdrag, ikke komplette oppgaveark. Spillets konkrete spørsmål er derfor nye oppgaver inspirert av temaene, ikke avskrifter av leksene. Formene og reglene fra det første utklippet er ikke gjenskapt som egne oppgaver.

2. **Udirs læreplan i matematikk MAT01-06, kompetansemål etter 3. trinn.** Den omtaler blant annet strategier for addisjon og subtraksjon, sammenhengen mellom regneartene, multiplikasjon ved telling og gruppering, dobling og halvering, praktisk multiplikasjon og divisjon, relasjonelle likhets- og ulikhetstegn, likevekt, areal og koordinatsystem. [Se kompetansemålene hos Udir](https://www.udir.no/lk20/mat01-06/kompetansemaal-og-vurdering/kv1022?lang=nob).

Læreplanen brukes som faglig retning, ikke som påstand om at spillet dekker alle målene eller erstatter undervisning. Oppgavene er korte flervalgsøvelser; flere kompetansemål krever også praktisk arbeid, samtale, utforsking og at eleven forklarer egne strategier.

## Oppgaver i spillet

Hver oppgave har en ferdighet og et skjult vanskelighetstrinn. Spillet kan velge en oppgave fra en bestemt ferdighet eller blande mellom ferdigheter.

| Ferdighet | Nåværende oppgaveform |
|---|---|
| Tiervenner og fylle neste tier | Finne det manglende tallet, med tierbrett som visuell støtte på de første trinnene |
| Pluss og minus | Regneoppgaver med hopp og tieroverganger |
| Tallrekker og plassverdi | Finne neste tall eller sette sammen hundrere, tiere og enere |
| Dobling og halvering | Doble et tall eller dele et partall i to like deler |
| Åpne regnestykker | Finne det ukjente tallet i addisjon eller subtraksjon |
| Multiplikasjon og deling | Regne med like store grupper eller dele en mengde likt |
| Sammenligning | Sette riktig tegn (<, = eller >) mellom to tall eller to uttrykk |
| Areal | Telle enhetsruter i et rektangel |
| Koordinater | Lese av vannrett eller loddrett plassering av et punkt i et rutenett |
| Diagrammer | Lese av en søyle eller summere søylene i et lite blomsterdiagram |

Oppgavebanken er laget for variasjon innen hvert trinn. Diagramoppgavene leser nå av én søyle eller summerer søylene. Utklippet om data peker også mot oppgaver som ennå ikke er med: tolke og sammenligne forskjeller i diagrammer, sortere eller gruppere datasett og følge instruksjoner for å fullføre former. De kan legges til senere dersom barnet møter dette i leksene. Leksebildene er arbeidsmateriale lokalt; de trengs ikke for å kjøre spillet og er ikke del av den publiserte nettsiden.

## Tilpasning og læringsstøtte

- Hver av de 14 ferdighetene har sin egen progresjon. Framgang i én ferdighet endrer ikke automatisk nivået i en annen.
- I automatisk modus øker trinnet etter minst sju riktige uten hint blant de siste åtte oppgavene på trinnet. To feil på rad, eller tre feil blant de siste fem, senker trinnet og gir ekstra støtte.
- Hint kan brukes uten å miste stjerner. Et riktig svar etter hint belønnes som vanlig, men teller ikke som selvstendig mestring i tilpasningen.
- Oppgaven forklarer svaret etter at barnet har valgt. Støttemodeller brukes blant annet for tierfylling, regnehopp, like grupper, ruteareal og koordinater.
- Automatisk tilpasning er en enkel, utprøvbar regelmodell. Den er ikke en diagnostisk eller standardisert vurdering av elevens kompetanse.

## Belønning og butikk

Stjerner gir synlig framgang for innsats, ikke bare for riktige svar. Barnet kan gi enhjørningen navn, kjøpe ting og ta dem av og på. Butikken har sammenleggbare grupper for manefarger, pynt, hover, halstilbehør, vinger og eventyrsteder. Kjøpt utstyr beholdes, og bare ett element i hver gruppe kan være på samtidig.

## Teknologi, lagring og publisering

- Nettleserbasert, statisk app med vanlig HTML, CSS og JavaScript. Den trenger ingen serverkode eller eksterne pakker for selve spillet.
- Ingen innlogging, analyseverktøy eller nettverkstjenester inne i spillet.
- Kan installeres på hjemskjermen på iPad via manifest og ikoner, og virker uten nett etter første besøk via en service worker. Se README for installering og oppdatering.
- Stjerner, navn, innstillinger, utstyr, mestringsprofiler og aktiv runde lagres i nettleserens `localStorage`.
- Lagringen er knyttet til nettleseren og nettsidens adresse. Den synkroniseres ikke mellom enheter, og localhost og GitHub Pages får hver sin lagring.
- GitHub Pages publiserer siden fra repoet. Nye endringer blir synlige på nettsiden etter at de er committet og pushet til publiseringsbranchen.
- GitHub Pages-siden er offentlig tilgjengelig. Ikke legg personopplysninger eller leksemateriale som ikke skal deles i publiseringsmappen.

## Videre arbeid

Det viktigste neste steget er å prøve spillet med barnet og bruke observasjonene til å justere oppgavetekst, hint, prisnivå og vanskelighetsprogresjon. Aktuelle utvidelser etter utprøving:

1. Legge til diagramoppgaver der barnet sammenligner søyler, finner forskjeller og sorterer eller grupperer data.
2. Utvide praktisk måling av areal og koordinatoppgaver med enkle instruksjoner og bevegelse i rutenettet.
3. Lage flere oppgavevarianter innenfor ferdighetene, slik at gjentatte runder ikke får samme preg.
4. Vurdere en valgfri måte å eksportere eller flytte lokal framgang mellom nettlesere.
5. Gjennomgå tilgjengelighet og bruk på nettbrett etter at barnet har prøvd spillet.

## Kodeoversikt

- `index.html`: sideoppsett og tilgjengelighetsdialoger.
- `sw.js` og `manifest.webmanifest`: installering på hjemskjerm og bruk uten nett.
- `styles.css`: visuell utforming og responsiv layout.
- `game.js`: oppgavegenerator, poeng, tilpasning, lagringstilstand og butikkregler.
- `app.js`: visning, enhjørningsillustrasjon og brukerinteraksjon.
- `README.md`: hvordan starte og bruke spillet.
- `Grunnlag oppgaver/`: lekseutklipp som ble brukt til å velge noen av temaene.
