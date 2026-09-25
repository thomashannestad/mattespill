'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const G = require('./game.js');
const foals = G.ITEMS.filter(item => item.slot === 'foal');

test('føll kjøpes én gang, byttes gratis og lagres med resten av fremgangen', () => {
  const state = G.fresh(); state.balance = 1000; state.earned = 1200;
  G.buyOrEquip(state, 'bell');
  const initial = state.balance;
  for (const foal of foals) {
    const before = state.balance;
    assert.equal(G.buyOrEquip(state, foal.id), true);
    assert.equal(state.balance, before - foal.price);
    assert.equal(state.equipped.foal, foal.id);
    assert.equal(state.equipped.neck, 'bell');
  }
  const balance = initial - foals.reduce((total, item) => total + item.price, 0);
  for (const foal of foals) {
    G.buyOrEquip(state, foal.id);
    assert.equal(state.balance, balance);
    assert.equal(state.equipped.foal, foal.id);
  }
  const restored = G.restore(JSON.parse(JSON.stringify(state)));
  for (const key of ['balance', 'earned', 'owned', 'equipped']) assert.deepEqual(restored[key], state[key]);
  assert.equal(G.buyOrEquip(restored, foals.at(-1).id), true);
  assert.equal(restored.equipped.foal, undefined);
  assert.equal(restored.owned.length, foals.length + 1);
  assert.equal(restored.balance, balance);
});

test('for lite stjerner og ugyldige lagrede føll gir ikke gratis kjøp', () => {
  for (const foal of foals) {
    const state = G.fresh(); state.balance = foal.price - 1;
    assert.equal(G.buyOrEquip(state, foal.id), false);
    assert.deepEqual(state.equipped, {});
    assert.deepEqual(state.owned, []);
    assert.equal(state.balance, foal.price - 1);
    const restored = G.restore({ ...state, equipped: { foal: foal.id } });
    assert.equal(restored.equipped.foal, undefined);
    state.balance++;
    assert.equal(G.buyOrEquip(state, foal.id), true);
    assert.equal(state.balance, 0);
  }
});

// Kjør appens faktiske hendelser med en liten DOM-stubb og isolert lagring.
// Geometri og responsiv layout kontrolleres separat i nettleseren.
function shop(state) {
  let saved = JSON.stringify(state), html = '';
  const nodes = new Map();
  const node = key => {
    if (!nodes.has(key)) nodes.set(key, { dataset: {}, handlers: {}, classList: { toggle() {} },
      focus() {}, scrollIntoView() {}, setAttribute() {}, removeAttribute() {},
      addEventListener(event, callback) { this.handlers[event] = callback; } });
    return nodes.get(key);
  };
  Object.defineProperty(node('#main'), 'innerHTML', { get: () => html, set: value => { html = value; } });
  const all = selector => {
    const attr = selector.match(/^\[data-([\w-]+)\]$/)?.[1];
    if (!attr) return [];
    return [...html.matchAll(new RegExp(`data-${attr}="([^"]*)"`, 'g'))].map(match => {
      const item = node(`[data-${attr}="${match[1]}"]`);
      item.dataset[attr.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = match[1];
      return item;
    });
  };
  vm.runInNewContext(fs.readFileSync(require.resolve('./app.js'), 'utf8'), {
    window: { MathGame: G }, document: { querySelector: node, querySelectorAll: all, addEventListener() {} },
    localStorage: { getItem: () => saved, setItem: (_, value) => { saved = value; } },
    setTimeout() {}, clearTimeout() {}, matchMedia: () => ({ matches: true })
  });
  node('#unicorn-tab').handlers.click();
  return { click: key => { assert.ok(node(key).handlers.click, key); node(key).handlers.click(); },
    html: () => html, saved: () => JSON.parse(saved),
    scene: () => html.match(/<div class="unicorn-scene">[\s\S]*?<\/svg><\/div>/)[0] };
}

test('forhåndsvisning erstatter bare synlig føll; avbryt og kjøp bevarer utstyr og saldo', () => {
  const state = G.fresh(); state.balance = 600; state.earned = 600;
  G.buyOrEquip(state, 'cloverFoal'); G.buyOrEquip(state, 'bell');
  const app = shop(state), before = app.saved();
  app.click('[data-try="peachFoal"]');
  assert.equal((app.scene().match(/data-foal=/g) || []).length, 1);
  assert.match(app.scene(), /data-foal="peachFoal"/);
  assert.match(app.scene(), /med Stjernebjelle/);
  assert.deepEqual(app.saved(), before);
  app.click('[data-cancel-preview]');
  assert.match(app.scene(), /data-foal="cloverFoal"/);
  assert.deepEqual(app.saved(), before);
  app.click('[data-try="peachFoal"]');
  app.click('[data-buy="peachFoal"]');
  assert.equal(app.saved().balance, before.balance - G.ITEMS.find(i => i.id === 'peachFoal').price);
  assert.equal(app.saved().equipped.foal, 'peachFoal');
  app.click('[data-item="cloverFoal"]');
  assert.equal(app.saved().equipped.foal, 'cloverFoal');
  assert.equal((app.scene().match(/data-foal=/g) || []).length, 1);
  app.click('[data-filter="mine"]');
  app.click('#undress');
  assert.deepEqual(app.saved().equipped, { foal: 'cloverFoal' });
  assert.doesNotMatch(app.html(), /id="undress"/);
});

test('alle føll vises alene i scenen, også etter gjenåpning; eldre lagring virker uten føll', () => {
  for (const item of [null, ...foals]) {
    const state = G.fresh(); state.balance = 1000; state.earned = 1000;
    if (item) G.buyOrEquip(state, item.id);
    const app = shop(G.restore(JSON.parse(JSON.stringify(state))));
    assert.equal((app.scene().match(/data-foal=/g) || []).length, item ? 1 : 0);
    if (item) assert.ok(app.scene().includes(`sammen med føllet ${item.name}`));
    assert.doesNotMatch(app.html(), /\b(?:undefined|NaN)\b/);
    assert.match(app.html(), /data-shop-group="foal"/);
  }
});
