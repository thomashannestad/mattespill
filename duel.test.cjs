const test = require('node:test');
const assert = require('node:assert/strict');
const D = require('./duel.js');
const G = require('./game.js');

test('regnekrig: seks unike svarkort med riktig svar, aldri negative', () => {
  for (const op of ['plus', 'minus', 'times', 'mixed']) for (let i = 0; i < 2000; i++) {
    const t = D.rkTask(op);
    assert.equal(t.options.length, D.RK_OPTIONS); assert.equal(new Set(t.options).size, D.RK_OPTIONS);
    assert.ok(t.options.includes(t.answer)); assert.ok(t.options.every(v => Number.isInteger(v) && v >= 0));
    const expected = t.kind === 'plus' ? t.a + t.b : t.kind === 'minus' ? t.a - t.b : t.a * t.b;
    assert.equal(t.answer, expected);
    if (t.kind === 'minus') assert.ok(t.a >= t.b, 'største kort først');
    if (t.kind === 'times') assert.ok(t.a <= 10 && t.b <= 10);
    if (op !== 'mixed') assert.equal(t.kind, op);
  }
});

test('regnekrig: feil svar stenger bare egne knapper i ett sekund, uten minuspoeng', () => {
  const m = D.regnekrig({ op: 'minus', target: 5 }); m.target = 2; // kort kamp i testen
  const wrong = m.task.options.find(v => v !== m.task.answer);
  assert.equal(D.rkTap(m, 0, wrong, 1000), 'wrong');
  assert.deepEqual(m.score, [0, 0]);
  assert.equal(D.rkTap(m, 0, m.task.answer, 1500), 'locked', 'stengt i ett sekund');
  assert.equal(D.rkTap(m, 0, wrong, 2500), 'locked', 'samme feil kort kan ikke trykkes igjen');
  assert.equal(D.rkTap(m, 1, m.task.answer, 1600), 'win', 'den andre spilleren kan svare med en gang');
  assert.deepEqual(m.score, [0, 1]);
  assert.equal(D.rkTap(m, 0, m.task.answer, 3000), 'ignored', 'runden er avgjort');
  assert.equal(D.rkNext(m), true); assert.deepEqual(m.wrong, [[], []]); assert.equal(m.roundWinner, null);
  D.rkTap(m, 1, m.task.answer, 4000);
  assert.equal(m.winner, 1); assert.equal(D.rkNext(m), false);
  assert.equal(D.regnekrig({ op: 'tull', target: 99 }).target, 10);
});

test('fire på rad: brettet har bare tall terningene kan gi, og riktig rute tas', () => {
  for (const ops of ['plusminus', 'all']) for (let i = 0; i < 200; i++) {
    const m = D.fireIRad({ ops }), possible = new Set();
    for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) for (const r of D.radResults(a, b, ops === 'all')) possible.add(r.value);
    assert.equal(m.board.length, 25);
    assert.ok(m.board.every(c => possible.has(c.value)));
    for (const v of new Set(m.board.map(c => c.value))) assert.ok(m.board.filter(c => c.value === v).length <= 3);
  }
  const m = D.fireIRad({ ops: 'plusminus' });
  m.board.forEach((c, i) => { c.value = i === 7 ? 9 : i === 8 ? 2 : i === 9 ? 7 : 11; });
  assert.equal(D.radRoll(m, 6, 3), true);
  assert.equal(D.radRoll(m, 1, 1), null, 'kan ikke kaste to ganger');
  assert.deepEqual(D.radPick(m, 7), { player: 0, ok: true, value: 9, text: '6 + 3', results: ['6 + 3 = 9', '6 − 3 = 3'] });
  assert.equal(m.board[7].owner, 0); assert.equal(m.turn, 1);
  assert.equal(D.radRoll(m, 6, 1), true); // 7 og 5: ruten med 7 passer, ruten med 2 gjør det ikke
  const miss = D.radPick(m, 8);
  assert.equal(miss.ok, false); assert.equal(m.board[8].owner, null); assert.equal(m.turn, 0, 'feil rute gir turen videre');
});

