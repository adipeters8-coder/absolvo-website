// Preisrechner: Live-Preis, Rabattcode-Prüfung, Datei-Prüfung und Absenden an Forminit.
// Ohne JavaScript bleibt das Formular ein normales POST-Formular.
import preiseJson from '../data/preise.json';
import { berechne, formatEuro, istCodeAnfang, staffelStufe, type Auswahl, type Ergebnis, type Preise } from '../lib/preis';

const preise = preiseJson as Preise;

const euroKurz = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const formatEuroGanz = (betragCent: number) =>
  betragCent % 100 === 0 ? euroKurz.format(betragCent / 100) : formatEuro(betragCent);

// Grenzen von Forminit: 25 MB Dateien pro Anfrage, die Setup-Anleitung empfiehlt mit Puffer bei 24 MB zu stoppen
const MAX_DATEIEN = 10;
const MAX_BYTES = 24 * 1000 * 1000;

// Fehlercodes von Forminit, die wir verständlich erklären können
const FEHLERTEXTE: Record<string, string> = {
  FI_SCHEMA_FORMAT_EMAIL: 'Die E-Mail-Adresse sieht nicht ganz richtig aus. Schaut sie euch bitte noch mal an.',
  TOO_MANY_REQUESTS: 'Das ging gerade etwas schnell hintereinander. Wartet ein paar Sekunden und schickt die Anfrage dann noch mal ab.',
};
// Anreiz erst kurz vor der nächsten Stufe zeigen. Maßstab ist der Abstand zwischen den Stufen:
// bei 5er-Abständen ab 3 Hoodies vorher, bei 10er-Abständen ab 5. Bei engen Stufen (2er) reicht der
// kleine Hinweis in der Preis-Karte. Unter der Mindestmenge ab 5 Hoodies vorher.
const anreizSchwelle = (abstand: number | null) => (abstand === null ? 5 : abstand >= 5 ? Math.ceil(abstand / 2) : 0);
const prozent = new Intl.NumberFormat('de-DE', { style: 'percent', maximumFractionDigits: 1 });
const hoodies = (n: number) => `${n} ${n === 1 ? 'Hoodie' : 'Hoodies'}`;

const megabyte = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 });
const alsMB = (bytes: number) => `${megabyte.format(bytes / 1000 / 1000)} MB`;

