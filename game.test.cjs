const test = require('node:test');
const assert = require('node:assert/strict');
const G = require('./game.js');

// Sjekker at fasit, modell og svarkort henger sammen for hver oppgavetype.
function checkQuestion(q) {
  assert.equal(q.options.length, 4);
  assert.equal(new Set(q.options).size, 4);
  assert.ok(q.options.includes(q.answer));
  assert.ok(q.options.every(n => Number.isInteger(n) && n >= 0));
  if (q.kind === 'tenFrame') {
    assert.equal(q.model.a + q.answer, q.model.target);
    assert.equal(q.model.target % 10, 0);
    assert.ok(q.options.every(n => n <= 10));
    if (q.type === 'ten') assert.equal(q.model.target, 10);
    else assert.equal(q.model.target, Math.ceil(q.model.a / 10) * 10);
  } else if (q.type === 'plus' || q.type === 'minus') {
    const [a, b] = q.prompt.match(/\d+/g).map(Number);
    assert.equal(q.answer, q.type === 'plus' ? a + b : a - b);
    assert.ok(q.answer >= 0);
  } else if (q.kind === 'place') {
    let answer = 0;
    for (const match of q.prompt.matchAll(/(\d+) (hundrere|tier[e]?|enere)/g)) answer += Number(match[1]) * (match[2] === 'hundrere' ? 100 : match[2].startsWith('tier') ? 10 : 1);
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
      assert.equal(side.value, side.op === '+' ? side.a + side.b : side.op === '−' ? side.a - side.b : side.a * side.b);
      assert.ok(side.value >= 0, `negativ differanse: ${side.a} ${side.op} ${side.b}`);
      if (side.op === '×') assert.ok(side.a <= 10 && side.b <= 10, `for stort gangestykke: ${side.a} × ${side.b}`);
    }
    assert.notEqual(left.value, right.value);
    assert.equal(q.answer, Math.max(left.value, right.value));
    assert.ok(q.options.includes(Math.min(left.value, right.value)), 'den minste verdien skal også være et svarkort');
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
  assert.deepEqual(G.answer(state, state.current.options.find(v => v !== state.current.answer)), { correct: false, points: 1 });
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
  return G.answer(state, correct ? state.current.answer : state.current.options.find(n => n !== state.current.answer));
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

test('versjon 1 migreres uten tap av stjerner, utstyr, navn eller aktiv runde', () => {
  const old = {version:1,balance:21,earned:30,answered:12,correct:9,name:'Stella',owned:['bow'],equipped:{head:'bow'},difficulty:'hard',topic:'plus',round:{done:2,correct:1,earned:4},current:{type:'plus',title:'Hvor mange?',prompt:'8 + 5',answer:13,options:[12,13,14,15],explanation:'8 + 5 = 13.',hint:'Tell videre.',selected:13}};
  const s = G.restore(old);
  for (const key of ['balance','earned','answered','correct','name','owned','equipped','topic','round','current']) assert.deepEqual(s[key], old[key]);
  assert.equal(s.version, 2); assert.equal(s.difficulty, 'auto');
  assert.equal(G.answer(s,13), null); assert.equal(s.balance,21);
  const awaiting = G.restore({...old,current:{...old.current,selected:undefined}});
  assert.equal(G.answer(awaiting,13).points,3);
  assert.equal(awaiting.mastery.plus.seen,0);
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
    assert.equal(s.current.meta.level,2);assert.equal(s.current.showSupport,true);assert.equal(s.current.extraSupport,true);
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
