---
marp: true
size: 16:9
paginate: true

style: |
  /* FONTS */
  @import url('https://fonts.googleapis.com/css2?family=Ubuntu:wght@400;700&family=Oswald:wght@400;700&display=swap');

  /* COLORS AND BASIC STYLING */
  :root {
    --dark: #220c10;
    --dark-rgb: 34,12,16;
    --darkblue: #2176ae;
    --blue: #0eb1d2;
    --darkgreen: #688e26;
    --green: #98ce00;
    --orange: #ff7b33;
    --paper: #fffdf9;
    --red: #ff3333;
    --yellow: #fdcb34;
    --pink: #cb20c5;
    --primary: var(--blue);
    --secondary: var(--orange);
    --accent: var(--orange);
    --text: var(--dark);
    --text-color: var(--text);
    --quote-color: var(--accent);
    --background: var(--paper);
    --headline-color: var(--text);
    --font-family: 'Ubuntu', sans-serif;
    --heading-font-family: 'Oswald', sans-serif;
    --font-size: 1rem;
  }

  /* GENERAL STYLES */
  section {
    background-color: var(--background);
    color: var(--text-color);
    font-family: var(--font-family);
    display: flex; /* Erlaubt Flexbox-Eigenschaften */
    flex-direction: column; /* Stapelt Inhalte vertikal */
    justify-content: flex-start; /* Startet Inhalte von oben */
    padding-top: 70px; /* Setzt einen oberen Rand */
    padding-left: 40px; /* Behält den linken Rand */
    padding-right: 40px; /* Behält den rechten Rand */
    padding-bottom: 40px; /* Behält den unteren Rand */
  }

  h1, h2, h3, h4, h5 {
    font-family: var(--heading-font-family);
    color: var(--headline-color); /* Set headings to use the normal text color */
    /*text-transform: uppercase;*/
    margin: 0 0 10px 0;
  }

  p, li {
    font-size: var(--font-size);
  }

  a {
    color: var(--text-color);
    text-decoration: underline;
  }

  a:hover {
    color: darken(var(--primary), 10%);
  }

  img[alt~="center"] {
   display: block;
   margin: 0 auto;
  }

  /* Blockquote styling */
  blockquote {
    background-color: var(--background);
    border: 0;
    padding: 20px;
    font-family: var(--heading-font-family);
    color: var(--text-color);
    margin: 20px 30px 20px 0px;
    box-shadow: 6px 6px 10px rgba(0, 0, 0, 0.10); /* Add box shadow with light from top-left */
  }

  /* Adjusting the table styling for a centered table with margins, no borders, and specific lines */
  table {
    width: 95%;
    margin: 5px 10px 5px 10px;
    border-collapse: collapse;
  }
  th, td, tr {
    padding: 2px;
    margin: 0;
    text-align: left;
    vertical-align: top;
    background-color: transparent!important;
    border: none!important;
  }
  tr:not(:last-child) td, th {
    border-bottom: 1px solid var(--text-color)!important; /* Adds a border to the bottom of each cell, except for cells in the first and last row */
  }

  /* Zeilenhöhe */
  p, li, blockquote, h1, h2, h3, h4, h5, {
    line-height: 1.5; /* Example line-height for general text */
  }

  /* Footer and header styling */
  section::after, section::before {
    font-size: 0.9rem;
    position: absolute;
  }

  section::after {
    bottom: 5px;
    right: 20px;
    content: counter(page);
    color: var(--text-color);
    text-shadow:0px 0px 7px var(--paper);
  }

  section::before {
    bottom: 5px;
    left: 20px;
    color: var(--text-color);
    content: "schreibszene.ch";
    text-shadow:0px 0px 7px var(--paper);
  }

  header {
    font-family: var(--heading-font-family);
    color: var(--text-color);
    Font-size: 0.9rem;
    padding: 2px 7px 5px 5px;
    margin: 0 0 0 -5px;
  }
  section.lead {
    position: relative;
    color: white; /* Ensuring text color is visible on darker backgrounds */
    background-image: url('./assets/1080p/cover.jpg'); /* Path to your main background image */
    background-size: cover;
    background-position: center;
  }


  .text-content-cover {
  position: relative; 
  z-index: 1;
  }
  .text-content-cover h1,
  .text-content-cover h2,
  .text-content-cover h3, 
  .text-content-cover h4,
  .text-content-cover h5,
  .text-content-cover h6 {
   color: var(--text);
   background-color: rgba( 255,255,255, 0.6);
   display: inline-block;
   padding: 0.1rem 1rem .25rem 1rem;
   margin: 0.1rem 9rem 1rem 0 ;
   /*border-radius:25px;*/
   clear:both;
  }

  .text-content-cover h1 {
   font-size: 2.7rem;
  }

  .text-content-cover h2 {
  font-size: 1.7rem;
  }

  .duration-bubble p{
  font-size: 0.9rem!important;
  position: absolute;
  line-height: 1.1rem!important; 
  padding: 0!important;
  margin: 0!important;
  top: 615px;
  left: 963px;
  text-align: center;
  z-index: 20; /* Ensures text is above the overlay */
  }

  header {
    font-family: var(--heading-font-family);
    color: var(--text-color);
    Font-size: 0.9rem;
    padding: 2px 7px 5px 5px;
    margin: 0 0 0 -5px;
    border: 2px solid var(--orange);
  }

