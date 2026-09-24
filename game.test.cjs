const test = require('node:test');
const assert = require('node:assert/strict');
const G = require('./game.js');

// Sjekker at fasit, modell og svarkort henger sammen for hver oppgavetype.
function checkQuestion(q) {
  assert.ok(q.options.length >= 3 && q.options.length <= 4);
  assert.equal(new Set(q.options.map(o => o.value)).size, q.options.length);
  assert.ok(q.options.some(o => o.value === q.answer));
  assert.ok(q.options.every(o => typeof o.label === 'string' && o.label.length > 0));
  if (q.kind !== 'compare') { assert.equal(q.options.length, 4); assert.ok(q.options.every(o => Number.isInteger(o.value) && o.value >= 0 && o.label === String(o.value))); }
  if (q.kind === 'tenFrame') {
    assert.equal(q.model.a + q.answer, q.model.target);
    assert.equal(q.model.target % 10, 0);
    assert.ok(q.options.every(o => o.value <= 10));
    if (q.type === 'ten') assert.equal(q.model.target, 10);
    else assert.equal(q.model.target, Math.ceil(q.model.a / 10) * 10);
  } else if (q.type === 'plus' || q.type === 'minus') {
    const [a, b] = q.prompt.match(/\d+/g).map(Number);
    assert.equal(q.answer, q.type === 'plus' ? a + b : a - b);
    assert.ok(q.answer >= 0);
  } else if (q.kind === 'place') {
    let answer = 0;
    for (const match of q.prompt.matchAll(/(\d+) (hundrer[e]?|tier[e]?|ener[e]?)/g)) answer += Number(match[1]) * (match[2].startsWith('hundrer') ? 100 : match[2].startsWith('tier') ? 10 : 1);
    assert.doesNotMatch(q.prompt, /\b1 (hundrere|tiere|enere)\b/);
    assert.equal(q.answer, answer);
    assert.ok(q.answer < 1000);
  } else if (q.kind === 'chart') {
    const bar = q.bars.find(b => q.prompt.includes(b.label.toLowerCase()));
    assert.equal(q.answer, bar ? bar.value : q.bars.reduce((a, b) => a + b.value, 0));
  } else if (q.kind === 'sequence') {
    const [a, b, c] = q.prompt.match(/\d+/g).map(Number);
    assert.equal(b - a, c - b);
    assert.equal(q.answer, c + (c - b));
    assert.ok(q.answer <= 100);
  } else if (q.kind === 'doubleHalf') {
    const { number, operation } = q.model;
    if (operation === 'half') { assert.equal(number % 2, 0); assert.equal(q.answer, number / 2); }
    else assert.equal(q.answer, number * 2);
    assert.ok(q.prompt.includes(String(number)));
  } else if (q.kind === 'equation') {
    const [x, y, z] = q.prompt.replace('□', q.answer).match(/\d+/g).map(Number);
    assert.equal(q.prompt.includes('+') ? x + y : x - y, z);
  } else if (q.kind === 'groups') {
    const { groups, each, total, operation } = q.model;
    assert.equal(total, groups * each);
    assert.equal(q.answer, operation === 'multiply' ? total : each);
    assert.ok(q.prompt.includes(operation === 'multiply' ? `${groups} grupper med ${each}` : `Del ${total} bær likt mellom ${groups}`));
  } else if (q.kind === 'compare') {
    const { left, right } = q.model;
    for (const side of [left, right]) {
      assert.equal(side.value, side.op === '+' ? side.a + side.b : side.op === '−' ? side.a - side.b : side.op === '×' ? side.a * side.b : side.a);
      assert.ok(side.value >= 0, `negativ differanse: ${side.a} ${side.op} ${side.b}`);
      if (side.op === '×') assert.ok(side.a <= 10 && side.b <= 10, `for stort gangestykke: ${side.a} × ${side.b}`);
    }
    assert.equal(q.answer, left.value < right.value ? '<' : left.value > right.value ? '>' : '=');
    assert.deepEqual(q.options.map(o => o.value), ['<', '=', '>']);
    assert.ok(q.options.every(o => typeof o.spoken === 'string'));
    assert.ok(q.prompt.includes('□'));
  } else if (q.kind === 'area') {
    assert.equal(q.answer, q.model.width * q.model.height);
  } else if (q.kind === 'coordinate') {
    const { x, y, axis, limit } = q.model;
    assert.equal(q.answer, axis === 'x' ? x : y);
    assert.ok(x >= 1 && x <= limit && y >= 1 && y <= limit);
  } else assert.fail(`ukjent oppgavetype: ${q.type}/${q.kind}`);
}

