const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const G = require('./game.js');

// Fast tilfeldig sekvens gjør en eventuell feil identisk på neste kjøring og i CI.
function seeded(seed) {
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
}
function calculate(text) {
  assert.match(text, /^\d+(?: [+−×] \d+)*$/);
  const terms = text.split(/ ([+−]) /);
  const product = term => term.split(' × ').map(Number).reduce((a, b) => a * b, 1);
  let total = product(terms[0]);
  for (let i = 1; i < terms.length; i += 2) total += (terms[i] === '+' ? 1 : -1) * product(terms[i + 1]);
  return total;
}

// Leser den synlige oppgaven, ikke q.answer eller mellomresultater som generatoren har regnet ut.
// Areal, diagrammer og koordinater trenger dessuten figurens oppgitte data.
function solve(q) {
  const text = q.prompt;
  switch (q.meta.skill) {
    case 'ten': case 'nextTen': case 'equation': {
      const valid = q.options.filter(o => {
        const [left, right] = text.replace('□', o.label).split(' = ');
        return calculate(left) === calculate(right);
      });
      assert.equal(valid.length, 1, 'regnestykket må ha nøyaktig ett riktig kort');
      return Number(valid[0].label);
    }
    case 'plus': case 'minus': return calculate(text);
    case 'sequence': {
      const [a, b, c] = text.split(', ').slice(0, 3).map(Number);
      assert.equal(c - b, b - a);
      return c + (b - a);
    }
    case 'place': {
      const weights = { hundrer: 100, hundrere: 100, tier: 10, tiere: 10, ener: 1, enere: 1 };
      return [...text.matchAll(/(\d+) (hundrere?|tiere?|enere?)/g)].reduce((sum, m) => sum + Number(m[1]) * weights[m[2]], 0);
    }
    case 'doubleHalf': {
      const number = Number(text.match(/av (\d+)\?/)[1]);
      return text.includes('halvparten') ? number / 2 : number * 2;
    }
    case 'multiply': {
      const [, count, each] = text.match(/(\d+) grupper med (\d+) i hver/);
      return Number(count) * Number(each);
    }
    case 'divide': {
      const [, total, groups] = text.match(/Del (\d+) bær likt mellom (\d+) kurver/);
      assert.equal(Number(total) % Number(groups), 0);
      return Number(total) / Number(groups);
    }
    case 'compare': {
      const [left, right] = text.split(' □ ').map(calculate);
      return left < right ? '<' : left > right ? '>' : '=';
    }
    case 'balance': {
      const [, left, right] = text.match(/^Venstre skål: ([\d og?]+)\. Høyre skål: ([\d og?]+)\./);
      const sum = side => (side.match(/\d+/g) || []).map(Number).reduce((a, b) => a + b, 0);
      if (left.includes('?')) return sum(right) - sum(left);
      if (right.includes('?')) return sum(left) - sum(right);
      return sum(left) > sum(right) ? 'left' : sum(left) < sum(right) ? 'right' : 'equal';
    }
    case 'area': return q.model.width * q.model.height;
    case 'coordinate': return text.includes('vannrett') ? q.model.x : q.model.y;
    case 'gridMove': {
      let [, x, y] = text.match(/står på \((\d+), (\d+)\)/).map(Number);
      const instruction = text.match(/\. Gå (.*?)\. Hvor/)[1];
      const moves = [...instruction.matchAll(/(\d+) (til høyre|til venstre|opp|ned)/g)];
      assert.equal(moves.length, q.meta.level);
      for (const [, length, direction] of moves) {
        const distance = Number(length);
        if (direction === 'til høyre') x += distance;
        else if (direction === 'til venstre') x -= distance;
        else if (direction === 'opp') y += distance;
        else y -= distance;
        assert.ok(x >= 1 && x <= q.model.limit && y >= 1 && y <= q.model.limit, 'instruksjon utenfor rutenettet');
      }
      assert.deepEqual(q.model.end, { x, y });
      return `${x},${y}`;
    }
    case 'chart': {
      if (text.includes('til sammen')) return q.bars.reduce((sum, b) => sum + b.value, 0);
      if (text.includes('flest') || text.includes('færrest')) {
        const sorted = [...q.bars].sort((a, b) => text.includes('flest') ? b.value - a.value : a.value - b.value);
        assert.notEqual(sorted[0].value, sorted[1].value, 'flere riktige farger');
        return sorted[0].label;
      }
      const named = q.bars.filter(b => text.includes(b.label.toLowerCase())).sort((a, b) => text.indexOf(a.label.toLowerCase()) - text.indexOf(b.label.toLowerCase()));
      if (text.includes('flere')) { assert.equal(named.length, 2); assert.ok(named[0].value > named[1].value); return named[0].value - named[1].value; }
      assert.equal(named.length, 1);
      return named[0].value;
    }
    default: assert.fail(`Mangler uavhengig løser for ${q.meta.skill}`);
  }
}

