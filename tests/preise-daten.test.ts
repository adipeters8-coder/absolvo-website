// Plausibilitätsprüfung der echten Preise in src/data/preise.json
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { berechne, cent, type Preise } from '../src/lib/preis.ts';

const preise: Preise = JSON.parse(readFileSync(new URL('../src/data/preise.json', import.meta.url), 'utf8'));
const farbwerte: Record<string, string> = JSON.parse(
  readFileSync(new URL('../src/data/farbwerte.json', import.meta.url), 'utf8'),
);
const stufen = preise.staffel_basis;

test('erste Stufe beginnt bei der Mindestmenge', () => {
  assert.equal(stufen[0].ab, preise.mindestmenge);
});

test('Stufen sind aufsteigend und jede ist günstiger als die davor', () => {
  for (let i = 1; i < stufen.length; i++) {
    assert.ok(stufen[i].ab > stufen[i - 1].ab, `Stufe ${stufen[i].ab} steht nach ${stufen[i - 1].ab}`);
    assert.ok(cent(stufen[i].preis) < cent(stufen[i - 1].preis), `ab ${stufen[i].ab} ist nicht günstiger`);
  }
});

test('jede Stufe rechnet ihren eigenen Preis', () => {
  for (const stufe of stufen) {
    const e = berechne(preise, { menge: stufe.ab, uebergroessen: 0, druckVorne: 1, ruecken: 1, aermelname: false, code: '' });
    assert.equal(e.basisCent, cent(stufe.preis));
  }
});

test('Rabattcodes sind positiv und gelten ab Mindestmenge oder später', () => {
  for (const [code, regel] of Object.entries(preise.codes)) {
    assert.ok(regel.rabatt_eur > 0, code);
    assert.ok(regel.ab_menge >= preise.mindestmenge, code);
  }
});

test('jede Farbe hat einen Farbwert, beliebte Farben gibt es wirklich', () => {
  assert.equal(new Set(preise.farben).size, preise.farben.length, 'doppelte Farbe');
  for (const farbe of preise.farben) assert.match(farbwerte[farbe] ?? '', /^#[0-9A-F]{6}$/i, `kein Farbwert für ${farbe}`);
  for (const farbe of preise.farben_beliebt ?? []) assert.ok(preise.farben.includes(farbe), `${farbe} fehlt in farben`);
});