test('alle oppgavetyper har fire unike svar og matematisk riktig fasit', () => {
  for (const difficulty of ['easy', 'normal', 'hard']) {
    for (const topic of Object.keys(G.TOPICS)) {
      for (let i = 0; i < 500; i++) {
        const q = G.question(topic, difficulty);
        checkQuestion(q);
        if (difficulty === 'easy' && (q.type === 'plus' || q.type === 'minus')) assert.ok(q.answer <= 20);
      }
    }
  }
});

test('riktig gir 3 totalt, feil gir 1; samme oppgave kan ikke belønnes to ganger', () => {
  const state = G.fresh(); state.current = G.question('plus');
  assert.deepEqual(G.answer(state, state.current.answer), { correct: true, points: 3 });
  assert.equal(state.balance, 3); assert.equal(state.earned, 3);
  assert.equal(G.answer(state, state.current.answer), null); assert.equal(state.balance, 3);
  state.current = G.question('minus');
  assert.deepEqual(G.answer(state, state.current.options.find(o => o.value !== state.current.answer).value), { correct: false, points: 1 });
  assert.equal(state.balance, 4); assert.equal(state.round.done, 2); assert.equal(state.round.correct, 1);
});

test('en runde avsluttes etter åtte oppgaver og 24 stjerner ved alle riktige', () => {
  const state = G.fresh();
  for (let i = 0; i < 8; i++) { state.current = G.question(); G.answer(state, state.current.answer); }
  assert.equal(state.round.done, 8); assert.equal(state.round.earned, 24);
  assert.equal(G.level(state.earned).index, 1);
  state.current = G.question(); assert.equal(G.answer(state, state.current.answer), null);
});

test('kjøp krever dekning, trekker én gang og endrer ikke opptjent nivå', () => {
  const state = G.fresh(); assert.equal(G.buyOrEquip(state, 'bow'), false);
  state.balance = state.earned = 30;
  assert.equal(G.buyOrEquip(state, 'bow'), true); assert.equal(state.balance, 21); assert.equal(state.equipped.head, 'bow');
  assert.equal(state.earned, 30); assert.equal(G.level(state.earned).index, 1);
  G.buyOrEquip(state, 'bow'); assert.equal(state.equipped.head, undefined); assert.equal(state.balance, 21);
  G.buyOrEquip(state, 'bow'); assert.equal(state.equipped.head, 'bow'); assert.equal(state.balance, 21);
  assert.equal(G.buyOrEquip(state, 'missing-item'), false);
});

test('utstyr i samme kategori byttes, kjøpt utstyr beholdes', () => {
  const state = G.fresh(); state.balance = state.earned = 100;
  G.buyOrEquip(state, 'bow'); G.buyOrEquip(state, 'crown'); G.buyOrEquip(state, 'mint');
  assert.equal(state.equipped.head, 'crown'); assert.equal(state.equipped.mane, 'mint');
  assert.deepEqual(state.owned, ['bow', 'crown', 'mint']); assert.equal(state.balance, 49);
});

test('lagring bevarer svarte oppgaver og hindrer nye poeng etter gjenåpning', () => {
  const state = G.fresh(); state.current = G.question('chart'); G.answer(state, state.current.answer);
  const restored = G.restore(JSON.parse(JSON.stringify(state)));
  assert.deepEqual(restored, state);
  assert.equal(G.answer(restored, restored.current.answer), null); assert.equal(restored.balance, 3);
});

test('ugyldig lagring erstattes med trygge verdier', () => {
  assert.deepEqual(G.restore(null), G.fresh());
  assert.deepEqual(G.restore({ version: 42 }), G.fresh());
  const state = G.restore({ version: 1, balance: -5, earned: 'abc', current: { options: [] }, owned: ['bad'], equipped: { head: 'crown' }, round: { done: 99 }, difficulty: 'invalid' });
  assert.equal(state.balance, 0); assert.equal(state.current, null); assert.deepEqual(state.owned, []); assert.deepEqual(state.equipped, {});
  assert.equal(state.round.done, 0); assert.equal(state.difficulty, 'auto');
});

function attempt(state, skill, correct = true, hint = false, overrides = {}) {
  if (state.round.done === 8) state.round = { done: 0, correct: 0, earned: 0 };
  state.current = G.generate(skill, state.mastery[skill].level);
  Object.assign(state.current.meta, { adaptive: true }, overrides);
  if (hint) G.useHint(state);
  return G.answer(state, correct ? state.current.answer : state.current.options.find(o => o.value !== state.current.answer).value);
}

