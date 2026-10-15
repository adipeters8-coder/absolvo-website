# ABSOLVO Website · Briefing für Claude Code

Lies diese Datei komplett, bevor du Code schreibst. Sie ist die einzige Quelle für Inhalt, Design und Technik. Wenn etwas fehlt, frag nach statt zu raten. Texte aus dieser Datei 1:1 übernehmen, nicht umformulieren.

## 1. Worum es geht

ABSOLVO verkauft Abschlusspullover (Hoodies mit Motto vorne und Namensliste hinten) an Schulklassen und Jahrgänge in Deutschland: Abi, Fachabi, Realschule, Hauptschule, Berufskolleg. Gründer und einziger Ansprechpartner: Adrian Peters, Düsseldorf, macht das seit 2019.

Ziel der Website: Besucher (Stufensprecher, Abikomitee, Klassenleitung, 15 bis 20 Jahre) verstehen in 10 Sekunden, was ABSOLVO ist, rechnen ihren Preis im Konfigurator aus und schicken eine Anfrage ab. Jede Seite führt zum Preisrechner. Es gibt keinen Shop mit Warenkorb, nur Anfrage.

Domain: https://www.absolvo.shop (absolvo.shop leitet auf www weiter)
Instagram: @absolvo [Handle prüfen] · TikTok: [Handle] · Mail: [hallo@absolvo.shop]

## 2. Technik

Astro (aktuelle stabile Version), statischer Output, kein UI-Framework. Nur der Preisrechner bekommt ein kleines TypeScript-Script. Kein Tailwind, eigenes CSS mit Custom Properties (Tokens unten). Schriften über npm selbst hosten (@fontsource/archivo-black, @fontsource-variable/inter-tight, @fontsource/jetbrains-mono), kein Google-Fonts-Link (Datenschutz).

Integrationen: @astrojs/sitemap. Sonst so wenig Abhängigkeiten wie möglich.

Hosting: GitHub Pages mit GitHub Actions (offizielle Astro-Action). `public/CNAME` mit `www.absolvo.shop`. `site: 'https://www.absolvo.shop'` in astro.config, `trailingSlash: 'always'`.

Formular: Formspree (Endpoint als Umgebungsvariable `PUBLIC_FORMSPREE_ID`, bis dahin Platzhalter). Absenden per fetch, danach Weiterleitung auf /danke/. Ohne JavaScript funktioniert das Formular als normales POST.

Struktur:
```
src/
  layouts/Base.astro        (head, SEO, Header, Footer)
  components/               (Header, Footer, Button, Logo, SectionLabel, Rotstift, FaqItem, StepList, SchoolCards, CtaBand, PriceTeaser)
  data/preise.json          (alle Preise und Regeln des Konfigurators)
  data/faq.json
  pages/ index, preis-berechnen, abipullover, abschlusspullover-realschule, abschlusspullover-berufskolleg, so-laeufts, faq, ueber-absolvo, danke, impressum, datenschutz, 404
  scripts/konfigurator.ts
  styles/tokens.css, global.css
public/ logo/ (SVGs aus dem Ordner absolvo-assets), favicon.svg, og/ (OG-Bilder), robots.txt, CNAME
```

## 3. Marke und Ton

ABSOLVO ist Latein für „ich schließe ab“. Die Marke spielt mit Schule: Rotstift, Haken, Korrekturen, Noten. Ironisch, locker, auf Augenhöhe. Kein Werbesprech, keine Doktorhut-Clipart, keine Emojis im Fließtext der Website.

Sprache: Du/Ihr. Kurze, ganze Sätze. Keine Gedankenstriche als Satzteiler. Keine Floskeln wie „Wir sind nicht X, sondern Y“. Nicht überschwänglich.

Slogans für Akzente (sparsam, max. einer pro Abschnitt): „Abgehakt.“ · „Gute Hoodie.“ · „Hoodie ist gut genug.“ · „Jeder Abschluss verdient einen Pulli.“ · 404: „Die Seite hat leider nicht bestanden.“

## 4. Design

