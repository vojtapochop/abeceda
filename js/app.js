'use strict';
/* Abeceda – výuka písmen pro předškoláky a prvňáky. Bez závislostí, funguje offline. */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const BY_ID = Object.fromEntries(LETTERS.map(l => [l.id, l]));
const rand = a => a[Math.floor(Math.random() * a.length)];
const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const wait = ms => new Promise(r => setTimeout(r, ms));

/* ---------- Stav ---------- */
const KEY = 'abeceda.v1';
const state = Object.assign({ letters: {}, rate: 0.85, breakMin: 15 }, (() => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } })());
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} };
const prog = id => state.letters[id] || (state.letters[id] = { seen: 0, traced: 0, box: 0 });
const starsOf = id => { const p = state.letters[id]; return p ? (p.seen ? 1 : 0) + (p.traced ? 1 : 0) + (p.box >= 3 ? 1 : 0) : 0; };
const starsHTML = n => [0, 1, 2].map(i => `<span class="${i < n ? '' : 'star-off'}">⭐</span>`).join('');

/* ---------- Zvuky (syntetizované, jemné; žádný „bzučák“ za chybu) ---------- */
let ac;
function tone(freq, t0 = 0, dur = 0.35, vol = 0.18) {
  if (!ac) return;
  const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime + t0;
  o.type = 'sine'; o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(ac.destination); o.start(t); o.stop(t + dur + 0.05);
}
const SCALE = [523.25, 587.33, 659.25, 783.99, 880, 1046.5];
const sfx = {
  tap: () => tone(660, 0, 0.08, 0.06),
  step: i => tone(SCALE[i % SCALE.length], 0, 0.3),
  right: () => { tone(659.25); tone(783.99, 0.1); tone(1046.5, 0.2, 0.5); },
  wrong: () => tone(196, 0, 0.22, 0.1),
  win: () => [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.12, 0.45)),
};

/* ---------- Hlas: nahrávky rodiče mají přednost, jinak systémový český hlas ---------- */
let voice = null, speakToken = 0;
function pickVoice() {
  const vs = (window.speechSynthesis ? speechSynthesis.getVoices() : []).filter(v => /^cs/i.test(v.lang));
  voice = vs.find(v => /enhanced|premium|vylep/i.test(v.name)) || vs.find(v => v.localService) || vs[0] || null;
}
if (window.speechSynthesis) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }

function tts(text) {
  return new Promise(res => {
    if (!window.speechSynthesis || !text) return res();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'cs-CZ'; if (voice) u.voice = voice; u.rate = state.rate; u.pitch = 1.1;
    const done = () => { clearTimeout(tm); res(); };
    const tm = setTimeout(done, 1500 + text.length * 130);
    u.onend = done; u.onerror = done;
    speechSynthesis.speak(u);
  });
}

/* IndexedDB s nahrávkami hlásek */
const recURL = {};
const db = new Promise(res => {
  if (!window.indexedDB) return res(null);
  const rq = indexedDB.open('abeceda', 1);
  rq.onupgradeneeded = () => rq.result.createObjectStore('rec');
  rq.onsuccess = () => res(rq.result); rq.onerror = () => res(null);
});
async function idb(mode, fn) {
  const d = await db; if (!d) return null;
  return new Promise(res => { const st = d.transaction('rec', mode).objectStore('rec'); const rq = fn(st); rq.onsuccess = () => res(rq.result); rq.onerror = () => res(null); });
}
async function loadRecs() {
  const keys = await idb('readonly', s => s.getAllKeys()) || [];
  for (const k of keys) { const b = await idb('readonly', s => s.get(k)); if (b) recURL[k] = URL.createObjectURL(b); }
}
function playRec(id) {
  return new Promise(res => {
    const a = new Audio(recURL[id]); const done = () => { clearTimeout(tm); res(); };
    const tm = setTimeout(done, 4000); a.onended = done; a.onerror = done; a.play().catch(done);
  });
}