test('åtte observasjoner og minst sju riktige uten hint øker bare den aktuelle ferdigheten', () => {
  const s = G.fresh();
  for (let i = 0; i < 7; i++) attempt(s, 'ten');
  assert.equal(s.mastery.ten.level, 1);
  attempt(s, 'ten', false);
  assert.equal(s.mastery.ten.level, 2);
  assert.deepEqual(s.mastery.ten.recent, []);
  for (const skill of Object.keys(G.SKILLS).filter(k => k !== 'ten')) assert.equal(s.mastery[skill].level, 1);
  attempt(s, 'ten'); assert.equal(s.mastery.ten.level, 2);
});

test('to feil på rad senker ett trinn; tre feil av fem gjør også det', () => {
  const s = G.fresh(); s.mastery.minus.level = 4;
  attempt(s, 'minus', false); assert.equal(s.mastery.minus.level, 4);
  attempt(s, 'minus', false); assert.equal(s.mastery.minus.level, 3); assert.equal(s.mastery.minus.support, true);
  assert.deepEqual(s.mastery.minus.recent, []);
  for (const correct of [false,true,false,true,false]) attempt(s, 'minus', correct);
  assert.equal(s.mastery.minus.level, 2);
});

test('nivågrenser og ny måleperiode hindrer hopp og pendling', () => {
  const s = G.fresh();
  for (let i = 0; i < 20; i++) attempt(s, 'ten', false);
  assert.equal(s.mastery.ten.level, 1);
  for (let i = 0; i < 80; i++) attempt(s, 'ten');
  assert.equal(s.mastery.ten.level, G.SKILLS.ten.max);
  assert.equal(s.mastery.ten.history.length, 30);
});

test('hint gir fulle poeng, men hint alene fører ikke til økt nivå', () => {
  const s = G.fresh();
  for (let i = 0; i < 16; i++) attempt(s, 'nextTen', true, true);
  assert.equal(s.balance, 48); assert.equal(s.mastery.nextTen.level, 1);
  assert.ok(s.mastery.nextTen.recent.every(r => r.hint));
});

test('hint, mestring og en ubesvart oppgave overlever gjenåpning', () => {
  const s = G.fresh(); attempt(s, 'plus');
  s.current = G.generate('plus', 1); s.current.meta.adaptive = true; G.useHint(s);
  const restored = G.restore(JSON.parse(JSON.stringify(s)));
  assert.deepEqual(restored, s);
  G.answer(restored, restored.current.answer);
  assert.equal(restored.mastery.plus.recent.at(-1).hint, true);
  const again = G.restore(JSON.parse(JSON.stringify(restored)));
  assert.equal(G.answer(again, again.current.answer), null);
  assert.equal(again.mastery.plus.seen, 2);
});

test('manuell øving, repetisjon og utfordringer øker ikke det etablerte nivået', () => {
  for (const meta of [{adaptive:false},{role:'review'},{role:'challenge'}]) {
    const s = G.fresh();
    for (let i = 0; i < 16; i++) attempt(s, 'plus', true, false, meta);
    assert.equal(s.mastery.plus.level, 1); assert.equal(s.mastery.plus.recent.length, 0);
  }
});

test('et lagret trinn over ferdighetens maks klippes i stedet for å nullstilles', () => {
  const s = G.fresh(); s.mastery.equation.level = 9; s.mastery.equation.seen = 40;
  const restored = G.restore(JSON.parse(JSON.stringify(s)));
  assert.equal(restored.mastery.equation.level, G.SKILLS.equation.max); assert.equal(restored.mastery.equation.seen, 40);
});

test('versjon 1 migreres uten tap av stjerner, utstyr, navn eller aktiv runde', () => {
  const old = {version:1,balance:21,earned:30,answered:12,correct:9,name:'Stella',owned:['bow'],equipped:{head:'bow'},difficulty:'hard',topic:'plus',round:{done:2,correct:1,earned:4},current:{type:'plus',title:'Hvor mange?',prompt:'8 + 5',answer:13,options:[12,13,14,15],explanation:'8 + 5 = 13.',hint:'Tell videre.',selected:13}};
  const s = G.restore(old);
  for (const key of ['balance','earned','answered','correct','name','owned','equipped','topic','round']) assert.deepEqual(s[key], old[key]);
  assert.deepEqual(s.current, { ...old.current, options: old.current.options.map(v => G.option(v)) });
  assert.equal(s.version, 2); assert.equal(s.difficulty, 'auto');
  assert.equal(G.answer(s,13), null); assert.equal(s.balance,21);
  const awaiting = G.restore({...old,current:{...old.current,selected:undefined}});
  assert.equal(G.answer(awaiting,13).points,3);
  assert.equal(awaiting.mastery.plus.seen,0);
});