**Farben (tokens.css)**
```
--rot: #E3262B;          /* Korrekturrot, Akzente, Buttons, Rotstift */
--rot-dunkel: #C91F24;   /* Hover */
--papier: #F4F1EA;       /* Seitenhintergrund */
--papier-2: #EBE7DE;     /* Karten, Flächen */
--tinte: #17181C;        /* Text, dunkle Sektionen */
--tinte-2: #2E2F33;
--grau: #6B6A66;         /* Nebentexte */
--linie: #E2DDD2;
```
Grundregel: Papierweiß als Hintergrund, Tinte für Text, Rot nur als Akzent und für große Flächen in Hero/CTA. Nie Rot auf Rot. Kleine Schrift auf Rot nur in Papierweiß und ab 18 px fett.

**Schriften**
Archivo Black: nur im Logo, nie für Text.
Inter Tight 800/900: Headlines, sehr eng (letter-spacing -0.04em, line-height 0.95).
Inter Tight 400/500: Fließtext, 18 px mobil, 20 px Desktop, line-height 1.5.
JetBrains Mono 500: Labels, Abschnittsnummern („01 · FÜR WEN“), Preise in Tabellen, Versalien, letter-spacing 0.04em, 13 bis 14 px.

Typo-Skala (clamp, mobil bis Desktop): H1 48 bis 120 px · H2 36 bis 72 px · H3 24 bis 32 px · Text 18 bis 20 px · Label 13 px.

**Layout**
Mobil zuerst. Max. Breite Inhalt 1200 px, Seitenränder 20 px mobil, 48 px Desktop. Viel Weißraum, große Typo, wenige Elemente pro Abschnitt. Abschnitte abwechselnd Papier und Tinte, Hero und Schluss-CTA in Rot.

**Logo**
Dateien in public/logo/: `absolvo-logo-tinte.svg` (auf Papier), `absolvo-logo-papier.svg` (auf Tinte), `absolvo-logo-auf-rot.svg` (auf Rot, Haken in Tinte), `absolvo-signet.svg` (nur Haken). Logo nicht nachbauen, nicht verzerren, nur diese Dateien. Header: Logo 140 px breit mobil, 180 px Desktop, verlinkt auf /.

**Rotstift-Elemente (als kleine SVG-Komponente)**
Unterstreichung: `<path d="M3 8 C50 3 120 1 197 6" stroke="#E3262B" stroke-width="6" stroke-linecap="round" fill="none"/>` in viewBox 0 0 200 12, unter einem Wort, preserveAspectRatio="none".
Haken: Pfad aus absolvo-signet.svg.
Kringel um ein Wort: handgezeichnete Ellipse, 2 Linien leicht versetzt.
Regel: max. ein Rotstift-Element pro Abschnitt. Optional einmalig Zeichen-Animation beim Scrollen (stroke-dashoffset), respektiert prefers-reduced-motion.

**Komponenten**
Button primär: Rot, Text Papierweiß, Inter Tight 800, 18 px, Padding 18/28, Radius 999 px, Hover Rot-dunkel, Fokusring 3 px Tinte. Auf Rot: Papierweiß mit Text Tinte.
Button sekundär: Rahmen 2 px Tinte, transparent.
Karten: Papier-2, Radius 16 px, keine Schatten.
Section-Label: JetBrains Mono, „01 · FÜR WEN“, in Rot.

**Bilder**
Fotos schwarzweiß mit hohem Kontrast, Rot nur als ergänztes Element (CSS-Filter grayscale(1) contrast(1.2) auf Fotos erlaubt). Für v1 Platzhalter mit Mockups (grauer Hoodie, Namensliste angedeutet) und Alt-Text. Format WebP/AVIF über astro:assets, Breite und Höhe immer gesetzt.

## 5. Seiten und Texte

Jede Seite: Title, Description, genau eine H1, Section-Labels, am Ende CTA-Band „Euer Jahrgang ist dran?“ mit Button „Preis berechnen“.

Header: Logo · Für wen (Dropdown: Abi und Fachabi, Realschule und Hauptschule, Berufskolleg) · So läuft's · FAQ · Button „Preis berechnen“. Mobil: Burger-Menü, Button bleibt sichtbar.
Sticky-Leiste mobil unten auf allen Seiten außer dem Rechner: „Preis berechnen →“.
Footer: Logo, „Abschlusspullover für jeden Abschluss.“, Links zu allen Seiten, Instagram, TikTok, Mail, Impressum, Datenschutz, „Made in Düsseldorf.“

