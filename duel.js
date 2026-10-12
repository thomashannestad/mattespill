/* Spill for to på samme skjerm: Regnekrig, Fire på rad og Huskespill.
   Ren spillogikk uten DOM, delt av nettleseren og testene. */
(function (root) {
  'use strict';
  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const shuffle = values => { const a = [...values]; for (let i = a.length - 1; i > 0; i--) { const j = rand(0, i); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  // Spillerne heter etter fargen sin, så ingen trenger å skrive navn.
  const PLAYERS = ['Lilla', 'Grønn'];
  // Et ferdig spill gir like mange stjerner uansett hvor mange oppgaver det tok, og uansett hvem som vant.
  const GAME_STARS = 3;

  // ===== Regnekrig: to kort trekkes, og den som først trykker riktig svar på sin side, tar kortene. =====
  const RK_OPS = { plus: '+', minus: '−', times: '·', mixed: null };
  const RK_TARGETS = [5, 10, 15];
  const RK_OPTIONS = 6;
  const LOCK_MS = 1000; // Feil svar stenger bare egne knapper ett sekund. Ingen minuspoeng.
  function rkTask(op) {
    const kind = op === 'mixed' ? ['plus', 'minus', 'times'][rand(0, 2)] : op;
    let a = rand(1, kind === 'times' ? 10 : 12), b = rand(1, kind === 'times' ? 10 : 12);
    if (kind === 'minus' && b > a) [a, b] = [b, a];
    const answer = kind === 'plus' ? a + b : kind === 'minus' ? a - b : a * b;
    // Seks svarkort: riktig svar, typiske feil (feil regneart, én gruppe for mye eller for lite) og naboer.
    const typical = kind === 'times' ? [answer + a, answer - a, answer + b, answer - b, a + b] : kind === 'minus' ? [a + b, answer + 1, answer - 1, answer + 2] : [answer + 1, answer - 1, answer + 10, answer - 10];
    const candidates = [...shuffle(typical), ...shuffle([1, -1, 2, -2, 3, -3, 4, -4, 5, -5, 6, 7]).map(d => answer + d)];
    const values = new Set([answer]);
    for (const v of candidates) { if (values.size === RK_OPTIONS) break; if (Number.isInteger(v) && v >= 0) values.add(v); }
    return { a, b, kind, symbol: RK_OPS[kind], answer, options: shuffle([...values]) };
  }
  function regnekrig(settings = {}) {
    const op = Object.hasOwn(RK_OPS, settings.op) ? settings.op : 'minus';
    const target = RK_TARGETS.includes(settings.target) ? settings.target : 10;
    return { game: 'regnekrig', op, target, score: [0, 0], rounds: 0, task: rkTask(op), lockedUntil: [0, 0], wrong: [[], []], roundWinner: null, winner: null };
  }
  // Svar fra én spiller. Gir 'win', 'wrong', 'locked' eller 'ignored'.
  function rkTap(m, player, value, now = Date.now()) {
    if (m.winner !== null || m.roundWinner !== null || ![0, 1].includes(player) || !m.task.options.includes(value)) return 'ignored';
    if (now < m.lockedUntil[player] || m.wrong[player].includes(value)) return 'locked';
    if (value !== m.task.answer) { m.lockedUntil[player] = now + LOCK_MS; m.wrong[player].push(value); return 'wrong'; }
    m.roundWinner = player; m.score[player]++; m.rounds++;
    if (m.score[player] >= m.target) m.winner = player;
    return 'win';
  }
  function rkNext(m) {
    if (m.winner !== null || m.roundWinner === null) return false;
    Object.assign(m, { task: rkTask(m.op), lockedUntil: [0, 0], wrong: [[], []], roundWinner: null });
    return true;
  }

  // ===== Fire på rad: kast to terninger, regn ut, og ta en ledig rute med svaret. =====
  const RAD_SIZE = 5, RAD_LINE = 4;
  function radResults(d1, d2, times) {
    const [hi, lo] = d1 >= d2 ? [d1, d2] : [d2, d1];
    const results = [{ value: d1 + d2, text: `${d1} + ${d2}` }, { value: hi - lo, text: `${hi} − ${lo}` }];
    if (times) results.push({ value: d1 * d2, text: `${d1} · ${d2}` });
    return results;
  }
  // Alle tall som kan lages med to terninger finnes på brettet, og de vanligste kommer oftest.
  function radBoard(times) {
    const counts = new Map();
    for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) for (const r of radResults(a, b, times)) counts.set(r.value, (counts.get(r.value) || 0) + 1);
    const board = shuffle([...counts.keys()]).slice(0, RAD_SIZE * RAD_SIZE);
    const total = [...counts.values()].reduce((s, n) => s + n, 0);
    while (board.length < RAD_SIZE * RAD_SIZE) {
      let pick = Math.random() * total, value;
      for (const [v, n] of counts) { pick -= n; if (pick < 0) { value = v; break; } }
      if (value !== undefined && board.filter(v => v === value).length < 3) board.push(value);
    }
    return shuffle(board).map(value => ({ value, owner: null, text: null }));
  }
  function fireIRad(settings = {}) {
    const times = settings.ops === 'all';
    return { game: 'rad', times, board: radBoard(times), turn: 0, dice: null, playable: false, last: null, line: null, turns: 0, winner: null };
  }
  function radRoll(m, d1 = rand(1, 6), d2 = rand(1, 6)) {
    if (m.winner !== null || m.dice) return null;
    m.dice = [d1, d2]; m.last = null;
    const values = radResults(d1, d2, m.times).map(r => r.value);
    m.playable = m.board.some(c => c.owner === null && values.includes(c.value));
    return m.playable;
  }
  function radLine(board, index) {
    const owner = board[index].owner, r = Math.floor(index / RAD_SIZE), c = index % RAD_SIZE;
    if (owner === null) return null;
    for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
      const cells = [index];
      for (const s of [1, -1]) {
        let rr = r + dr * s, cc = c + dc * s;
        while (rr >= 0 && rr < RAD_SIZE && cc >= 0 && cc < RAD_SIZE && board[rr * RAD_SIZE + cc].owner === owner) { cells.push(rr * RAD_SIZE + cc); rr += dr * s; cc += dc * s; }
      }
      if (cells.length >= RAD_LINE) return cells.sort((a, b) => a - b);
    }
    return null;
  }
  // Valgt rute: riktig svar tar ruten, et tall som ikke passer gir turen videre. Begge deler er én oppgave.
  function radPick(m, index) {
    const cell = m.board[index];
    if (!m.dice || !m.playable || m.winner !== null || !cell || cell.owner !== null) return null;
    const results = radResults(m.dice[0], m.dice[1], m.times), hit = results.find(r => r.value === cell.value), player = m.turn;
    m.turns++;
    if (hit) {
      cell.owner = player; cell.text = hit.text;
      const line = radLine(m.board, index);
      if (line) { m.winner = player; m.line = line; } else if (m.board.every(x => x.owner !== null)) m.winner = 'draw';
    }
    m.last = { player, ok: Boolean(hit), value: cell.value, text: hit ? hit.text : null, results: results.map(r => `${r.text} = ${r.value}`) };
    m.dice = null; m.playable = false;
    if (m.winner === null) m.turn = 1 - player;
    return m.last;
  }
  // Ingen ledig rute passer: turen går videre.
  function radPass(m) {
    if (!m.dice || m.playable || m.winner !== null) return null;
    m.turns++;
    m.last = { player: m.turn, ok: false, pass: true, results: radResults(m.dice[0], m.dice[1], m.times).map(r => `${r.text} = ${r.value}`) };
    m.dice = null; m.turn = 1 - m.turn;
    return m.last;
  }

  // ===== Huskespill: snu to kort. Et par som hører sammen gir et poeng og en tur til. =====
  const MEMORY_KINDS = { ten: 'Tiervenner', plus: 'Pluss', times: 'Gange', double: 'Dobling' };
  function memoryPairs(kind, count) {
    if (kind === 'ten') return [0, 1, 2, 3, 4, 5].map(a => [String(a), String(10 - a)]);
    const used = new Set(), pairs = [];
    for (let guard = 0; pairs.length < count && guard < 1000; guard++) {
      let text, answer;
      if (kind === 'plus') { const a = rand(1, 9), b = rand(1, 9); text = `${a} + ${b}`; answer = a + b; }
      else if (kind === 'times') { const a = rand(1, 10), b = [2, 3, 4, 5, 10][rand(0, 4)]; text = `${a} · ${b}`; answer = a * b; }
      else { const a = rand(1, 15); text = `Dobbelt av ${a}`; answer = a * 2; }
      if (used.has(answer)) continue;
      used.add(answer); pairs.push([text, String(answer)]);
    }
    return pairs;
  }
  function huskespill(settings = {}) {
    const kind = Object.hasOwn(MEMORY_KINDS, settings.kind) ? settings.kind : 'ten';
    const count = kind === 'ten' ? 6 : [6, 8].includes(settings.pairs) ? settings.pairs : 8;
    const cards = shuffle(memoryPairs(kind, count).flatMap((pair, i) => [{ pair: i, label: pair[0] }, { pair: i, label: pair[1] }])).map(c => ({ ...c, owner: null }));
    return { game: 'huske', kind, cards, open: [], turn: 0, score: [0, 0], turns: 0, pending: false, winner: null };
  }
  function memoryFlip(m, index) {
    const card = m.cards[index];
    if (m.winner !== null || m.pending || !card || card.owner !== null || m.open.includes(index)) return null;
    m.open.push(index);
    if (m.open.length < 2) return { flipped: index };
    const [i, j] = m.open, player = m.turn;
    m.turns++;
    if (m.cards[i].pair === m.cards[j].pair) {
      m.cards[i].owner = m.cards[j].owner = player; m.score[player]++; m.open = [];
      if (m.cards.every(c => c.owner !== null)) m.winner = m.score[0] === m.score[1] ? 'draw' : m.score[0] > m.score[1] ? 0 : 1;
      return { match: true, player };
    }
    m.pending = true;
    return { match: false, player };
  }
  // Snur kortene tilbake etter et bom, og gir turen til den andre spilleren.
  function memoryHide(m) {
    if (!m.pending) return false;
    m.open = []; m.pending = false; m.turn = 1 - m.turn;
    return true;
  }

  const api = { PLAYERS, GAME_STARS, RK_OPS, RK_TARGETS, RK_OPTIONS, LOCK_MS, RAD_SIZE, RAD_LINE, MEMORY_KINDS, rkTask, regnekrig, rkTap, rkNext,
    radResults, radBoard, fireIRad, radRoll, radLine, radPick, radPass, memoryPairs, huskespill, memoryFlip, memoryHide };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Duel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