/* say(['Kde je', {letter:'M'}, '?']) – části se přehrají po sobě; nové volání přeruší staré. */
async function say(parts) {
  const my = ++speakToken;
  if (window.speechSynthesis) speechSynthesis.cancel();
  await wait(60);
  if (!Array.isArray(parts)) parts = [parts];
  // sousední texty spojíme, ať věta zní plynule
  const merged = [];
  for (const p of parts) {
    const item = typeof p === 'string' ? p : (recURL[p.letter] ? p : p.letter.toLowerCase());
    if (typeof item === 'string' && typeof merged[merged.length - 1] === 'string') merged[merged.length - 1] += ' ' + item; else merged.push(item);
  }
  for (const m of merged) {
    if (my !== speakToken) return;
    if (typeof m === 'string') await tts(m); else await playRec(m.letter);
  }
}

/* ---------- Vykreslení ---------- */
const kind = id => VOWELS.has(id) ? 'vowel' : 'cons';
function glyph(id) {
  const L = BY_ID[id], w = L.w || 100;
  return `<svg class="glyph ${kind(id)}" viewBox="-12 -42 ${w + 24} 162" aria-label="${id}">${L.strokes.map(d => `<path d="${d}"/>`).join('')}</svg>`;
}
const picHTML = L => L.svg || L.emoji;
function wordHTML(L) {
  const w = L.word, i = w.toLowerCase().indexOf(L.id.toLowerCase());
  if (i < 0) return w;
  return `${w.slice(0, i)}<b class="${kind(L.id) === 'cons' ? 'c' : ''}">${w.slice(i, i + L.id.length)}</b>${w.slice(i + L.id.length)}`;
}
const linkWord = L => (L.inside ? 've slově ' : 'jako ') + L.word;

let current = 'start', cancelScreen = 0;
function show(name) {
  cancelScreen++; speakToken++;
  if (window.speechSynthesis) speechSynthesis.cancel();
  $$('.screen').forEach(s => s.hidden = s.id !== 's-' + name);
  current = name;
}
function confetti() {
  const c = $('#confetti');
  for (let i = 0; i < 18; i++) {
    const e = document.createElement('span'); e.className = 'conf'; e.textContent = rand(['⭐', '✨', '🌟']);
    e.style.left = Math.random() * 100 + '%'; e.style.animationDelay = Math.random() * 0.5 + 's';
    c.appendChild(e); setTimeout(() => e.remove(), 2600);
  }
}
function celebrate(pic, text, stars) {
  return new Promise(res => {
    $('#cele-pic').innerHTML = pic; $('#cele-text').textContent = text; $('#cele-stars').innerHTML = stars || '';
    $('#celebrate').hidden = false; confetti(); sfx.win();
    $('#cele-ok').onclick = () => { $('#celebrate').hidden = true; res(); };
  });
}

/* ---------- Domů ---------- */
const sessionStart = Date.now(); let breakShown = 0;
function nextLetter() { return LETTERS.find(l => starsOf(l.id) < 2); }
function home(greet) {
  show('home');
  const nx = nextLetter();
  $('#groups').innerHTML = GROUPS.map(g => `<div class="group"><h3>${g.name}</h3><div class="group-row">${g.ids.map(id => {
    const L = BY_ID[id], p = state.letters[id];
    return `<button class="ltile ${nx && nx.id === id ? 'next' : ''}" data-id="${id}"><span class="badge ${p && p.traced ? '' : 'locked'}">${picHTML(L)}</span>${glyph(id)}<span class="mini-stars">${starsHTML(starsOf(id))}</span></button>`;
  }).join('')}</div></div>`).join('');
  const msg = greet || (nx ? `Zkusíme písmeno ${nx.id}?` : 'Znáš celou abecedu!');
  $('#home-bubble').textContent = msg;
  if (state.breakMin && Date.now() - sessionStart > state.breakMin * 60000 * (breakShown + 1)) {
    breakShown++; $('#break').hidden = false; say('Dnes ti to šlo! Oči si teď potřebují odpočinout.');
  }
}
$('#groups').addEventListener('click', e => { const t = e.target.closest('.ltile'); if (t) { sfx.tap(); openLetter(t.dataset.id); } });
$('#break-more').onclick = () => { $('#break').hidden = true; };
$('#owl-home').onclick = () => { const o = $('#owl-home'); o.classList.remove('hop'); void o.offsetWidth; o.classList.add('hop'); say($('#home-bubble').textContent); };
document.addEventListener('click', e => { const b = e.target.closest('[data-nav]'); if (b) { sfx.tap(); home(); } });