test('64 000 oppgaver: fasit følger oppgaveteksten, alle likninger i forklaringen er sanne', t => {
  t.mock.method(Math, 'random', seeded(0x24_09_2026));
  const variants = new Set();
  let count = 0;
  for (const [skill, info] of Object.entries(G.SKILLS)) for (let level = 1; level <= info.max; level++) {
    for (let sample = 0; sample < 1000; sample++) {
      const q = G.generate(skill, level);
      try {
        const expected = solve(q);
        assert.equal(q.answer, expected);
        assert.equal(q.options.filter(o => o.value === expected).length, 1);
        assert.equal(new Set(q.options.map(o => o.label)).size, q.options.length);
        if (typeof expected === 'number') assert.ok(Number.isInteger(expected) && expected >= 0);
        for (const match of q.explanation.matchAll(/(\d+(?: [+−×] \d+)+) = (\d+)/g)) assert.equal(calculate(match[1]), Number(match[2]), `feil forklaring: ${match[0]}`);
        if (q.steps) {
          assert.equal(q.steps.at(-1).value, expected);
          for (let i = 1; i < q.steps.length; i++) assert.equal(q.steps[i - 1].value + q.steps[i].jump, q.steps[i].value);
        }
        if (skill === 'compare') variants.add(`compare:${q.answer}`);
        if (skill === 'chart') variants.add(`chart:${q.form}`);
        if (skill === 'equation') variants.add(`equation:${q.model.op}:${q.model.missing}`);
        if (skill === 'balance') variants.add(`balance:${q.model.form}:${q.model.unknown}`);
        if (skill === 'doubleHalf') variants.add(`doubleHalf:${q.model.operation}`);
        // Alle kort prøves i en egen kopi av tilstanden, også etter lagring/gjenåpning.
        if (sample < 5) for (const o of q.options) {
          const state = G.restore(JSON.parse(JSON.stringify({ ...G.fresh(), current: q })));
          assert.deepEqual(G.answer(state, o.value), { correct: o.value === expected, points: o.value === expected ? 3 : 1 });
          const restored = G.restore(JSON.parse(JSON.stringify(state)));
          assert.equal(G.answer(restored, o.value), null, 'samme svar må ikke gi nye poeng');
        }
        count++;
      } catch (error) { error.message = `${skill}, trinn ${level}, eksempel ${sample}: ${JSON.stringify(q)}\n${error.message}`; throw error; }
    }
  }
  for (const expected of ['compare:<','compare:=','compare:>','chart:read','chart:most','chart:fewest','chart:difference','chart:sum','equation:+:left','equation:+:right','equation:−:left','equation:−:right','balance:heavier:null','balance:missing:left','balance:missing:right','doubleHalf:double','doubleHalf:half']) assert.ok(variants.has(expected), `Mangler dekning: ${expected}`);
  t.diagnostic(`${count} oppgaver kontrollert på alle ${Object.keys(G.SKILLS).length} ferdigheter.`);
});

test('sammenligning holder gangestykkene innen 10-gangen også etter gjentatte like trekk', t => {
  t.mock.method(Math, 'random', () => 0.999999);
  const q = G.generate('compare', 4);
  assert.equal(q.answer, solve(q));
  for (const side of [q.model.left, q.model.right]) if (side.op === '×') assert.ok(side.a <= 10 && side.b <= 10, `${side.a} × ${side.b}`);
});