test('sammenligning bruker alle tre tegnene, og like sider forekommer på hvert trinn', () => {
  for (let level = 1; level <= G.SKILLS.compare.max; level++) {
    const count = { '<': 0, '=': 0, '>': 0 }, ops = new Set();
    for (let i = 0; i < 600; i++) { const q = G.generate('compare', level); count[q.answer]++; ops.add(q.model.left.op); ops.add(q.model.right.op); }
    for (const symbol of ['<', '=', '>']) assert.ok(count[symbol] >= 60, `trinn ${level}: ${symbol} forekommer for sjelden (${count[symbol]})`);
    if (level === 1) assert.deepEqual([...ops], [null]); else assert.ok(!ops.has(null));
    assert.equal(ops.has('×'), level === G.SKILLS.compare.max);
  }
});

test('svar med tegn gir poeng, avviser tall, og overlever gjenåpning med opplest tekst', () => {
  const s = G.fresh(); s.current = G.generate('compare', 2);
  assert.equal(G.answer(s, 5), null); assert.equal(G.answer(s, 'x'), null);
  const restored = G.restore(JSON.parse(JSON.stringify(s)));
  assert.deepEqual(restored, s);
  assert.equal(restored.current.options.find(o => o.value === '<').spoken, 'mindre enn');
  assert.deepEqual(G.answer(restored, restored.current.answer), { correct: true, points: 3 });
  assert.equal(restored.current.selected, restored.current.answer);
  const again = G.restore(JSON.parse(JSON.stringify(restored)));
  assert.equal(again.current.selected, restored.current.answer); assert.equal(G.answer(again, again.current.answer), null);
});

test('lagring der svarkortene bare var tall, oppgraderes til kort med tekst', () => {
  const s = G.fresh(); s.current = G.generate('minus', 2);
  const raw = JSON.parse(JSON.stringify(s)); raw.current.options = s.current.options.map(o => o.value);
  const restored = G.restore(raw);
  assert.deepEqual(restored.current.options, s.current.options);
  assert.deepEqual(G.answer(restored, restored.current.answer), { correct: true, points: 3 });
  const junk = JSON.parse(JSON.stringify(s)); junk.current.options = [{ value: 1, label: 'x' }, { value: 1, label: 'y' }, { value: 2 }, 'z'];
  assert.equal(G.restore(junk).current, null);
});

test('oppgavemetadata skiller tierovergang fra større tall uten overgang', () => {
  for (let i = 0; i < 500; i++) {
    for (const skill of ['plus','minus']) for (const level of [4,5]) {
      const q = G.generate(skill,level), {a,b} = q.model;
      assert.equal(q.meta.level,level); assert.equal(q.meta.skill,skill);
      const crossing = skill === 'plus' ? a % 10 + b % 10 >= 10 : a % 10 < b % 10;
      assert.equal(crossing,level===5);
      assert.equal(q.steps.at(-1).value,q.answer);
      for(let j=1;j<q.steps.length;j++) assert.equal(q.steps[j-1].value+q.steps[j].jump,q.steps[j].value);
    }
  }
});

test('alle faglige nivåer gir gyldig lagring og fire svaralternativer', () => {
  for (const [skill,info] of Object.entries(G.SKILLS)) for (let level=1;level<=info.max;level++) for (let i=0;i<100;i++) {
    const s=G.fresh();s.current=G.generate(skill,level);
    checkQuestion(s.current);
    assert.deepEqual(G.restore(JSON.parse(JSON.stringify(s))).current,s.current);
  }
});

test('automatisk støtte etter feil forsvinner rolig og telles som støtte', () => {
  const s=G.fresh();s.topic='ten';s.mastery.ten.level=3;
  attempt(s,'ten',false);attempt(s,'ten',false);
  for(let i=0;i<2;i++) {
    s.current=G.nextQuestion(s);
    assert.equal(s.current.meta.level,2);assert.equal(s.current.showSupport,true);assert.equal(s.current.extraSupport,true);assert.equal(s.current.hintOpen,true);
    G.answer(s,s.current.answer);
  }
  assert.equal(s.mastery.ten.support,false);
  assert.ok(s.mastery.ten.recent.every(r=>r.hint));
});

test('utfordringer krever mestring og repetisjon er ett trinn under', t => {
  const s=G.fresh();s.topic='plus';s.mastery.plus.level=3;
  const random=t.mock.method(Math,'random',()=>.95);
  assert.equal(G.nextQuestion(s).meta.role,'current');
  s.mastery.plus.recent=Array.from({length:5},()=>({correct:true,hint:false}));
  let q=G.nextQuestion(s);assert.equal(q.meta.role,'challenge');assert.equal(q.meta.level,4);
  random.mock.mockImplementation(()=>.1);
  q=G.nextQuestion(s);assert.equal(q.meta.role,'review');assert.equal(q.meta.level,2);
});