### / (Startseite)
Title: Abschlusspullover für jeden Abschluss | ABSOLVO
Description: Abschlusspullover für Abi, Realschule und Berufskolleg. Mit Motto und allen Namen drauf, fairer Preis, gedruckt in Deutschland. Jetzt Preis berechnen.

Hero (Rot):
Label: JAHRGANG 2027
H1: Abschlusspullover für jeden Abschluss. (Rotstift-Haken hinter „Abschluss.“ in Tinte)
Text: Abi, Realschule, Berufskolleg. Ihr bekommt euren Pulli mit Motto und allen Namen drauf, zu einem fairen Preis und mit einem Ansprechpartner, der sich auch wirklich meldet.
Button: Preis berechnen · Link: So läuft's
Hinweis: Mit dem Code INSTA50 spart ihr 50 € ab 40 Hoodies.

01 · FÜR WEN (Papier). H2: Für wen ist ABSOLVO?
Karte Abi und Fachabi: Abipullover mit Motto, Namensliste und allem, was zum Jahrgang gehört. → /abipullover/
Karte Realschule und Hauptschule: Die 10. Klasse ist auch ein Abschluss. Klassenpullover mit allen Namen drauf. → /abschlusspullover-realschule/
Karte Berufskolleg und Ausbildung: Wer zusammen durch die Prüfungen geht, darf das auch zeigen. → /abschlusspullover-berufskolleg/

02 · SO LÄUFT'S (Tinte). H2: So kommt ihr an euren Abschlusspullover
1 Preis berechnen. Menge, Farbe und Druck eingeben, Preis sofort sehen.
2 Design abstimmen. Ihr schickt Motto oder Idee, ich mache es druckfertig.
3 Namen und Größen sammeln. Über einen Link, jeder trägt sich selbst ein.
4 Druck und Lieferung. Gedruckt in Deutschland, geliefert zu euch.
Link: Mehr zum Ablauf

03 · BEISPIELE (Papier). H2: Abschlusspullover, die so aussehen wie ihr
Galerie mit 3 bis 6 Platzhaltern (Mockups), Alt-Text z. B. „Schwarzer Abschlusspullover mit Namensliste auf dem Rücken, Abi 2027“.

04 · WARUM ABSOLVO (Papier-2). H2: Warum ABSOLVO?
Ich mache seit 2019 Abschlusspullover für Klassen und Jahrgänge. Mit ABSOLVO bekommt das jetzt einen Namen. Ich halte die Abläufe schlank, lasse in Deutschland drucken und rede mit euch auf Augenhöhe. Ohne Doktorhut-Clipart.
Drei kurze Punkte als Karten: Fairer Preis · Ein Ansprechpartner · Jeder zahlt selbst [nur zeigen, wenn Sammellink mit Einzelzahlung umgesetzt ist]

05 · FAQ (Papier). H2: Häufige Fragen. Die ersten 4 aus faq.json, Link zur FAQ.

CTA-Band (Rot). H2: Euer Jahrgang ist dran? Text: Rechnet euren Preis in einer Minute aus und schickt die Anfrage direkt ab. Button.

### /preis-berechnen/
Title: Abschlusspullover Preis berechnen | ABSOLVO
Description: Was kostet euer Abschlusspullover? Menge, Farbe und Druck wählen, Preis pro Hoodie sofort sehen und Anfrage direkt abschicken.
H1: Was kostet euer Abschlusspullover?
Text: Gebt ein, was ihr euch vorstellt. Der Preis passt sich sofort an. Danach schickt ihr die Anfrage ab und ich melde mich bei euch.
Darunter der Konfigurator (Abschnitt 6). Unter dem Rechner H2: Was im Preis drin ist. Text: Design und Druckvorbereitung, Druck vorne und hinten, Namensliste, Versand innerhalb Deutschlands. Plus statische Preistabelle „ab X € pro Hoodie“ je Mengenstufe aus preise.json (für Google und ohne JS sichtbar).

