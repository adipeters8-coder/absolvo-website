// Testfälle aus CLAUDE.md, Abschnitt 8 (Abnahme v1).
// Die Rechenlogik wird gegen die festen Briefing-Preise geprüft (tests/fixtures/preise-briefing.json),
// damit neue Preise in src/data/preise.json die Tests nicht brechen. Die echten Preise prüft preise-daten.test.ts.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { berechne, formatEuro, type Auswahl, type Preise } from '../src/lib/preis.ts';

const preise: Preise = JSON.parse(readFileSync(new URL('./fixtures/preise-briefing.json', import.meta.url), 'utf8'));

const basis: Auswahl = { menge: 30, uebergroessen: 0, druckVorne: 1, ruecken: 1, aermelname: false, code: '' };
const rechne = (aenderung: Partial<Auswahl>) => berechne(preise, { ...basis, ...aenderung });

test('30 Stück Basis = 36,90 € pro Stück', () => {
  const e = rechne({ menge: 30 });
  assert.equal(e.stueckCent, 3690);
  assert.equal(e.proHoodieCent, 3690);
  assert.equal(formatEuro(e.proHoodieCent!), '36,90 €');
});

test('60 Stück mit 2 Farben vorne und Ärmel = 41,40 € pro Stück', () => {
  const e = rechne({ menge: 60, druckVorne: 2, aermelname: true });
  assert.equal(e.stueckCent, 4140);
  assert.equal(e.gesamtCent, 60 * 4140);
  assert.equal(formatEuro(e.stueckCent!), '41,40 €');
});

test('45 Stück mit INSTA50 zieht 50 € ab', () => {
  const e = rechne({ menge: 45, code: 'INSTA50' });
  assert.equal(e.code.status, 'gueltig');
  assert.equal(e.rabattCent, 5000);
  assert.equal(e.gesamtCent, 45 * 3690 - 5000);
});

test('35 Stück mit INSTA50 zieht nichts ab', () => {
  const e = rechne({ menge: 35, code: 'INSTA50' });
  assert.equal(e.code.status, 'zu_wenig');
  assert.equal(e.rabattCent, 0);
  assert.equal(e.gesamtCent, 35 * 3690);
});

test('Code ist unabhängig von Groß-/Kleinschreibung', () => {
  assert.equal(rechne({ menge: 45, code: ' insta50 ' }).code.status, 'gueltig');
  assert.equal(rechne({ menge: 45, code: 'Flyer50' }).rabattCent, 5000);
  assert.equal(rechne({ menge: 45, code: 'GIBTSNICHT' }).code.status, 'unbekannt');
});

test('Staffelgrenzen: höchste Stufe mit ab <= Menge', () => {
  assert.equal(rechne({ menge: 20 }).basisCent, 3990);
  assert.equal(rechne({ menge: 29 }).basisCent, 3990);
  assert.equal(rechne({ menge: 49 }).basisCent, 3690);
  assert.equal(rechne({ menge: 50 }).basisCent, 3490);
  assert.equal(rechne({ menge: 100 }).basisCent, 3290);
  assert.equal(rechne({ menge: 400 }).basisCent, 3290);
});

test('Übergrößen kosten pro Stück extra und gehen in den Schnitt ein', () => {
  const e = rechne({ menge: 30, uebergroessen: 3 });
  assert.equal(e.gesamtCent, 30 * 3690 + 3 * 600);
  assert.equal(e.proHoodieCent, Math.round((30 * 3690 + 3 * 600) / 30));
  assert.equal(rechne({ menge: 30, uebergroessen: 99 }).uebergroessen, 30);
});

test('3 Farben vorne und Rücken 2-farbig', () => {
  assert.equal(rechne({ menge: 30, druckVorne: 3, ruecken: 2 }).stueckCent, 3690 + 300 + 150);
});

test('Unter der Mindestmenge kein Preis, aber Hinweis auf erste Stufe', () => {
  const e = rechne({ menge: 12 });
  assert.equal(e.unterMindestmenge, true);
  assert.equal(e.gesamtCent, null);
  assert.deepEqual(e.naechsteStufe, { ab: 20, stueckCent: 3990 });
});

test('Anreiz zeigt die nächste Stufe inklusive Aufpreise', () => {
  assert.deepEqual(rechne({ menge: 30, aermelname: true }).naechsteStufe, { ab: 50, stueckCent: 3490 + 500 });
  assert.equal(rechne({ menge: 120 }).naechsteStufe, null);
});