---

<!-- Erste Folie mit Cover-Styling -->

<!-- _paginate: skip -->

<div class="overlay -cover"></div>
  <div class="text-content-cover">
 <h3 style="text-align: right;">Matthias Wiemeyer</h3><br> <br><br><br><br><br><br><br><br>
    <h1>Vom Rohtext zum Reintext</h1><br>
    <br>  </div>

<div class="duration-bubble">
  <p><b><br> &nbsp </b></p>
  </div>

![bg](./assets/1080p/glas-putzen.jpg) 

---

<!-- _backgroundColor: var(--orange) -->

# Das Wichtigste zum <br>guten Stil

<br><br><br><br><br><br>

> «Betrachten Sie Ihr Sündenregister und bereuen Sie aufrichtig.»

![bg right](./assets/1080p/stylish.jpg)

---

<style scoped> h1 {margin: -80px 0 -3px 0;font-size: 1.5rem;} p,td, tr, li, ol, ul {font-size: 0.78rem; line-height: 0.92rem;}
</style>

# Kleine Tugendlehre des Schreibens

- **Ziel und Zielgruppe** präzise identifizieren
- **Persönlichkeit** zeigen (Dialog mit Leser:innen als Vorbild)
- **Aktiv** schreiben (Passivkonstruktionen kritisch prüfen)
- **Verben** vor Substantive (in Anspruch nehmen – brauchen, verwenden, benutzen)
- Das **treffende, ausdrucksstarke Wort** verwenden (Haus – Gutshof, gehen – schlendern, gut – verlockend)
- **Adjektive sparen** (keine Tautologien, kein schulischer Bereich, kein schlimmer Traum, wenig [beste, grösste, wichtigste, massgeschneidert, eklatant])
- **Deutsche, kurze, unverbrauchte Wörter** (liebäugeln, Fernweh, sanft, Obhut, Ehrfurcht, vollends, indessen, gewieft, begreifen ...)
- **Satzzeichen** (mehr Gedankenstrich und Doppelpunkt, wenig Ausrufezeichen)
- Leser durch **Layout** führen (Headlines, Zwischentitel, Hervorhebungen, Bullets, Tabellen, Bilder ...)
- **Keine Floskeln** (Vorsicht vor den ersten Einfällen)
- **Ein Gedanke pro Satz, kurz und lang mischen** (flüssig lesbar, ohne zurückzulesen, keine langen Einschübe)
- **Schlicht schreiben** (kein Wortmüll, nicht Überflüssiges, kein Imponiergehabe, Dienstleistung für den Leser)
- Jeder Absatz, jeder Satz, **jedes Wort, muss sich sein Brot verdienen**.
- Lesbarkeit verbessern durch **Textscharniere** (im Gegensatz dazu, andererseits, danach ...)
- **Schreibe wie du sprichst**, nur sorgfältiger.