function start() {
  const form = document.querySelector<HTMLFormElement>('#rechner');
  if (!form) return;

  const $ = <T extends Element>(selektor: string) => form.querySelector<T>(selektor)!;
  const $$ = <T extends Element>(selektor: string) => [...form.querySelectorAll<T>(selektor)];

  const anzahl = $<HTMLInputElement>('#anzahl');
  const regler = $<HTMLInputElement>('[data-regler]');
  const uebergroessen = $<HTMLInputElement>('#uebergroessen');
  const code = $<HTMLInputElement>('#rabattcode');
  const codeStatus = $<HTMLElement>('[data-code-status]');
  const live = $<HTMLElement>('[data-live]');
  const statisch = $<HTMLElement>('[data-statisch]');
  const preisblock = $<HTMLElement>('[data-preisblock]');
  const mindest = $<HTMLElement>('[data-mindest]');
  const anreiz = $<HTMLElement>('[data-anreiz]');
  const zeileErsparnis = $<HTMLElement>('[data-zeile-ersparnis]');
  const ansage = $<HTMLElement>('[data-ansage]');
  const leiste = $<HTMLElement>('[data-preisleiste]');
  const leistePreis = $<HTMLElement>('[data-leiste-preis]');
  const leisteGesamt = $<HTMLElement>('[data-leiste-gesamt]');
  const leisteMindest = $<HTMLElement>('[data-leiste-mindest]');
  const betreff = $<HTMLInputElement>('[data-betreff]');
  const absenden = $<HTMLButtonElement>('[data-absenden]');
  const fehlerText = $<HTMLElement>('[data-fehler-text]');
  const fehler = $<HTMLElement>('[data-fehler]');
  const anstupser = $<HTMLElement>('[data-anstupser]');
  const anstupserText = $<HTMLElement>('[data-anstupser-text]');
  const anstupserBtn = $<HTMLButtonElement>('[data-anstupser-btn]');
  const dateien = $<HTMLInputElement>('[data-dateien]');
  const dateienStatus = $<HTMLElement>('[data-dateien-status]');

  const gewaehlt = (name: string) => $<HTMLInputElement>(`input[name="${name}"]:checked`);

  const ausgeben = (schluessel: string, text: string) => {
    for (const el of $$<HTMLElement>(`[data-ausgabe="${schluessel}"]`)) el.textContent = text;
  };
  const feld = (schluessel: string, wert: string) => {
    $<HTMLInputElement>(`[data-feld="${schluessel}"]`).value = wert;
  };

  // Preise zählen kurz hoch oder runter statt zu springen (ohne Animation bei „weniger Bewegung“)
  const bewegungErlaubt = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const zaehlen = (schluessel: string, zielCent: number | null) => {
    for (const el of $$<HTMLElement>(`[data-ausgabe="${schluessel}"]`)) {
      const vorher = el.dataset.cent;
      const startCent = Number(vorher);
      el.dataset.cent = zielCent === null ? '' : String(zielCent);
      if (zielCent === null) {
        el.textContent = '–';
        continue;
      }
      // Ohne vorherigen Preis (Start oder unter Mindestmenge) direkt anzeigen
      if (!bewegungErlaubt || !vorher || !Number.isFinite(startCent) || startCent === zielCent) {
        el.textContent = formatEuro(zielCent);
        continue;
      }
      const t0 = performance.now();
      const schritt = (jetzt: number) => {
        if (el.dataset.cent !== String(zielCent)) return; // neues Ziel, diese Animation endet
        const p = Math.min(1, (jetzt - t0) / 320);
        const weich = 1 - (1 - p) ** 3;
        el.textContent = formatEuro(Math.round(startCent + (zielCent - startCent) * weich));
        if (p < 1) requestAnimationFrame(schritt);
      };
      requestAnimationFrame(schritt);
      // Absicherung, falls requestAnimationFrame pausiert (z. B. Tab im Hintergrund)
      window.setTimeout(() => {
        if (el.dataset.cent === String(zielCent)) el.textContent = formatEuro(zielCent);
      }, 400);
    }
  };

  const hupfen = () => {
    if (!bewegungErlaubt) return;
    for (const el of $$<HTMLElement>('[data-ausgabe="pro-hoodie"]')) {
      el.classList.remove('ist-guenstiger');
      void el.offsetWidth; // Animation neu starten
      el.classList.add('ist-guenstiger');
    }
  };

  // Anreiz unter der Menge: nur kurz vor der nächsten Stufe
  const zeigeAnstupser = (e: Ergebnis) => {
    const stufe = e.naechsteStufe;
    const fehlen = stufe ? stufe.ab - e.menge : 0;
    const aktuelle = staffelStufe(preise, e.menge);
    const abstand = stufe && aktuelle ? stufe.ab - aktuelle.ab : null;
    if (!stufe || e.menge < 1 || fehlen < 1 || fehlen > anreizSchwelle(abstand)) {
      anstupser.hidden = true;
      anstupser.classList.remove('ist-neu');
      return false;
    }
    if (e.unterMindestmenge || e.stueckCent === null) {
      anstupserText.innerHTML = `Fast geschafft. Noch <strong>${hoodies(fehlen)}</strong>, dann seid ihr bei ${stufe.ab} Stück und es geht los.`;
    } else {
      const sparCent = e.stueckCent - stufe.stueckCent;
      anstupserText.innerHTML =
        `Fast geschafft. Mit <strong>${hoodies(fehlen)} mehr</strong> zahlt ihr nur ${formatEuro(stufe.stueckCent)} pro Stück. ` +
        `Das sind <strong>${formatEuro(sparCent)} (${prozent.format(sparCent / e.stueckCent)}) weniger</strong> pro Hoodie.`;
    }
    anstupserBtn.textContent = `+${hoodies(fehlen)}`;
    anstupserBtn.dataset.ziel = String(stufe.ab);
    if (anstupser.hidden) {
      anstupser.hidden = false;
      anstupser.classList.remove('ist-neu');
      void anstupser.offsetWidth;
      anstupser.classList.add('ist-neu');
    }
    return true;
  };

  anstupserBtn.addEventListener('click', () => {
    const ziel = Number(anstupserBtn.dataset.ziel);
    if (!ziel) return;
    anzahl.value = String(ziel);
    aktualisieren();
    anzahl.focus();
  });

  let letzteBasis: number | null = null;

  regler.hidden = false;
  live.hidden = false;
  statisch.hidden = true;
  leiste.hidden = false;
  document.body.classList.add('hat-preisleiste');

  const lesen = (): Auswahl => ({
    menge: Number.parseInt(anzahl.value, 10) || 0,
    uebergroessen: Number.parseInt(uebergroessen.value, 10) || 0,
    druckVorne: Number(gewaehlt('fi-text-druck_vorne').dataset.farben),
    ruecken: Number(gewaehlt('fi-text-ruecken').dataset.farben),
    aermelname: gewaehlt('fi-text-aermelname').value === 'Ja',
    code: code.value,
  });

  let ansageTimer: number | undefined;
  const ansagen = (text: string) => {
    window.clearTimeout(ansageTimer);
    ansageTimer = window.setTimeout(() => (ansage.textContent = text), 700);
  };

  const zeigeCodeStatus = (e: Ergebnis) => {
    const c = e.code;
    let text = '';
    if (c.status === 'gueltig') text = `Code passt, ${formatEuroGanz(c.rabattCent)} gespart`;
    if (c.status === 'zu_wenig') text = `Gilt ab ${c.abMenge} Hoodies`;
    if (c.status === 'unbekannt' && !istCodeAnfang(preise, code.value)) text = 'Diesen Code kenne ich nicht.';
    codeStatus.textContent = text;
    codeStatus.dataset.zustand = text ? c.status : '';
  };

  const aktualisieren = () => {
    const e = berechne(preise, lesen());

    // Regler und Übergrößen an die Menge anpassen
    const reglerMin = Number(regler.min);
    const reglerMax = Number(regler.max);
    const reglerWert = Math.min(Math.max(e.menge, reglerMin), reglerMax);
    if (document.activeElement !== regler) regler.value = String(reglerWert);
    regler.style.setProperty('--fuellung', `${((reglerWert - reglerMin) / (reglerMax - reglerMin)) * 100}%`);
    uebergroessen.max = String(Math.max(e.menge, 0));

    zeigeCodeStatus(e);

    preisblock.hidden = e.unterMindestmenge;
    mindest.hidden = !e.unterMindestmenge;
    leistePreis.hidden = e.unterMindestmenge;
    leisteGesamt.hidden = e.unterMindestmenge;
    leisteMindest.hidden = !e.unterMindestmenge;

    // Kurz vor der nächsten Stufe übernimmt der animierte Anreiz, sonst der kleine Hinweis in der Ergebnis-Karte
    const nah = zeigeAnstupser(e);
    if (e.naechsteStufe && !nah) {
      anreiz.textContent = `Bei ${e.naechsteStufe.ab} Hoodies zahlt ihr nur ${formatEuro(e.naechsteStufe.stueckCent)} pro Stück.`;
      anreiz.hidden = false;
    } else {
      anreiz.hidden = true;
    }

    // Neue, günstigere Preisstufe erreicht: Preis kurz hüpfen lassen
    if (letzteBasis !== null && e.basisCent !== null && e.basisCent < letzteBasis) hupfen();
    letzteBasis = e.basisCent;

    if (e.proHoodieCent === null || e.gesamtCent === null || e.basisCent === null) {
      zaehlen('pro-hoodie', null);
      zaehlen('gesamt', null);
      zeileErsparnis.hidden = true;
      feld('pro-hoodie', `unter Mindestmenge (${preise.mindestmenge})`);
      feld('gesamt', `unter Mindestmenge (${preise.mindestmenge})`);
      feld('staffel', '–');
      feld('ersparnis', '0');
      ansagen(mindest.textContent?.trim() ?? '');
      return;
    }

    const proHoodie = formatEuro(e.proHoodieCent);
    const gesamt = formatEuro(e.gesamtCent);
    zaehlen('pro-hoodie', e.proHoodieCent);
    zaehlen('gesamt', e.gesamtCent);
    zeileErsparnis.hidden = e.rabattCent === 0;
    ausgeben('ersparnis', `−${formatEuro(e.rabattCent)}`);

    feld('pro-hoodie', proHoodie);
    feld('gesamt', gesamt);
    feld('staffel', formatEuro(e.basisCent));
    feld('ersparnis', formatEuro(e.rabattCent));
    ansagen(`${proHoodie} pro Hoodie, ${gesamt} gesamt`);
  };

  regler.addEventListener('input', () => {
    anzahl.value = regler.value;
    aktualisieren();
  });

  form.addEventListener('input', (ev) => {
    if (ev.target !== regler) aktualisieren();
  });

  form.addEventListener('change', (ev) => {
    // Übergrößen nie mehr als Hoodies insgesamt
    if (ev.target === anzahl || ev.target === uebergroessen) {
      const menge = Number.parseInt(anzahl.value, 10) || 0;
      if ((Number.parseInt(uebergroessen.value, 10) || 0) > menge) uebergroessen.value = String(menge);
      aktualisieren();
    }
  });

  // Design-Dateien: Anzahl und Gesamtgröße prüfen, bevor etwas hochgeladen wird
  dateien.addEventListener('change', () => {
    const liste = [...(dateien.files ?? [])];
    const summe = liste.reduce((gesamt, datei) => gesamt + datei.size, 0);
    let problem = '';
    if (liste.length > MAX_DATEIEN) problem = `Bitte höchstens ${MAX_DATEIEN} Dateien auswählen.`;
    else if (summe > MAX_BYTES) problem = `Zusammen ${alsMB(summe)}. Mehr als 24 MB gehen nicht, schickt große Dateien lieber per Mail.`;
    dateien.setCustomValidity(problem);
    dateienStatus.dataset.zustand = problem ? 'fehler' : '';
    dateienStatus.textContent =
      problem || (liste.length ? `${liste.length} ${liste.length === 1 ? 'Datei' : 'Dateien'} ausgewählt, ${alsMB(summe)}` : '');
  });

  // Preisleiste nur zeigen, solange der Rechner im Bild ist, aber Ergebnis-Karte und Kontaktbereich nicht
  const sichtbar = new Set<Element>();
  const ergebnisKarte = $('.ergebnis');
  const kontakt = $('#kontakt');
  const beobachter = new IntersectionObserver((eintraege) => {
    for (const e of eintraege) {
      if (e.isIntersecting) sichtbar.add(e.target);
      else sichtbar.delete(e.target);
    }
    const imRechner = sichtbar.has(form);
    const verdeckt = sichtbar.has(ergebnisKarte) || sichtbar.has(kontakt);
    leiste.classList.toggle('ist-weg', !imRechner || verdeckt);
  });
  beobachter.observe(form);
  beobachter.observe(ergebnisKarte);
  beobachter.observe(kontakt);

  const zeigeFehler = (code?: string) => {
    fehlerText.textContent = (code && FEHLERTEXTE[code]) || 'Das hat leider nicht geklappt.';
    fehler.hidden = false;
    if (code === 'FI_SCHEMA_FORMAT_EMAIL') $<HTMLInputElement>('#k-email').focus();
  };

  // Absenden per fetch an Forminit, danach /danke/
  let wirdGesendet = false;
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    if (wirdGesendet) return;
    aktualisieren();
    fehler.hidden = true;

    const schule = ($<HTMLInputElement>('#k-schule').value || '').trim();
    betreff.value = `Neue Anfrage: ${schule}, ${anzahl.value} Stück`;

    if (form.dataset.formular !== 'ja') {
      zeigeFehler();
      return;
    }

    // FormData zuerst bauen, dann den Knopf sperren
    const daten = new FormData(form);
    // Ohne Auswahl schickt der Browser ein leeres Datei-Feld mit, das braucht Forminit nicht
    if (!dateien.files?.length) daten.delete(dateien.name);

    wirdGesendet = true;
    const knopfText = absenden.textContent;
    absenden.disabled = true;
    absenden.textContent = 'Wird gesendet …';
    try {
      const antwort = await fetch(form.action, {
        method: 'POST',
        body: daten,
        headers: { Accept: 'application/json' },
      });
      type Antwort = { success?: boolean; error?: string; hashId?: string; submission?: { hashId?: string } };
      const ergebnis = (await antwort.json().catch(() => null)) as Antwort | null;
      // Erfolg nur, wenn Forminit eine Einsendung mit hashId bestätigt
      const hashId = ergebnis?.submission?.hashId ?? ergebnis?.hashId;
      if (!antwort.ok || ergebnis?.success === false || typeof hashId !== 'string') {
        console.error('Forminit-Fehler', antwort.status, ergebnis?.error);
        zeigeFehler(ergebnis?.error);
      } else {
        window.location.assign('/danke/');
        return;
      }
    } catch (fehlerObjekt) {
      console.error('Forminit nicht erreichbar', fehlerObjekt);
      zeigeFehler();
    }
    wirdGesendet = false;
    absenden.disabled = false;
    absenden.textContent = knopfText;
  });

  aktualisieren();
}

start();
