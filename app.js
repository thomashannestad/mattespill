(() => {
  'use strict';
  const G = window.MathGame, KEY = 'enhjorningsdalen-v1';
  let state = G.fresh(), view = 'play', storageAvailable = true, toastTimer;
  const $ = selector => document.querySelector(selector);
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  try { const raw = localStorage.getItem(KEY); if (raw) state = G.restore(JSON.parse(raw)); } catch { storageAvailable = false; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); storageAvailable = true; } catch { storageAvailable = false; } $('#save-note').textContent = storageAvailable ? 'Lagres på denne enheten' : 'Kan ikke lagre fremgangen'; }
  function notify(message) { clearTimeout(toastTimer); $('#toast').textContent = message; $('#toast').hidden = false; toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 3500); }
  function celebrate() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const colors = ['#c5a4df','#f0c364','#9ccaaa','#e7a7b4'];
    $('#confetti').innerHTML = Array.from({length:22}, (_, i) => `<i style="--left:${25 + Math.random()*50}%;--color:${colors[i%4]};--drift:${Math.random()*200-100}px;animation-delay:${Math.random()*.2}s"></i>`).join('');
    setTimeout(() => { $('#confetti').innerHTML = ''; }, 2000);
  }
  function scene() {
    const eq = state.equipped, lvl = G.level(state.earned).index, night = eq.world === 'night', sunset = eq.world === 'sunset';
    const mane = eq.mane === 'mint' ? ['#83bbaa','#c5e9ca','#5c968d'] : eq.mane === 'ocean' ? ['#80b9da','#b5e7e7','#6991c2'] : ['#b29acb','#e4c2dc','#8d7cae'];
    return `<div class="unicorn-scene"><span class="scene-label">${night ? 'Under stjernene' : sunset ? 'En gyllen kveld' : 'Hjemme i blomsterengen'}</span>
    <svg viewBox="0 0 500 430" role="img" aria-label="${escape(state.name)}, enhjørningen din${eq.head ? ', med '+escape(G.ITEMS.find(i=>i.id===eq.head).name) : ''}${eq.back ? ', med vinger' : ''}">
      <defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="${night ? '#303e69' : sunset ? '#f2c6b1' : '#dfede7'}"/><stop offset="1" stop-color="${night ? '#8c91b0' : sunset ? '#f8e5c6' : '#f2f4dd'}"/></linearGradient><linearGradient id="coat" x2=".5" y2="1"><stop stop-color="#fffef8"/><stop offset="1" stop-color="#eee8f1"/></linearGradient><linearGradient id="hair" x2=".8" y2="1"><stop stop-color="${mane[1]}"/><stop offset="1" stop-color="${mane[0]}"/></linearGradient><linearGradient id="horn" x2="1" y2="1"><stop stop-color="#ffe5a2"/><stop offset="1" stop-color="#d0a04d"/></linearGradient></defs>
      <path fill="url(#sky)" d="M0 0h500v430H0z"/>
      ${night ? '<g fill="#fff3c9"><circle cx="90" cy="84" r="2"/><circle cx="148" cy="52" r="2"/><circle cx="394" cy="112" r="2.5"/><circle cx="425" cy="55" r="2"/><path d="M372 66a26 26 0 1 1-27-32 22 22 0 0 0 27 32"/></g>' : '<circle cx="391" cy="90" r="36" fill="#fff9dc" opacity=".9"/><g fill="#fffefa" opacity=".67"><path d="M28 123c-6-18 18-31 29-16 4-29 48-25 47 2 22-10 39 8 30 21H28Z"/><path d="M349 165c-4-12 13-21 22-11 2-20 34-20 36 0 16-8 30 7 25 15h-83Z"/></g>'}
      <path d="M0 247Q90 158 194 231T500 225V430H0" fill="${night ? '#879c9b' : '#c8dbc0'}"/>
      <path d="M0 292Q151 216 282 269T500 263V430H0" fill="${night ? '#6f8c81' : '#b7d1ad'}"/>
      <path d="M0 346Q123 302 264 326T500 306V430H0" fill="${night ? '#9db39b' : '#d2dfb8'}"/>
      <path d="M333 297Q249 341 315 371T268 430H428Q459 365 372 356T375 295" fill="${night ? '#b8bdab' : '#e7e7c9'}" opacity=".8"/>
      <g fill="none" stroke="${night ? '#577765' : '#8aaa83'}" stroke-width="2" stroke-linecap="round"><path d="m53 347-4-13m4 13 7-7m359 39 4-16m-4 16-5-7M102 395l-2-15m2 15 5-9m356-40 2-15"/></g>
      <g fill="#fcf4d6"><circle cx="49" cy="331" r="5"/><circle cx="421" cy="361" r="5"/><circle cx="99" cy="379" r="4"/></g><g fill="#c597b5"><circle cx="63" cy="366" r="4"/><circle cx="436" cy="330" r="5"/><circle cx="462" cy="382" r="4"/></g>
      <ellipse cx="248" cy="337" rx="116" ry="15" fill="#748a70" opacity=".17"/>
      <g id="unicorn-art" stroke="#a997b3" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" transform="translate(${(1-(.94+lvl*.015))*250} ${(1-(.94+lvl*.015))*330}) scale(${.94+lvl*.015})">
        <path d="M161 224c-37-28-64-2-68 23-4 29 13 48-19 56 43 12 71-9 59-37-8-17 5-25 25-16" fill="url(#hair)"/>
        <path d="M123 235c-29 20 15 45-21 57" fill="none" stroke="${mane[2]}" opacity=".6"/>
        <path d="m190 265-8 58q1 10 20 8l18-60m45-1 10 52q2 10 20 4l-2-65" fill="#e0d9e9"/>
        <path d="M155 228c10-38 64-45 105-29l16-44 44 20-11 58c-2 25-18 47-46 49l-89-5c-26-8-32-29-19-49Z" fill="url(#coat)"/>
        <path d="m166 261 2 65q1 9 20 6l13-53m64-11-6 58q2 10 22 5l16-67" fill="url(#coat)"/>
        <path d="m168 316 0 11q1 10 20 5l3-15m69-1-1 10q2 11 22 5l4-14" fill="${eq.feet ? '#e9c261' : '#c4add2'}"/>
        <path d="m183 319-1 5q1 8 20 7l3-11m70-7 2 11q2 7 19 2l-1-11" fill="${eq.feet ? '#cfaa51' : '#b39bbf'}"/>
        ${eq.back ? '<g fill="#f1e5fa" stroke="#b59ac8"><path d="M228 237c-62-7-81-39-82-86 18 7 37 18 48 35-9-29-5-46 6-58 23 24 44 60 28 109Z"/><path d="M226 235q-44-23-66-65m65 64q-8-51-24-90" fill="none"/><path d="M225 235q-29-35-34-56" fill="none"/></g>' : ''}
        <path d="M274 112c-21-10-36 1-44 21-6 15 3 26-3 38-7 12-25 24-20 43 5 17 26 28 49 16-14-10-11-22-2-35 10-14 17-35 7-48" fill="url(#hair)"/>
        <path d="M251 124c-29 22 15 39-15 64-13 12-14 26 0 35" stroke="${mane[2]}" fill="none" opacity=".55"/>
        <path d="M279 112q-21-27-8-47 23 12 28 40" fill="url(#coat)"/><path d="m279 97-4-20 14 24" fill="#e7bfcf" stroke="none"/>
        <path d="m306 112 27-61-5 68" fill="url(#horn)" stroke="#c0a062"/><path d="m319 83 11 5m-17 8 16 5" stroke="#c0a062"/>
        <path d="M257 150c-5-34 16-53 44-48 22 3 24 21 32 30 5 7 27 10 29 27 1 20-24 35-50 26-22-7-20-24-30-22l-6 19" fill="url(#coat)"/>
        <path d="M256 140c-19-17-4-42 20-45 23-4 44 6 46 23-18 7-27-1-31-10-1 18-17 20-26 14Z" fill="url(#hair)"/>
        <path d="M268 102q6 11 20 11" fill="none" stroke="${mane[2]}" opacity=".5"/>
        <ellipse cx="313" cy="139" rx="5.5" ry="8" fill="#4b4356" stroke="none"/><circle cx="315" cy="136" r="1.8" fill="white" stroke="none"/><path d="m310 132-4-3" stroke="#4b4356"/><ellipse cx="309" cy="157" rx="10" ry="6" fill="#eab8c8" stroke="none" opacity=".65"/>
        <path d="m342 169q-8 6-14 0" fill="none" stroke="#a8879d"/><circle cx="348" cy="153" r="2" fill="#a8879d" stroke="none"/>
        ${eq.head === 'bow' ? '<g fill="#d78cab" stroke="#b56e90"><path d="M258 132q-32-25-26 6 3 20 26 2 24 25 28 3 7-26-26-11Z"/><circle cx="258" cy="138" r="6" fill="#edafc9"/></g>' : ''}
        ${eq.head === 'crown' ? '<path d="m263 96-8-27 20 12 10-23 12 21 18-15-3 30Z" fill="#f3d378" stroke="#c29c45"/><circle cx="285" cy="84" r="4" fill="#bf91c7" stroke="none"/>' : ''}
        ${eq.head === 'flowers' ? `<g stroke="#d7a3bb" fill="#efc1d1">${[263,278,293,308].map((x,i)=>`<circle cx="${x}" cy="${103-i*2}" r="9"/><circle cx="${x}" cy="${103-i*2}" r="3" fill="#ffe6a1" stroke="none"/>`).join('')}</g>` : ''}
        ${lvl >= 2 ? '<path d="m220 247 3 7 8 1-6 5 2 8-7-4-7 4 2-8-6-5 8-1Z" fill="#e3c676" stroke="none"/>' : ''}
      </g>
      <g fill="${night ? '#ffe6ac' : '#b29ac4'}" opacity=".8"><path d="m118 156 3 9 9 3-9 3-3 9-3-9-9-3 9-3Z"/><path d="m384 225 3 8 8 3-8 3-3 8-3-8-8-3 8-3Z"/>${lvl>=1?'<path d="m181 83 2 6 6 2-6 2-2 6-2-6-6-2 6-2Z"/>':''}${lvl>=3?'<path d="m376 153 4 11 11 4-11 4-4 11-4-11-11-4 11-4Z"/>':''}</g>
    </svg></div>`;
  }
  function unicornPanel(closet = false) {
    const level = G.level(state.earned), percent = level.next ? (state.earned - level.at)/(level.next.at-level.at)*100 : 100;
    return `<aside class="unicorn-panel" aria-label="Din enhjørning">${scene()}<div class="unicorn-identity"><h2>${escape(state.name)}</h2><span class="level-badge">Nivå ${level.index + 1}</span></div><p class="level-name">${level.name}</p><div class="level-track" role="progressbar" aria-label="Fremgang til neste nivå" aria-valuenow="${Math.round(percent)}" aria-valuemin="0" aria-valuemax="100"><span style="width:${percent}%"></span></div><p class="level-caption">${level.next ? `${level.next.at - state.earned} stjerner til neste nivå` : 'Du er en ekte eventyrmester! ✦'}</p>${closet ? `<form class="name-form" id="name-form"><label for="unicorn-name" class="sr-only">Enhjørningens navn</label><input id="unicorn-name" aria-label="Enhjørningens navn" maxlength="24" value="${escape(state.name)}" required><button type="submit">Lagre navn</button></form><p class="stats-note">${state.answered} oppgaver utforsket<br>${state.earned} stjerner tjent gjennom hele eventyret</p>` : '<button class="shop-link" data-view="closet">✧ Kle på enhjørningen</button>'}</aside>`;
  }
  function chart(q) {
    return `<div class="bar-chart" role="img" aria-label="Søylediagram. ${q.bars.map(b=>`${escape(b.label)}: ${b.value} blomster`).join('. ')}"><div class="chart-ticks" aria-hidden="true">${Array.from({length:11},(_,i)=>`<span style="top:${i*10}%">${10-i}</span>`).join('')}</div>${q.bars.map((b,i)=>`<div class="bar-column" aria-hidden="true"><div class="bar" style="height:${b.value*10}%;--bar-color:${['#dba4ba','#e6c36c','#88b3cb','#ad96c6'][i]}"></div><span class="bar-label">${escape(b.label)}</span></div>`).join('')}</div>`;
  }
  function tenFrame(q, solved = false) {
    const whole = q.model.target - 10, filled = q.model.a - whole;
    const description = solved ? `${filled} blomster fra før, ${10-filled} nye. Nå er alle ti rutene fylt.` : `Et brett med ti ruter. ${filled} ruter er fylt med blomster, resten er tomme.`;
    return `<figure class="ten-model" aria-label="${description}">
      ${whole > 0 ? `<p class="whole-tens">${whole} er allerede på plass.<br>${solved ? 'Nå er den siste tieren også fylt.' : 'Fyll den siste tieren.'}</p>` : ''}
      <div class="ten-frame" aria-hidden="true">${Array.from({length:10},(_,i)=>`<span class="ten-cell ${i<filled?'existing':solved?'added':'empty'}" style="--delay:${Math.max(0,i-filled)*65}ms">${i<filled||solved?'✿':''}</span>`).join('')}</div>
      <figcaption>${solved ? `<span><i class="legend-dot existing"></i> ${filled} fra før</span><span><i class="legend-dot added"></i> ${10-filled} nye</span>` : 'To rader med fem ruter'}</figcaption>
    </figure>`;
  }
  function stepsVisual(q, solved = false) {
    if (!q.steps) return '';
    return `<div class="calculation-steps" aria-label="Regn ett steg om gangen">${q.steps.map((step,i)=>`${i?`<span class="step-jump"><span>${step.jump<0?'−':'+'}${Math.abs(step.jump)}</span><span aria-hidden="true">→</span></span>`:''}<b>${!solved&&i===q.steps.length-1?'?':step.value}</b>`).join('')}</div>`;
  }
  function groupsVisual(q) {
    const { groups, each, operation } = q.model;
    return `<div class="groups-model" role="img" aria-label="${groups} like grupper med ${each} blomster i hver"><span class="groups-caption">${operation === 'multiply' ? 'Like store grupper' : 'Del bærene likt'}</span><div class="groups-row">${Array.from({length:groups},(_,i)=>`<span class="flower-group" aria-label="Gruppe ${i+1}">${Array.from({length:each},()=>'<i aria-hidden="true">✿</i>').join('')}</span>`).join('')}</div></div>`;
  }
  function areaVisual(q) {
    const { width, height } = q.model;
    return `<div class="area-model" role="img" aria-label="Rektangel med ${height} rader og ${width} ruter i hver rad"><div class="area-grid" style="--columns:${width}">${Array.from({length:width*height},()=>'<i aria-hidden="true"></i>').join('')}</div><span>${width} ruter bortover · ${height} rader</span></div>`;
  }
  function coordinateVisual(q) {
    const { x, y, limit } = q.model;
    return `<div class="coordinate-model" role="img" aria-label="Rutenett med enhjørningen på et punkt"><div class="coordinate-plane"><div class="coordinate-y-numbers" style="height:${limit*32}px">${Array.from({length:limit},(_,i)=>`<span>${limit-i}</span>`).join('')}</div><div class="coordinate-grid" style="--grid-size:${limit}">${Array.from({length:limit*limit},(_,i)=>`<i class="${i % limit === x-1 && Math.floor(i/limit) === limit-y ? 'marked':''}" aria-hidden="true">${i % limit === x-1 && Math.floor(i/limit) === limit-y ? '🦄':''}</i>`).join('')}</div></div><div class="coordinate-numbers" style="width:${limit*32}px">${Array.from({length:limit},(_,i)=>`<span>${i+1}</span>`).join('')}</div><span class="axis-caption">x · bortover &nbsp;&nbsp; y · oppover</span></div>`;
  }
  function compareVisual(q, solved = false) {
    const expr = item => `${item.a} ${item.op} ${item.b}`;
    return `<div class="compare-model"><span>${escape(expr(q.model.left))}${solved?` = ${q.model.left.value}`:''}</span><b aria-hidden="true">og</b><span>${escape(expr(q.model.right))}${solved?` = ${q.model.right.value}`:''}</span></div>`;
  }
  function learningVisual(q, solved = false) {
    if (q.kind === 'tenFrame') return tenFrame(q,solved);
    if (q.kind === 'groups') return groupsVisual(q);
    if (q.kind === 'area') return areaVisual(q);
    if (q.kind === 'coordinate') return coordinateVisual(q);
    if (q.kind === 'compare') return compareVisual(q,solved);
    return stepsVisual(q,solved);
  }
  function questionCard() {
    const q = state.current, answered = q.selected !== undefined, correct = q.selected === q.answer;
    const showModel = !answered && ((q.showSupport || q.hintOpen) && (q.kind === 'tenFrame' || q.steps) || ['groups','area','coordinate','compare'].includes(q.kind));
    return `<section class="question-card ${q.type === 'chart' ? 'chart-card' : ''} ${q.kind==='tenFrame'?'ten-card':''}" aria-label="Matteoppgave">
      <div class="round-header"><span>Oppgave ${Math.min(state.round.done+(answered?0:1),8)} av 8</span><strong>${G.TOPICS[q.type]}</strong></div>
      <div class="round-dots" aria-hidden="true">${Array.from({length:8},(_,i)=>`<span class="${i<state.round.done?'done':i===state.round.done?'current':''}"></span>`).join('')}</div>
      <div class="question-content"><h2 id="question-title" tabindex="-1">${escape(q.title)}</h2>
      ${q.kind==='chart'?chart(q)+`<p class="chart-question">${escape(q.prompt)}</p>`:q.kind==='compare'?`<p class="chart-question">${escape(q.prompt)}</p>${compareVisual(q)}`:`<p class="equation ${q.kind==='place'?'place':q.kind==='tenFrame'||q.kind==='equation'?'missing-number':q.prompt.includes(',')?'sequence':''}">${escape(q.prompt)}${q.type==='plus'||q.type==='minus'?' = ?':''}</p>`}
      ${showModel&&q.kind!=='compare'?learningVisual(q):''}</div>
      <p class="answer-instruction">${answered?'Riktig svar er markert med ✓':'Trykk på svaret du tror er riktig'}</p>
      <div class="answers">${q.options.map((value,i)=>`<button class="answer ${answered?value===q.answer?'correct':value===q.selected?'incorrect':'muted':''}" data-answer="${value}" ${answered?'disabled':''} aria-label="${value}${answered&&value===q.answer?', riktig svar':''}"><span class="answer-key" aria-hidden="true">${i+1}</span>${value}${answered&&value===q.answer?'<span class="mark" aria-hidden="true">✓</span>':''}</button>`).join('')}</div>
      ${answered?`<div class="feedback ${correct?'':'try'}" role="status"><div class="feedback-top"><b>${correct?'Det stemmer!':'Takk for at du prøvde!'}</b><span class="point-award">+${correct?3:1} ★</span></div><p>${escape(q.explanation)}</p>${learningVisual(q,true)}<button class="primary-button" id="next-question">${state.round.done===8?'Se hvordan det gikk':'Neste oppgave'} <span aria-hidden="true">→</span></button></div>`:`<div class="help-row"><button class="text-button" id="hint-button" aria-expanded="${q.hintOpen?'true':'false'}" aria-controls="hint">${q.hintOpen?'Skjul hint':'Jeg vil ha et hint'}</button><span>Ingen hast. Du har god tid.</span></div><p class="hint" id="hint" ${q.hintOpen?'':'hidden'}>${escape(q.hint)}</p>`}
    </section>`;
  }
  function summaryCard() {
    return `<section class="question-card summary"><span class="summary-icon" aria-hidden="true">✦</span><h2>For en fin innsats!</h2><p>Du har utforsket 8 oppgaver<br>og hjulpet ${escape(state.name)} å vokse.</p><div class="summary-score">${state.round.earned} <span aria-hidden="true">★</span></div><p>stjerner i denne runden<br>${state.round.correct} av 8 riktige svar</p><div class="summary-buttons"><button class="primary-button" id="new-round">Spill en ny runde</button><button class="shop-link" data-view="closet">Besøk enhjørningsbutikken</button></div></section>`;
  }
  function render() {
    if (!state.current && state.round.done < 8) { state.current = G.nextQuestion(state); save(); }
    $('#balance').textContent = state.balance;
    $('#play-tab').classList.toggle('active',view==='play'); $('#unicorn-tab').classList.toggle('active',view==='closet');
    for (const [selector, active] of [['#play-tab',view==='play'],['#unicorn-tab',view==='closet']]) { if(active) $(selector).setAttribute('aria-current','page'); else $(selector).removeAttribute('aria-current'); }
    const warning = storageAvailable ? '' : '<p class="storage-warning" role="alert">Nettleseren kan ikke lagre nå. Du kan spille, men fremgangen kan forsvinne når siden lukkes. Tillat nettleserlagring for å ta vare på eventyret.</p>';
    if (view === 'play') {
      const nextItem = G.ITEMS.find(i=>!state.owned.includes(i.id));
      $('#main').innerHTML = warning + `<div class="intro"><div><h1>Et lite regnestykke, litt mer magi.</h1><p>Løs oppgaver og samle stjerner til ${escape(state.name)}.</p></div><label class="topic-select">Vi øver på <select id="topic">${Object.entries(G.TOPICS).map(([key,label])=>`<option value="${key}" ${key===state.topic?'selected':''}>${label}</option>`).join('')}</select></label></div><div class="play-grid">${state.round.done===8 && !state.current ? summaryCard() : questionCard()}${unicornPanel()}</div>${nextItem?`<div class="reward-strip"><div class="reward-icon" aria-hidden="true">${nextItem.icon}</div><div><h3>${nextItem.name} til ${escape(state.name)}?</h3><p>${state.balance>=nextItem.price?'Du har nok stjerner! Finn den i butikken.':`Bare ${nextItem.price-state.balance} stjerner til, så kan den bli din.`}</p></div><button class="text-button" data-view="closet">Se butikken</button></div>`:''}`;
    } else {
      $('#main').innerHTML = warning + `<div class="intro"><div><h1>Et eventyr helt på din måte.</h1><p>Velg noe fint til ${escape(state.name)}. Alt du kjøper, får du beholde.</p></div></div><div class="closet-grid">${unicornPanel(true)}<section class="shop-section" aria-labelledby="shop-title"><div class="shop-heading"><h2 id="shop-title">Enhjørningsbutikken</h2><span>Velg utstyr for å ta det på eller av</span></div><div class="items-grid">${G.ITEMS.map(item=>{
        const owned = state.owned.includes(item.id), equipped = state.equipped[item.slot]===item.id, afford = state.balance>=item.price;
        return `<article class="item ${equipped?'equipped':''}"><span class="item-icon" aria-hidden="true">${item.icon}</span><h3>${item.name}</h3><p>${item.description}</p><button data-item="${item.id}" ${!owned&&!afford?'disabled':''} aria-label="${equipped?'Ta av':owned?'Ta på':afford?'Kjøp':'Du mangler stjerner til'} ${item.name}${owned?'':`, ${item.price} stjerner`}">${equipped?'✓ På · ta av':owned?'Ta på':afford?`Kjøp · ${item.price} ★`:`${item.price} ★ · mangler ${item.price-state.balance}`}</button></article>`;
      }).join('')}</div><p class="stats-note">Stjernene du bruker i butikken, teller fortsatt mot neste nivå.</p></section></div>`;
    }
    bind();
  }
  function switchView(nextView) { view = nextView; render(); }
  function respond(value) {
    const previous = G.level(state.earned).index, result = G.answer(state,value); if (!result) return;
    save(); render(); $('#next-question')?.focus({preventScroll:true});
    if (result.correct) { $('#unicorn-art')?.classList.add('unicorn-happy'); celebrate(); }
    if (G.level(state.earned).index>previous) notify(`${state.name} nådde nivå ${G.level(state.earned).index+1}! Magien vokser ✦`);
  }
  function nextQuestion() {
    if (!state.current || state.current.selected === undefined) return;
    state.current = state.round.done < 8 ? G.nextQuestion(state) : null;
    save(); render(); if (state.round.done===8) celebrate();
    $('#question-title')?.focus({preventScroll:true});
  }
  function bind() {
    document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>switchView(b.dataset.view)));
    document.querySelectorAll('[data-answer]').forEach(b=>b.addEventListener('click',()=>respond(Number(b.dataset.answer))));
    $('#next-question')?.addEventListener('click',nextQuestion);
    $('#new-round')?.addEventListener('click',()=>{state.round={done:0,correct:0,earned:0};state.current=null;save();render();$('#question-title')?.focus({preventScroll:true});});
    $('#topic')?.addEventListener('change',e=>{state.topic=e.target.value;if(state.current && state.current.selected===undefined) state.current=G.nextQuestion(state);save();render();});
    $('#hint-button')?.addEventListener('click',()=>{state.current.hintOpen=!state.current.hintOpen;if(state.current.hintOpen)G.useHint(state);save();render();$('#hint-button')?.focus({preventScroll:true});});
    $('#name-form')?.addEventListener('submit',e=>{e.preventDefault();const name=$('#unicorn-name').value.trim().slice(0,24);if(!name){$('#unicorn-name').setCustomValidity('Skriv et navn til enhjørningen.');$('#unicorn-name').reportValidity();return;}state.name=name;save();render();notify(`Enhjørningen din heter nå ${name}.`);});
    $('#unicorn-name')?.addEventListener('input',e=>e.target.setCustomValidity(''));
    document.querySelectorAll('[data-item]').forEach(b=>b.addEventListener('click',()=>{const item=G.ITEMS.find(i=>i.id===b.dataset.item),owned=state.owned.includes(item.id);if(G.buyOrEquip(state,item.id)){save();render();document.querySelector(`[data-item="${item.id}"]`)?.focus({preventScroll:true});notify(!owned?`${item.name} er din! −${item.price} stjerner`:state.equipped[item.slot]===item.id?`${item.name} er tatt på.`:`${item.name} er tatt av.`);if(!owned)celebrate();}}));
  }
  $('#play-tab').addEventListener('click',()=>switchView('play'));
  $('#unicorn-tab').addEventListener('click',()=>switchView('closet'));
  $('#settings-button').addEventListener('click',()=>{$('#difficulty').value=state.difficulty;$('#reset-confirm').hidden=true;$('#settings-dialog').showModal();});
  $('#difficulty').addEventListener('change',e=>{state.difficulty=e.target.value;save();notify('Den nye vanskelighetsgraden gjelder fra neste oppgave.');});
  $('#reset-button').addEventListener('click',()=>{$('#reset-confirm').hidden=false;$('#reset-no').focus();});
  $('#reset-no').addEventListener('click',()=>{$('#reset-confirm').hidden=true;$('#reset-button').focus();});
  $('#reset-yes').addEventListener('click',()=>{state=G.fresh();view='play';save();$('#settings-dialog').close();render();notify('Et nytt eventyr venter på deg og Luna.');});
  document.addEventListener('keydown',e=>{if(e.repeat||e.altKey||e.ctrlKey||e.metaKey||view!=='play'||$('#settings-dialog').open||['INPUT','SELECT','TEXTAREA','BUTTON'].includes(e.target.tagName)) return;if(/^[1-4]$/.test(e.key)&&state.current?.selected===undefined){e.preventDefault();respond(state.current.options[Number(e.key)-1]);}});
  save(); render();
})();
