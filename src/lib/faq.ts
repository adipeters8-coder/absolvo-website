// FAQ mit Antwort-Varianten: Sobald die Einzelzahlung umgesetzt ist (site.json), gilt die neue Antwort.
import faq from '../data/faq.json';
import site from '../data/site.json';

interface Eintrag {
  frage: string;
  antwort: string;
  antwort_einzelzahlung?: string;
}

export const fragen = (faq as Eintrag[]).map((f) => ({
  frage: f.frage,
  antwort: site.einzelzahlung_umgesetzt && f.antwort_einzelzahlung ? f.antwort_einzelzahlung : f.antwort,
}));