### /abipullover/
Title: Abipullover 2027 mit Motto und Namen | ABSOLVO
Description: Abipullover für Gymnasium, Gesamtschule und Fachabi. Mit Motto, Namensliste und fairem Preis. Jetzt Preis für euren Jahrgang berechnen.
H1: Abipullover für euren Jahrgang.
Text: Ob Gymnasium, Gesamtschule oder Fachoberschule: Euer Abipullover bekommt euer Motto vorne und alle Namen hinten. Ihr stimmt das Design mit mir ab, jeder trägt sich selbst ein und am Ende kommt ein Karton zu euch an die Schule.
H2: Was auf euren Abipullover kann (Motto vorne, Namensliste hinten, Name auf dem Ärmel, eure Farbe)
H2: Noch kein Abi-Motto? Text: Schreibt mir eure Ideen, ich mache daraus ein Motiv. (später Link auf Ratgeber)
CTA-Band, Preisrechner mit ?schulform=abi vorausgefüllt.

### /abschlusspullover-realschule/
Title: Abschlusspullover Realschule und 10. Klasse | ABSOLVO
Description: Abschlusspullover für Realschule und Hauptschule. Klassenpullover mit allen Namen drauf, für die ganze Stufe oder nur eure Klasse.
H1: Abschlusspullover für die 10. Klasse.
Text: Die 10. Klasse ist auch ein Abschluss, und zwar ein ziemlich großer. Ihr bekommt einen Klassenpullover mit allen Namen drauf, für die ganze Stufe oder nur für eure Klasse.
H2: Ganze Stufe oder nur eure Klasse? Text: Beides geht. Kleinere Klassen ab [Mindestmenge] Stück, als Stufe wird es pro Pulli günstiger.
H2: Wer bestellt? Text: Meistens kümmern sich Klassensprecher oder Klassenleitung. Ihr habt bei mir einen festen Ansprechpartner, vom ersten Entwurf bis zur Lieferung.
CTA mit ?schulform=realschule.

### /abschlusspullover-berufskolleg/
Title: Abschlusspullover Berufskolleg und Ausbildung | ABSOLVO
Description: Abschlusspullover für Berufskolleg, Fachschule und Ausbildungsjahrgang. Mit Namen, Motto und fairem Preis.
H1: Abschlusspullover fürs Berufskolleg.
Text: Fachschule, Ausbildungsjahrgang oder Meisterklasse. Wer zusammen durch die Prüfungen geht, darf das auch zeigen.
H2: Auch für Ausbildungsbetriebe. Text: Ihr wollt eurem Azubi-Jahrgang zum Abschluss etwas mitgeben? Fragt einfach an.
CTA mit ?schulform=berufskolleg.

### /so-laeufts/
Title: Abschlusspullover bestellen: So läuft's | ABSOLVO
Description: In vier Schritten zum Abschlusspullover. Preis berechnen, Design abstimmen, Namen sammeln, Lieferung. Plant am besten [X] Wochen vor eurem Abschluss ein.
H1: So läuft's bei ABSOLVO.
Die 4 Schritte groß, je H2 mit 2 bis 3 Sätzen. Dann H2: Wann solltet ihr bestellen? Text: Plant ab Anfrage rund [X] Wochen ein. Wenn ihr den Pulli zur Mottowoche oder Zeugnisvergabe tragen wollt, fragt lieber früher an.

### /faq/ (aus faq.json, als details/summary, alle Antworten im HTML sichtbar für Google)
Title: Fragen zu Abschlusspullovern | ABSOLVO
H1: Häufige Fragen
Was kostet ein Abschlusspullover? Das hängt von Menge, Druck und Extras ab. Im Preisrechner seht ihr den Preis pro Hoodie sofort.
Gibt es eine Mindestmenge? Ja, ab [Mindestmenge] Stück. Je mehr ihr seid, desto günstiger wird jeder Pulli.
Kann jeder seine eigene Größe wählen? Ja. Jeder trägt Größe und Namen selbst über einen Link ein.
Muss einer für alle das Geld einsammeln? [Antwort je nach Zahlungslösung, bis dahin: Das klären wir bei der Anfrage, Ziel ist, dass jeder selbst zahlt.]
Wie lange dauert es bis zur Lieferung? Rechnet ab Freigabe mit [X] Wochen.
Können wir verschiedene Farben bestellen? [klären]
Wer macht das Design? Ihr schickt Motto, Logo oder Idee, ich mache daraus ein druckfertiges Motiv. Ihr gebt frei, bevor gedruckt wird.
Was ist, wenn ein Name falsch geschrieben ist? Ihr seht die komplette Namensliste vor dem Druck und gebt sie frei.
Gibt es Übergrößen? Ja, bis 5XL gegen Aufpreis.
Liefert ihr direkt an die Schule? Ja, oder an eine Person aus der Stufe.

