/* Ren spillogikk, delt av nettleseren og testene. Ingen nettverk eller avhengigheter. */
(function (root) {
  'use strict';
  const TOPICS = { mixed: 'Litt av alt', ten: 'Tiervenner', nextTen: 'Fylle neste tier', plus: 'Pluss', minus: 'Minus', numbers: 'Tallvenner', doubleHalf: 'Dobling og halvering', equation: 'Åpne regnestykker', multiply: 'Multiplikasjon', divide: 'Deling', compare: 'Sammenligne', area: 'Areal', coordinate: 'Koordinater', chart: 'Diagrammer' };
  // Nivåene er faglige trinn innen én ferdighet, ikke enhjørningens belønningsnivå.
  const SKILLS = { ten: { topic: 'ten', max: 3 }, nextTen: { topic: 'nextTen', max: 4 }, plus: { topic: 'plus', max: 5 }, minus: { topic: 'minus', max: 5 }, sequence: { topic: 'numbers', max: 4 }, place: { topic: 'numbers', max: 4 }, doubleHalf: { topic: 'doubleHalf', max: 4 }, equation: { topic: 'equation', max: 5 }, multiply: { topic: 'multiply', max: 4 }, divide: { topic: 'divide', max: 4 }, compare: { topic: 'compare', max: 4 }, area: { topic: 'area', max: 4 }, coordinate: { topic: 'coordinate', max: 3 }, chart: { topic: 'chart', max: 3 } };
  const profiles = () => Object.fromEntries(Object.keys(SKILLS).map(key => [key, { level: 1, recent: [], history: [], seen: 0, support: false }]));
  const ITEMS = [
    { id: 'bow', slot: 'head', name: 'Sløyfefin', description: 'En rosa sløyfe i manen', price: 9, icon: '🎀' },
    { id: 'mint', slot: 'mane', name: 'Mintmagi', description: 'En man i friske mintfarger', price: 15, icon: '🌿' },
    { id: 'socks', slot: 'feet', name: 'Gullhover', description: 'Litt gull i hvert steg', price: 18, icon: '✨' },
    { id: 'crown', slot: 'head', name: 'Stjernekrone', description: 'En krone for små eventyrere', price: 27, icon: '👑' },
    { id: 'sunset', slot: 'world', name: 'Ferskenhimmel', description: 'En varm solnedgang i dalen', price: 30, icon: '🌅' },
    { id: 'ocean', slot: 'mane', name: 'Havdrøm', description: 'En blå og turkis man', price: 36, icon: '🌊' },
    { id: 'flowers', slot: 'head', name: 'Blomsterkrans', description: 'Blomster fra eventyrengen', price: 42, icon: '🌸' },
    { id: 'wings', slot: 'back', name: 'Drømmevinger', description: 'Vinger til din magiske venn', price: 60, icon: '🪽' },
    { id: 'night', slot: 'world', name: 'Stjernenatt', description: 'En hel himmel av stjerner', price: 75, icon: '🌙' }
  ];
  const LEVELS = [{ at: 0, name: 'Liten drømmer' }, { at: 24, name: 'Engvenn' }, { at: 60, name: 'Stjernevenn' }, { at: 120, name: 'Magisk følgesvenn' }, { at: 210, name: 'Eventyrmester' }];
  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const shuffle = values => { const a = [...values]; for (let i = a.length - 1; i > 0; i--) { const j = rand(0, i); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  function choices(answer, step = 1, max = Infinity) {
    const values = new Set([answer]);
    for (const delta of shuffle([-3, -2, -1, 1, 2, 3])) { if (answer + delta * step >= 0 && answer + delta * step <= max) values.add(answer + delta * step); if (values.size === 4) break; }
    return shuffle([...values]);
  }
  function generate(skill, difficulty) {
    const n = Math.max(1, Math.min(SKILLS[skill].max, difficulty));
    const q = { type: SKILLS[skill].topic, title: '', prompt: '', answer: 0, explanation: '', hint: '', hintUsed: false,
      meta: { skill, level: n, role: 'current', adaptive: false, features: [] } };
    if (skill === 'ten' || skill === 'nextTen') {
      const a = skill === 'ten' ? rand(n === 1 ? 1 : 0, n === 1 ? 9 : 10) : (n === 1 ? 10 : rand(n === 4 ? 10 : 2, n === 4 ? 99 : 9) * 10) + rand(1, 9);
      const target = skill === 'ten' ? 10 : Math.ceil(a / 10) * 10;
      q.answer = target - a; q.kind = 'tenFrame'; q.model = { a, target };
      q.title = skill === 'ten' ? 'Hvor mange mangler for å få 10?' : 'Hvor mange mangler til neste tier?';
      q.prompt = skill === 'ten' && n === 3 ? `□ + ${a} = ${target}` : `${a} + □ = ${target}`;
      q.showSupport = skill === 'ten' ? n === 1 : n <= 2;
      q.hint = 'Hver rad har fem ruter. Tell rutene som er tomme. Hvor mange trengs for å fylle hele brettet?';
      q.explanation = `${a} + ${q.answer} = ${target}. ${q.answer === 0 ? 'Brettet er allerede fullt!' : `Vi legger til ${q.answer} og fyller tieren.`}`;
      q.meta.features = [q.showSupport ? 'ten-frame' : 'optional-ten-frame', skill === 'ten' ? 'complement-to-10' : 'complement-to-next-10'];
    } else if (skill === 'plus' || skill === 'minus') {
      let a, b;
      if (n === 1) { a = rand(2, 9); b = rand(1, skill === 'plus' ? 10 - a : a); }
      else if (n === 2) { a = rand(11, 18); b = rand(1, skill === 'plus' ? 19 - a : a % 10); }
      else if (n === 3) { a = rand(skill === 'plus' ? 2 : 11, skill === 'plus' ? 9 : 18); b = rand(skill === 'plus' ? 11 - a : a % 10 + 1, 9); }
      else if (skill === 'plus') {
        const ones = rand(1, 8); a = rand(1, 5) * 10 + ones;
        b = rand(1, 3) * 10 + rand(n === 4 ? 1 : 10 - ones, n === 4 ? 9 - ones : 9);
      } else { a = rand(4, 9) * 10 + rand(1, 8); b = rand(1, 3) * 10 + rand(n === 4 ? 0 : a % 10 + 1, n === 4 ? a % 10 : 9); }
      const op = skill === 'plus' ? '+' : '−';
      q.answer = skill === 'plus' ? a + b : a - b;
      q.title = skill === 'plus' ? 'Hvor mange blir det til sammen?' : 'Hvor mange er igjen?';
      q.prompt = `${a} ${op} ${b}`; q.model = { a, b, op };
      const crossing = skill === 'plus' ? a % 10 + b % 10 >= 10 : a % 10 < b % 10;
      q.meta.features = [crossing ? 'crosses-ten' : 'no-ten-crossing', a < 20 && b < 10 ? 'small-numbers' : 'two-digit'];
      q.hint = skill === 'plus' ? crossing ? 'Se om du kan fylle en tier først. Legg så til det som er igjen.' : `Start på ${a}. Tell ${b} fremover, gjerne med tiere først og enere etterpå.` : `Start på ${a}. Trekk fra ${b}, ett hopp om gangen. Du kan stoppe ved en hel tier på veien.`;
      q.steps = [{ value: a }];
      if (skill === 'plus' && crossing && b < 10) {
        const toTen = 10 - a % 10;
        q.steps.push({ value: a + toTen, jump: toTen });
        if (b > toTen) q.steps.push({ value: q.answer, jump: b - toTen });
      } else if (skill === 'minus' && crossing && b < 10) {
        q.steps.push({ value: a - a % 10, jump: -(a % 10) }, { value: q.answer, jump: -(b - a % 10) });
      } else {
        const tens = Math.floor(b / 10) * 10, sign = skill === 'plus' ? 1 : -1;
        if (tens) q.steps.push({ value: a + sign * tens, jump: sign * tens });
        if (b % 10) q.steps.push({ value: q.answer, jump: sign * (b % 10) });
      }
      q.explanation = q.steps.length > 2 ? `${q.prompt} = ${q.answer}. Først ${a} ${q.steps[1].jump < 0 ? '−' : '+'} ${Math.abs(q.steps[1].jump)} = ${q.steps[1].value}, så ${q.steps[1].value} ${q.steps[2].jump < 0 ? '−' : '+'} ${Math.abs(q.steps[2].jump)} = ${q.answer}.` : `${q.prompt} = ${q.answer}.`;
    } else if (skill === 'sequence') {
      const step = n <= 2 ? 1 : shuffle(n === 3 ? [2, 5] : [2, 5, 10])[0];
      const start = rand(1, (n === 1 ? 20 : n === 4 ? 100 : 50) - 3 * step);
      q.answer = start + step * 3; q.title = 'Hvilket tall mangler?'; q.kind = 'sequence';
      q.prompt = `${start}, ${start + step}, ${start + step * 2}, ?`;
      q.explanation = `Vi teller ${step} om gangen: ${start}, ${start + step}, ${start + step * 2}, ${q.answer}.`;
      q.hint = 'Se hvor mye tallet øker fra det første til det neste.';
      q.meta.features = [`step-${step}`];
    } else if (skill === 'place') {
      const h = n <= 2 ? 0 : rand(1, 9), t = n === 1 ? 1 : n === 4 ? 0 : rand(1, 9), u = rand(1, 9);
      q.answer = h * 100 + t * 10 + u; q.title = 'Hvilket tall er dette?'; q.kind = 'place';
      q.prompt = `${h ? `${h} hundrere, ` : ''}${t} ${t === 1 ? 'tier' : 'tiere'} og ${u} enere`;
      q.explanation = `${q.prompt} blir ${q.answer}.`;
      q.hint = 'En hundrer er 100, en tier er 10 og en ener er 1.';
      q.meta.features = [n === 4 ? 'zero-tens' : h ? 'hundreds' : 'tens'];
    } else if (skill === 'doubleHalf') {
      const half = n >= 3 && rand(0, n === 3 ? 1 : 2) === 0;
      const number = half ? rand(2, n === 1 ? 10 : n === 2 ? 20 : n === 3 ? 30 : 50) * 2 : rand(1, n === 1 ? 5 : n === 2 ? 10 : n === 3 ? 20 : 50);
      q.answer = half ? number / 2 : number * 2; q.kind = 'doubleHalf'; q.model = { number, operation: half ? 'half' : 'double' };
      q.title = half ? 'Finn halvparten' : 'Doble tallet'; q.prompt = half ? `Hva er halvparten av ${number}?` : `Hva er det dobbelte av ${number}?`;
      q.hint = half ? `Del ${number} i to like store grupper.` : `Legg ${number} sammen med ${number} én gang til.`;
      q.explanation = half ? `Halvparten av ${number} er ${q.answer}, fordi ${q.answer} + ${q.answer} = ${number}.` : `Det dobbelte av ${number} er ${number} + ${number} = ${q.answer}.`;
      q.meta.features = [half ? 'halving' : 'doubling', number < 10 ? 'small-numbers' : 'two-digit'];
    } else if (skill === 'equation') {
      const a = rand(n === 1 ? 1 : 10, n === 1 ? 9 : n === 2 ? 20 : n === 3 ? 50 : 100);
      const b = rand(n === 1 ? 1 : 2, n === 1 ? 9 : n === 2 ? 20 : n === 3 ? 50 : 100);
      const form = rand(0, n === 1 ? 1 : 3);
      if (form === 0) { q.answer = b; q.prompt = `${a} + □ = ${a + b}`; q.model = { a, b, op: '+', target: a + b, missing: 'right' }; }
      else if (form === 1) { q.answer = a; q.prompt = `□ + ${b} = ${a + b}`; q.model = { a, b, op: '+', target: a + b, missing: 'left' }; }
      else if (form === 2) { q.answer = b; q.prompt = `${a + b} − □ = ${a}`; q.model = { a: a + b, b, op: '−', target: a, missing: 'right' }; }
      else { q.answer = a + b; q.prompt = `□ − ${a} = ${b}`; q.model = { a: a + b, b: a, op: '−', target: b, missing: 'left' }; }
      q.kind = 'equation'; q.title = 'Finn tallet som mangler'; q.hint = 'Tenk på hva som må stå i ruten for at begge sider av likhetstegnet skal bli like.';
      q.explanation = `${q.prompt.replace('□', q.answer)}. Begge sider blir like store.`;
      q.meta.features = [q.model.op === '+' ? 'addition' : 'subtraction', q.model.missing === 'left' ? 'unknown-first' : 'unknown-last'];
    } else if (skill === 'multiply' || skill === 'divide') {
      const groups = rand(2, n === 1 ? 3 : n === 2 ? 4 : n === 3 ? 5 : 6), each = rand(2, n === 1 ? 5 : n === 2 ? 6 : n === 3 ? 8 : 10), total = groups * each;
      q.kind = 'groups'; q.model = { groups, each, total, operation: skill };
      if (skill === 'multiply') { q.answer = total; q.title = 'Tell like store grupper'; q.prompt = `${groups} grupper med ${each} i hver. Hvor mange blir det?`; q.hint = `Legg sammen ${each} så mange ganger som det er grupper.`; q.explanation = `${each} + `.repeat(groups - 1) + `${each} = ${total}. Det er ${groups} like grupper.`; }
      else { q.answer = each; q.title = 'Del likt'; q.prompt = `Del ${total} bær likt mellom ${groups} kurver. Hvor mange får hver kurv?`; q.hint = `Del bærene i ${groups} like store grupper.`; q.explanation = `${total} delt i ${groups} like grupper gir ${each} i hver kurv.`; }
      q.meta.features = [skill === 'multiply' ? 'equal-groups' : 'equal-sharing', `groups-${groups}`];
    } else if (skill === 'compare') {
      const ops = n < 3 ? ['+', '−'] : ['+', '−', '×'];
      let left, right;
      for (let attempt = 0; attempt < 20; attempt++) {
        const make = () => { const op = ops[rand(0, ops.length - 1)], a = rand(2, n === 1 ? 9 : n === 2 ? 20 : 50), b = rand(1, n === 1 ? 9 : n === 2 ? 20 : 10); return { a, b, op, value: op === '+' ? a + b : op === '−' ? Math.abs(a - b) : a * b }; };
        left = make(); right = make(); if (left.value !== right.value) break;
      }
      if (left.value === right.value) { right.b += 1; right.value = right.op === '+' ? right.a + right.b : right.op === '−' ? Math.abs(right.a - right.b) : right.a * right.b; }
      q.answer = Math.max(left.value, right.value); q.kind = 'compare'; q.model = { left, right }; q.title = 'Sammenlign regnestykkene'; q.prompt = 'Regn ut begge. Velg uttrykket som blir størst.';
      q.hint = 'Regn ut ett uttrykk om gangen, og sammenlign svarene.';
      q.explanation = `${left.a} ${left.op} ${left.b} = ${left.value}, og ${right.a} ${right.op} ${right.b} = ${right.value}. ${q.answer} er størst.`;
      q.meta.features = [ops.includes('×') ? 'multiplication' : 'addition-subtraction', 'compare-values'];
    } else if (skill === 'area') {
      const width = rand(2, n === 1 ? 3 : n === 2 ? 4 : n === 3 ? 5 : 6), height = rand(2, n === 1 ? 3 : n === 2 ? 4 : n === 3 ? 5 : 6);
      q.answer = width * height; q.kind = 'area'; q.model = { width, height }; q.title = 'Tell rutene'; q.prompt = 'Hvor mange ruter dekker teppet?';
      q.hint = `Tell ${width} ruter i hver rad. Hvor mange rader er det?`; q.explanation = `${width} ruter i hver av ${height} rader gir ${q.answer} ruter.`;
      q.meta.features = ['area-by-unit-squares', `rectangle-${width}x${height}`];
    } else if (skill === 'coordinate') {
      const limit = n === 1 ? 4 : n === 2 ? 5 : 6, x = rand(1, limit), y = rand(1, limit), axis = n === 1 ? 'x' : n === 2 ? 'y' : (rand(0, 1) ? 'x' : 'y');
      q.answer = axis === 'x' ? x : y; q.kind = 'coordinate'; q.model = { x, y, axis, limit }; q.title = 'Finn punktet på rutenettet';
      q.prompt = `Enhjørningen står på punktet. Hvilket tall viser ${axis === 'x' ? 'vannrett retning' : 'loddrett retning'}?`; q.hint = 'Les av fra null langs kanten: først bortover (x), så oppover (y).';
      q.explanation = `Punktet er (${x}, ${y}). ${axis === 'x' ? 'Vannrett' : 'Loddrett'} viser ${q.answer}.`;
      q.meta.features = [`read-${axis}-coordinate`, 'grid-point'];
    } else if (skill === 'chart') {
      q.kind = 'chart'; const labels = ['Rosa', 'Gule', 'Blå', 'Lilla'];
      q.bars = labels.map(label => ({ label, value: rand(1, n === 1 ? 5 : 10) }));
      q.title = 'Blomster i enhjørningsdalen';
      if (n === 3) {
        q.prompt = 'Hvor mange blomster er det til sammen?'; q.answer = q.bars.reduce((sum, b) => sum + b.value, 0);
        q.explanation = `${q.bars.map(b => b.value).join(' + ')} = ${q.answer} blomster.`;
        q.hint = 'Les av høyden på hver søyle, og legg sammen de fire tallene.';
      } else {
        const selected = rand(0, 3);
        q.prompt = `Hvor mange ${labels[selected].toLowerCase()} blomster er det?`; q.answer = q.bars[selected].value;
        q.explanation = `Søylen for ${labels[selected].toLowerCase()} blomster går opp til ${q.answer}.`;
        q.hint = `Finn søylen merket «${labels[selected]}». Følg toppen bort til tallene på venstre side.`;
      }
      q.meta.features = [n === 3 ? 'sum-bars' : 'read-bar'];
    }
    q.options = choices(q.answer, q.kind === 'place' && n > 1 ? 10 : 1, q.kind === 'tenFrame' ? 10 : Infinity);
    return q;
  }
  function skillsFor(topic) { return Object.keys(SKILLS).filter(s => topic === 'mixed' || SKILLS[s].topic === topic); }
  function manualLevel(skill, difficulty) { return difficulty === 'easy' ? 1 : difficulty === 'hard' ? SKILLS[skill].max : Math.min(3, SKILLS[skill].max); }
  function question(topic = 'mixed', difficulty = 'normal') {
    const skill = shuffle(skillsFor(Object.hasOwn(TOPICS, topic) ? topic : 'mixed'))[0];
    return generate(skill, manualLevel(skill, difficulty));
  }
  function nextQuestion(state) {
    const available = skillsFor(state.topic);
    // Blandede runder fordeler øvingen: velg blant ferdighetene med færrest besvarte oppgaver.
    const minSeen = Math.min(...available.map(s => state.mastery[s].seen));
    const skill = shuffle(available.filter(s => state.mastery[s].seen <= minSeen + 1))[0];
    const p = state.mastery[skill], adaptive = state.difficulty === 'auto';
    let target = adaptive ? p.level : manualLevel(skill, state.difficulty), role = 'current';
    if (adaptive && !p.support) {
      const roll = Math.random();
      if (p.level > 1 && roll < .2) { target--; role = 'review'; }
      else if (roll > .9 && p.level < SKILLS[skill].max && p.recent.length >= 5 && p.recent.slice(-5).filter(r => r.correct && !r.hint).length >= 4) { target++; role = 'challenge'; }
    }
    let q;
    for (let i = 0; i < 12; i++) { q = generate(skill, target); if (q.prompt !== state.current?.prompt && !p.history.slice(-3).some(h => h.prompt === q.prompt)) break; }
    q.meta.adaptive = adaptive; q.meta.role = role;
    if (adaptive && p.support) { q.showSupport = true; q.extraSupport = true; }
    return q;
  }
  function useHint(state) { if (!state.current || state.current.selected !== undefined) return; state.current.hintUsed = true; }
  function recordAttempt(state, q, correct) {
    if (!q.meta || !Object.hasOwn(SKILLS, q.meta.skill)) return; // Oppgaver fra versjon 1 beholdes, men er ikke kalibrerte.
    const p = state.mastery[q.meta.skill], result = { correct, hint: Boolean(q.hintUsed || q.extraSupport) };
    p.seen++; p.history.push({ ...result, level: q.meta.level, role: q.meta.role, prompt: q.prompt }); p.history = p.history.slice(-30);
    // Repetisjon, manuell øving og prøveoppgaver styrer ikke det etablerte nivået.
    if (!q.meta.adaptive || q.meta.role !== 'current' || q.meta.level !== p.level) {
      if (q.meta.adaptive && !correct) p.support = true;
      return;
    }
    p.recent.push(result); p.recent = p.recent.slice(-8);
    const twoWrong = p.recent.length >= 2 && p.recent.slice(-2).every(r => !r.correct);
    const threeWrong = p.recent.slice(-5).filter(r => !r.correct).length >= 3;
    if (twoWrong || threeWrong) { p.level = Math.max(1, p.level - 1); p.recent = []; p.support = true; }
    else if (p.recent.length === 8 && p.recent.filter(r => r.correct && !r.hint).length >= 7) {
      p.level = Math.min(SKILLS[q.meta.skill].max, p.level + 1); p.recent = []; p.support = false;
    } else if (p.support && p.recent.length >= 2 && p.recent.slice(-2).every(r => r.correct)) p.support = false;
  }
  function fresh() { return { version: 2, balance: 0, earned: 0, answered: 0, correct: 0, name: 'Luna', owned: [], equipped: {}, difficulty: 'auto', topic: 'mixed', mastery: profiles(), round: { done: 0, correct: 0, earned: 0 }, current: null }; }
  function level(earned) { let index = 0; LEVELS.forEach((l, i) => { if (earned >= l.at) index = i; }); return { ...LEVELS[index], index, next: LEVELS[index + 1] || null }; }
  const integer = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;
  function validQuestion(q) {
    if (!q || q.type === 'mixed' || !Object.hasOwn(TOPICS, q.type) || !['title', 'prompt', 'explanation', 'hint'].every(k => typeof q[k] === 'string') || !integer(q.answer, 0, 1000) || !Array.isArray(q.options) || q.options.length !== 4 || new Set(q.options).size !== 4 || !q.options.includes(q.answer) || !q.options.every(n => integer(n, 0, 1100)) || (q.selected !== undefined && !q.options.includes(q.selected))) return false;
    if (q.type === 'chart' && (!Array.isArray(q.bars) || q.bars.length !== 4 || !q.bars.every(b => typeof b.label === 'string' && integer(b.value, 1, 10)))) return false;
    if (q.type === 'ten' || q.type === 'nextTen' || q.kind === 'tenFrame') {
      if (!q.model || !integer(q.model.a, 0, 999) || !integer(q.model.target, 10, 1000) || q.model.target % 10 !== 0 || q.answer !== q.model.target - q.model.a || !integer(q.answer, 0, 10)) return false;
    }
    if (q.steps && (!Array.isArray(q.steps) || q.steps.length > 4 || !q.steps.every(s => integer(s.value, 0, 1000) && (s.jump === undefined || integer(s.jump, -100, 100))))) return false;
    return true;
  }
  function restore(raw) {
    const state = fresh();
    if (!raw || ![1, 2].includes(raw.version)) return state;
    for (const key of ['balance', 'earned', 'answered', 'correct']) if (Number.isSafeInteger(raw[key]) && raw[key] >= 0) state[key] = raw[key];
    state.balance = Math.min(state.balance, state.earned); state.correct = Math.min(state.correct, state.answered);
    if (typeof raw.name === 'string' && raw.name.trim()) state.name = raw.name.trim().slice(0, 24);
    if (raw.version === 2 && ['auto', 'easy', 'normal', 'hard'].includes(raw.difficulty)) state.difficulty = raw.difficulty;
    if (Object.hasOwn(TOPICS, raw.topic)) state.topic = raw.topic;
    state.owned = [...new Set(Array.isArray(raw.owned) ? raw.owned.filter(id => ITEMS.some(i => i.id === id)) : [])];
    for (const item of ITEMS) if (state.owned.includes(item.id) && raw.equipped?.[item.slot] === item.id) state.equipped[item.slot] = item.id;
    if (raw.round && ['done', 'correct', 'earned'].every(k => Number.isInteger(raw.round[k]) && raw.round[k] >= 0) && raw.round.done <= 8 && raw.round.correct <= raw.round.done && raw.round.earned <= raw.round.done * 3) state.round = { done: raw.round.done, correct: raw.round.correct, earned: raw.round.earned };
    if (raw.version === 2) for (const skill of Object.keys(SKILLS)) {
      const p = raw.mastery?.[skill]; if (!p || !integer(p.level, 1, SKILLS[skill].max)) continue;
      const validResult = r => r && typeof r.correct === 'boolean' && typeof r.hint === 'boolean';
      state.mastery[skill] = { level: p.level, seen: integer(p.seen, 0, Number.MAX_SAFE_INTEGER) ? p.seen : 0, support: p.support === true,
        recent: Array.isArray(p.recent) ? p.recent.filter(validResult).slice(-8).map(r => ({correct:r.correct,hint:r.hint})) : [],
        history: Array.isArray(p.history) ? p.history.filter(r => validResult(r) && integer(r.level, 1, SKILLS[skill].max) && ['current','review','challenge'].includes(r.role) && typeof r.prompt === 'string').slice(-30).map(r => ({correct:r.correct,hint:r.hint,level:r.level,role:r.role,prompt:r.prompt})) : [] };
    }
    if (validQuestion(raw.current)) {
      state.current = { ...raw.current };
      const m = state.current.meta;
      if (raw.version === 1 || !m || !Object.hasOwn(SKILLS, m.skill) || SKILLS[m.skill].topic !== state.current.type || !integer(m.level, 1, SKILLS[m.skill].max) || !['current','review','challenge'].includes(m.role)) delete state.current.meta;
    }
    return state;
  }
  function answer(state, value) {
    const q = state.current;
    if (!q || q.selected !== undefined || !q.options.includes(value) || state.round.done >= 8) return null;
    const correct = value === q.answer, points = correct ? 3 : 1;
    q.selected = value; state.balance += points; state.earned += points; state.answered++; state.correct += Number(correct);
    state.round.done++; state.round.correct += Number(correct); state.round.earned += points;
    recordAttempt(state, q, correct);
    return { correct, points };
  }
  function buyOrEquip(state, id) {
    const item = ITEMS.find(i => i.id === id); if (!item) return false;
    if (!state.owned.includes(id)) { if (state.balance < item.price) return false; state.balance -= item.price; state.owned.push(id); }
    if (state.equipped[item.slot] === id) delete state.equipped[item.slot]; else state.equipped[item.slot] = id;
    return true;
  }
  const api = { TOPICS, SKILLS, ITEMS, LEVELS, question, generate, nextQuestion, useHint, fresh, restore, level, answer, buyOrEquip };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.MathGame = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