/* ---------- Karta písmena: vidím – slyším – spojím se slovem ---------- */
let cur = null;
function openLetter(id) {
  cur = BY_ID[id]; show('letter');
  $('#letter-glyph').innerHTML = glyph(id);
  $('#letter-small').textContent = `${id.length > 1 ? 'Ch' : id} ${id.toLowerCase()}`;
  $('#letter-pic').innerHTML = picHTML(cur);
  $('#letter-word').innerHTML = wordHTML(cur);
  $('#letter-stars').innerHTML = starsHTML(starsOf(id));
  if (!prog(id).seen) { prog(id).seen = 1; save(); }
  say([{ letter: id }, linkWord(cur)]);
}
const popEl = el => { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); };
$('#letter-card').onclick = () => { popEl($('#letter-card')); say([{ letter: cur.id }]); };
$('#pic-card').onclick = () => { popEl($('#pic-card')); say(cur.word); };
$('#btn-trace').onclick = () => { sfx.tap(); startTrace(cur.id); };

/* ---------- Psaní: obtahování po tazích se správným pořadím a směrem ---------- */
const SVGNS = 'http://www.w3.org/2000/svg';
const mk = (tag, attrs = {}, parent) => { const e = document.createElementNS(SVGNS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };
const TOL = 17, WIN = 12, STEP = 1.5, ROUNDS = 3;
const T = { svg: $('#trace-svg'), strokes: [], si: 0, idx: 0, drag: false, busy: false, round: 0, L: null };

function startTrace(id) {
  T.L = BY_ID[id]; T.round = 0; show('trace');
  setupRound(true);
}
function setupRound(first) {
  const L = T.L, w = L.w || 100, svg = T.svg, my = cancelScreen;
  svg.innerHTML = ''; svg.setAttribute('viewBox', `-30 -50 ${w + 60} 175`);
  svg.classList.toggle('faint', T.round === 2);
  svg.classList.add(kind(L.id)); svg.classList.remove(kind(L.id) === 'vowel' ? 'cons' : 'vowel');
  mk('path', { d: `M-30 0 H${w + 30}`, class: 't-line' }, svg);
  mk('path', { d: `M-30 100 H${w + 30}`, class: 't-line base' }, svg);
  L.strokes.forEach(d => mk('path', { d, class: 't-ghost' }, svg));
  T.strokes = L.strokes.map(d => {
    const guide = mk('path', { d, class: 't-guide' + (T.round === 0 ? '' : ' t-hide') }, svg);
    const len = guide.getTotalLength(), pts = [];
    for (let s = 0; s < len; s += STEP) pts.push(guide.getPointAtLength(s));
    pts.push(guide.getPointAtLength(len));
    return { d, len, pts };
  });
  T.strokes.forEach(s => { s.ink = mk('path', { d: s.d, class: 't-ink t-hide', stroke: 'currentColor' }, svg); });
  T.starts = T.strokes.map((s, i) => {
    const g = mk('g', { class: T.round === 2 ? 't-hide' : '' }, svg);
    mk('circle', { cx: s.pts[0].x, cy: s.pts[0].y, r: 6.5, class: 't-start' }, g);
    mk('text', { x: s.pts[0].x, y: s.pts[0].y, class: 't-num' }, g).textContent = i + 1;
    return g;
  });
  T.handle = mk('circle', { r: 9, class: 't-handle' }, svg);
  T.si = 0; T.idx = 0; T.drag = false; placeHandle();
  $('#trace-rounds').innerHTML = Array.from({ length: ROUNDS }, (_, i) => `<span class="dot ${i < T.round ? 'on' : i === T.round ? 'cur' : ''}"></span>`).join('');
  if (first) { say(['Dívej se. Takhle se píše', { letter: L.id }]); demo().then(() => { if (my === cancelScreen) say('Teď ty. Chyť zelenou kuličku a jeď po cestě.'); }); }
}
function setInk(s, idx) {
  s.ink.classList.toggle('t-hide', idx <= 0);
  s.ink.setAttribute('stroke-dasharray', `${Math.min(s.len, idx * STEP)} ${s.len + 30}`);
}
function placeHandle() {
  const s = T.strokes[T.si]; if (!s) { T.handle.classList.add('t-hide'); return; }
  const p = s.pts[T.idx]; T.handle.setAttribute('cx', p.x); T.handle.setAttribute('cy', p.y);
  T.handle.classList.remove('t-hide');
  T.starts.forEach((g, i) => g.classList.toggle('t-hide', T.round === 2 || i <= T.si && (i < T.si || T.idx > 0)));
}
async function demo() {
  const my = cancelScreen; T.busy = true;
  T.strokes.forEach(s => setInk(s, 0)); T.si = 0; T.idx = 0;
  await wait(500);
  for (let i = 0; i < T.strokes.length; i++) {
    const s = T.strokes[i]; T.si = i;
    for (let k = 0; k < s.pts.length; k++) {
      if (my !== cancelScreen) return;
      T.idx = k; setInk(s, k); placeHandle();
      await new Promise(r => requestAnimationFrame(r));
    }
    await wait(250);
  }
  await wait(500);
  if (my !== cancelScreen) return;
  T.strokes.forEach(s => setInk(s, 0)); T.si = 0; T.idx = 0; placeHandle(); T.busy = false;
}
$('#btn-demo').onclick = () => { if (!T.busy) { sfx.tap(); demo(); } };

function svgPoint(e) {
  const m = T.svg.getScreenCTM(); if (!m) return { x: 0, y: 0 };
  const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse()); return p;
}
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
T.svg.addEventListener('pointerdown', e => {
  if (T.busy || !T.strokes[T.si]) return;
  e.preventDefault();
  const p = svgPoint(e), s = T.strokes[T.si];
  if (dist(p, s.pts[T.idx]) < TOL * 1.4) { T.drag = true; try { T.svg.setPointerCapture(e.pointerId); } catch {} }
  else { T.handle.classList.remove('nudge'); void T.handle.getBBox(); T.handle.classList.add('nudge'); }
});
T.svg.addEventListener('pointermove', e => {
  if (!T.drag || T.busy) return;
  e.preventDefault();
  const p = svgPoint(e), s = T.strokes[T.si];
  let best = -1, near = Infinity;
  for (let j = T.idx; j <= Math.min(T.idx + WIN, s.pts.length - 1); j++) { const d = dist(p, s.pts[j]); if (d < near) near = d; if (d < TOL) best = j; }
  if (best > T.idx) { T.idx = best; setInk(s, T.idx); placeHandle(); }
  if (near > TOL * 2.2) T.drag = false;       // prst utekl z cesty – stačí znovu chytit kuličku, nic se nemaže
  if (T.idx >= s.pts.length - 1) strokeDone();
});
const endDrag = () => { T.drag = false; };
T.svg.addEventListener('pointerup', endDrag); T.svg.addEventListener('pointercancel', endDrag);

