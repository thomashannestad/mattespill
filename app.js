(() => {
  'use strict';
  const G = window.MathGame, KEY = 'enhjorningsdalen-v1';
  let state = G.fresh(), view = 'play', storageAvailable = true, toastTimer, preview = null;
  const shopOpenGroups = new Set(['mane']);
  let shopFilter = 'all';
  const $ = selector => document.querySelector(selector);
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  try { const raw = localStorage.getItem(KEY); if (raw) state = G.restore(JSON.parse(raw)); } catch { storageAvailable = false; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); storageAvailable = true; } catch { storageAvailable = false; } $('#save-note').textContent = storageAvailable ? 'Lagres på denne enheten' : 'Kan ikke lagre fremgangen'; }
  // Ruller bare så mye som trengs for at elementet blir synlig, og ikke i det hele tatt hvis det allerede er det.
  const reveal = element => element?.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  function notify(message) { clearTimeout(toastTimer); $('#toast').textContent = message; $('#toast').hidden = false; toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 3500); }
  function celebrate() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const colors = ['#c5a4df','#f0c364','#9ccaaa','#e7a7b4'];
    $('#confetti').innerHTML = Array.from({length:22}, (_, i) => `<i style="--left:${25 + Math.random()*50}%;--color:${colors[i%4]};--drift:${Math.random()*200-100}px;animation-delay:${Math.random()*.2}s"></i>`).join('');
    setTimeout(() => { $('#confetti').innerHTML = ''; }, 2000);
  }
  // Utstyret som vises: det enhjørningen har på, pluss en ting som prøves i butikken.
  function shown() { const item = preview && G.ITEMS.find(i => i.id === preview); return item ? { ...state.equipped, [item.slot]: item.id } : state.equipped; }
  // Egen tegning med kort horn, store øyne og runde føllproporsjoner.
  // Samme tegning brukes i butikkortet og i engen, uten utstyr fra den voksne.
  function foalArt(id) {
    const colors = {
      cloverFoal: ['#fffaf0', '#e6dfd8', '#bfe1bf', '#75aa90', '#93b6a2'],
      peachFoal: ['#fce7e3', '#e8ced0', '#ffe3a3', '#dcad69', '#caa2b1'],
      moonFoal: ['#eff0fc', '#d2d6ea', '#b8dcee', '#859acb', '#a5a6c9']
    }[id];
    if (!colors) return '';
    const [coat, shade, hair, hairLine, hoof] = colors;
    return `<g class="foal-art" data-foal="${id}" stroke="#a997b3" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M130 95c25-17 35 3 27 20-5 10-3 18 7 20-25 7-30-10-23-22 4-7-2-10-10-7" fill="${hair}"/>
      <path d="m86 125-2 34q0 7 12 5l7-37m19-3 7 35q1 6 12 2l-4-40" fill="${shade}"/>
      <path d="M67 78c-13 18-13 39-2 51 14 15 60 15 74-1 11-15 3-37-17-40l-31-1-6-17Z" fill="${coat}"/>
      <path d="m70 122-3 43q0 6 13 4l9-38m26-3 1 36q1 6 14 3l4-43" fill="${coat}"/>
      <path d="m68 159-1 6q0 7 13 4l2-9m34-2v6q1 7 14 3l1-8" fill="${hoof}"/>
      <path d="M75 43c20 0 24 13 18 27-6 14 7 22 0 31-5 7-15 7-21 2 10-11-1-14 0-27" fill="${hair}"/>
      <path d="M68 40Q57 14 70 10q17 10 16 29" fill="${coat}"/><path d="m72 22 5 14" stroke="#deb5c8" stroke-width="4"/>
      <path d="m40 39-5-28 19 23" fill="#ffe5a2" stroke="#c6a667"/>
      <path d="M79 40C65 22 40 27 32 45c-4 8-9 10-16 13-18 9-11 30 8 33 12 3 25-1 32-10l13 13c11-12 17-33 10-54Z" fill="${coat}"/>
      <path d="M79 39c-8-18-36-17-43-1 7 9 20 6 25-1-2 12 10 19 19 13" fill="${hair}"/>
      <path d="M46 33q8 6 16 0m18 29q-5 10 3 19" fill="none" stroke="${hairLine}"/>
      <ellipse cx="39" cy="57" rx="6" ry="8.5" fill="#4b4356" stroke="none"/><circle cx="37" cy="54" r="2.3" fill="white" stroke="none"/>
      <ellipse cx="47" cy="74" rx="9" ry="5" fill="#e9afc4" opacity=".65" stroke="none"/>
      <circle cx="15" cy="70" r="2" fill="#a8879d" stroke="none"/><path d="M16 81q7 4 12-1" fill="none" stroke="#a8879d"/>
      ${id === 'moonFoal' ? '<path d="m115 103 3 7 8 1-6 5 2 8-7-4-7 4 2-8-6-5 8-1Z" fill="#f0d381" stroke="none"/>' : ''}
    </g>`;
  }
  function scene() {
    const eq = shown(), lvl = G.level(state.earned).index, world = eq.world || 'meadow', night = ['night','auroraSky','moonGarden'].includes(world), sunset = world === 'sunset', aurora = world === 'auroraSky', moonGarden = world === 'moonGarden';
    const mane = ({ mint: ['#83bbaa','#c5e9ca','#5c968d'], ocean: ['#80b9da','#b5e7e7','#6991c2'], rose: ['#d985a8','#f2c2d1','#a8557d'], peach: ['#ebaa83','#f8d3a4','#c87970'], auroraMane: ['#53a99d','#c3a3db','#536caa'], lavenderMane: ['#aa8ac6','#e7c4e7','#745a9c'], sunGoldMane: ['#e8ad47','#ffe5a2','#bb763b'], forestMane: ['#529676','#acd69b','#356c59'] })[eq.mane] || ['#b29acb','#e4c2dc','#8d7cae'];
    const sceneName = aurora ? 'Nordlys over dalen' : moonGarden ? 'Månehagen' : night ? 'Under stjernene' : sunset ? 'En gyllen kveld' : 'Hjemme i blomsterengen';
    const hoofColors = eq.feet === 'heartHooves' ? ['#e998b6','#c8769a'] : eq.feet === 'moonHooves' ? ['#d5d8eb','#a5a9c4'] : ['#e9c261','#cfaa51'];
    // Fjærvinger som vifter ut fra ryggen, slik som ikonet i butikken. Regnbuevingene har én fjær per regnbuefarge, rødt øverst.
    const feather = (angle, length, width, fill, stroke) => `<g transform="translate(206 222) rotate(${angle})"><path d="M0 0C${length*.3} ${-width} ${length*.82} ${-width} ${length} 0 ${length*.82} ${width} ${length*.3} ${width} 0 0Z" fill="${fill}" stroke="${stroke}" stroke-width="1.6"/><path d="M4 0H${length*.86}" stroke="${stroke}" stroke-width="1.1" opacity=".55" fill="none"/></g>`;
    const wings = () => {
      const rainbow = eq.back === 'rainbowWings';
      const colors = rainbow ? [['#e8605e','#b94643'],['#f39a4f','#c47433'],['#f4cf4e','#c9a531'],['#6fbf7f','#4b9459'],['#5fa6dc','#3f7fb3'],['#9d7ad3','#7556a8']] : Array(6).fill(['#f4ecfb','#b59ac8']);
      const long = [[262,150],[248,154],[234,148],[220,136],[206,120],[192,104]].map(([a,l],i) => feather(a, l, 14, colors[i][0], colors[i][1]));
      const short = [[256,74],[240,78],[224,72],[208,64]].map(([a,l]) => feather(a, l, 15, rainbow ? '#fffdf8' : '#fdfaff', rainbow ? '#d9c9a6' : '#c9b6d9'));
      return `<g class="wings">${long.reverse().join('')}${short.reverse().join('')}</g>`;
    };
    const itemName = id => G.ITEMS.find(item => item.id === id)?.name;
    return `<div class="unicorn-scene"><span class="scene-label">${sceneName}</span>
    <svg viewBox="0 0 500 430" role="img" aria-label="${escape(state.name)}, enhjørningen din${eq.head ? ', med '+escape(itemName(eq.head)) : ''}${eq.mane ? ', med '+escape(itemName(eq.mane)) : ''}${eq.feet ? ', med '+escape(itemName(eq.feet)) : ''}${eq.neck ? ', med '+escape(itemName(eq.neck)) : ''}${eq.back ? ', med '+escape(itemName(eq.back)) : ''}${eq.world ? ', i '+escape(itemName(eq.world)) : ''}${eq.foal ? ', sammen med føllet '+escape(itemName(eq.foal)) : ''}">
      <defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="${aurora ? '#283f64' : moonGarden ? '#343552' : night ? '#303e69' : sunset ? '#f2c6b1' : '#dfede7'}"/><stop offset="1" stop-color="${aurora ? '#547b85' : moonGarden ? '#77718f' : night ? '#8c91b0' : sunset ? '#f8e5c6' : '#f2f4dd'}"/></linearGradient><linearGradient id="coat" x2=".5" y2="1"><stop stop-color="#fffef8"/><stop offset="1" stop-color="#eee8f1"/></linearGradient><linearGradient id="hair" x2=".8" y2="1"><stop stop-color="${mane[1]}"/><stop offset="1" stop-color="${mane[0]}"/></linearGradient><linearGradient id="horn" x2="1" y2="1"><stop stop-color="${eq.head === 'pearl' ? '#ffffff' : '#ffe5a2'}"/><stop offset="1" stop-color="${eq.head === 'pearl' ? '#a9c8db' : '#d0a04d'}"/></linearGradient></defs>
      <path fill="url(#sky)" d="M0 0h500v430H0z"/>
      ${aurora ? '<path d="M0 118Q105 30 206 99T500 70v69Q390 103 277 150T0 173Z" fill="#a4e7bf" opacity=".33"/><path d="M0 146Q121 65 231 126T500 99v49Q370 132 256 175T0 198Z" fill="#c1a6e8" opacity=".32"/>' : ''}
      ${night ? '<g fill="#fff3c9"><circle cx="90" cy="84" r="2"/><circle cx="148" cy="52" r="2"/><circle cx="394" cy="112" r="2.5"/><circle cx="425" cy="55" r="2"/><path d="M372 66a26 26 0 1 1-27-32 22 22 0 0 0 27 32"/></g>' : '<circle cx="391" cy="90" r="36" fill="#fff9dc" opacity=".9"/><g fill="#fffefa" opacity=".67"><path d="M28 123c-6-18 18-31 29-16 4-29 48-25 47 2 22-10 39 8 30 21H28Z"/><path d="M349 165c-4-12 13-21 22-11 2-20 34-20 36 0 16-8 30 7 25 15h-83Z"/></g>'}
      <path d="M0 247Q90 158 194 231T500 225V430H0" fill="${night ? '#879c9b' : '#c8dbc0'}"/>
      <path d="M0 292Q151 216 282 269T500 263V430H0" fill="${night ? '#6f8c81' : '#b7d1ad'}"/>
      <path d="M0 346Q123 302 264 326T500 306V430H0" fill="${night ? '#9db39b' : '#d2dfb8'}"/>
      <path d="M333 297Q249 341 315 371T268 430H428Q459 365 372 356T375 295" fill="${night ? '#b8bdab' : '#e7e7c9'}" opacity=".8"/>
      <g fill="none" stroke="${night ? '#577765' : '#8aaa83'}" stroke-width="2" stroke-linecap="round"><path d="m53 347-4-13m4 13 7-7m359 39 4-16m-4 16-5-7M102 395l-2-15m2 15 5-9m356-40 2-15"/></g>
      <g fill="#fcf4d6"><circle cx="49" cy="331" r="5"/><circle cx="421" cy="361" r="5"/><circle cx="99" cy="379" r="4"/></g><g fill="#c597b5"><circle cx="63" cy="366" r="4"/><circle cx="436" cy="330" r="5"/><circle cx="462" cy="382" r="4"/></g>
      <ellipse cx="248" cy="337" rx="116" ry="15" fill="#748a70" opacity=".17"/>
      <g id="unicorn-art"><g stroke="#a997b3" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" transform="translate(${(1-(.94+lvl*.015))*250} ${(1-(.94+lvl*.015))*330}) scale(${.94+lvl*.015})">
        <path d="M161 224c-37-28-64-2-68 23-4 29 13 48-19 56 43 12 71-9 59-37-8-17 5-25 25-16" fill="url(#hair)"/>
        <path d="M123 235c-29 20 15 45-21 57" fill="none" stroke="${mane[2]}" opacity=".6"/>
        <path d="m190 265-8 58q1 10 20 8l18-60m45-1 10 52q2 10 20 4l-2-65" fill="#e0d9e9"/>
        <path d="m183 319-1 5q1 8 20 7l3-11m70-7 2 11q2 7 19 2l-1-11" fill="${eq.feet ? hoofColors[1] : '#b39bbf'}"/>
        <path d="M155 228c10-38 64-45 105-29l16-44 44 20-11 58c-2 25-18 47-46 49l-89-5c-26-8-32-29-19-49Z" fill="url(#coat)"/>
        <path d="m166 261 2 65q1 9 20 6l13-53m64-11-6 58q2 10 22 5l16-67" fill="url(#coat)"/>
        <path d="m168 316 0 11q1 10 20 5l3-15m69-1-1 10q2 11 22 5l4-14" fill="${eq.feet ? hoofColors[0] : '#c4add2'}"/>
        ${eq.back ? wings() : ''}
        ${eq.neck === 'scarf' ? '<g class="neck-accessory"><path d="M254 180Q282 199 315 187l-3 13q-32 12-59-7Z" fill="#a384bd" stroke="#806499"/><path d="m287 202-2 25 9-5 8 6-3-27" fill="#8f70ae" stroke="#806499"/><path d="m290 203 2 14" fill="none" stroke="#b99bd0"/></g>' : ''}
        ${eq.neck === 'bell' ? '<g class="neck-accessory"><path d="M254 183Q284 208 315 189" fill="none" stroke="#d8a94c" stroke-width="4"/><circle cx="291" cy="200" r="3" fill="none" stroke="#c29c45" stroke-width="2"/><path d="M291 203q8 0 8 9l2 4h-20l2-4q0-9 8-9Z" fill="#f3d378" stroke="#c29c45" stroke-width="2"/><circle cx="291" cy="218" r="2.5" fill="#9d7842" stroke="none"/><path d="m288 207-2 5" stroke="#fff1bf" stroke-width="2"/></g>' : ''}
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
        ${eq.head === 'pearl' ? '<path d="m265 119 17-4" stroke="#b6c8d7" stroke-width="4"/><circle cx="274" cy="116" r="7" fill="#edf5fc" stroke="#b6c8d7"/><circle cx="272" cy="113" r="2.5" fill="#fff" stroke="none"/>' : ''}
        ${eq.head === 'starclip' ? '<path d="m244 164 4 9 10 1-7 7 2 10-9-5-9 5 2-10-7-7 10-1Z" fill="#f1cd69" stroke="#c69d45"/><circle cx="244" cy="180" r="3" fill="#fff4c6" stroke="none"/>' : ''}
        ${lvl >= 2 ? '<path d="m220 247 3 7 8 1-6 5 2 8-7-4-7 4 2-8-6-5 8-1Z" fill="#e3c676" stroke="none"/>' : ''}
      </g></g>
      ${eq.foal ? `<ellipse cx="403" cy="361" rx="56" ry="9" fill="#748a70" opacity=".17"/><g transform="translate(324 224) scale(.8)">${foalArt(eq.foal)}</g>` : ''}
      <g fill="${night ? '#ffe6ac' : '#b29ac4'}" opacity=".8"><path d="m118 156 3 9 9 3-9 3-3 9-3-9-9-3 9-3Z"/><path d="m384 225 3 8 8 3-8 3-3 8-3-8-8-3 8-3Z"/>${lvl>=1?'<path d="m181 83 2 6 6 2-6 2-2 6-2-6-6-2 6-2Z"/>':''}${lvl>=3?'<path d="m376 153 4 11 11 4-11 4-4 11-4-11-11-4 11-4Z"/>':''}</g>
    </svg></div>`;
  }
  function previewBar() {
    const item = preview && G.ITEMS.find(i => i.id === preview); if (!item) return '';
    const afford = state.balance >= item.price;
    return `<div class="preview-bar" role="status"><p><span aria-hidden="true">${item.icon}</span> ${item.slot === 'foal' ? 'Du møter' : 'Du prøver'} <b>${escape(item.name)}</b></p><div class="preview-actions"><button class="primary-button" data-buy="${item.id}" ${afford?'':'disabled'}>${afford?`Kjøp · ${item.price} ★`:`Mangler ${item.price-state.balance} ★`}</button><button class="text-button" data-cancel-preview>${item.slot === 'foal' ? 'Tilbake' : 'Ta av igjen'}</button></div></div>`;
  }
  function unicornPanel(closet = false) {
    const level = G.level(state.earned), percent = level.next ? (state.earned - level.at)/(level.next.at-level.at)*100 : 100;
    return `<aside class="unicorn-panel" aria-label="Din enhjørning">${scene()}<div class="unicorn-identity"><h2>${escape(state.name)}</h2><span class="level-badge">Nivå ${level.index + 1}</span></div><p class="level-name">${level.name}</p><div class="level-track" role="progressbar" aria-label="Fremgang til neste nivå" aria-valuenow="${Math.round(percent)}" aria-valuemin="0" aria-valuemax="100"><span style="width:${percent}%"></span></div><p class="level-caption">${level.next ? `${level.next.at - state.earned} stjerner til neste nivå` : 'Du er en ekte eventyrmester! ✦'}</p>${closet ? previewBar() : ''}${closet ? `<form class="name-form" id="name-form"><label for="unicorn-name" class="sr-only">Enhjørningens navn</label><input id="unicorn-name" aria-label="Enhjørningens navn" maxlength="24" value="${escape(state.name)}" required><button type="button" class="name-dice" id="random-name" aria-label="Trekk et nytt navn" title="Trekk et nytt navn"><span aria-hidden="true">↻</span></button><button type="submit">Lagre navn</button></form><p class="stats-note">${state.answered} oppgaver utforsket<br>${state.earned} stjerner tjent gjennom hele eventyret</p>` : '<button class="shop-link" data-view="closet">✧ Kle på enhjørningen</button>'}</aside>`;
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
  function groupsVisual(q, solved = false) {
    const { groups, each, total, operation } = q.model;
    const flowers = count => Array.from({length:count},()=>'<i aria-hidden="true">✿</i>').join('');
    // Før svaret viser deling bare haugen og tomme kurver, ellers står fasiten i modellen.
    if (operation === 'divide' && !solved) return `<div class="groups-model" role="img" aria-label="${total} bær i én haug og ${groups} tomme kurver"><span class="groups-caption">${total} bær skal deles likt i ${groups} kurver</span><div class="flower-pile">${flowers(total)}</div><div class="groups-row">${Array.from({length:groups},()=>'<span class="flower-group empty" aria-hidden="true"></span>').join('')}</div></div>`;
    return `<div class="groups-model" role="img" aria-label="${groups} like grupper med ${each} ${operation === 'divide' ? 'bær' : 'blomster'} i hver"><span class="groups-caption">${operation === 'multiply' ? 'Like store grupper' : 'Bærene delt likt'}</span><div class="groups-row">${Array.from({length:groups},(_,i)=>`<span class="flower-group" aria-label="Gruppe ${i+1}">${flowers(each)}</span>`).join('')}</div></div>`;
  }
  function areaVisual(q) {
    const { width, height } = q.model;
    return `<div class="area-model" role="img" aria-label="Rektangel med ${height} rader og ${width} ruter i hver rad"><div class="area-grid" style="--columns:${width}">${Array.from({length:width*height},()=>'<i aria-hidden="true"></i>').join('')}</div><span>${width} ruter bortover · ${height} rader</span></div>`;
  }
  function coordinateVisual(q, solved = false) {
    const { limit } = q.model, moving = q.kind === 'gridMove';
    const here = moving ? (solved ? q.model.end : q.model.start) : q.model, from = moving && solved ? q.model.start : null;
    const cell = i => { const x = i % limit + 1, y = limit - Math.floor(i / limit); return x === here.x && y === here.y ? '<i class="marked" aria-hidden="true">🦄</i>' : from && x === from.x && y === from.y ? '<i class="start" aria-hidden="true">✿</i>' : '<i aria-hidden="true"></i>'; };
    const description = `Rutenett. Enhjørningen står på (${here.x}, ${here.y})${from ? `, og startet på (${from.x}, ${from.y})` : ''}`;
    return `<div class="coordinate-model" role="img" aria-label="${description}"><div class="coordinate-plane"><div class="coordinate-y-numbers" style="height:${limit*32}px">${Array.from({length:limit},(_,i)=>`<span>${limit-i}</span>`).join('')}</div><div class="coordinate-grid" style="--grid-size:${limit}">${Array.from({length:limit*limit},(_,i)=>cell(i)).join('')}</div><div class="coordinate-numbers" style="width:${limit*32+2}px">${Array.from({length:limit},(_,i)=>`<span>${i+1}</span>`).join('')}</div></div><span class="axis-caption">x · bortover &nbsp;&nbsp; y · oppover</span></div>`;
  }
  function balanceVisual(q, solved = false) {
    const { form, left, right, unknown } = q.model, sum = side => side.reduce((total, w) => total + w, 0);
    const totals = { left: sum(left) + (unknown === 'left' && solved ? q.answer : 0), right: sum(right) + (unknown === 'right' && solved ? q.answer : 0) };
    // Før svaret holdes vekten rett, ellers ville den røpe svaret. Etter svaret vipper den mot den tyngste siden.
    const tilt = form === 'heavier' && solved ? Math.sign(totals.right - totals.left) * 9 : 0, rad = tilt * Math.PI / 180;
    const end = dir => ({ x: 160 + dir * 105 * Math.cos(rad), y: 42 + dir * 105 * Math.sin(rad) });
    const pan = (side, dir) => {
      const e = end(dir), x = e.x, y = e.y + 46, items = [...side.map(String), ...(unknown === (dir < 0 ? 'left' : 'right') ? [solved ? String(q.answer) : '?'] : [])];
      const startX = x - (items.length * 30 - 4) / 2;
      return `<path d="M${e.x} ${e.y}L${x - 56} ${y}M${e.x} ${e.y}L${x + 56} ${y}" stroke="#8d7cae" stroke-width="1.5" fill="none"/><path d="M${x - 60} ${y}h120l-10 16h-100Z" fill="#d8dfd1" stroke="#70947b" stroke-width="1.5"/>${items.map((label, i) => { const wx = startX + i * 30, box = label === '?'; return `<rect x="${wx}" y="${y - 28}" width="26" height="26" rx="5" fill="${box ? '#fffdfa' : '#f3d378'}" stroke="${box ? '#b9c4b0' : '#c29c45'}" stroke-width="1.5"${box ? ' stroke-dasharray="3 2"' : ''}/><text x="${wx + 13}" y="${y - 10}" text-anchor="middle" font-size="12" font-weight="700" fill="${box ? '#886ba4' : '#6b5218'}">${label}</text>`; }).join('')}`;
    };
    const l = end(-1), r = end(1), describe = side => side.join(' og ');
    const caption = form === 'heavier' ? (solved ? (tilt === 0 ? 'Vekten står i likevekt.' : `${tilt > 0 ? 'Høyre' : 'Venstre'} side går ned.`) : 'Vekten holdes rett til du har svart.') : (solved ? `${totals.left} på hver side.` : 'Vekten er i likevekt.');
    return `<figure class="balance-model" aria-label="Skålvekt. Venstre skål: ${describe(left)}${unknown === 'left' ? ' og et ukjent lodd' : ''}. Høyre skål: ${describe(right)}${unknown === 'right' ? ' og et ukjent lodd' : ''}. ${caption}"><svg viewBox="0 0 320 190" aria-hidden="true"><path d="M160 42L138 178h44Z" fill="#c8dbc0" stroke="#8aaa83" stroke-width="1.5"/><rect x="108" y="176" width="104" height="7" rx="3" fill="#8aaa83"/><line x1="${l.x}" y1="${l.y}" x2="${r.x}" y2="${r.y}" stroke="#8d7cae" stroke-width="8" stroke-linecap="round"/><circle cx="160" cy="42" r="6" fill="#fffdfa" stroke="#8d7cae" stroke-width="2"/>${pan(left, -1)}${pan(right, 1)}</svg><figcaption>${caption}</figcaption></figure>`;
  }
  function compareVisual(q) {
    const expr = x => x.op ? `${x.a} ${x.op} ${x.b}` : `${x.a}`, { left, right } = q.model;
    const spoken = q.options.find(o => o.value === q.answer)?.spoken || q.answer, relation = q.answer === '=' ? 'er lik' : `er ${spoken}`;
    return `<div class="compare-model" role="img" aria-label="${escape(expr(left))} ${escape(relation)} ${escape(expr(right))}"><span>${escape(expr(left))}${left.op?` = ${left.value}`:''}</span><b class="compare-sign" aria-hidden="true">${escape(q.answer)}</b><span>${escape(expr(right))}${right.op?` = ${right.value}`:''}</span></div>`;
  }
  function learningVisual(q, solved = false) {
    if (q.kind === 'tenFrame') return tenFrame(q,solved);
    if (q.kind === 'groups') return groupsVisual(q,solved);
    if (q.kind === 'area') return areaVisual(q);
    if (q.kind === 'coordinate' || q.kind === 'gridMove') return coordinateVisual(q,solved);
    if (q.kind === 'balance') return balanceVisual(q,solved);
    if (q.kind === 'compare') return compareVisual(q);
    return stepsVisual(q,solved);
  }
  function questionCard() {
    const q = state.current, answered = q.selected !== undefined, correct = q.selected === q.answer;
    const showModel = !answered && ((q.showSupport || q.hintOpen) && (q.kind === 'tenFrame' || q.steps) || ['groups','area','coordinate','gridMove','balance'].includes(q.kind));
    return `<section class="question-card ${q.type === 'chart' ? 'chart-card' : ''} ${q.kind==='tenFrame'?'ten-card':''}" aria-label="Matteoppgave">
      <div class="round-header"><span>Oppgave ${Math.min(state.round.done+(answered?0:1),8)} av 8</span><strong>${G.TOPICS[q.type]}</strong></div>
      <div class="round-dots" aria-hidden="true">${Array.from({length:8},(_,i)=>`<span class="${i<state.round.done?'done':i===state.round.done?'current':''}"></span>`).join('')}</div>
      <div class="question-content"><h2 id="question-title" tabindex="-1">${escape(q.title)}</h2>
      ${q.kind==='chart'?chart(q)+`<p class="chart-question">${escape(q.prompt)}</p>`:['groups','doubleHalf','area','coordinate','gridMove','balance'].includes(q.kind)?`<p class="question-text">${escape(q.prompt)}</p>`:`<p class="equation ${q.kind==='place'?'place':['tenFrame','equation','compare'].includes(q.kind)?'missing-number':q.kind==='sequence'?'sequence':''}">${escape(q.prompt)}${q.type==='plus'||q.type==='minus'?' = ?':''}</p>`}
      ${showModel?learningVisual(q):''}</div>
      <p class="answer-instruction">${answered?'Riktig svar er markert med ✓':'Trykk på svaret du tror er riktig'}</p>
      <div class="answers ${q.options.length===3?'count-3':''}">${q.options.map((o,i)=>`<button class="answer ${answered?o.value===q.answer?'correct':o.value===q.selected?'incorrect':'muted':''} ${/^\d+$/.test(o.label)?'':o.label.length<=2?'symbol':'text'}" data-option="${i}" ${answered?'disabled':''} aria-label="${escape(o.spoken||o.label)}${answered&&o.value===q.answer?', riktig svar':''}"><span class="answer-key" aria-hidden="true">${i+1}</span>${escape(o.label)}${answered&&o.value===q.answer?'<span class="mark" aria-hidden="true">✓</span>':''}</button>`).join('')}</div>
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
      $('#main').innerHTML = warning + `<h1 class="sr-only">Spill og lær</h1><div class="play-toolbar"><label class="topic-select">Vi øver på <select id="topic">${Object.entries(G.TOPICS).map(([key,label])=>`<option value="${key}" ${key===state.topic?'selected':''}>${label}</option>`).join('')}</select></label></div><div class="play-grid">${state.round.done===8 && !state.current ? summaryCard() : questionCard()}${unicornPanel()}</div>${nextItem?`<div class="reward-strip"><div class="reward-icon" aria-hidden="true">${nextItem.icon}</div><div><h3>${nextItem.name} til ${escape(state.name)}?</h3><p>${state.balance>=nextItem.price?'Du har nok stjerner! Finn den i butikken.':`Bare ${nextItem.price-state.balance} stjerner til, så kan den bli din.`}</p></div><button class="text-button" data-view="closet">Se butikken</button></div>`:''}`;
    } else {
      const slotLabels = { head: 'Pynt', mane: 'Manefarger', feet: 'Hover', neck: 'Rundt halsen', back: 'Vinger', world: 'Eventyrsteder', foal: 'Enhjørningsføll' };
      const slotOrder = ['mane','head','feet','neck','back','world','foal'];
      const itemCard = item => {
        const isFoal = item.slot === 'foal';
        const owned = state.owned.includes(item.id), equipped = state.equipped[item.slot]===item.id, trying = preview===item.id, afford = state.balance>=item.price;
        const button = owned ? `<button data-item="${item.id}" aria-label="${isFoal ? equipped ? 'La føllet hvile:' : 'Velg føllet' : equipped ? 'Ta av' : 'Ta på'} ${item.name}">${isFoal ? equipped ? '✓ Med · la hvile' : 'Bli med' : equipped ? '✓ På · ta av' : 'Ta på'}</button>`
          : trying ? `<button data-buy="${item.id}" ${afford?'':'disabled'} aria-label="${afford?`Kjøp ${item.name}, ${item.price} stjerner`:`Du mangler ${item.price-state.balance} stjerner til ${item.name}`}">${afford?`Kjøp · ${item.price} ★`:`Mangler ${item.price-state.balance} ★`}</button>`
          : `<button data-try="${item.id}" aria-label="${isFoal ? 'Møt' : 'Prøv'} ${item.name}, koster ${item.price} stjerner">${isFoal ? 'Møt' : 'Prøv'} · ${item.price} ★</button>`;
        return `<article class="item ${equipped?'equipped':''} ${trying?'trying':''}"><span class="item-icon ${isFoal ? 'foal-icon' : ''}" aria-hidden="true">${isFoal ? `<svg viewBox="0 0 180 180" focusable="false">${foalArt(item.id)}</svg>` : item.icon}</span><h3>${item.name}</h3><p>${item.description}</p>${button}</article>`;
      };
      // «Mine ting» viser bare det som er kjøpt, med alle grupper åpne, så det går raskt å kle om.
      const mine = shopFilter === 'mine' && state.owned.length > 0;
      const groups = slotOrder.map(slot => {
        const all = G.ITEMS.filter(item=>item.slot===slot).sort((a,b)=>a.price-b.price), ownedCount = all.filter(item=>state.owned.includes(item.id)).length;
        const items = mine ? all.filter(item=>state.owned.includes(item.id)) : all;
        if (!items.length) return '';
        return `<details class="shop-group" data-shop-group="${slot}" ${mine||shopOpenGroups.has(slot)?'open':''}><summary><span class="shop-group-name">${slotLabels[slot]}</span><span class="shop-group-count">${mine?`${items.length} ting`:`${items.length} valg`}</span><span class="shop-group-owned">${ownedCount} kjøpt</span><span class="shop-group-chevron" aria-hidden="true">⌄</span></summary>${slot === 'foal' ? '<p class="shop-group-note">En liten venn å spare til. Ett føll kan være med i engen om gangen. Du beholder alle føllene du kjøper, og kan bytte når du vil.</p>' : ''}<div class="items-grid">${items.map(itemCard).join('')}</div></details>`;
      }).join('');
      $('#main').innerHTML = warning + `<h1 class="sr-only">Min enhjørning</h1><div class="closet-grid">${unicornPanel(true)}<section class="shop-section" aria-labelledby="shop-title"><div class="shop-heading"><h2 id="shop-title">${mine?'Mine ting':'Enhjørningsbutikken'}</h2><span>${mine?`${state.owned.length} av ${G.ITEMS.length} skatter`:`${G.ITEMS.length} skatter i ${slotOrder.length} grupper`}</span></div><div class="shop-filter" role="group" aria-label="Vis"><button data-filter="all" aria-pressed="${!mine}">Hele butikken</button><button data-filter="mine" aria-pressed="${mine}" ${state.owned.length?'':'disabled'}>Mine ting · ${state.owned.length}</button>${mine&&Object.keys(state.equipped).some(slot=>slot!=='foal')?'<button class="text-button" id="undress">Ta av alt</button>':''}</div>${groups}<p class="stats-note">Stjernene du bruker i butikken, teller fortsatt mot neste nivå.</p></section></div>`;
    }
    bind();
  }
  function switchView(nextView) { view = nextView; preview = null; render(); }
  function focusAfterRender(selector) { document.querySelector(selector)?.focus({preventScroll:true}); }
  // Stjernene i toppmenyen spretter og viser +3 når de øker, så barnet ser poengene selv om oppgaven er i fokus.
  function bumpWallet(points) {
    const wallet = $('.wallet'); wallet.classList.remove('bump'); void wallet.offsetWidth; wallet.classList.add('bump');
    wallet.querySelector('.award')?.remove(); wallet.insertAdjacentHTML('beforeend', `<span class="award" aria-hidden="true">+${points}</span>`);
    setTimeout(() => wallet.querySelector('.award')?.remove(), 1300);
  }
  function respond(value) {
    const previous = G.level(state.earned).index, result = G.answer(state,value); if (!result) return;
    save(); render(); reveal($('#next-question')); $('#next-question')?.focus({preventScroll:true}); bumpWallet(result.points);
    if (result.correct) { $('#unicorn-art')?.classList.add('unicorn-happy'); celebrate(); }
    if (G.level(state.earned).index>previous) notify(`${state.name} nådde nivå ${G.level(state.earned).index+1}! Magien vokser ✦`);
  }
  function nextQuestion() {
    if (!state.current || state.current.selected === undefined) return;
    state.current = state.round.done < 8 ? G.nextQuestion(state) : null;
    save(); render(); if (state.round.done===8) celebrate();
    reveal($('.round-header') || $('.summary')); $('#question-title')?.focus({preventScroll:true});
  }
  function bind() {
    document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>switchView(b.dataset.view)));
    document.querySelectorAll('[data-shop-group]').forEach(group=>group.addEventListener('toggle',()=>{if(group.open)shopOpenGroups.add(group.dataset.shopGroup);else shopOpenGroups.delete(group.dataset.shopGroup);}));
    document.querySelectorAll('[data-option]').forEach(b=>b.addEventListener('click',()=>respond(state.current.options[Number(b.dataset.option)].value)));
    $('#next-question')?.addEventListener('click',nextQuestion);
    $('#new-round')?.addEventListener('click',()=>{state.round={done:0,correct:0,earned:0};state.current=null;save();render();reveal($('.round-header'));$('#question-title')?.focus({preventScroll:true});});
    $('#topic')?.addEventListener('change',e=>{state.topic=e.target.value;if(state.current && state.current.selected===undefined) state.current=G.nextQuestion(state);save();render();});
    $('#hint-button')?.addEventListener('click',()=>{state.current.hintOpen=!state.current.hintOpen;if(state.current.hintOpen)G.useHint(state);save();render();$('#hint-button')?.focus({preventScroll:true});});
    $('#name-form')?.addEventListener('submit',e=>{e.preventDefault();const name=$('#unicorn-name').value.trim().slice(0,24);if(!name){$('#unicorn-name').setCustomValidity('Skriv et navn til enhjørningen.');$('#unicorn-name').reportValidity();return;}state.name=name;save();render();notify(`Enhjørningen din heter nå ${name}.`);});
    $('#unicorn-name')?.addEventListener('input',e=>e.target.setCustomValidity(''));
    // Terningen fyller inn et nytt navn. Det lagres først når barnet trykker «Lagre navn».
    $('#random-name')?.addEventListener('click',()=>{const input=$('#unicorn-name');input.value=G.randomName(input.value.trim());input.setCustomValidity('');input.classList.remove('name-new');void input.offsetWidth;input.classList.add('name-new');});
    document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{shopFilter=b.dataset.filter;preview=null;render();focusAfterRender(`[data-filter="${shopFilter}"]`);}));
    $('#undress')?.addEventListener('click',()=>{state.equipped=state.equipped.foal?{foal:state.equipped.foal}:{};save();render();focusAfterRender('[data-filter="mine"]');notify(`${state.name} har tatt av alt utstyret.`);});
    // Kjøpt utstyr tas av og på. Ukjøpt utstyr prøves først, og kjøpes med en egen knapp.
    document.querySelectorAll('[data-item]').forEach(b=>b.addEventListener('click',()=>{const item=G.ITEMS.find(i=>i.id===b.dataset.item);preview=null;if(G.buyOrEquip(state,item.id)){save();render();document.querySelector(`[data-item="${item.id}"]`)?.focus({preventScroll:true});notify(item.slot==='foal' ? state.equipped.foal===item.id ? `${item.name} blir med i engen!` : `${item.name} hviler litt. Du kan hente føllet igjen når du vil.` : state.equipped[item.slot]===item.id?`${item.name} er tatt på.`:`${item.name} er tatt av.`);}}));
    document.querySelectorAll('[data-try]').forEach(b=>b.addEventListener('click',()=>{const item=G.ITEMS.find(i=>i.id===b.dataset.try);preview=item.id;render();document.querySelector(`.item [data-buy="${item.id}"]`)?.focus({preventScroll:true});if(matchMedia('(max-width: 700px)').matches)reveal($('.unicorn-scene'));}));
    document.querySelectorAll('[data-buy]').forEach(b=>b.addEventListener('click',()=>{const item=G.ITEMS.find(i=>i.id===b.dataset.buy);if(!state.owned.includes(item.id)&&G.buyOrEquip(state,item.id)){preview=null;save();render();document.querySelector(`[data-item="${item.id}"]`)?.focus({preventScroll:true});notify(`${item.name} er din! −${item.price} stjerner`);celebrate();}}));
    $('[data-cancel-preview]')?.addEventListener('click',()=>{const id=preview;preview=null;render();document.querySelector(`[data-try="${id}"]`)?.focus({preventScroll:true});});
  }
  $('#play-tab').addEventListener('click',()=>switchView('play'));
  $('#unicorn-tab').addEventListener('click',()=>switchView('closet'));
  $('#settings-button').addEventListener('click',()=>{$('#difficulty').value=state.difficulty;$('#reset-confirm').hidden=true;$('#settings-dialog').showModal();});
  $('#difficulty').addEventListener('change',e=>{state.difficulty=e.target.value;save();notify('Den nye vanskelighetsgraden gjelder fra neste oppgave.');});
  $('#reset-button').addEventListener('click',()=>{$('#reset-confirm').hidden=false;$('#reset-no').focus();});
  $('#reset-no').addEventListener('click',()=>{$('#reset-confirm').hidden=true;$('#reset-button').focus();});
  $('#reset-yes').addEventListener('click',()=>{state=G.fresh();view='play';save();$('#settings-dialog').close();render();notify(`Et nytt eventyr venter på deg og ${state.name}.`);});
  // Tastene 1–4 velger kort etter plassering; tegnene <, = og > velger kortet med samme tegn.
  document.addEventListener('keydown',e=>{if(e.repeat||e.altKey||e.ctrlKey||e.metaKey||view!=='play'||$('#settings-dialog').open||['INPUT','SELECT','TEXTAREA','BUTTON'].includes(e.target.tagName)||!state.current||state.current.selected!==undefined) return;const chosen=/^[1-4]$/.test(e.key)?state.current.options[Number(e.key)-1]:state.current.options.find(o=>o.value===e.key);if(chosen){e.preventDefault();respond(chosen.value);}});
  save(); render();
})();