### /ueber-absolvo/
Title: Über ABSOLVO | Abschlusspullover aus Düsseldorf
H1: Hi, ich bin Adrian.
Text: Seit 2019 kümmere ich mich immer wieder um die Abschlusspullover von Klassen und Jahrgängen. Dabei habe ich ziemlich viel gelernt, vor allem was gut läuft und was nicht. Mit ABSOLVO bekommt das Ganze jetzt einen festen Namen. ABSOLVO ist Latein und heißt so viel wie „ich schließe ab“. Ich sitze in Düsseldorf und lasse in Deutschland drucken.
Foto: rund, schwarzweiß, roter Kringel (Platzhalter bis Foto da ist).

### /danke/ (noindex)
H1: Abgehakt. Text: Eure Anfrage ist da. Ich melde mich bei euch, meistens innerhalb von [24 Stunden]. In der Zwischenzeit: Folgt uns auf Instagram.

### /404
H1: Die Seite hat leider nicht bestanden. Button: Zum Preisrechner.

### /impressum/, /datenschutz/
Platzhalter-Struktur anlegen, Inhalte liefert Adrian (Name, Anschrift, Kontakt, ggf. USt-ID). Datenschutz: Hosting GitHub, Formspree, selbst gehostete Schriften, keine Cookies in v1.

## 6. Konfigurator (Preisrechner)

Alle Zahlen in `src/data/preise.json`, nichts im Code hart verdrahten. Die Werte unten sind Platzhalter und werden von Adrian aus seiner Kalkulation ersetzt.

```json
{
  "mindestmenge": 20,
  "staffel_basis": [
    { "ab": 20, "preis": 39.90 },
    { "ab": 30, "preis": 36.90 },
    { "ab": 50, "preis": 34.90 },
    { "ab": 100, "preis": 32.90 }
  ],
  "basis_enthaelt": "Hoodie, Druck vorne 1-farbig, Rücken mit Namensliste 1-farbig, Design, Versand",
  "aufpreise_pro_stueck": {
    "druck_vorne_2_farben": 1.50,
    "druck_vorne_3_farben": 3.00,
    "ruecken_2_farben": 1.50,
    "aermelname": 5.00,
    "uebergroesse_3xl_bis_5xl": 6.00
  },
  "farben": ["Schwarz", "Navy", "Grau meliert", "Weiß", "Bordeaux", "Flaschengrün"],
  "codes": {
    "INSTA50": { "rabatt_eur": 50, "ab_menge": 40 },
    "FLYER50": { "rabatt_eur": 50, "ab_menge": 40 }
  },
  "hinweis": "Alle Preise inkl. MwSt. Verbindlicher Preis nach Prüfung der Anfrage."
}
```

Felder (in dieser Reihenfolge, als echtes `<form>` mit Labels):
1. Schulform: Abi/Fachabi · Realschule/Hauptschule · Berufskolleg/Ausbildung · Sonstiges (vorausgefüllt aus URL-Parameter `?schulform=`)
2. Anzahl Hoodies (Zahl, min. mindestmenge, Slider plus Eingabefeld)
3. Davon Übergrößen 3XL bis 5XL (Zahl, max. Anzahl Hoodies)
4. Hoodie-Farbe (Farbkacheln aus `farben`)
5. Druck vorne: 1 Farbe · 2 Farben · 3 Farben oder mehr
6. Rücken: Namensliste 1-farbig · Namensliste 2-farbig
7. Name auf dem Ärmel: ja/nein
8. Rabattcode (Textfeld, Groß/Kleinschreibung egal, Prüfung live: „Code passt, 50 € gespart“ oder „Gilt ab 40 Hoodies“)
9. Wunschtermin Lieferung (Datum, optional)
10. Kontakt: Name, Schule, Ort, E-Mail (Pflicht), Telefon (optional), Nachricht (optional), Checkbox Datenschutz (Pflicht)