async function strokeDone() {
  const my = cancelScreen;
  T.drag = false; sfx.step(T.si); T.si++; T.idx = 0; placeHandle();
  if (T.si < T.strokes.length) return;
  T.busy = true; T.round++;
  $$('#trace-rounds .dot').forEach((d, i) => d.className = 'dot ' + (i < T.round ? 'on' : ''));
  if (T.round < ROUNDS) {
    sfx.right(); await say(rand(PRAISE)); await wait(300);
    if (my !== cancelScreen) return;
    T.busy = false; setupRound(false);
    say(T.round === 1 ? 'A ještě jednou.' : 'A teď skoro bez nápovědy.');
  } else {
    const id = T.L.id; prog(id).traced++; save();
    say([rand(PRAISE), 'Umíš napsat', { letter: id }]);
    await celebrate(picHTML(T.L), `Umíš napsat ${id}!`, starsHTML(starsOf(id)));
    T.busy = false; home();
  }
}

/* ---------- Hry: Najdi písmeno / Na co začíná? ---------- */
const Q = { mode: 'find', list: [], i: 0, target: null, firstTry: true, lock: false };
const QN = 8;
function pool() {
  const seen = LETTERS.filter(l => state.letters[l.id] && state.letters[l.id].seen);
  return seen.length >= 3 ? seen : LETTERS.slice(0, Math.max(5, seen.length));
}
function startQuiz(mode) {
  let p = pool(); if (mode === 'first') p = p.filter(l => !l.noFirst);
  // slabší písmena (nižší „krabička“) se ptají častěji – jednoduché rozložené opakování
  const bag = p.flatMap(l => Array(6 - Math.min(5, prog(l.id).box)).fill(l));
  Q.list = []; let last = null;
  while (Q.list.length < QN) { const l = rand(bag); if (l !== last || p.length === 1) { Q.list.push(l); last = l; } }
  Q.mode = mode; Q.i = 0; show('quiz'); ask();
}
function ask() {
  const L = Q.target = Q.list[Q.i]; Q.firstTry = true; Q.lock = false;
  const n = prog(L.id).box >= 2 ? 4 : 3;
  const all = pool().filter(l => l.id !== L.id);
  let cands = [];
  if (prog(L.id).box >= 2) cands = (SIMILAR[L.id] || []).map(id => BY_ID[id]).filter(Boolean);
  const others = shuffle(all.length >= n - 1 ? all : LETTERS.filter(l => l.id !== L.id));
  const opts = [L]; for (const c of [...shuffle(cands).slice(0, 2), ...others]) { if (opts.length >= n) break; if (!opts.includes(c)) opts.push(c); }
  $('#quiz-dots').innerHTML = Q.list.map((_, i) => `<span class="dot ${i < Q.i ? 'on' : i === Q.i ? 'cur' : ''}"></span>`).join('');
  $('#quiz-prompt').innerHTML = Q.mode === 'find' ? '<button class="speaker" id="q-speak">🔊</button>' : `<button class="pic" id="q-speak">${picHTML(L)}</button>`;
  $('#q-speak').onclick = prompt;
  $('#quiz-tiles').innerHTML = shuffle(opts).map(o => `<button class="tile" data-id="${o.id}">${glyph(o.id)}</button>`).join('');
  prompt();
}
function prompt() {
  const L = Q.target;
  if (Q.mode === 'find') say(['Kde je', { letter: L.id }, recURL[L.id] ? '' : `${linkWord(L)}?`].filter(Boolean));
  else say(`Na co začíná ${L.word}?`);
}
$('#btn-repeat').onclick = prompt;
$('#quiz-tiles').addEventListener('click', async e => {
  const t = e.target.closest('.tile'); if (!t || Q.lock) return;
  const L = Q.target, p = prog(L.id), my = cancelScreen;
  if (t.dataset.id !== L.id) {
    t.classList.add('wrong'); sfx.wrong();
    if (Q.firstTry) { p.box = Math.max(0, p.box - 1); save(); }
    Q.firstTry = false; say(rand(RETRY)).then(() => { if (my === cancelScreen && !Q.lock) prompt(); });
    return;
  }
  Q.lock = true; t.classList.add('right'); sfx.right();
  if (Q.firstTry) { p.box = Math.min(5, p.box + 1); save(); }
  await say([rand(PRAISE), { letter: L.id }, linkWord(L)]);
  await wait(250);
  if (my !== cancelScreen) return;
  if (++Q.i < QN) ask();
  else { await celebrate('🏆', 'Hotovo! Skvělá práce!'); home(); }
});
$('#btn-find').onclick = () => { sfx.tap(); startQuiz('find'); };
$('#btn-first').onclick = () => { sfx.tap(); startQuiz('first'); };