---

<!-- _header: Ein Weihnachts-Bettelbrief – und kein ganz schlechter.  Sie haben **5 Minuten, um eine kompetente Kritik** vorzubereiten. -->

<style scoped> p,td, tr {font-size: 0.85rem; line-height: 
1rem;}
</style>

# Welche Sünden finden Sie in diesem Text?

##### Ein bewegtes Jahr neigt sich dem Ende zu – die Festtage stehen vor der Tür.

Seit 36 Jahren unterstützt fraw Frauen darin, sich in herausfordernden Lebenssituationen auf ihre Stärken zu besinnen und Veränderungen selbstbewusst mitzugestalten.

Auch die fraw musste stets neue Wege gehen und innovative Ansätze für die Stärkung der Frauen in Beruf und Familie entwickeln.

Im Frühjahr hat das Eidgenössische Büro für die Gleichstellung von Frau und Mann entschieden, die Unterstützungsbeiträge bis 2019 vollständig zu streichen. Dieser überraschende Entscheid stellt die fraw vor grosse finanzielle Herausforderungen. Doch die Erfolgsgeschichte der fraw muss weitergehen. 500 Beratungen jährlich machen einen Unterschied.

Nutzen Sie gemeinsam den Wind der Veränderung, um mutig und entschlossen für und mit Frauen die Welt zu bewegen. Unterstützen Sie uns mit einer Spende in diesen dynamischen Zeiten. Für Ihre Treue danken wir Ihnen von Herzen.

Herzliche Weihnachtsgrüsse

fraw – frau arbeit weiterbildung

---

<style scoped> p, li, ol, ul, table, td, tr {font-size: 0.8rem; line-height: 1.2rem;}</style>

# Text überarbeiten

- **Langsam lesen, am besten laut**
  - Komplizierte, verschachtelte Sätze <br>→ aufbrechen
  - Zungenbrecher, holprige Melodie <br>→ umformulieren
  - Innere Logik <br>→ Roter Faden, Textscharniere
- **Stilistische Raffinesse**
  - Viele Verben
  - Wenig Adjektive
  - konkret und bildhaft
  - Viel Aktiv
- **Layout optimieren** <br>→ Bullets, Zwischentitel, Hervorhebungen


---

<!-- _header: Schauen Sie diesen Brief an und bereiten Sie sich darauf vor, ihn **kompetent zu kritisieren (5 Min.)** -->

<style scoped> p,li, ol, ul, table, td, tr {font-size: 0.85rem; line-height: 1rem;}</style>

# 

**Buchhaltung - ein notwendiges Übel für Sie?**

Sehr geehrter Herr Knosiak

Meine Praxis-Erfahrung habe ich in verschiedenen Unternehmen als Angestellte aber auch als Inhaberin eines eigenen kleinen Unternehmens gesammelt. Die Tätigkeiten in der Buchhaltung und Lohnbuchhaltung sowie die Personaladministration waren dabei immer ein fixer Bestandteil meiner Aufgaben. Als AHV-Revisorin erhielt ich zudem Einblicke in verschiedene Buchhaltungen von KMUs. Mit diesem ‚Rucksack‘ kann ich Ihnen heute folgende Dienstleistungen anbieten:

- Buchhaltung von A bis Z (exkl. Jahresabschluss)
- Lohnbuchhaltung inkl. AHV-/KTG-/UVG-Jahresdeklaration sowie Quellensteuerabrechnungen
- Personaladministration (Schreiben von Zeugnissen, Krankheitsmeldungen etc.)

Gerne unterstütze ich Sie in diesen Bereichen oder übernehme diese Arbeiten für Sie. Sie bezahlen mich nur für die Stunden oder Tage, in denen ich für Sie arbeite. Fixe Lohnkosten entfallen somit. Gerade in Zeiten, wo qualifizierte Fachkräfte fehlen und Kosten gespart werden müssen, könnte mein Angebot für Sie interessant sein. 

Zögern Sie nicht, mich für weitere Informationen zu kontaktieren.

Barbara Thies