Rechnung:
```
basis = Staffelpreis für die Menge (höchste Stufe mit ab <= menge)
stueck = basis + Aufpreise je nach Auswahl
gesamt = stueck * menge + uebergroessen_anzahl * aufpreis_uebergroesse - code_rabatt (falls gültig und menge >= ab_menge)
pro_hoodie_effektiv = gesamt / menge
```
Ausgabe (sticky auf Desktop rechts, mobil als Leiste unten): Preis pro Hoodie groß (z. B. „34,90 €“), Gesamtpreis, Ersparnis durch Code in Rot, Hinweistext. Live-Update bei jeder Änderung, deutsches Zahlenformat (Intl.NumberFormat 'de-DE', EUR). Unter der Mindestmenge: Hinweis „Ab 20 Hoodies geht's los. Kleinere Gruppe? Schreibt mir trotzdem.“ und Anfrage bleibt möglich.

Kleiner Anreiz unter dem Preis: „Bei [nächste Stufe] Hoodies zahlt ihr nur X € pro Stück.“

Absenden: alle Auswahlen plus berechneter Preis als Felder an Formspree (Betreff „Neue Anfrage: [Schule], [Menge] Stück“), Honeypot-Feld gegen Spam, danach /danke/. Fehlerfall: Hinweis plus Mail-Link.

Ohne JavaScript: Formular bleibt nutzbar, Preis wird dann nicht live berechnet, statische Preistabelle steht darüber.

## 7. Technisches SEO (Pflicht)

`<html lang="de">`, UTF-8, Viewport. Pro Seite eigener Title (max. 60 Zeichen) und Description (max. 155), Canonical auf sich selbst, Open Graph und Twitter Card (og:image 1200x630, für v1 ein generisches Bild: rote Fläche mit Logo und „Abschlusspullover für jeden Abschluss.“). Genau eine H1, logische H2/H3.

JSON-LD: Startseite Organization (name, url, logo, sameAs Instagram/TikTok) und WebSite. Preisrechner und Schulform-Seiten: Product „Abschlusspullover“ mit AggregateOffer (lowPrice = niedrigster Staffelpreis, priceCurrency EUR). FAQ-Seite: FAQPage. Unterseiten: BreadcrumbList.

sitemap.xml über @astrojs/sitemap (ohne /danke/), robots.txt mit Sitemap-Verweis. /danke/ mit `noindex`. Saubere 404.

Bilder über astro:assets (WebP/AVIF, width/height, loading lazy ab dem zweiten Bild, fetchpriority high für Hero). Schriften mit font-display swap, nur benötigte Schnitte, Preload für Inter Tight 800. Kein Layout-Shift. JavaScript nur auf /preis-berechnen/.

Barrierefreiheit: Kontraste nach WCAG AA, sichtbare Fokuszustände, Formular-Labels, Skip-Link, Alt-Texte, prefers-reduced-motion.

Interne Verlinkung: jede Seite verlinkt Preisrechner und mindestens eine Schulform-Seite. Ankertexte mit Keywords (z. B. „Abipullover“, nicht „hier“).

## 8. Abnahme v1

Alle Seiten aus Abschnitt 5 vorhanden und verlinkt. Preisrechner rechnet korrekt mit preise.json (Testfälle: 30 Stk Basis = 36,90 €/Stk; 60 Stk mit 2 Farben vorne und Ärmel = 41,40 €/Stk; 45 Stk mit INSTA50 zieht 50 € ab; 35 Stk mit INSTA50 zieht nichts ab). Lighthouse mobil ab 90 in allen vier Kategorien. Keine Konsolenfehler. Sieht auf 375 px Breite sauber aus. Build läuft in GitHub Actions durch, Seite unter www.absolvo.shop erreichbar.

## 9. Nicht machen

Keine Cookies, kein Tracking, kein Meta Pixel in v1. Keine Stockfotos mit Doktorhüten. Keine erfundenen Bewertungen, Kundenzahlen oder Lieferversprechen. Platzhalter in eckigen Klammern sichtbar lassen, nicht mit ausgedachten Werten füllen. Logo nicht als Text nachbauen.
