// Weiche Trennstellen für lange Komposita in großen Headlines (mobil 48 px).
// Ändert den Text nicht, sagt dem Browser nur, wo er notfalls trennen darf.
const TRENNSTELLEN: [string, string][] = [
  ['Abschlusspullovern', 'Abschluss­pullovern'],
  ['Abschlusspullover', 'Abschluss­pullover'],
  ['Klassenpullover', 'Klassen­pullover'],
  ['Abipullover', 'Abi­pullover'],
  ['Ausbildungsbetriebe', 'Ausbildungs­betriebe'],
  ['Ausbildungsjahrgang', 'Ausbildungs­jahrgang'],
  ['Berufskolleg', 'Berufs­kolleg'],
  ['Datenschutzerklärung', 'Datenschutz­erklärung'],
];

export function shy(text: string): string {
  return TRENNSTELLEN.reduce((t, [wort, getrennt]) => t.replaceAll(wort, getrennt), text);
}
