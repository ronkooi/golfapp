# Golfclub Zeegersloot - Griendbaan Scorekaart (Holes 1 t/m 9)

Een speciaal ontwikkelde, mobiele scorekaart en GPS-afstands-app voor **Golfclub Zeegersloot (Griendbaan, Par 36)** in Alphen aan den Rijn, geoptimaliseerd voor gebruik op een **Samsung Galaxy Z Flip 6** (zowel uitgeklapt als op het coverscherm).

---

## Belangrijkste Functies

1. **Speelpartner Altijd Eerst (1e Invoer)**
   * Bij elke hole en op het setup-scherm staat altijd de **speelpartner als eerste** (bovenaan), en jouw eigen score als tweede.
   * Grote, touch-vriendelijke `[-]` en `[+]` knoppen om met één duim slagen in te voeren.

2. **WHS Handicap & Officiële Baanhandicap**
   * Voer je exacte WHS handicap in (bijv. `24.2` en `28.0`).
   * De app berekent automatisch de 9-holes baanhandicap (playing handicap) op basis van de officiële Course Rating (CR) en Slope Rating (SR) van Zeegersloot.
   * Slagen mee worden nauwkeurig verdeeld over de oneven Stroke Indexes (SI 1, 3, 5, 7, 9, 11, 13, 15, 17) van de Griendbaan.

3. **Flexibele Afslagkleur (Tee Box Keuze per Speler & per Hole)**
   * Keuze uit alle officiële Zeegersloot tees: **Wit, Geel, Blauw, Rood, Oranje**.
   * Je kunt op elk moment gedurende het spel per hole van kleur wisselen met één tik.

4. **Live GPS Afstand tot de Volgende Hole (en Green)**
   * Zodra je op hole 5 staat, toont de app direct de live GPS-afstand naar de **Teebox van hole 6** en naar het midden van de **Green van hole 6**.
   * Daarnaast toont de app ook de realtime afstand naar de huidige green van hole 5.

5. **Directe Check-in bij Afslag (Golfdashboard)**
   * Een geïntegreerde knop opent direct `https://zeegersloot.golfdashboard.com` zodat je meteen kunt inloggen en de optie **"Inchecken"** kunt kiezen.
   * Zodra je hebt ingecheckt en terugkeert naar de app, verschijnt direct de knop **"✅ 2. Ingecheckt! Start Direct Scorekaart ▶"** om zonder vertraging op Hole 1 te starten.
   * Mogelijkheid om de directe incheck-URL eventueel aan te passen of te verfijnen.

6. **Duidelijk Visueel Eindoverzicht & Uitslag**
   * Winnaar-trofee met direct inzicht in wie de ronde heeft gewonnen.
   * Vergelijking: Bruto slagen, Netto slagen en Stableford-punten (9 holes + 18-equivalent).
   * Volledige interactieve scorekaarttabel met kleurgecodeerde badges (Eagle, Birdie, Par, Bogey, Dubbel Bogey+).
   * **Spraakoptie:** Een *"Lees Score Voor"* knop die de uitslag en score hardop uitspreekt via de luidspreker van je telefoon.
   * **Deelknop:** Kopieert met 1 klik een kant-en-klaar overzicht voor WhatsApp.

7. **Historie & Offline Gebruik (PWA)**
   * Gespeelde rondes worden automatisch lokaal opgeslagen en kunnen via het tabblad *Historie* worden teruggekeken.
   * Voorzien van een **Service Worker (`sw.js`)**: werkt 100% offline op de golfbaan, zelfs als de mobiele verbinding in de polder even wegvalt.

8. **Samsung Galaxy Z Flip 6 Coverscherm Modus (Flex Window)**
   * Detecteert automatisch het compacte coverscherm (~720x748 px) of kan handmatig worden ingeschakeld met de knop **"📱 Coverscherm"**.
   * Extra grote contrastrijke knoppen die speciaal ontworpen zijn voor bediening met één hand terwijl je telefoon dichtgeklapt is!

---

## Bestandsstructuur

```text
GolfApp/
├── index.html            # Hoofdscherm (SPA) met alle weergaves
├── manifest.json         # PWA configuratie voor Android / Samsung installatie
├── sw.js                 # Service Worker voor offline cachen
├── start_server.bat      # Windows snelkoppeling om de app lokaal te starten
├── css/
│   └── styles.css        # Responsive styling met Coverscherm Modus
├── js/
│   ├── course-data.js    # Officiële baangegevens Griendbaan (Pars, SI, Tees, GPS coördinaten)
│   ├── handicap.js       # WHS Playing Handicap & Stableford berekeningen
│   ├── gps.js            # Realtime GPS tracking & afstandsmeters
│   ├── storage.js        # LocalStorage voor voorkeuren, actieve ronde en historie
│   └── app.js            # UI interactie en logica
└── icons/
    ├── icon.svg          # Vector golfclub icoon
    ├── icon-192.png      # Android app icoon 192x192
    └── icon-512.png      # Android app icoon 512x512
```

---

## Installatie op je Samsung Galaxy Z Flip 6

1. **Lokaal testen:**
   * Dubbelklik op `start_server.bat` op je computer.
   * Open de browser op je telefoon naar het IP-adres van je computer (bijv. `http://192.168.1.15:8000`).
2. **Online zetten (Aanbevolen voor op de baan):**
   * Upload deze map gratis naar **GitHub Pages**, **Netlify** of **Vercel**.
3. **Als App installeren:**
   * Open de pagina in **Samsung Internet** of **Google Chrome**.
   * Tik op de 3 puntjes (menu) en kies **"Toevoegen aan startscherm"** (of *"App installeren"*).
   * De app heeft nu een eigen Zeegersloot-icoon tussen je apps!
4. **Coverscherm weergave (Flex Window):**
   * Open de app op het coverscherm (bijv. via de *Cover Launcher* widget in Samsung Good Lock / MultiStar, of via Samsung Internet op het Flex Window).
   * Schakel eventueel de knop **"📱 Coverscherm"** in voor de extra grote bedieningselementen!
