// Preislogik des Konfigurators (Briefing Abschnitt 6).
// Alle Zahlen kommen aus src/data/preise.json, gerechnet wird in Cent.

export interface Preise {
  mindestmenge: number;
  staffel_basis: { ab: number; preis: number }[];
  basis_enthaelt: string;
  aufpreise_pro_stueck: {
    druck_vorne_2_farben: number;
    druck_vorne_3_farben: number;
    ruecken_2_farben: number;
    aermelname: number;
    uebergroesse_3xl_bis_5xl: number;
  };
  farben: string[];
  /** Farben, die im Rechner sichtbar oben stehen; der Rest klappt auf */
  farben_beliebt?: string[];
  codes: Record<string, { rabatt_eur: number; ab_menge: number }>;
  hinweis: string;
}

export interface Auswahl {
  menge: number;
  uebergroessen: number;
  /** 1, 2 oder 3 (= 3 Farben oder mehr) */
  druckVorne: number;
  /** 1 oder 2 */
  ruecken: number;
  aermelname: boolean;
  code: string;
}

export type CodeStatus =
  | { status: 'leer' }
  | { status: 'unbekannt' }
  | { status: 'zu_wenig'; code: string; abMenge: number; rabattCent: number }
  | { status: 'gueltig'; code: string; abMenge: number; rabattCent: number };

export interface Ergebnis {
  menge: number;
  uebergroessen: number;
  unterMindestmenge: boolean;
  /** Staffelpreis pro Stück, null unter der Mindestmenge */
  basisCent: number | null;
  aufpreisCent: number;
  /** basis + Aufpreise pro Stück */
  stueckCent: number | null;
  gesamtCent: number | null;
  proHoodieCent: number | null;
  rabattCent: number;
  code: CodeStatus;
  naechsteStufe: { ab: number; stueckCent: number } | null;
}

export const cent = (eur: number): number => Math.round(eur * 100);

const euroFormat = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });

export function formatEuro(betragCent: number): string {
  return euroFormat.format(betragCent / 100);
}

/** Höchste Stufe mit ab <= menge, sonst null */
export function staffelStufe(preise: Preise, menge: number) {
  let treffer: Preise['staffel_basis'][number] | null = null;
  for (const stufe of preise.staffel_basis) {
    if (stufe.ab <= menge && (!treffer || stufe.ab > treffer.ab)) treffer = stufe;
  }
  return treffer;
}

/** Kleinste Stufe mit ab > menge, sonst null */
export function naechsteStaffelStufe(preise: Preise, menge: number) {
  let treffer: Preise['staffel_basis'][number] | null = null;
  for (const stufe of preise.staffel_basis) {
    if (stufe.ab > menge && (!treffer || stufe.ab < treffer.ab)) treffer = stufe;
  }
  return treffer;
}

/** Aufpreise pro Stück je nach Auswahl (ohne Übergrößen, die gelten nur für einzelne Stücke) */
export function aufpreisProStueckCent(preise: Preise, auswahl: Pick<Auswahl, 'druckVorne' | 'ruecken' | 'aermelname'>): number {
  const a = preise.aufpreise_pro_stueck;
  let summe = 0;
  if (auswahl.druckVorne === 2) summe += cent(a.druck_vorne_2_farben);
  if (auswahl.druckVorne >= 3) summe += cent(a.druck_vorne_3_farben);
  if (auswahl.ruecken >= 2) summe += cent(a.ruecken_2_farben);
  if (auswahl.aermelname) summe += cent(a.aermelname);
  return summe;
}

/** Rabattcode prüfen, Groß-/Kleinschreibung egal */
export function pruefeCode(preise: Preise, eingabe: string, menge: number): CodeStatus {
  const gesucht = eingabe.trim().toUpperCase();
  if (!gesucht) return { status: 'leer' };
  const treffer = Object.entries(preise.codes).find(([code]) => code.toUpperCase() === gesucht);
  if (!treffer) return { status: 'unbekannt' };
  const [code, regel] = treffer;
  const info = { code, abMenge: regel.ab_menge, rabattCent: cent(regel.rabatt_eur) };
  return menge >= regel.ab_menge ? { status: 'gueltig', ...info } : { status: 'zu_wenig', ...info };
}

/** Ist die Eingabe der Anfang eines gültigen Codes? (dann noch keine Fehlermeldung zeigen) */
export function istCodeAnfang(preise: Preise, eingabe: string): boolean {
  const gesucht = eingabe.trim().toUpperCase();
  return gesucht.length > 0 && Object.keys(preise.codes).some((code) => code.toUpperCase().startsWith(gesucht));
}

const ganzzahl = (wert: number, min: number): number => (Number.isFinite(wert) ? Math.max(min, Math.floor(wert)) : min);

/**
 * basis  = Staffelpreis für die Menge
 * stueck = basis + Aufpreise
 * gesamt = stueck * menge + uebergroessen * aufpreis_uebergroesse - code_rabatt (falls gültig)
 * pro_hoodie_effektiv = gesamt / menge
 */
export function berechne(preise: Preise, eingabe: Auswahl): Ergebnis {
  const menge = ganzzahl(eingabe.menge, 0);
  const uebergroessen = Math.min(ganzzahl(eingabe.uebergroessen, 0), menge);
  const aufpreisCent = aufpreisProStueckCent(preise, eingabe);
  const code = pruefeCode(preise, eingabe.code, menge);
  const stufe = staffelStufe(preise, menge);
  const unterMindestmenge = menge < preise.mindestmenge || !stufe;

  const naechste = naechsteStaffelStufe(preise, menge);
  const naechsteStufe = naechste ? { ab: naechste.ab, stueckCent: cent(naechste.preis) + aufpreisCent } : null;

  if (unterMindestmenge || !stufe) {
    return {
      menge,
      uebergroessen,
      unterMindestmenge: true,
      basisCent: null,
      aufpreisCent,
      stueckCent: null,
      gesamtCent: null,
      proHoodieCent: null,
      rabattCent: 0,
      code,
      naechsteStufe,
    };
  }

  const basisCent = cent(stufe.preis);
  const stueckCent = basisCent + aufpreisCent;
  const rabattCent = code.status === 'gueltig' ? code.rabattCent : 0;
  const gesamtCent = Math.max(
    0,
    stueckCent * menge + uebergroessen * cent(preise.aufpreise_pro_stueck.uebergroesse_3xl_bis_5xl) - rabattCent,
  );

  return {
    menge,
    uebergroessen,
    unterMindestmenge: false,
    basisCent,
    aufpreisCent,
    stueckCent,
    gesamtCent,
    proHoodieCent: Math.round(gesamtCent / menge),
    rabattCent,
    code,
    naechsteStufe,
  };
}