test('fire på rad: fire på rad vannrett, loddrett og på skrå vinner; ingen passende rute gir turen videre', () => {
  for (const cells of [[0, 1, 2, 3], [4, 9, 14, 19], [0, 6, 12, 18], [4, 8, 12, 16]]) {
    const board = Array.from({ length: 25 }, () => ({ owner: null }));
    for (const i of cells) board[i].owner = 1;
    assert.deepEqual(D.radLine(board, cells[2]), cells);
  }
  const board = Array.from({ length: 25 }, () => ({ owner: null }));
  for (const i of [0, 1, 2]) board[i].owner = 0;
  assert.equal(D.radLine(board, 1), null);
  const m = D.fireIRad({});
  m.board.forEach(c => { c.value = 30; });
  assert.equal(D.radRoll(m, 1, 2), false);
  assert.equal(D.radPick(m, 0), null, 'ingen rute kan velges');
  assert.equal(D.radPass(m).pass, true); assert.equal(m.turn, 1); assert.equal(m.dice, null);
});

test('huskespill: unike par, riktig par gir ny tur, bom gir turen videre', () => {
  for (const kind of ['ten', 'plus', 'times', 'double']) for (const pairs of [6, 8]) for (let i = 0; i < 100; i++) {
    const m = D.huskespill({ kind, pairs });
    const count = kind === 'ten' ? 6 : pairs;
    assert.equal(m.cards.length, count * 2);
    const answers = D.memoryPairs(kind, count).map(p => p[1]);
    assert.equal(new Set(answers).size, answers.length, 'ingen to par har samme svar');
    for (let p = 0; p < count; p++) assert.equal(m.cards.filter(c => c.pair === p).length, 2);
  }
  for (const [text, answer] of D.memoryPairs('plus', 8)) { const [a, b] = text.split(' + ').map(Number); assert.equal(a + b, Number(answer)); }
  for (const [a, b] of D.memoryPairs('ten', 6)) assert.equal(Number(a) + Number(b), 10);
  const m = D.huskespill({ kind: 'ten' });
  const first = m.cards.findIndex(c => c.pair === 0), mate = m.cards.findIndex((c, i) => c.pair === 0 && i !== first), other = m.cards.findIndex(c => c.pair === 1);
  assert.deepEqual(D.memoryFlip(m, first), { flipped: first });
  assert.equal(D.memoryFlip(m, first), null, 'samme kort to ganger teller ikke');
  assert.deepEqual(D.memoryFlip(m, other), { match: false, player: 0 });
  assert.equal(D.memoryFlip(m, mate), null, 'venter til kortene er snudd tilbake');
  assert.equal(D.memoryHide(m), true); assert.equal(m.turn, 1);
  D.memoryFlip(m, first); assert.deepEqual(D.memoryFlip(m, mate), { match: true, player: 1 });
  assert.equal(m.turn, 1, 'riktig par gir en tur til'); assert.deepEqual(m.score, [0, 1]);
  for (let p = 1; p < 6; p++) { const [x, y] = m.cards.map((c, i) => c.pair === p ? i : -1).filter(i => i >= 0); D.memoryFlip(m, x); D.memoryFlip(m, y); }
  assert.equal(m.winner, 1); assert.equal(m.turns, 7);
});

test('et ferdig spill gir tre stjerner, og alle tre spillene ender med en vinner eller uavgjort', () => {
  assert.equal(D.GAME_STARS, 3);
  const rk = D.regnekrig({ target: 5 });
  for (let i = 0; i < 5; i++) { D.rkTap(rk, 0, rk.task.answer, i * 10); D.rkNext(rk); }
  assert.equal(rk.winner, 0);
  const mem = D.huskespill({ kind: 'double', pairs: 6 });
  for (let p = 0; p < 6; p++) { const [x, y] = mem.cards.map((c, i) => c.pair === p ? i : -1).filter(i => i >= 0); D.memoryFlip(mem, x); D.memoryFlip(mem, y); }
  assert.equal(mem.winner, 0);
});

test('aktivitetsstjerner fra duellen øker saldo og opptjente stjerner, men ikke mestring', () => {
  const s = G.fresh(), before = JSON.stringify(s.mastery);
  assert.equal(G.reward(s, 1), true); assert.equal(G.reward(s, 1), true);
  assert.equal(s.balance, 2); assert.equal(s.earned, 2); assert.equal(s.answered, 0);
  assert.equal(JSON.stringify(s.mastery), before);
  for (const bad of [0, -3, 1.5, 'x', 1000]) assert.equal(G.reward(s, bad), false);
  assert.equal(s.balance, 2);
  assert.deepEqual(G.restore(JSON.parse(JSON.stringify(s))).earned, 2);
});
