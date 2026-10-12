/* Visning for duellene. Spillogikken ligger i duel.js; stjerner gis via appens belønning (ctx.award).
   Under en kamp dekker duellen hele skjermen. Trykk håndteres på pointerdown, så to spillere kan trykke
   samtidig uten klikkforsinkelse, og zoom, tekstmarkering og menyer ved langt trykk er skrudd av. */
(function () {
  'use strict';
  const D = window.Duel, N = D.PLAYERS;
  const settings = { regnekrig: { op: 'minus', target: 10 }, rad: { ops: 'plusminus' }, huske: { kind: 'ten', pairs: 8 } };
  const GAMES = [
    { id: 'regnekrig', icon: '⚡', title: 'Regnekrig', desc: 'To kort trekkes. Den som først trykker riktig svar på sin side, tar kortene.', tag: 'Fart · sitt overfor hverandre',
      options: [['op', 'Regneart', [['plus', 'Pluss'], ['minus', 'Minus'], ['times', 'Gange'], ['mixed', 'Blandet']]], ['target', 'Først til', [[5, '5 kort'], [10, '10 kort'], [15, '15 kort']]]] },
    { id: 'rad', icon: '🎲', title: 'Fire på rad', desc: 'Kast to terninger, regn ut og ta en rute med svaret. Fire på rad vinner.', tag: 'Bytt på · ingen hast',
      options: [['ops', 'Regnearter', [['plusminus', 'Pluss og minus'], ['all', 'Pluss, minus og gange']]]] },
    { id: 'huske', icon: '🃏', title: 'Huskespill', desc: 'Snu to kort. Hører de sammen, får du paret og en tur til.', tag: 'Bytt på · ingen hast',
      options: [['kind', 'Kort', [['ten', 'Tiervenner'], ['plus', 'Pluss'], ['times', 'Gange'], ['double', 'Dobling']]], ['pairs', 'Antall par', [[6, '6 par'], [8, '8 par']]]] }
  ];
  const MEMORY_GOAL = { ten: 'Finn to tall som blir 10 sammen.', plus: 'Finn regnestykket og svaret som hører sammen.', times: 'Finn gangestykket og svaret som hører sammen.', double: 'Finn tallet og det dobbelte.' };
  const PIPS = { 1: [[50, 50]], 2: [[28, 28], [72, 72]], 3: [[28, 28], [50, 50], [72, 72]], 4: [[28, 28], [72, 28], [28, 72], [72, 72]], 5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]], 6: [[28, 26], [72, 26], [28, 50], [72, 50], [28, 74], [72, 74]] };
  let ctx = null, main = null, stage = null, match = null, timers = [], rewarded = false, confirm = false, note = '';

  const esc = value => ctx.escape(value);
  const later = (fn, ms) => { timers.push(setTimeout(fn, ms)); };
  const die = n => `<svg class="die" viewBox="0 0 100 100" role="img" aria-label="Terning som viser ${n}"><rect x="4" y="4" width="92" height="92" rx="18" fill="#fffefa" stroke="#8d7cae" stroke-width="4"/>${PIPS[n].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9" fill="#4b4356"/>`).join('')}</svg>`;
  const starsLine = () => `<span class="duel-stars" aria-live="polite">${rewarded ? `+${D.GAME_STARS} ★ til ${esc(ctx.name())}` : `${D.GAME_STARS} ★ til ${esc(ctx.name())} når spillet er ferdig`}</span>`;
  const exitButton = () => `<button class="duel-exit" data-act="exit">✕ Avslutt</button>`;
  const endButtons = () => `<div class="duel-end"><button class="primary-button" data-act="again">Spill igjen</button><button class="secondary-button" data-act="menu">Til duellmenyen</button></div>`;
  const confirmBox = () => confirm ? `<div class="duel-confirm" role="alertdialog" aria-label="Avslutte duellen?"><p>Avslutte duellen?</p><p class="small">De ${D.GAME_STARS} stjernene kommer når et spill er spilt ferdig.</p><button class="primary-button" data-act="exit-no">Nei, spill videre</button><button class="secondary-button" data-act="exit-yes">Ja, avslutt</button></div>` : '';

  // ----- Menyen i fanen «Duell» -----
  function mount(target, context) {
    ctx = context; main = target;
    main.innerHTML = ctx.warning + `<h1 class="sr-only">Duell</h1><div class="duel-intro"><h2>Duell for to</h2><p>Spill sammen på samme skjerm. Hvert ferdige spill gir ${D.GAME_STARS} ★ til ${esc(ctx.name())}, uansett hvem som vinner.</p></div>
      <div class="duel-games">${GAMES.map(g => `<article class="duel-card"><div class="duel-card-head"><span class="duel-icon" aria-hidden="true">${g.icon}</span><div><h3>${g.title}</h3><span class="duel-tag">${g.tag}</span></div></div><p>${g.desc}</p>
        ${g.options.map(([key, label, choices]) => { const fixed = g.id === 'huske' && key === 'pairs' && settings.huske.kind === 'ten';
          return `<div class="duel-option" role="group" aria-label="${label}"><span>${label}</span>${choices.map(([value, text]) => `<button class="chip" data-duel-setting="${g.id}:${key}:${value}" aria-pressed="${fixed ? value === 6 : String(settings[g.id][key]) === String(value)}" ${fixed ? 'disabled' : ''}>${text}</button>`).join('')}</div>`; }).join('')}
        <button class="primary-button duel-start" data-duel-start="${g.id}">Start</button></article>`).join('')}</div>`;
    main.querySelectorAll('[data-duel-setting]').forEach(b => b.addEventListener('click', () => {
      const [game, key, raw] = b.dataset.duelSetting.split(':');
      settings[game][key] = /^\d+$/.test(raw) ? Number(raw) : raw;
      mount(main, ctx); main.querySelector(`[data-duel-setting="${b.dataset.duelSetting}"]`)?.focus();
    }));
    main.querySelectorAll('[data-duel-start]').forEach(b => b.addEventListener('click', () => start(b.dataset.duelStart)));
  }

  // ----- Scenen som dekker skjermen under en kamp -----
  function start(game) {
    clear(); rewarded = false; confirm = false; note = '';
    if (!stage) {
      stage = document.createElement('div');
      stage.setAttribute('role', 'dialog'); stage.setAttribute('aria-modal', 'true');
      stage.addEventListener('pointerdown', onPointer); stage.addEventListener('click', onClick);
      stage.addEventListener('contextmenu', e => e.preventDefault());
      document.body.appendChild(stage); document.documentElement.classList.add('duel-open');
    }
    stage.className = `duel-stage duel-${game}`;
    stage.setAttribute('aria-label', GAMES.find(g => g.id === game).title);
    match = game === 'regnekrig' ? D.regnekrig(settings.regnekrig) : game === 'rad' ? D.fireIRad(settings.rad) : D.huskespill(settings.huske);
    if (game === 'regnekrig') { match.countdown = 3; const tick = () => { match.countdown--; draw(); if (match.countdown > 0) later(tick, 700); }; later(tick, 700); }
    draw();
  }
  function clear() { timers.forEach(clearTimeout); timers = []; }
  function close() {
    clear(); stage?.remove(); stage = null; match = null; confirm = false;
    document.documentElement.classList.remove('duel-open');
    ctx.done();
  }
  // Stjernene gis én gang, når spillet er avgjort. Et spill som avsluttes underveis, gir ingen stjerner.
  function finish() { if (rewarded || !match || match.winner === null) return; rewarded = true; ctx.award(D.GAME_STARS); }
  function draw() {
    if (!stage || !match) return;
    stage.innerHTML = (match.game === 'regnekrig' ? drawRegnekrig() : match.game === 'rad' ? drawRad() : drawHuske()) + confirmBox();
  }

  // Ett trykk = én handling. Tastaturbrukere får click med detail 0, som behandles likt.
  function onPointer(e) { const t = e.target.closest('[data-act]'); if (!t || t.disabled) return; e.preventDefault(); act(t); }
  function onClick(e) { const t = e.target.closest('[data-act]'); if (!t || t.disabled || e.detail !== 0) return; act(t); }
  function act(t) {
    const kind = t.dataset.act;
    if (kind === 'exit') { if (match.winner !== null && match.winner !== undefined) close(); else { confirm = true; draw(); } return; }
    if (kind === 'exit-no') { confirm = false; draw(); return; }
    if (kind === 'exit-yes' || kind === 'menu') { close(); return; }
    if (kind === 'again') { start(match.game); return; }
    if (confirm) return;
    if (kind === 'pick') pickRegnekrig(Number(t.dataset.player), Number(t.dataset.value));
    else if (kind === 'roll') { D.radRoll(match); note = ''; draw(); }
    else if (kind === 'cell') { if (D.radPick(match, Number(t.dataset.index))) { finish(); draw(); if (match.winner !== null && match.winner !== 'draw') ctx.celebrate(); } }
    else if (kind === 'pass') { if (D.radPass(match)) draw(); }
    else if (kind === 'card') flipCard(Number(t.dataset.index));
  }

  // ----- Regnekrig -----
  function pickRegnekrig(player, value) {
    const result = D.rkTap(match, player, value, Date.now());
    if (result === 'wrong') { draw(); later(draw, D.LOCK_MS + 30); }
    else if (result === 'win') {
      finish(); draw();
      if (match.winner !== null) ctx.celebrate();
      else later(() => { D.rkNext(match); draw(); }, 1500);
    }
  }
  function regnekrigHalf(p) {
    const m = match, other = 1 - p, t = m.task, locked = Date.now() < m.lockedUntil[p];
    const status = m.winner !== null ? (m.winner === p ? 'Du vant! 🎉' : 'Godt kjempet!')
      : m.countdown > 0 ? 'Gjør deg klar …' : m.roundWinner === p ? 'Du tok kortene! ★' : m.roundWinner === other ? `${N[other]} var først. Svaret er ${t.answer}.`
      : locked ? 'Oi! Vent litt …' : 'Regn ut og trykk på svaret';
    const task = m.countdown > 0 ? `<span class="rk-count">${m.countdown}</span>` : `<span class="rk-card">${t.a}</span><span class="rk-op">${t.symbol}</span><span class="rk-card">${t.b}</span>`;
    const keys = t.options.map(v => {
      const off = m.countdown > 0 || m.roundWinner !== null || m.winner !== null || locked || m.wrong[p].includes(v);
      const cls = m.roundWinner !== null && v === t.answer ? 'right' : m.wrong[p].includes(v) ? 'tried' : '';
      return `<button class="rk-key ${cls}" data-act="pick" data-player="${p}" data-value="${v}" ${off ? 'disabled' : ''}>${v}</button>`;
    }).join('');
    return `<section class="rk-half rk-p${p} ${locked ? 'locked' : ''} ${m.roundWinner === p ? 'won' : ''}" aria-label="${N[p]} side">
      <div class="rk-score"><span class="rk-me">${N[p]} <b>${m.score[p]}</b></span><span class="rk-goal">Først til ${m.target}</span><span class="rk-other">${N[other]} ${m.score[other]}</span></div>
      <div class="rk-task">${task}</div><p class="rk-status">${status}</p><div class="rk-pad">${keys}</div></section>`;
  }
  function drawRegnekrig() {
    const mid = match.winner !== null ? `<div class="rk-mid ended">${starsLine()}${endButtons()}</div>` : `<div class="rk-mid">${exitButton()}${starsLine()}</div>`;
    return regnekrigHalf(1) + mid + regnekrigHalf(0);
  }

  // ----- Fire på rad -----
  function drawRad() {
    const m = match, p = m.turn, names = m.times ? 'pluss, minus eller gange' : 'pluss eller minus';
    const players = `<div class="duel-players">${[0, 1].map(i => `<span class="pl pl${i} ${m.winner === null && p === i ? 'active' : ''}">${N[i]} · ${m.board.filter(c => c.owner === i).length} ruter</span>`).join('')}</div>`;
    const last = m.last ? (m.last.ok ? `${N[m.last.player]} tok ${m.last.value} med ${m.last.text}.` : m.last.pass ? `${N[m.last.player]} fikk ingen rute: ${m.last.results.join(', ')}.` : `${m.last.value} passet ikke. Terningene ga ${m.last.results.join(', ')}.`) : '';
    let side;
    if (m.winner !== null) side = `<p class="duel-result">${m.winner === 'draw' ? 'Uavgjort! Brettet er fullt.' : `${N[m.winner]} fikk fire på rad! 🎉`}</p>${endButtons()}`;
    else if (!m.dice) side = `<p class="turn pl${p}">${N[p]} sin tur</p>${last ? `<p class="duel-note">${last}</p>` : ''}<button class="primary-button roll pl${p}" data-act="roll">🎲 Kast terningene</button>`;
    else side = `<p class="turn pl${p}">${N[p]} sin tur</p><div class="dice">${die(m.dice[0])}${die(m.dice[1])}</div>
      <p class="duel-note">${m.playable ? `Regn ${names}, og trykk på en ledig rute med svaret.` : 'Ingen ledig rute passer denne gangen.'}</p>${m.playable ? '' : '<button class="secondary-button" data-act="pass">Turen går videre</button>'}`;
    const board = `<div class="rad-board" role="grid" aria-label="Brett med fem ganger fem ruter">${m.board.map((c, i) => {
      const off = c.owner !== null || !m.dice || !m.playable || m.winner !== null;
      return `<button class="rad-cell ${c.owner !== null ? `own pl${c.owner}` : ''} ${m.line && m.line.includes(i) ? 'line' : ''}" data-act="cell" data-index="${i}" ${off ? 'disabled' : ''} aria-label="${c.owner !== null ? `${c.value}, tatt av ${N[c.owner]}` : c.value}"><span>${c.value}</span>${c.text ? `<small>${c.text}</small>` : ''}</button>`;
    }).join('')}</div>`;
    return `<div class="duel-top">${exitButton()}${starsLine()}</div><div class="duel-layout"><div class="duel-side">${players}${side}</div>${board}</div>`;
  }

  // ----- Huskespill -----
  function flipCard(index) {
    const result = D.memoryFlip(match, index);
    if (!result) return;
    if (result.flipped !== undefined) { note = ''; draw(); return; }
    finish();
    if (result.match) { note = match.winner !== null ? '' : `${N[result.player]} fant et par og får en tur til.`; draw(); if (match.winner !== null && match.winner !== 'draw') ctx.celebrate(); }
    else { note = `Ikke et par. Nå er det ${N[1 - result.player]} sin tur.`; draw(); later(() => { D.memoryHide(match); draw(); }, 1400); }
  }
  function drawHuske() {
    // Etter et bom vises neste spiller med en gang, selv om kortene snus tilbake litt senere.
    const m = match, p = m.pending ? 1 - m.turn : m.turn;
    const players = `<div class="duel-players">${[0, 1].map(i => `<span class="pl pl${i} ${m.winner === null && p === i ? 'active' : ''}">${N[i]} · ${m.score[i]} par</span>`).join('')}</div>`;
    const side = m.winner !== null ? `<p class="duel-result">${m.winner === 'draw' ? `Uavgjort, ${m.score[0]} par hver!` : `${N[m.winner]} vant med ${m.score[m.winner]} par! 🎉`}</p>${endButtons()}`
      : `<p class="turn pl${p}">${N[p]} sin tur</p><p class="duel-note">${note || MEMORY_GOAL[m.kind]}</p>`;
    const grid = `<div class="mem-grid ${m.cards.length > 12 ? 'mem-16' : ''}">${m.cards.map((c, i) => {
      const up = c.owner !== null || m.open.includes(i), off = up || m.pending || m.winner !== null;
      return `<button class="mem-card ${up ? 'up' : ''} ${c.owner !== null ? `own pl${c.owner}` : ''}" data-act="card" data-index="${i}" ${off ? 'disabled' : ''} aria-label="${up ? esc(c.label) : 'Kort med baksiden opp'}">${up ? `<span>${esc(c.label)}</span>` : '<span aria-hidden="true">✦</span>'}</button>`;
    }).join('')}</div>`;
    return `<div class="duel-top">${exitButton()}${starsLine()}</div><div class="duel-layout"><div class="duel-side">${players}${side}</div>${grid}</div>`;
  }

  // Ingen knipezoom eller dobbelttrykk-zoom mens duellen er åpen (Safari på iPad).
  for (const type of ['gesturestart', 'gesturechange', 'dblclick']) document.addEventListener(type, e => { if (stage) e.preventDefault(); }, { passive: false });

  window.DuelUI = { mount };
})();
