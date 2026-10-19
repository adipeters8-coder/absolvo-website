// Preisrechner: Live-Preis, Rabattcode-Prüfung und Absenden an Formspree.
// Ohne JavaScript bleibt das Formular ein normales POST-Formular.
import preiseJson from '../data/preise.json';
import { berechne, formatEuro, istCodeAnfang, type Auswahl, type Ergebnis, type Preise } from '../lib/preis';

const preise = preiseJson as Preise;

const euroKurz = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const formatEuroGanz = (betragCent: number) =>
  betragCent % 100 === 0 ? euroKurz.format(betragCent / 100) : formatEuro(betragCent);

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
  const wunschtermin = $<HTMLInputElement>('#wunschtermin');
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
  const fehler = $<HTMLElement>('[data-fehler]');

  const gewaehlt = (name: string) => $<HTMLInputElement>(`input[name="${name}"]:checked`);

  const ausgeben = (schluessel: string, text: string) => {
    for (const el of $$<HTMLElement>(`[data-ausgabe="${schluessel}"]`)) el.textContent = text;
  };
  const feld = (schluessel: string, wert: string) => {
    $<HTMLInputElement>(`[data-feld="${schluessel}"]`).value = wert;
  };

  // Wunschtermin nicht in der Vergangenheit
  const heute = new Date();
  wunschtermin.min = new Date(heute.getTime() - heute.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

  regler.hidden = false;
  live.hidden = false;
  statisch.hidden = true;
  leiste.hidden = false;
  document.body.classList.add('hat-preisleiste');

  const lesen = (): Auswahl => ({
    menge: Number.parseInt(anzahl.value, 10) || 0,
    uebergroessen: Number.parseInt(uebergroessen.value, 10) || 0,
    druckVorne: Number(gewaehlt('druck_vorne').dataset.farben),
    ruecken: Number(gewaehlt('ruecken').dataset.farben),
    aermelname: gewaehlt('aermelname').value === 'Ja',
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

    if (e.naechsteStufe) {
      anreiz.textContent = `Bei ${e.naechsteStufe.ab} Hoodies zahlt ihr nur ${formatEuro(e.naechsteStufe.stueckCent)} pro Stück.`;
      anreiz.hidden = false;
    } else {
      anreiz.hidden = true;
    }

    if (e.proHoodieCent === null || e.gesamtCent === null || e.basisCent === null) {
      ausgeben('pro-hoodie', '–');
      ausgeben('gesamt', '–');
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
    ausgeben('pro-hoodie', proHoodie);
    ausgeben('gesamt', gesamt);
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

  // Preisleiste ausblenden, solange Ergebnis-Karte oder Kontaktbereich zu sehen sind
  const sichtbar = new Set<Element>();
  const beobachter = new IntersectionObserver((eintraege) => {
    for (const e of eintraege) {
      if (e.isIntersecting) sichtbar.add(e.target);
      else sichtbar.delete(e.target);
    }
    leiste.classList.toggle('ist-weg', sichtbar.size > 0);
  });
  beobachter.observe($('.ergebnis'));
  beobachter.observe($('#kontakt'));

  // Absenden per fetch, danach /danke/
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    aktualisieren();
    fehler.hidden = true;

    const schule = ($<HTMLInputElement>('#k-schule').value || '').trim();
    betreff.value = `Neue Anfrage: ${schule}, ${anzahl.value} Stück`;

    if (form.dataset.formspree !== 'ja') {
      fehler.hidden = false;
      return;
    }

    const knopfText = absenden.textContent;
    absenden.disabled = true;
    absenden.textContent = 'Wird gesendet …';
    try {
      const antwort = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      });
      if (!antwort.ok) throw new Error(`Formspree ${antwort.status}`);
      window.location.assign('/danke/');
    } catch {
      fehler.hidden = false;
      absenden.disabled = false;
      absenden.textContent = knopfText;
    }
  });

  aktualisieren();
}

start();