/* ---------- Rodiče (vstup podržením 1,5 s, aby se sem dítě nedostalo omylem) ---------- */
(() => {
  const b = $('#btn-parent'); let tm;
  const stop = () => { clearTimeout(tm); b.classList.remove('holding'); };
  b.addEventListener('pointerdown', () => { b.classList.add('holding'); tm = setTimeout(() => { stop(); parent(); }, 1500); });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => b.addEventListener(ev, stop));
  b.addEventListener('click', () => { if (current === 'home') $('#home-bubble').textContent = 'Rodiče: tlačítko chvíli podržte.'; });
  b.addEventListener('contextmenu', e => e.preventDefault());
})();
function parent() {
  show('parent');
  $('#voice-info').textContent = voice ? `Používá se český hlas „${voice.name}“. Kvalitnější hlas lze stáhnout v Nastavení → Zpřístupnění → Předčítání obsahu → Hlasy → Čeština.`
    : 'Český hlas nebyl nalezen. Na iPadu ho stáhnete v Nastavení → Zpřístupnění → Předčítání obsahu → Hlasy → Čeština. Do té doby pomohou vlastní nahrávky níže.';
  $('#rate').value = state.rate; $('#break-min').value = String(state.breakMin);
  renderRecs();
  const done = LETTERS.filter(l => starsOf(l.id) === 3).length, seen = LETTERS.filter(l => starsOf(l.id) > 0).length;
  const weak = LETTERS.filter(l => state.letters[l.id] && state.letters[l.id].seen && state.letters[l.id].box < 2).map(l => l.id);
  $('#progress-info').textContent = `Rozpracováno ${seen} z ${LETTERS.length} písmen, plně zvládnuto ${done}.` + (weak.length ? ` Ještě procvičit: ${weak.join(', ')}.` : '');
}
function renderRecs() {
  $('#rec-grid').innerHTML = LETTERS.map(l => `<button class="rec ${recURL[l.id] ? 'has' : ''}" data-id="${l.id}">${l.id}</button>`).join('');
}
$('#rate').oninput = e => { state.rate = +e.target.value; save(); };
$('#break-min').onchange = e => { state.breakMin = +e.target.value; save(); };
$('#btn-voice-test').onclick = () => say('Ahoj! M jako motýl. Kde je písmeno S?');
$('#btn-reset').onclick = () => { if (confirm('Opravdu vymazat celý postup?')) { state.letters = {}; save(); parent(); } };
$('#btn-rec-clear').onclick = async () => {
  if (!confirm('Smazat všechny nahrávky?')) return;
  await idb('readwrite', s => s.clear()); for (const k in recURL) { URL.revokeObjectURL(recURL[k]); delete recURL[k]; } renderRecs();
};
let recording = false;
$('#rec-grid').addEventListener('click', async e => {
  const b = e.target.closest('.rec'); if (!b || recording) return;
  const id = b.dataset.id;
  if (!navigator.mediaDevices || !window.MediaRecorder) { alert('Nahrávání tento prohlížeč nepodporuje.'); return; }
  let stream;
  try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
  catch { alert('Nepodařilo se získat přístup k mikrofonu. Povolte ho prosím v nastavení.'); return; }
  recording = true;
  const mr = new MediaRecorder(stream), chunks = [];
  mr.ondataavailable = ev => { if (ev.data.size) chunks.push(ev.data); };
  mr.onstop = async () => {
    stream.getTracks().forEach(t => t.stop()); recording = false;
    const blob = new Blob(chunks, { type: mr.mimeType || 'audio/mp4' });
    if (blob.size) {
      await idb('readwrite', s => s.put(blob, id));
      if (recURL[id]) URL.revokeObjectURL(recURL[id]);
      recURL[id] = URL.createObjectURL(blob);
    }
    renderRecs(); if (blob.size) playRec(id);
  };
  await wait(250);                 // krátká prodleva, ať se nenahraje klepnutí
  b.classList.add('live'); mr.start();
  setTimeout(() => mr.state !== 'inactive' && mr.stop(), 2000);
});

/* ---------- Start ---------- */
$('#btn-start').onclick = () => {
  try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); ac.resume(); } catch {}
  pickVoice(); sfx.right();
  home('Ahoj! Vyber si písmeno.');
  say('Ahoj! Vyber si písmeno.');
};
document.addEventListener('visibilitychange', () => { if (!document.hidden && ac && ac.state !== 'running') ac.resume().catch(() => {}); });
document.addEventListener('gesturestart', e => e.preventDefault());
document.addEventListener('contextmenu', e => { if (current !== 'parent') e.preventDefault(); });
loadRecs();
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
show('start');