// Kjør den faktiske visningen med isolert minnelagring. Ingen brukerdata eller nettleser berøres.
const app = new vm.Script(fs.readFileSync(require.resolve('./app.js'), 'utf8'));
function render(q, solved = false) {
  const nodes = new Map();
  const element = selector => {
    if (!nodes.has(selector)) nodes.set(selector, { innerHTML: '', textContent: '', classList: { toggle() {} }, setAttribute() {}, removeAttribute() {}, addEventListener() {} });
    return nodes.get(selector);
  };
  const state = G.fresh(); state.current = { ...q };
  if (solved) G.answer(state, q.answer);
  app.runInNewContext({ window: { MathGame: G }, document: { querySelector: element, querySelectorAll: () => [], addEventListener() {} }, localStorage: { getItem: () => JSON.stringify(state), setItem() {} } });
  return element('#main').innerHTML;
}

test('figurer viser riktig antall, riktige punkter og skålvekt som heller mot tyngste side', t => {
  t.mock.method(Math, 'random', seeded(12345));
  for (const skill of Object.keys(G.SKILLS)) {
    for (let level = 1; level <= G.SKILLS[skill].max; level++) for (let i = 0; i < 8; i++) {
      const q = G.generate(skill, level);
      if (q.kind === 'tenFrame') q.hintOpen = true;
      for (const solved of [false, true]) {
        const html = render(q, solved);
        assert.doesNotMatch(html, /\b(?:NaN|undefined)\b/);
        assert.equal((html.match(/data-option="\d+"/g) || []).length, q.options.length);
        assert.equal((html.match(/class="answer correct/g) || []).length, solved ? 1 : 0);
        if (q.kind === 'tenFrame') {
          assert.equal((html.match(/class="ten-cell /g) || []).length, 10);
          assert.equal((html.match(/class="ten-cell existing/g) || []).length, q.model.a - (q.model.target - 10));
          assert.equal((html.match(/class="ten-cell added/g) || []).length, solved ? q.answer : 0);
        } else if (q.kind === 'area') {
          const cells = html.match(/class="area-grid"[^>]*>(.*?)<\/div>/s)[1];
          assert.equal((cells.match(/<i /g) || []).length, solve(q));
        } else if (q.kind === 'groups') {
          const model = html.slice(html.indexOf('<div class="groups-model"'), html.indexOf('</section>'));
          assert.equal((model.match(/<i aria-hidden="true">✿<\/i>/g) || []).length, q.model.total);
          assert.equal((model.match(/class="flower-group(?: empty)?"/g) || []).length, q.model.groups);
          assert.equal((model.match(/class="flower-group empty"/g) || []).length, skill === 'divide' && !solved ? q.model.groups : 0);
        } else if (q.kind === 'coordinate' || q.kind === 'gridMove') {
          const cells = html.match(/class="coordinate-grid"[^>]*>(.*?)<\/div>/s)[1].match(/<i\b[^>]*>.*?<\/i>/g);
          const at = q.kind === 'coordinate' ? q.model : solved ? q.model.end : q.model.start;
          assert.equal(cells.length, q.model.limit ** 2);
          assert.equal(cells.findIndex(cell => cell.includes('marked')), (q.model.limit - at.y) * q.model.limit + at.x - 1);
          assert.equal(cells.filter(cell => cell.includes('marked')).length, 1);
          const description = html.match(/aria-label="(Rutenett[^"]+)"/)[1];
          assert.ok(description.includes(`(${at.x}, ${at.y})`), 'punktet må også kunne leses av skjermleser');
        } else if (q.kind === 'chart') {
          const heights = [...html.matchAll(/class="bar" style="height:(\d+)%;/g)].map(m => Number(m[1]));
          assert.deepEqual(heights, q.bars.map(b => b.value * 10));
        } else if (q.kind === 'balance') {
          const [, ly, ry] = html.match(/<line x1="[^"]+" y1="([^"]+)" x2="[^"]+" y2="([^"]+)"/);
          const weight = side => q.model[side].reduce((a, b) => a + b, 0);
          assert.equal(Math.sign(Number(ly) - Number(ry)), solved && q.model.form === 'heavier' ? Math.sign(weight('left') - weight('right')) : 0);
          if (q.model.form === 'missing') assert.equal(html.includes('>?<\/text>'), !solved);
        }
      }
    }
  }
});
