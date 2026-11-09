/* Projeto Shape — aplicativo (telas e interações). */
(function () {
  'use strict';
  const D = ShapeData, L = ShapeLogic, DB = ShapeDB, C = ShapeCharts, F = ShapeFigure;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const live = a => a.filter(r => !r.deleted);
  const gLabel = g => (D.GROUPS[g] ? D.GROUPS[g].label : 'Outro');

  /* ---------- ícones ---------- */
  const ICONS = {
    home: '<path d="M3.5 11.2 12 4l8.5 7.2"/><path d="M5.8 9.8V19a1 1 0 0 0 1 1h10.4a1 1 0 0 0 1-1V9.8"/><path d="M10 20v-5.2h4V20"/>',
    list: '<rect x="5" y="3.5" width="14" height="17" rx="3.2"/><path d="M9 9h6M9 13h6M9 17h3.5"/>',
    chart: '<path d="M4 4.5V19a1 1 0 0 0 1 1h15"/><path d="m8 15 3.2-4.3 3 2.3L19 7"/>',
    pulse: '<path d="M3 12.5h4l2.3-6 4.2 12 2.4-6H21"/>',
    more: '<circle cx="5.5" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="18.5" cy="12" r="1.5" fill="currentColor"/>',
    play: '<path d="M8 5.5v13a.8.8 0 0 0 1.2.7l10-6.5a.8.8 0 0 0 0-1.4l-10-6.5A.8.8 0 0 0 8 5.5Z" fill="currentColor"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    up: '<path d="m6 14 6-6 6 6"/>',
    down: '<path d="m6 10 6 6 6-6"/>',
    edit: '<path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17v3Z"/><path d="m14.5 7.5 3 3"/>',
    swap: '<path d="M4 8h13l-3-3M20 16H7l3 3"/>',
    trash: '<path d="M4.5 7h15M9.5 7V4.8h5V7M6.5 7l.8 12a1 1 0 0 0 1 .9h7.4a1 1 0 0 0 1-.9l.8-12"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    chevR: '<path d="m9 5 7 7-7 7"/>',
    chevL: '<path d="m15 5-7 7 7 7"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    download: '<path d="M12 4v11m0 0-4-4m4 4 4-4M5 19h14"/>',
    upload: '<path d="M12 16V5m0 0-4 4m4-4 4 4M5 19h14"/>',
    share: '<path d="M12 4v11m0-11L8.5 7.5M12 4l3.5 3.5M6 12v6.5a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V12"/>',
    video: '<rect x="3.5" y="6" width="12" height="12" rx="3"/><path d="m15.5 11 5-3v8l-5-3"/>',
    list2: '<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>',
    dumbbell: '<path d="M6.5 8v8M17.5 8v8M3.5 10v4M20.5 10v4M6.5 12h11"/>'
  };
  const ic = (n, cls) => '<svg class="ic ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[n] || '') + '</svg>';

  /* ---------- estado ---------- */
  const DEFAULT_SETTINGS = { name: 'Giovanna', restDefault: 90, autoRest: true, sound: true, vibrate: true };
  const S = {
    plan: null, settings: Object.assign({}, DEFAULT_SETTINGS), meta: null, custom: [], memos: {},
    sessions: [], body: [], cardio: [], active: null, timer: null, persisted: null, dbMode: 'idb',
    route: 'home', ui: { planDay: null, progTab: 'resumo', exKey: null, metric: 'top', bodyMetric: 'weight', openSession: null },
    sheet: null, dlg: null, installEvt: null, pendingImport: null
  };

  /* ---------- persistência ---------- */
  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2800);
  }
  function fail(e) { console.error(e); toast('Não consegui salvar. Faça um backup assim que possível.'); }
  const stamp = () => Date.now();
  const saveKV = (id, value) => DB.put('kv', { id, value, updatedAt: stamp() }).catch(fail);
  const savePlan = () => saveKV('plan', S.plan);
  const saveSettings = () => saveKV('settings', S.settings);
  const saveMeta = () => saveKV('meta', S.meta);
  const saveCustom = () => saveKV('custom', S.custom);
  function saveRec(store, rec) {
    rec.updatedAt = stamp(); if (!rec.createdAt) rec.createdAt = rec.updatedAt;
    return DB.put(store, rec).catch(fail);
  }
  function softDelete(store, rec) { rec.deleted = true; rec.updatedAt = stamp(); return DB.put(store, rec).catch(fail); }
  function saveActiveNow() {
    clearTimeout(saveActiveNow.t);
    if (S.active) { S.active.updatedAt = stamp(); DB.put('kv', { id: 'active', value: S.active, updatedAt: stamp() }).catch(fail); }
  }
  function saveActiveSoon() { clearTimeout(saveActiveNow.t); saveActiveNow.t = setTimeout(saveActiveNow, 350); }
  function debounce(key, fn, ms) { clearTimeout(debounce[key]); debounce[key] = setTimeout(fn, ms || 400); }

  async function loadAll() {
    const [kv, ss, bd, cd] = await Promise.all(['kv', 'sessions', 'body', 'cardio'].map(s => DB.getAll(s)));
    const m = {}; kv.forEach(r => { m[r.id] = r.value; });
    S.settings = Object.assign({}, DEFAULT_SETTINGS, m.settings || {});
    S.custom = m.custom || []; S.memos = m.memos || {};
    S.sessions = ss; S.body = bd; S.cardio = cd;
    S.active = m.active || null;
    S.timer = m.timer || null;
    if (S.timer && S.timer.endAt + 600000 < Date.now()) { S.timer = null; DB.del('kv', 'timer').catch(() => {}); }
    S.meta = m.meta || null;
    if (!S.meta) { S.meta = { deviceId: L.uid(), createdAt: Date.now(), lastBackupAt: null }; saveMeta(); }
    S.plan = m.plan || null;
    if (!S.plan) { S.plan = D.defaultPlan(L.uid); savePlan(); }
    for (let d = 0; d < 7; d++) if (!S.plan.days[d]) S.plan.days[d] = { title: 'Descanso', items: [] };
  }

  /* ---------- utilitários de dados ---------- */
  const sessionsSorted = () => live(S.sessions).sort((a, b) => a.startedAt - b.startedAt);
  const customPool = () => S.custom.map(c => ({ name: c.name, group: c.group, equip: c.equip || [], pattern: 'custom', sets: c.sets || 3, reps: c.reps || '10–12', unit: c.unit || 'reps', note: '' }));
  const memoOf = name => S.memos[L.normName(name)] || '';

  function lastFor(ex) {
    const ss = live(S.sessions);
    let last = L.lastPerformance(ss, ex.name);
    if (last) return { last, from: null };
    const orig = ex.origName || ex.baseName;
    if (orig) { last = L.lastPerformance(ss, orig); if (last) return { last, from: orig }; }
    return { last: null, from: null };
  }
  function placeReps(ex, k, last) {
    if (last && last.sets.length) { const s = last.sets[Math.min(k, last.sets.length - 1)]; if (s && s.reps != null) return String(s.reps); }
    const r = L.repRange(ex.reps);
    return r.min != null ? String(r.min) : 'reps';
  }
  function setPill(s, unit) {
    if (unit === 'sec') return (s.load != null ? L.fmtNum(s.load) + ' kg × ' : '') + (s.reps != null ? s.reps : '–') + ' s';
    if (s.load != null) return L.fmtNum(s.load) + ' kg × ' + (s.reps != null ? s.reps : '–');
    return (s.reps != null ? s.reps : '–') + ' reps';
  }

  /* ---------- cronômetro de descanso (continua em qualquer tela) ---------- */
  let audioCtx = null;
  function unlockAudio() {
    try {
      if (!audioCtx) { const AC = window.AudioContext || window.webkitAudioContext; if (AC) audioCtx = new AC(); }
      if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    } catch (e) { /* sem áudio */ }
  }
  function beep() {
    if (!S.settings.sound || !audioCtx) return;
    try {
      const t0 = audioCtx.currentTime;
      [0, 0.28, 0.56].forEach(o => {
        const osc = audioCtx.createOscillator(), g = audioCtx.createGain();
        osc.type = 'sine'; osc.frequency.value = 880;
        g.gain.setValueAtTime(0.0001, t0 + o);
        g.gain.exponentialRampToValueAtTime(0.35, t0 + o + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + o + 0.22);
        osc.connect(g); g.connect(audioCtx.destination);
        osc.start(t0 + o); osc.stop(t0 + o + 0.25);
      });
    } catch (e) { /* ignore */ }
  }
  function alarm() {
    beep();
    if (S.settings.vibrate && navigator.vibrate) { try { navigator.vibrate([220, 110, 220, 110, 380]); } catch (e) { /* ignore */ } }
  }
  const persistTimer = () => { if (S.timer) DB.put('kv', { id: 'timer', value: S.timer, updatedAt: stamp() }).catch(() => {}); };
  function startRest(sec) {
    unlockAudio();
    sec = Math.max(5, Math.round(sec));
    const now = Date.now();
    S.timer = { startedAt: now, endAt: now + sec * 1000, total: sec, done: false };
    persistTimer(); renderTimerBar(); updateTimerText(sec);
  }
  function stopRest() {
    S.timer = null; DB.del('kv', 'timer').catch(() => {}); renderTimerBar();
  }
  function adjustRest(d) {
    const t = S.timer; if (!t || t.done) return;
    t.endAt += d * 1000; t.total = Math.max(5, t.total + d);
    if (t.endAt - Date.now() < 1000) t.endAt = Date.now() + 1000;
    persistTimer(); updateTimerText((t.endAt - Date.now()) / 1000);
  }
  function renderTimerBar() {
    const el = $('#timerbar'), t = S.timer;
    if (!t) { el.hidden = true; el.innerHTML = ''; document.body.classList.remove('has-timer'); return; }
    el.hidden = false; document.body.classList.add('has-timer');
    if (t.done) {
      el.innerHTML = '<div class="tb done" role="alert"><div class="tb-mid"><div class="tb-time">00:00</div><div class="tb-lbl">Descanso concluído. Próxima série!</div></div>' +
        '<button data-act="rest-more" aria-label="Mais 30 segundos">+30 s</button><button data-act="rest-stop">OK</button></div>';
    } else {
      el.innerHTML = '<div class="tb"><div class="tb-time" id="tb-time">00:00</div><div class="tb-mid"><div class="tb-lbl">Descanso</div></div>' +
        '<button data-act="rest-adj" data-d="-15" aria-label="Menos 15 segundos">−15</button><button data-act="rest-adj" data-d="15" aria-label="Mais 15 segundos">+15</button>' +
        '<button data-act="rest-stop" aria-label="Parar descanso">Pular</button><div class="tb-fill" id="tb-fill"></div></div>';
      updateTimerText((t.endAt - Date.now()) / 1000);
    }
  }
  function updateTimerText(rem) {
    const t = S.timer; if (!t || t.done) return;
    const a = $('#tb-time'), f = $('#tb-fill');
    if (a) a.textContent = L.fmtClock(rem);
    if (f) f.style.width = Math.min(100, Math.max(0, (1 - rem / t.total) * 100)) + '%';
  }
  function tick() {
    const now = Date.now(), t = S.timer;
    if (t && !t.done) {
      const rem = (t.endAt - now) / 1000;
      if (rem <= 0) { t.done = true; persistTimer(); if (now - t.endAt < 8000) alarm(); renderTimerBar(); }
      else updateTimerText(rem);
    }
    if (S.active) {
      const txt = L.fmtElapsed((now - S.active.startedAt) / 1000);
      $$('[data-elapsed]').forEach(el => { el.textContent = txt; });
    }
  }

  /* ---------- tela ligada durante o treino ---------- */
  let wake = null;
  async function wantWake() {
    try {
      if ('wakeLock' in navigator && S.active && document.visibilityState === 'visible' && !wake) {
        wake = await navigator.wakeLock.request('screen');
        wake.addEventListener('release', () => { wake = null; });
      }
    } catch (e) { wake = null; }
  }
  function releaseWake() { try { if (wake) wake.release(); } catch (e) { /* ignore */ } wake = null; }

  /* ---------- treino ---------- */
  function startDay(dayIdx) {
    if (S.active) { toast('Você já tem um treino em andamento.'); return go('treino'); }
    const day = S.plan.days[dayIdx];
    if (!day || !day.items.length) { toast('Este dia não tem exercícios na ficha.'); return; }
    unlockAudio();
    const now = Date.now();
    const exercises = day.items.map(it => {
      const ex = {
        planId: it.id, name: it.name, baseName: it.baseName || null, origName: null, group: it.group,
        unit: it.unit || 'reps', reps: it.reps, note: it.note || '', setsPlanned: it.sets,
        sets: Array.from({ length: it.sets }, () => ({ load: null, reps: null, done: false }))
      };
      const lf = lastFor(ex);
      if (lf.last && !lf.from) {
        ex.sets.forEach((s, k) => {
          const ref = lf.last.sets[Math.min(k, lf.last.sets.length - 1)];
          s.load = ref ? ref.load : null;
        });
      }
      return ex;
    });
    S.active = { id: L.uid(), date: L.isoDate(new Date(now)), startedAt: now, dayIdx: +dayIdx, title: day.title, cur: 0, exercises, updatedAt: now };
    saveActiveNow(); closeSheet(); go('treino'); wantWake();
  }

  function toggleSet(k) {
    const a = S.active, ex = a.exercises[a.cur], s = ex.sets[k];
    if (!s.done) {
      const lf = lastFor(ex);
      if (s.reps == null) s.reps = L.parseNum(placeReps(ex, k, lf.last));
      s.done = true; s.doneAt = Date.now();
      if (S.settings.autoRest) startRest(S.settings.restDefault);
    } else s.done = false;
    saveActiveNow(); render();
  }

  function exDoneState(ex) {
    const d = ex.sets.filter(s => s.done).length;
    return d === 0 ? '' : d === ex.sets.length ? 'done' : 'part';
  }

  function finishSummary() {
    const a = S.active;
    const fake = L.finalizeSession(a, Date.now());
    return { fake, st: L.sessionStats(fake) };
  }
  async function saveWorkout() {
    const a = S.active; if (!a) return;
    const rec = L.finalizeSession(a, Date.now());
    const st = L.sessionStats(rec);
    rec.exercises = rec.exercises.filter(ex => ex.sets.some(s => s.done));
    try { await DB.put('sessions', rec); } catch (e) { return fail(e); }
    S.sessions.push(rec);
    S.active = null; DB.del('kv', 'active').catch(() => {});
    stopRest(); releaseWake(); closeSheet();
    S.ui.openSession = rec.id;
    go('home');
    toast('Treino salvo: ' + st.setsDone + ' séries em ' + L.fmtDuration(rec.durationSec) + '.');
  }
  async function discardWorkout() {
    const ok = await ask({ title: 'Descartar treino?', msg: 'As cargas e séries deste treino em andamento serão apagadas.', ok: 'Descartar', danger: true });
    if (!ok) return;
    S.active = null; DB.del('kv', 'active').catch(() => {}); stopRest(); releaseWake(); closeSheet(); go('home');
    toast('Treino descartado.');
  }

  /* ---------- ficha: operações ---------- */
  const dayItems = d => S.plan.days[d].items;
  function planItem(id, d) { return dayItems(d).find(i => i.id === id); }
  function addToDay(e) {
    dayItems(S.ui.planDay).push({ id: L.uid(), name: e.name, group: e.group, sets: e.sets || 3, reps: e.reps || '10–12', unit: e.unit || 'reps', note: e.note || '' });
    savePlan(); render(); toast('Exercício adicionado à ficha.');
  }
  function swapInPlan(item, e) {
    if (!item.baseName) item.baseName = item.name;
    const unitChanged = (item.unit || 'reps') !== (e.unit || 'reps');
    item.name = e.name; item.group = e.group; item.unit = e.unit || 'reps'; item.note = e.note || '';
    if (unitChanged) item.reps = e.reps;
  }
  function swapInActive(exIdx, e, permanent) {
    const a = S.active, ex = a.exercises[exIdx];
    const unitChanged = (ex.unit || 'reps') !== (e.unit || 'reps');
    if (!ex.origName) ex.origName = ex.name;
    ex.name = e.name; ex.group = e.group; ex.unit = e.unit || 'reps'; ex.note = e.note || '';
    if (unitChanged) ex.reps = e.reps;
    const lf = lastFor(ex);
    ex.sets.forEach((s, k) => {
      s.reps = null; s.done = false;
      const ref = lf.last && !lf.from ? lf.last.sets[Math.min(k, lf.last.sets.length - 1)] : null;
      s.load = ref ? ref.load : null;
    });
    if (permanent) {
      const item = planItem(ex.planId, a.dayIdx);
      if (item) { swapInPlan(item, e); savePlan(); }
    }
    saveActiveNow(); closeSheet(); render();
    toast(permanent ? 'Exercício trocado na ficha e neste treino.' : 'Exercício trocado só neste treino.');
  }

  /* ---------- navegação ---------- */
  const ROUTES = { home: viewHome, treino: viewWorkout, ficha: viewPlan, evolucao: viewProgress, cardio: viewCardio, mais: viewMore };
  const NAV = [['home', 'Início', 'home'], ['ficha', 'Ficha', 'list'], ['evolucao', 'Evolução', 'chart'], ['cardio', 'Cardio', 'pulse'], ['mais', 'Mais', 'more']];
  function currentRoute() {
    const h = (location.hash || '').replace(/^#\/?/, '').split('?')[0] || 'home';
    return ROUTES[h] ? h : 'home';
  }
  function go(r) {
    const target = '#/' + r;
    if (location.hash === target) render(); else location.hash = target;
  }
  function renderNav() {
    $('#nav').innerHTML = NAV.map(n =>
      '<button data-act="go" data-to="' + n[0] + '"' + (S.route === n[0] ? ' aria-current="page"' : '') + '>' +
      (S.active && n[0] === 'home' ? '<span class="dot">' + ic(n[2]) + '</span>' : ic(n[2])) + '<span>' + n[1] + '</span></button>').join('');
  }
  let lastRoute = null;
  function render() {
    if (!S.plan) return;
    S.route = currentRoute();
    if (S.ui.planDay == null) S.ui.planDay = new Date().getDay();
    const view = $('#view');
    view.innerHTML = ROUTES[S.route]();
    renderNav();
    if (lastRoute !== S.route) { window.scrollTo(0, 0); lastRoute = S.route; }
    if (S.route === 'treino') wantWake();
    renderTimerBar();
  }

  function activeBanner() {
    if (!S.active || S.route === 'treino') return '';
    return '<button class="banner" data-act="go" data-to="treino"><span class="live"></span><span><b>Treino em andamento</b><small>' + esc(S.active.title) + ' · <span class="num" data-elapsed>' + L.fmtElapsed((Date.now() - S.active.startedAt) / 1000) + '</span></small></span><span class="go">Continuar</span></button>';
  }

  /* =========================================================
     TELA: INÍCIO
     ========================================================= */
  function viewHome() {
    const now = new Date(), dow = now.getDay(), todayIso = L.isoDate(now);
    const day = S.plan.days[dow], sess = sessionsSorted();
    const hr = now.getHours();
    const greet = hr < 12 ? 'Bom dia' : hr < 18 ? 'Boa tarde' : 'Boa noite';
    const name = (S.settings.name || '').trim();
    const week = L.weekDays(sess, S.plan, now);
    const wk = L.sessionsInWeek(sess, now);
    const planned = week.filter(d => d.planned).length;
    const monthKey = todayIso.slice(0, 7);
    const monthCount = sess.filter(s => s.date.startsWith(monthKey)).length;
    const last = sess[sess.length - 1];
    const doneToday = sess.some(s => s.date === todayIso);
    const rest = S.settings.restDefault;

    let today;
    if (S.active) {
      today = '<section class="card today-card"><div class="small">Treino em andamento</div><h2 class="title" style="margin-top:2px">' + esc(S.active.title) + '</h2>' +
        '<p class="sub" style="margin:8px 0 16px">Exercício ' + (S.active.cur + 1) + ' de ' + S.active.exercises.length + ' · <span class="num" data-elapsed>' + L.fmtElapsed((Date.now() - S.active.startedAt) / 1000) + '</span></p>' +
        '<button class="btn big" data-act="go" data-to="treino">' + ic('play') + ' CONTINUAR TREINO</button></section>';
    } else if (day.items.length) {
      today = '<section class="card today-card"><div class="small">Treino de hoje</div><h2 class="title" style="margin-top:2px">' + esc(day.title) + '</h2>' +
        '<div class="today-meta"><span class="chip static">' + day.items.length + ' exercícios</span><span class="chip static rose">≈ ' + L.estimateMinutes(day.items, rest) + ' min</span>' +
        (doneToday ? '<span class="chip static on">Já treinou hoje</span>' : '') + '</div>' +
        '<ul class="ex-preview">' + day.items.map(i => '<li><span>' + esc(i.name) + '</span><span class="sets">' + i.sets + '×' + esc(i.reps) + (i.unit === 'sec' ? ' s' : '') + '</span></li>').join('') + '</ul>' +
        '<button class="btn big" data-act="start-day" data-day="' + dow + '">' + ic('play') + ' INICIAR TREINO</button>' +
        '<div class="row" style="justify-content:center;margin-top:6px"><button class="link" data-act="pick-day">Escolher outro treino</button></div></section>';
    } else {
      today = '<section class="card today-card"><div class="small">Hoje</div><h2 class="title" style="margin-top:2px">Dia de descanso</h2>' +
        '<p class="sub" style="margin:8px 0 16px">Sua ficha não tem treino para ' + D.DAY_NAMES[dow].toLowerCase() + '. Descansar também faz parte do resultado.</p>' +
        '<button class="btn ghost" data-act="pick-day">Treinar mesmo assim</button></section>';
    }

    const weekHtml = '<div class="week">' + week.map(d =>
      '<div class="wd' + (d.trained ? ' trained' : '') + (d.planned ? ' planned' : '') + (d.isToday ? ' today' : '') + '" aria-label="' + D.DAY_NAMES[d.dow] + (d.trained ? ', treino feito' : '') + '"><i>' + (d.trained ? ic('check') : '') + '</i>' + D.DAY_INITIAL[d.dow] + '</div>').join('') + '</div>';

    const backupAge = S.meta.lastBackupAt ? (Date.now() - S.meta.lastBackupAt) / 86400000 : Infinity;
    const backupNotice = sess.length >= 3 && backupAge > 14
      ? '<div class="notice"><span class="grow">' + (S.meta.lastBackupAt ? 'Seu último backup foi há mais de 2 semanas.' : 'Você ainda não fez backup dos seus treinos.') + '</span><button class="btn small-btn ghost" data-act="go" data-to="mais">Fazer backup</button></div>' : '';

    return activeBanner() +
      '<header class="hello"><p class="sub">' + esc(L.longDate(now)) + '</p><h1 class="display">' + greet + (name ? ', ' + esc(name) : '') + '</h1></header>' +
      '<div class="stack">' + today +
      '<section class="card"><div class="row between"><h2 class="card-title" style="margin:0">Sua semana</h2><span class="small num">' + wk.length + (planned ? ' de ' + planned : '') + ' treinos</span></div>' + weekHtml +
      '<div class="stats"><div class="stat"><b>' + sess.length + '</b><span>treinos concluídos no total</span></div><div class="stat rose"><b>' + monthCount + '</b><span>treinos neste mês</span></div></div></section>' +
      (last ? '<button class="card last-card" data-act="open-session" data-id="' + last.id + '"><span class="ico">' + ic('dumbbell') + '</span><span class="grow"><span class="small">Último treino · ' + L.relDay(last.date, now) + '</span><b style="display:block;font-size:17px">' + esc(last.title) + '</b><span class="small">' + L.fmtDuration(last.durationSec) + ' · ' + L.sessionStats(last).exercisesDone + ' exercícios · ' + L.sessionStats(last).setsDone + ' séries</span></span>' + ic('chevR') + '</button>'
        : '<section class="card soft"><h2 class="card-title">Seu primeiro treino</h2><p class="sub">Quando você finalizar um treino, ele aparece aqui junto com a duração e as cargas.</p></section>') +
      backupNotice + '</div>';
  }

  /* =========================================================
     TELA: TREINO EM EXECUÇÃO
     ========================================================= */
  function viewWorkout() {
    const a = S.active;
    if (!a) {
      return '<header class="page-head"><h1 class="display">Treino</h1></header><div class="card empty"><div class="h2">Nenhum treino em andamento</div><p>Comece pelo treino de hoje na tela inicial.</p><button class="btn" style="margin-top:16px" data-act="go" data-to="home">Ir para o início</button></div>';
    }
    const i = a.cur, n = a.exercises.length, ex = a.exercises[i];
    const lf = lastFor(ex), last = lf.last;
    const rng = L.repRange(ex.reps);
    const tip = !lf.from ? L.suggestProgression(last, rng, ex.unit) : null;
    const memo = memoOf(ex.name);
    const rest = S.settings.restDefault;
    const isSec = ex.unit === 'sec';
    const yt = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(ex.name + ' execução correta');

    const bars = a.exercises.map((e, k) => '<button class="' + [exDoneState(e), k === i ? 'cur' : ''].join(' ') + '" data-act="ex-go" data-i="' + k + '" aria-label="Exercício ' + (k + 1) + ': ' + esc(e.name) + '"></button>').join('');

    let lastHtml;
    if (last) {
      lastHtml = '<div class="last-box"><b>' + (lf.from ? 'Exercício original (' + esc(lf.from) + ')' : 'Última vez') + '</b> · ' + L.fmtShort(last.date) + ' (' + L.relDay(last.date) + ')' +
        '<div class="sets-line">' + last.sets.map(s => setPill(s, last.unit)).join('  ·  ') + '</div>' + (tip ? '<div class="tip">' + esc(tip.text) + '</div>' : '') + '</div>';
    } else {
      lastHtml = '<div class="last-box">Primeira vez neste exercício. Registre as cargas para acompanhar a sua evolução.</div>';
    }

    const setRows = ex.sets.map((s, k) =>
      '<div class="set' + (s.done ? ' done' : '') + '"><div class="n">' + (k + 1) + '</div>' +
      '<input inputmode="decimal" autocomplete="off" enterkeyhint="next" data-in="load" data-k="' + k + '" value="' + L.inputNum(s.load) + '" placeholder="kg" aria-label="Carga da série ' + (k + 1) + ' em quilos">' +
      '<input inputmode="numeric" autocomplete="off" enterkeyhint="done" data-in="reps" data-k="' + k + '" value="' + L.inputNum(s.reps) + '" placeholder="' + placeReps(ex, k, lf.from ? null : last) + '" aria-label="' + (isSec ? 'Segundos' : 'Repetições') + ' da série ' + (k + 1) + '">' +
      '<button class="ok" data-act="toggle-set" data-k="' + k + '" aria-pressed="' + !!s.done + '" aria-label="' + (s.done ? 'Desmarcar' : 'Concluir') + ' série ' + (k + 1) + '">' + ic('check') + '</button></div>').join('');

    const preset = [60, 90, 120];
    const restChips = preset.map(v => '<button class="chip" aria-pressed="' + (rest === v) + '" data-act="rest-default" data-s="' + v + '">' + v + ' s</button>').join('') +
      '<button class="chip" aria-pressed="' + (!preset.includes(rest)) + '" data-act="rest-custom">' + (preset.includes(rest) ? 'Outro' : rest + ' s') + '</button>';

    const isLast = i === n - 1;
    return activeBanner() +
      '<div class="wk-head"><div class="grow"><div class="small">Exercício ' + (i + 1) + ' de ' + n + '</div><div class="h2">' + esc(a.title) + '</div></div>' +
      '<span class="elapsed" data-elapsed>' + L.fmtElapsed((Date.now() - a.startedAt) / 1000) + '</span>' +
      '<button class="icon-btn" data-act="ex-list" aria-label="Lista de exercícios">' + ic('list2') + '</button></div>' +
      '<div class="progress">' + bars + '</div>' +
      '<section class="card"><div class="ex-top"><div class="fig-box">' + F.svg(ex.group, 'Músculo trabalhado: ' + gLabel(ex.group)) + '</div>' +
      '<div class="grow"><h1 class="ex-name">' + esc(ex.name) + '</h1>' +
      '<div class="chips"><span class="chip static">' + esc(gLabel(ex.group)) + '</span><span class="chip static rose">' + ex.sets.length + ' séries · ' + esc(L.repsLabel(ex)) + '</span></div>' +
      (ex.origName ? '<div class="subbed">Troca de: ' + esc(ex.origName) + '</div>' : '') +
      '<div class="ex-links"><a class="link" href="' + yt + '" target="_blank" rel="noopener">' + ic('video') + ' Ver demonstração</a><button class="link" data-act="swap-open">' + ic('swap') + ' Trocar</button></div></div></div>' +
      lastHtml +
      (memo ? '<div class="memo-shown"><span class="small">Sua anotação:</span> ' + esc(memo) + '</div>' : '') +
      '<div class="sets"><div class="sets-head"><span>Série</span><span>Carga (kg)</span><span>' + (isSec ? 'Segundos' : 'Repetições') + '</span><span>Feita</span></div>' + setRows + '</div>' +
      '<div class="set-actions"><button class="btn ghost small-btn" data-act="add-set">' + ic('plus') + ' Série</button>' +
      (ex.sets.length > 1 ? '<button class="btn ghost small-btn" data-act="rm-set">' + ic('minus') + ' Série</button>' : '') + '</div>' +
      '<div class="rest-row"><div class="lbl"><span>Descanso entre as séries</span><button class="link" data-act="rest-now">' + ic('clock') + ' Iniciar agora</button></div><div class="chips">' + restChips + '</div></div>' +
      '<div class="memo"><label class="label" for="memo">Anotação do exercício</label><textarea id="memo" class="field" rows="2" data-in="memo" placeholder="Ex.: banco na posição 3, pegada fechada">' + esc(memo) + '</textarea></div>' +
      '</section>' +
      '<div class="nav-ex">' + (i > 0 ? '<button class="btn ghost" data-act="ex-prev" aria-label="Exercício anterior">' + ic('chevL') + '</button>' : '') +
      '<button class="btn big" data-act="' + (isLast ? 'finish-open' : 'ex-next') + '">' + (isLast ? ic('check') + ' Finalizar treino' : 'Próximo exercício ' + ic('chevR')) + '</button></div>' +
      '<div class="row wrap" style="justify-content:center;gap:18px;margin-top:10px">' + (isLast ? '' : '<button class="link" data-act="finish-open">Finalizar treino agora</button>') + '<button class="link" data-act="discard">Descartar treino</button></div>';
  }

  /* =========================================================
     TELA: FICHA
     ========================================================= */
  function viewPlan() {
    const d = S.ui.planDay, day = S.plan.days[d], items = day.items;
    const todayDow = new Date().getDay();
    const tabs = D.DAY_ORDER.map(k => '<button class="day-tab' + (k === todayDow ? ' today' : '') + '" role="tab" aria-selected="' + (k === d) + '" data-act="plan-day" data-d="' + k + '">' + D.DAY_SHORT[k] + '<small>' + S.plan.days[k].items.length + ' ex.</small></button>').join('');
    const list = items.length ? items.map((it, idx) =>
      '<article class="plan-item"><div class="pi-name">' + esc(it.name) + '</div>' +
      '<div class="pi-meta">' + it.sets + ' séries × ' + esc(it.reps) + (it.unit === 'sec' ? ' s' : '') + (it.note ? ' ' + esc(it.note) : '') + ' · ' + esc(gLabel(it.group)) + '</div>' +
      (it.baseName ? '<div class="pi-sub">No lugar de ' + esc(it.baseName) + ' <button class="link" style="min-height:28px" data-act="pi-revert" data-id="' + it.id + '">Voltar ao original</button></div>' : '') +
      '<div class="pi-actions"><button class="icon-btn" data-act="pi-up" data-id="' + it.id + '" aria-label="Subir"' + (idx === 0 ? ' disabled' : '') + '>' + ic('up') + '</button>' +
      '<button class="icon-btn" data-act="pi-down" data-id="' + it.id + '" aria-label="Descer"' + (idx === items.length - 1 ? ' disabled' : '') + '>' + ic('down') + '</button>' +
      '<button class="icon-btn" data-act="pi-edit" data-id="' + it.id + '" aria-label="Editar séries e repetições">' + ic('edit') + '</button>' +
      '<button class="icon-btn" data-act="pi-swap" data-id="' + it.id + '" aria-label="Substituir exercício">' + ic('swap') + '</button><span class="sp"></span>' +
      '<button class="icon-btn danger" data-act="pi-del" data-id="' + it.id + '" aria-label="Excluir exercício">' + ic('trash') + '</button></div></article>').join('')
      : '<div class="card empty"><div class="h2">Dia sem exercícios</div><p>Adicione exercícios para montar o treino de ' + D.DAY_NAMES[d].toLowerCase() + '.</p></div>';
    return activeBanner() + '<header class="page-head"><h1 class="display">Minha ficha</h1><p class="sub">Toque em um dia para ver e editar os exercícios.</p></header>' +
      '<div class="days" role="tablist">' + tabs + '</div>' +
      '<div class="card tight" style="margin-bottom:14px"><label class="label" for="day-title">Nome do treino de ' + D.DAY_NAMES[d].toLowerCase() + '</label><input id="day-title" class="field" data-in="dayTitle" value="' + esc(day.title) + '" placeholder="Ex.: Costas e bíceps"></div>' +
      list + '<div style="margin-top:14px"><button class="btn" data-act="pi-add">' + ic('plus') + ' Adicionar exercício</button></div>';
  }

  /* =========================================================
     TELA: MINHA EVOLUÇÃO
     ========================================================= */
  const BODY_FIELDS = [
    { k: 'weight', label: 'Peso', unit: 'kg' }, { k: 'waist', label: 'Cintura', unit: 'cm' }, { k: 'abdomen', label: 'Abdômen', unit: 'cm' },
    { k: 'hip', label: 'Quadril', unit: 'cm' }, { k: 'thigh', label: 'Coxa', unit: 'cm' }, { k: 'arm', label: 'Braço', unit: 'cm' }
  ];
  function viewProgress() {
    const tab = S.ui.progTab;
    const tabs = [['resumo', 'Resumo'], ['cargas', 'Cargas'], ['corpo', 'Corpo'], ['historico', 'Histórico']];
    const seg = '<div class="seg" role="tablist">' + tabs.map(t => '<button role="tab" aria-selected="' + (tab === t[0]) + '" data-act="prog-tab" data-tab="' + t[0] + '">' + t[1] + '</button>').join('') + '</div>';
    const body = tab === 'resumo' ? progSummary() : tab === 'cargas' ? progLoads() : tab === 'corpo' ? progBody() : progHistory();
    return activeBanner() + '<header class="page-head"><h1 class="display">Minha evolução</h1></header>' + seg + '<div class="stack" style="margin-top:14px">' + body + '</div>';
  }

  function progSummary() {
    const sess = sessionsSorted(), now = new Date();
    if (!sess.length) return '<div class="card empty"><div class="h2">Sem treinos ainda</div><p>Finalize um treino para ver frequência, tempo e gráficos aqui.</p></div>';
    const monthKey = L.isoDate(now).slice(0, 7);
    const total = sess.reduce((a, s) => a + s.durationSec, 0);
    const weeks = L.weeklyCounts(sess, 12, now);
    const avgPerWeek = weeks.reduce((a, w) => a + w.count, 0) / 12;
    const lastN = sess.slice(-15);
    return '<div class="metric-tiles"><div class="tile"><b>' + sess.length + '</b><span>treinos concluídos</span></div><div class="tile"><b>' + sess.filter(s => s.date.startsWith(monthKey)).length + '</b><span>neste mês</span></div>' +
      '<div class="tile"><b>' + L.fmtDuration(total / sess.length) + '</b><span>duração média</span></div><div class="tile"><b>' + L.fmtDuration(total) + '</b><span>tempo total treinado</span></div></div>' +
      '<section class="card"><h2 class="card-title">Frequência semanal</h2><p class="small" style="margin:-4px 0 8px">Treinos por semana · média de ' + L.fmtNum(avgPerWeek, 1) + ' nas últimas 12 semanas</p>' +
      C.barChart({ bars: weeks.map(w => ({ label: w.label, value: w.count, tip: 'Semana de ' + w.label + ' · ' + w.count + (w.count === 1 ? ' treino' : ' treinos') })), label: 'Treinos por semana' }) + '</section>' +
      '<section class="card"><h2 class="card-title">Tempo de treino</h2><p class="small" style="margin:-4px 0 8px">Duração dos últimos ' + lastN.length + ' treinos, em minutos</p>' +
      C.lineChart({ points: lastN.map(s => ({ label: L.fmtShort(s.date), y: Math.round(s.durationSec / 60), tip: L.fmtShort(s.date) + ' · ' + s.title + ' · ' + L.fmtDuration(s.durationSec) })), unit: 'min', label: 'Duração dos treinos' }) + '</section>';
  }

  function progLoads() {
    const hist = L.historyByExercise(S.sessions);
    const list = Object.values(hist).sort((a, b) => b.entries.length - a.entries.length || a.name.localeCompare(b.name, 'pt-BR'));
    if (!list.length) return '<div class="card empty"><div class="h2">Sem cargas registradas</div><p>Conclua séries durante o treino para acompanhar a evolução de cada exercício.</p></div>';
    if (!S.ui.exKey || !hist[S.ui.exKey]) S.ui.exKey = list[0].key;
    const h = hist[S.ui.exKey], en = h.entries;
    const hasLoad = en.some(e => e.top > 0);
    let metric = S.ui.metric;
    if (!hasLoad) metric = 'maxReps';
    const defs = {
      top: { label: 'Maior carga', unit: 'kg', get: e => e.top },
      volume: { label: 'Volume', unit: 'kg', get: e => Math.round(e.volume) },
      e1rm: { label: '1RM estimada', unit: 'kg', get: e => Math.round(e.e1rm * 10) / 10 },
      maxReps: { label: h.unit === 'sec' ? 'Melhor tempo' : 'Repetições (melhor série)', unit: h.unit === 'sec' ? 's' : 'reps', get: e => Math.max.apply(null, e.sets.map(s => s.reps || 0)) }
    };
    const def = defs[metric];
    const pts = en.slice(-20).map(e => ({ label: L.fmtShort(e.date), y: def.get(e), tip: L.fmtShort(e.date) + ' · ' + L.fmtNum(def.get(e)) + ' ' + def.unit + ' · ' + e.sets.length + (e.sets.length === 1 ? ' série' : ' séries') }));
    const pb = L.personalBest(en);
    const first = en[0], lastE = en[en.length - 1];
    const diff = hasLoad && en.length > 1 ? +(lastE.top - first.top).toFixed(2) : null;
    return '<section class="card"><label class="label" for="ex-sel">Exercício</label><select id="ex-sel" class="select" data-in="exSel">' +
      list.map(x => '<option value="' + esc(x.key) + '"' + (x.key === S.ui.exKey ? ' selected' : '') + '>' + esc(x.name) + ' (' + x.entries.length + ')</option>').join('') + '</select>' +
      (hasLoad ? '<div class="chips" style="margin-top:12px">' + ['top', 'volume', 'e1rm'].map(m => '<button class="chip" aria-pressed="' + (metric === m) + '" data-act="metric" data-m="' + m + '">' + defs[m].label + '</button>').join('') + '</div>' : '') +
      '</section>' +
      '<section class="card"><h2 class="card-title">' + esc(def.label) + '</h2>' + C.lineChart({ points: pts, unit: def.unit, label: def.label + ' de ' + h.name }) + '</section>' +
      '<div class="metric-tiles">' +
      (pb ? '<div class="tile"><b>' + L.fmtNum(pb.load) + ' kg</b><span>recorde · ' + (pb.reps != null ? pb.reps + (h.unit === 'sec' ? ' s' : ' reps') + ' · ' : '') + L.fmtShort(pb.date) + '</span></div>' : '') +
      '<div class="tile"><b>' + en.length + '</b><span>treinos com este exercício</span>' + (diff != null ? '<span class="d">' + (diff > 0 ? '+' : '') + L.fmtNum(diff) + ' kg desde o início</span>' : '') + '</div></div>' +
      '<section class="card"><h2 class="card-title">Últimas vezes</h2>' + en.slice(-8).reverse().map(e => '<div class="hist-ex"><b>' + L.fmtFull(e.date) + '</b><div class="set-pills">' + e.sets.map(s => '<span class="pill">' + esc(setPill(s, h.unit)) + '</span>').join('') + '</div></div>').join('') + '</section>';
  }

  function progBody() {
    const entries = live(S.body).sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt);
    const add = '<button class="btn" data-act="body-add">' + ic('plus') + ' Nova medição</button>';
    if (!entries.length) return add + '<div class="card empty"><div class="h2">Nenhuma medição ainda</div><p>Registre peso e medidas de cintura, abdômen, quadril, coxa e braço para ver o gráfico da sua evolução.</p></div>';
    const m = S.ui.bodyMetric, f = BODY_FIELDS.find(x => x.k === m) || BODY_FIELDS[0];
    const pts = entries.filter(e => e[f.k] != null).slice(-24).map(e => ({ label: L.fmtShort(e.date), y: e[f.k], tip: L.fmtFull(e.date) + ' · ' + L.fmtNum(e[f.k]) + ' ' + f.unit }));
    const tiles = BODY_FIELDS.map(bf => {
      const d = L.bodyDelta(entries, bf.k); if (!d) return '';
      const sign = v => (v > 0 ? '+' : '') + L.fmtNum(v);
      return '<div class="tile"><span>' + bf.label + '</span><b>' + L.fmtNum(d.latest) + ' ' + bf.unit + '</b>' +
        (d.diffPrev != null ? '<span class="d">' + sign(d.diffPrev) + ' vs. anterior</span>' : '<span class="d">primeira medição</span>') +
        (d.diffFirst != null && d.count > 2 ? '<span class="small">' + sign(d.diffFirst) + ' desde o início</span>' : '') + '</div>';
    }).join('');
    return add + '<div class="metric-tiles">' + tiles + '</div>' +
      '<section class="card"><div class="chips scroll" style="margin-bottom:12px">' + BODY_FIELDS.map(bf => '<button class="chip" aria-pressed="' + (bf.k === f.k) + '" data-act="body-metric" data-m="' + bf.k + '">' + bf.label + '</button>').join('') + '</div>' +
      '<h2 class="card-title">' + f.label + ' (' + f.unit + ')</h2>' + C.lineChart({ points: pts, unit: f.unit, label: 'Evolução de ' + f.label, empty: 'Sem medições de ' + f.label.toLowerCase() + ' ainda.' }) + '</section>' +
      '<h2 class="h2" style="margin-top:6px">Medições anteriores</h2>' +
      entries.slice().reverse().map(e => '<button class="entry" data-act="body-edit" data-id="' + e.id + '"><b>' + L.fmtFull(e.date) + '</b><div class="vals">' +
        BODY_FIELDS.filter(bf => e[bf.k] != null).map(bf => '<span class="pill">' + bf.label + ' ' + L.fmtNum(e[bf.k]) + ' ' + bf.unit + '</span>').join('') + '</div></button>').join('');
  }

  function progHistory() {
    const sess = sessionsSorted().reverse();
    if (!sess.length) return '<div class="card empty"><div class="h2">Nenhum treino registrado</div><p>Seus treinos finalizados aparecem aqui, com data, duração e cargas.</p></div>';
    let out = '', month = '';
    sess.forEach(s => {
      const ml = L.monthLabel(s.date);
      if (ml !== month) { month = ml; out += '<h2 class="month">' + ml + '</h2>'; }
      const st = L.sessionStats(s), open = S.ui.openSession === s.id, d = L.parseISO(s.date);
      out += '<div class="hist"><button class="hist-head" data-act="toggle-session" data-id="' + s.id + '" aria-expanded="' + open + '"><div class="hist-date"><b>' + d.getDate() + '</b><span>' + D.DAY_SHORT[d.getDay()] + '</span></div>' +
        '<div class="grow"><b>' + esc(s.title) + '</b><div class="small">' + L.fmtDuration(s.durationSec) + ' · ' + st.exercisesDone + ' exercícios · ' + st.setsDone + ' séries' + (st.volume ? ' · ' + L.fmtNum(Math.round(st.volume)) + ' kg de volume' : '') + '</div></div>' + ic(open ? 'up' : 'down') + '</button>';
      if (open) {
        out += '<div class="hist-body">' + s.exercises.filter(ex => ex.sets.some(x => x.done)).map(ex =>
          '<div class="hist-ex"><b>' + esc(ex.name) + '</b>' + (ex.origName ? ' <span class="small">(troca de ' + esc(ex.origName) + ')</span>' : '') + '<div class="set-pills">' +
          ex.sets.filter(x => x.done).map(x => '<span class="pill">' + esc(setPill(x, ex.unit)) + '</span>').join('') + '</div></div>').join('') +
          '<div class="row" style="margin-top:10px"><span class="small grow">Início às ' + new Date(s.startedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) + '</span><button class="btn danger small-btn" data-act="del-session" data-id="' + s.id + '">' + ic('trash') + ' Excluir treino</button></div></div>';
      }
      out += '</div>';
    });
    return out;
  }

  /* =========================================================
     TELA: CARDIO
     ========================================================= */
  const MODALITIES = ['Esteira', 'Bicicleta', 'Elíptico', 'Caminhada', 'Corrida', 'Escada', 'Outra'];
  const INTENSITIES = ['Leve', 'Moderada', 'Intensa'];
  function viewCardio() {
    const items = live(S.cardio).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
    const now = new Date(), weeks = L.weeklyMinutes(S.cardio, 8, now), cur = weeks[weeks.length - 1];
    const add = '<button class="btn" data-act="cardio-add">' + ic('plus') + ' Registrar cardio</button>';
    if (!items.length) return activeBanner() + '<header class="page-head"><h1 class="display">Cardio</h1><p class="sub">Esteira, bicicleta, elíptico e mais.</p></header>' + add + '<div class="card empty" style="margin-top:14px"><div class="h2">Nenhuma atividade ainda</div><p>Registre modalidade, tempo, distância e intensidade para acompanhar seu cardio.</p></div>';
    return activeBanner() + '<header class="page-head"><h1 class="display">Cardio</h1></header><div class="stack">' + add +
      '<div class="metric-tiles"><div class="tile"><b>' + cur.minutes + ' min</b><span>nesta semana · ' + cur.count + (cur.count === 1 ? ' sessão' : ' sessões') + '</span></div><div class="tile"><b>' + L.fmtNum(cur.km, 1) + ' km</b><span>distância na semana</span></div></div>' +
      '<section class="card"><h2 class="card-title">Minutos por semana</h2>' + C.barChart({ bars: weeks.map(w => ({ label: w.label, value: w.minutes, tip: 'Semana de ' + w.label + ' · ' + w.minutes + ' min' })), unit: 'min', label: 'Minutos de cardio por semana' }) + '</section>' +
      '<h2 class="h2">Atividades</h2>' +
      items.map(c => '<button class="entry" data-act="cardio-edit" data-id="' + c.id + '"><div class="row between"><b>' + esc(c.modality) + '</b><span class="small">' + L.fmtFull(c.date) + '</span></div><div class="vals"><span class="pill">' + c.minutes + ' min</span>' + (c.distance != null ? '<span class="pill">' + L.fmtNum(c.distance) + ' km</span>' : '') + (c.intensity ? '<span class="pill">' + esc(c.intensity) + '</span>' : '') + '</div>' + (c.note ? '<div class="small" style="margin-top:8px">' + esc(c.note) + '</div>' : '') + '</button>').join('') + '</div>';
  }

  /* =========================================================
     TELA: MAIS (configurações, backup, instalação)
     ========================================================= */
  const isStandalone = () => (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  function viewMore() {
    const st = S.settings, m = S.meta;
    const lastBk = m.lastBackupAt ? new Date(m.lastBackupAt).toLocaleDateString('pt-BR') + ' às ' + new Date(m.lastBackupAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'nunca';
    const canShare = !!(navigator.canShare && navigator.share);
    const counts = { s: live(S.sessions).length, b: live(S.body).length, c: live(S.cardio).length };
    return activeBanner() + '<header class="page-head"><h1 class="display">Mais</h1></header><div class="stack">' +
      '<section class="card"><h2 class="card-title">Preferências</h2>' +
      '<label class="label" for="set-name">Seu nome</label><input id="set-name" class="field" data-in="setting" data-key="name" value="' + esc(st.name) + '" autocomplete="given-name">' +
      '<div style="margin-top:12px"><label class="label" for="set-rest">Descanso padrão</label><select id="set-rest" class="select" data-in="setting" data-key="restDefault">' +
      [30, 45, 60, 75, 90, 105, 120, 150, 180, 240].map(v => '<option value="' + v + '"' + (st.restDefault === v ? ' selected' : '') + '>' + v + ' segundos</option>').join('') + (![30, 45, 60, 75, 90, 105, 120, 150, 180, 240].includes(st.restDefault) ? '<option value="' + st.restDefault + '" selected>' + st.restDefault + ' segundos</option>' : '') + '</select></div>' +
      '<label class="switch"><span>Iniciar descanso ao concluir uma série</span><input type="checkbox" data-in="setting" data-key="autoRest"' + (st.autoRest ? ' checked' : '') + '></label>' +
      '<label class="switch"><span>Som ao terminar o descanso</span><input type="checkbox" data-in="setting" data-key="sound"' + (st.sound ? ' checked' : '') + '></label>' +
      '<label class="switch"><span>Vibrar ao terminar o descanso</span><input type="checkbox" data-in="setting" data-key="vibrate"' + (st.vibrate ? ' checked' : '') + '></label></section>' +

      '<section class="card"><h2 class="card-title">Backup dos dados</h2><p class="sub" style="margin-bottom:12px">Seus dados ficam salvos neste aparelho. Guarde um backup de vez em quando, principalmente antes de trocar de celular ou limpar o navegador.</p>' +
      '<div class="kv"><span>Último backup</span><span>' + lastBk + '</span></div><div class="kv"><span>Salvo no aparelho</span><span>' + counts.s + ' treinos · ' + counts.b + ' medições · ' + counts.c + ' cardios</span></div>' +
      '<div class="btn-row" style="margin-top:12px"><button class="btn" data-act="export">' + ic('download') + ' Baixar backup</button></div>' +
      (canShare ? '<div style="margin-top:10px"><button class="btn ghost" data-act="export-share">' + ic('share') + ' Enviar para o Drive, WhatsApp…</button></div>' : '') +
      '<div style="margin-top:10px"><button class="btn ghost" data-act="import-pick">' + ic('upload') + ' Restaurar de um backup</button><input type="file" id="file-in" accept="application/json,.json" hidden data-in="importFile"></div></section>' +

      '<section class="card"><h2 class="card-title">Armazenamento</h2>' +
      '<div class="kv"><span>Tipo</span><span>' + (S.dbMode === 'idb' ? 'IndexedDB' : 'Básico (localStorage)') + '</span></div>' +
      '<div class="kv"><span>Protegido contra limpeza automática</span><span>' + (S.persisted === true ? 'Sim' : S.persisted === false ? 'Não' : '—') + '</span></div>' +
      (S.persisted === false ? '<p class="small" style="margin-top:8px">Instalar o app na tela inicial ajuda o celular a manter seus dados.</p>' : '') +
      (S.dbMode !== 'idb' ? '<p class="small" style="margin-top:8px">O navegador bloqueou o IndexedDB; usando o armazenamento básico. Faça backups com frequência.</p>' : '') + '</section>' +

      (isStandalone() ? '' : '<section class="card"><h2 class="card-title">Instalar no celular</h2>' +
        (S.installEvt ? '<button class="btn" data-act="install" style="margin-bottom:12px">Instalar o Projeto Shape</button>' : '') +
        '<details class="help"><summary>Como instalar</summary><ol><li><b>Android (Chrome):</b> toque em ⋮ e escolha “Instalar app” ou “Adicionar à tela inicial”.</li><li><b>iPhone (Safari):</b> toque em Compartilhar e escolha “Adicionar à Tela de Início”.</li></ol></details></section>') +

      '<section class="card"><h2 class="card-title">Ficha e dados</h2><div class="stack">' +
      '<button class="btn ghost" data-act="reset-plan">Restaurar a ficha original</button>' +
      '<button class="btn danger" data-act="reset-all">' + ic('trash') + ' Apagar todos os dados</button></div></section>' +
      '<p class="small" style="text-align:center">Projeto Shape · versão 1.0</p></div>';
  }

  /* =========================================================
     FOLHAS (bottom sheets) e diálogos
     ========================================================= */
  function shell(title, html) {
    return '<div class="sheet-back" data-act="sheet-close"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="' + esc(title) + '"><div class="sheet-handle"></div>' +
      '<div class="sheet-head"><h3>' + esc(title) + '</h3><button class="icon-btn plain" data-act="sheet-close" aria-label="Fechar">' + ic('x') + '</button></div><div class="sheet-body">' + html + '</div></div>';
  }
  function openSheet(sh) { S.sheet = sh; renderSheet(); }
  function closeSheet() { S.sheet = null; $('#sheet-root').innerHTML = ''; document.body.style.overflow = ''; }
  function renderSheet() {
    const sh = S.sheet; if (!sh) return;
    const prev = $('.sheet-body'), top = prev ? prev.scrollTop : 0;
    const b = SHEETS[sh.kind](sh);
    $('#sheet-root').innerHTML = shell(b.title, b.html);
    document.body.style.overflow = 'hidden';
    const nb = $('.sheet-body'); if (nb && sh.keepScroll) nb.scrollTop = top;
  }
  function ask(o) {
    return new Promise(res => {
      S.dlg = { res };
      $('#dialog-root').innerHTML = '<div class="sheet-back" data-act="dlg-no"></div><div class="dialog" role="alertdialog" aria-modal="true" aria-label="' + esc(o.title) + '"><h3>' + esc(o.title) + '</h3><p>' + esc(o.msg || '') + '</p>' +
        '<div class="btn-row"><button class="btn ghost" data-act="dlg-no">' + esc(o.cancel || 'Cancelar') + '</button><button class="btn ' + (o.danger ? 'danger' : '') + '" data-act="dlg-yes">' + esc(o.ok || 'Confirmar') + '</button></div></div>';
    });
  }
  function closeDlg(v) { const d = S.dlg; S.dlg = null; $('#dialog-root').innerHTML = ''; if (d) d.res(v); }

  function pickCompute(sh) {
    const extra = customPool();
    let list;
    if (sh.mode === 'swap') list = D.alternativesFor(sh.name, sh.group, sh.eq, extra);
    else {
      list = D.LIBRARY.concat(extra);
      if (sh.group !== 'all') list = list.filter(e => e.group === sh.group);
      if (sh.eq.length) list = list.filter(e => e.equip.some(q => sh.eq.includes(q)));
    }
    if (sh.q) { const k = D.norm(sh.q); list = list.filter(e => D.norm(e.name).includes(k)); }
    return list.slice(0, 80);
  }
  function pickListHtml(sh) {
    sh.list = pickCompute(sh);
    if (!sh.list.length) return '<div class="empty" style="padding:20px 0"><p>Nenhum exercício com esses filtros. Remova um equipamento ou crie o seu próprio exercício abaixo.</p></div>';
    return sh.list.map((e, i) => '<button class="pick-row" data-act="pick" data-i="' + i + '"><b>' + esc(e.name) + '</b><small>' + esc(gLabel(e.group)) + ' · ' + (e.equip.length ? e.equip.map(q => D.EQUIP[q]).join(', ') : 'Livre') + ' · ' + e.sets + '×' + esc(e.reps) + (e.unit === 'sec' ? ' s' : '') + '</small></button>').join('');
  }

  const SHEETS = {
    pick(sh) {
      const eqChips = Object.keys(D.EQUIP).map(q => '<button class="chip" aria-pressed="' + sh.eq.includes(q) + '" data-act="pick-eq" data-q="' + q + '">' + D.EQUIP[q] + '</button>').join('');
      const grChips = sh.mode === 'add' ? '<div class="chips scroll"><button class="chip" aria-pressed="' + (sh.group === 'all') + '" data-act="pick-group" data-g="all">Todos</button>' +
        Object.keys(D.GROUPS).map(g => '<button class="chip" aria-pressed="' + (sh.group === g) + '" data-act="pick-group" data-g="' + g + '">' + D.GROUPS[g].label + '</button>').join('') + '</div>' : '';
      const intro = sh.mode === 'swap' ? '<p class="sub" style="margin-bottom:10px">Alternativas para <b>' + esc(sh.name) + '</b>. Marque o que sua academia tem.</p>' : '';
      pickListHtml(sh);
      return {
        title: sh.mode === 'swap' ? 'Substituir exercício' : 'Adicionar exercício',
        html: intro + '<input id="pick-q" class="field" type="search" data-in="pickQ" placeholder="Buscar exercício" value="' + esc(sh.q) + '" autocomplete="off">' + grChips +
          '<div class="chips scroll">' + eqChips + '</div><div id="pick-list">' + pickListHtml(sh) + '</div>' +
          '<div style="margin-top:14px"><button class="btn ghost" data-act="custom-open">' + ic('plus') + ' Criar exercício próprio</button></div>'
      };
    },
    swapchoice(sh) {
      return {
        title: 'Trocar exercício', html: '<p class="sub" style="margin-bottom:16px">Trocar <b>' + esc(sh.exName) + '</b> por <b>' + esc(sh.entry.name) + '</b>. O histórico de ' + esc(sh.exName) + ' continua guardado.</p>' +
          '<div class="stack"><button class="btn" data-act="swap-apply" data-perm="0">Só neste treino</button><button class="btn ghost" data-act="swap-apply" data-perm="1">Neste treino e na ficha</button></div>'
      };
    },
    custom(sh) {
      return {
        title: 'Exercício próprio', html: '<div class="form-grid"><div class="full"><label class="label" for="c-name">Nome</label><input id="c-name" class="field" placeholder="Ex.: Remada no TRX"></div>' +
          '<div class="full"><label class="label" for="c-group">Grupo muscular</label><select id="c-group" class="select">' + Object.keys(D.GROUPS).map(g => '<option value="' + g + '"' + (g === sh.group ? ' selected' : '') + '>' + D.GROUPS[g].label + '</option>').join('') + '</select></div>' +
          '<div><label class="label" for="c-sets">Séries</label><input id="c-sets" class="field" inputmode="numeric" value="3"></div><div><label class="label" for="c-reps">Repetições</label><input id="c-reps" class="field" value="10–12"></div>' +
          '<div class="full"><label class="label" for="c-unit">Medido em</label><select id="c-unit" class="select"><option value="reps">Repetições</option><option value="sec">Segundos</option></select></div></div>' +
          '<div style="margin-top:16px"><button class="btn" data-act="custom-save">Salvar exercício</button></div>'
      };
    },
    editex(sh) {
      const it = planItem(sh.id, sh.day);
      return {
        title: 'Editar exercício', html: '<div class="form-grid"><div class="full"><label class="label" for="e-name">Nome</label><input id="e-name" class="field" value="' + esc(it.name) + '"><p class="small" style="margin-top:6px">Mudar o nome cria um novo histórico. Para trocar por outro exercício sem perder o histórico, use o botão de substituir.</p></div>' +
          '<div><label class="label" for="e-sets">Séries</label><input id="e-sets" class="field" inputmode="numeric" value="' + it.sets + '"></div><div><label class="label" for="e-reps">Repetições</label><input id="e-reps" class="field" value="' + esc(it.reps) + '" placeholder="8–12"></div>' +
          '<div><label class="label" for="e-unit">Medido em</label><select id="e-unit" class="select"><option value="reps"' + (it.unit !== 'sec' ? ' selected' : '') + '>Repetições</option><option value="sec"' + (it.unit === 'sec' ? ' selected' : '') + '>Segundos</option></select></div>' +
          '<div><label class="label" for="e-note">Observação</label><input id="e-note" class="field" value="' + esc(it.note) + '" placeholder="por perna"></div></div>' +
          '<div style="margin-top:16px"><button class="btn" data-act="edit-save">Salvar</button></div>'
      };
    },
    exlist(sh) {
      const a = S.active;
      return {
        title: 'Exercícios do treino', html: a.exercises.map((e, k) => {
          const d = e.sets.filter(s => s.done).length;
          return '<button class="pick-row' + (k === a.cur ? ' sel' : '') + '" data-act="ex-go" data-i="' + k + '"><b>' + esc(e.name) + '</b><small>' + d + ' de ' + e.sets.length + ' séries concluídas</small></button>';
        }).join('')
      };
    },
    finish(sh) {
      const { fake, st } = finishSummary();
      if (!st.setsDone) {
        return { title: 'Finalizar treino', html: '<p class="sub" style="margin-bottom:16px">Você ainda não concluiu nenhuma série. Marque as séries feitas ou descarte este treino.</p><div class="stack"><button class="btn" data-act="sheet-close">Continuar treinando</button><button class="btn danger" data-act="discard">Descartar treino</button></div>' };
      }
      const pending = S.active.exercises.reduce((n, e) => n + e.sets.filter(s => !s.done).length, 0);
      return {
        title: 'Finalizar treino', html: '<h2 class="title">' + esc(S.active.title) + '</h2><div class="sum-grid"><div class="stat"><b>' + L.fmtDuration(fake.durationSec) + '</b><span>duração</span></div><div class="stat rose"><b>' + st.setsDone + '</b><span>séries</span></div><div class="stat"><b>' + st.exercisesDone + '</b><span>exercícios</span></div></div>' +
          (pending ? '<p class="small" style="margin-bottom:14px">' + pending + (pending === 1 ? ' série não marcada não será registrada.' : ' séries não marcadas não serão registradas.') + '</p>' : '') +
          '<div class="stack"><button class="btn big" data-act="finish-save">' + ic('check') + ' Salvar treino</button><button class="btn ghost" data-act="sheet-close">Continuar treinando</button></div>'
      };
    },
    restcustom(sh) {
      return { title: 'Tempo de descanso', html: '<label class="label" for="rc">Segundos</label><input id="rc" class="field" inputmode="numeric" value="' + S.settings.restDefault + '"><div class="chips" style="margin:12px 0">' + [45, 75, 105, 150, 180].map(v => '<button class="chip" data-act="rc-fill" data-s="' + v + '">' + v + ' s</button>').join('') + '</div><button class="btn" data-act="rc-save">Usar este tempo</button>' };
    },
    pickday(sh) {
      return {
        title: 'Escolher treino', html: '<p class="sub" style="margin-bottom:12px">Comece qualquer treino da sua ficha, por exemplo para repor um dia perdido.</p>' +
          D.DAY_ORDER.filter(k => S.plan.days[k].items.length).map(k => '<button class="pick-row" data-act="start-day" data-day="' + k + '"><b>' + esc(S.plan.days[k].title) + '</b><small>' + D.DAY_NAMES[k] + ' · ' + S.plan.days[k].items.length + ' exercícios</small></button>').join('')
      };
    },
    body(sh) {
      const e = sh.id ? S.body.find(x => x.id === sh.id) : null;
      const v = k => (e && e[k] != null ? L.inputNum(e[k]) : '');
      return {
        title: e ? 'Editar medição' : 'Nova medição', html: '<div class="form-grid"><div class="full"><label class="label" for="b-date">Data</label><input id="b-date" class="field" type="date" value="' + (e ? e.date : L.isoDate()) + '"></div>' +
          BODY_FIELDS.map(f => '<div><label class="label" for="b-' + f.k + '">' + f.label + '</label><div class="unit-field"><input id="b-' + f.k + '" class="field" inputmode="decimal" value="' + v(f.k) + '" placeholder="–"><span>' + f.unit + '</span></div></div>').join('') + '</div>' +
          '<p class="small" style="margin:10px 0 16px">Preencha só o que você mediu hoje.</p><div class="stack"><button class="btn" data-act="body-save">Salvar medição</button>' + (e ? '<button class="btn danger" data-act="body-del">' + ic('trash') + ' Excluir medição</button>' : '') + '</div>'
      };
    },
    cardio(sh) {
      const e = sh.id ? S.cardio.find(x => x.id === sh.id) : null;
      const mod = sh.modality, other = !MODALITIES.slice(0, -1).includes(mod);
      const dr = sh.draft || {
        min: e ? String(e.minutes) : '', km: e && e.distance != null ? L.inputNum(e.distance) : '',
        date: e ? e.date : L.isoDate(), note: e ? e.note : '', other: mod === 'Outra' ? '' : mod
      };
      return {
        title: e ? 'Editar cardio' : 'Registrar cardio', html: '<label class="label">Modalidade</label><div class="chips">' + MODALITIES.map(m => '<button class="chip" aria-pressed="' + ((m === 'Outra' && other) || m === mod) + '" data-act="cardio-mod" data-m="' + m + '">' + m + '</button>').join('') + '</div>' +
          (other ? '<input id="k-other" class="field" style="margin-top:10px" placeholder="Qual atividade?" value="' + esc(dr.other) + '">' : '') +
          '<div class="form-grid" style="margin-top:14px"><div><label class="label" for="k-min">Tempo</label><div class="unit-field"><input id="k-min" class="field" inputmode="numeric" value="' + esc(dr.min) + '" placeholder="30"><span>min</span></div></div>' +
          '<div><label class="label" for="k-km">Distância</label><div class="unit-field"><input id="k-km" class="field" inputmode="decimal" value="' + esc(dr.km) + '" placeholder="opcional"><span>km</span></div></div>' +
          '<div class="full"><label class="label">Intensidade</label><div class="chips">' + INTENSITIES.map(x => '<button class="chip" aria-pressed="' + (sh.intensity === x) + '" data-act="cardio-int" data-i="' + x + '">' + x + '</button>').join('') + '</div></div>' +
          '<div class="full"><label class="label" for="k-date">Data</label><input id="k-date" class="field" type="date" value="' + esc(dr.date) + '"></div>' +
          '<div class="full"><label class="label" for="k-note">Observação</label><input id="k-note" class="field" value="' + esc(dr.note) + '" placeholder="opcional"></div></div>' +
          '<div class="stack" style="margin-top:16px"><button class="btn" data-act="cardio-save">Salvar</button>' + (e ? '<button class="btn danger" data-act="cardio-del">' + ic('trash') + ' Excluir</button>' : '') + '</div>'
      };
    },
    import(sh) {
      const c = L.countBackup(S.pendingImport);
      return {
        title: 'Restaurar backup', html: '<p class="sub">Backup de ' + (c.exportedAt ? new Date(c.exportedAt).toLocaleDateString('pt-BR') : 'data desconhecida') + ' com <b>' + c.sessions + '</b> treinos, <b>' + c.body + '</b> medições e <b>' + c.cardio + '</b> cardios.</p>' +
          '<div class="stack" style="margin-top:16px"><button class="btn" data-act="import-go" data-mode="merge">Mesclar com meus dados atuais</button><p class="small" style="margin-top:-6px">Mantém o que você já tem e soma o que está no backup.</p>' +
          '<button class="btn danger" data-act="import-go" data-mode="replace">Substituir tudo pelo backup</button><p class="small" style="margin-top:-6px">Apaga os dados atuais deste aparelho.</p></div>'
      };
    }
  };

  /* ---------- backup ---------- */
  async function buildBackupNow() {
    const [kv, sessions, body, cardio] = await Promise.all(['kv', 'sessions', 'body', 'cardio'].map(s => DB.getAll(s)));
    return L.buildBackup({ kv, sessions, body, cardio, deviceId: S.meta.deviceId });
  }
  async function exportBackup(share) {
    try {
      const obj = await buildBackupNow();
      const json = JSON.stringify(obj, null, 1);
      const fname = 'projeto-shape-backup-' + L.isoDate() + '.json';
      if (share) {
        const file = new File([json], fname, { type: 'application/json' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: 'Backup Projeto Shape' });
        } else { toast('Compartilhamento não disponível aqui. Use “Baixar backup”.'); return; }
      } else {
        const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
        const a = document.createElement('a'); a.href = url; a.download = fname; document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
      }
      S.meta.lastBackupAt = Date.now(); saveMeta(); render();
      toast('Backup gerado: ' + fname);
    } catch (e) { if (e && e.name === 'AbortError') return; fail(e); }
  }
  async function applyImport(mode) {
    const obj = S.pendingImport; if (!obj) return;
    const d = obj.data;
    try {
      if (mode === 'replace') {
        for (const s of DB.STORES) await DB.clear(s);
        await DB.putMany('sessions', d.sessions); await DB.putMany('body', d.body); await DB.putMany('cardio', d.cardio);
        await DB.putMany('kv', d.kv.filter(r => r.id !== 'active' && r.id !== 'timer' && r.id !== 'meta'));
        await DB.put('kv', { id: 'meta', value: S.meta, updatedAt: stamp() });
        stopRest(); releaseWake();
      } else {
        const local = { sessions: await DB.getAll('sessions'), body: await DB.getAll('body'), cardio: await DB.getAll('cardio'), kv: await DB.getAll('kv') };
        await DB.putMany('sessions', L.mergeRecords(local.sessions, d.sessions));
        await DB.putMany('body', L.mergeRecords(local.body, d.body));
        await DB.putMany('cardio', L.mergeRecords(local.cardio, d.cardio));
        const inc = d.kv.filter(r => r.id !== 'active' && r.id !== 'timer' && r.id !== 'meta');
        await DB.putMany('kv', L.mergeRecords(local.kv, inc).filter(r => !['active', 'timer', 'meta'].includes(r.id) || local.kv.some(l => l.id === r.id)));
      }
      S.pendingImport = null;
      await loadAll(); closeSheet(); S.ui.planDay = new Date().getDay(); render();
      toast(mode === 'replace' ? 'Backup restaurado.' : 'Backup mesclado com seus dados.');
    } catch (e) { fail(e); }
  }

  /* =========================================================
     AÇÕES (cliques)
     ========================================================= */
  const gv = id => { const el = document.getElementById(id); return el ? el.value : ''; };
  const ACTS = {
    go: t => go(t.dataset.to),
    'start-day': t => startDay(+t.dataset.day),
    'pick-day': () => openSheet({ kind: 'pickday' }),
    'open-session': t => { S.ui.progTab = 'historico'; S.ui.openSession = t.dataset.id; go('evolucao'); },

    /* treino */
    'toggle-set': t => toggleSet(+t.dataset.k),
    'add-set': () => { const ex = S.active.exercises[S.active.cur]; ex.sets.push({ load: ex.sets.length ? ex.sets[ex.sets.length - 1].load : null, reps: null, done: false }); saveActiveNow(); render(); },
    'rm-set': () => { const ex = S.active.exercises[S.active.cur]; if (ex.sets.length > 1) { ex.sets.pop(); saveActiveNow(); render(); } },
    'ex-go': t => { S.active.cur = +t.dataset.i; saveActiveNow(); closeSheet(); render(); window.scrollTo(0, 0); },
    'ex-next': () => { if (S.active.cur < S.active.exercises.length - 1) { S.active.cur++; saveActiveNow(); render(); window.scrollTo(0, 0); } },
    'ex-prev': () => { if (S.active.cur > 0) { S.active.cur--; saveActiveNow(); render(); window.scrollTo(0, 0); } },
    'ex-list': () => openSheet({ kind: 'exlist' }),
    'finish-open': () => openSheet({ kind: 'finish' }),
    'finish-save': () => saveWorkout(),
    discard: () => discardWorkout(),
    'rest-default': t => { S.settings.restDefault = +t.dataset.s; saveSettings(); render(); },
    'rest-custom': () => openSheet({ kind: 'restcustom' }),
    'rc-fill': t => { document.getElementById('rc').value = t.dataset.s; },
    'rc-save': () => { const v = Math.round(L.parseNum(gv('rc')) || 0); if (v < 10 || v > 900) return toast('Informe um tempo entre 10 e 900 segundos.'); S.settings.restDefault = v; saveSettings(); closeSheet(); render(); },
    'rest-now': () => startRest(S.settings.restDefault),
    'rest-adj': t => adjustRest(+t.dataset.d),
    'rest-more': () => startRest(30),
    'rest-stop': () => stopRest(),
    'swap-open': () => {
      const ex = S.active.exercises[S.active.cur];
      if (ex.sets.some(s => s.done)) return toast('Troque o exercício antes de concluir séries.');
      openSheet({ kind: 'pick', mode: 'swap', ctx: 'workout', exIdx: S.active.cur, name: ex.name, group: ex.group, eq: [], q: '' });
    },
    'swap-apply': t => { const sh = S.sheet; swapInActive(sh.exIdx, sh.entry, t.dataset.perm === '1'); },

    /* ficha */
    'plan-day': t => { S.ui.planDay = +t.dataset.d; render(); },
    'pi-up': t => { const d = S.ui.planDay, a = dayItems(d), i = a.findIndex(x => x.id === t.dataset.id); S.plan.days[d].items = L.movePlan(a, i, i - 1); savePlan(); render(); },
    'pi-down': t => { const d = S.ui.planDay, a = dayItems(d), i = a.findIndex(x => x.id === t.dataset.id); S.plan.days[d].items = L.movePlan(a, i, i + 1); savePlan(); render(); },
    'pi-edit': t => openSheet({ kind: 'editex', id: t.dataset.id, day: S.ui.planDay }),
    'pi-swap': t => { const it = planItem(t.dataset.id, S.ui.planDay); openSheet({ kind: 'pick', mode: 'swap', ctx: 'plan', id: it.id, day: S.ui.planDay, name: it.name, group: it.group, eq: [], q: '' }); },
    'pi-del': async t => {
      const it = planItem(t.dataset.id, S.ui.planDay);
      if (await ask({ title: 'Excluir exercício?', msg: it.name + ' sai da ficha. O histórico de cargas continua guardado.', ok: 'Excluir', danger: true })) {
        S.plan.days[S.ui.planDay].items = dayItems(S.ui.planDay).filter(x => x.id !== it.id); savePlan(); render(); toast('Exercício excluído da ficha.');
      }
    },
    'pi-revert': t => {
      const it = planItem(t.dataset.id, S.ui.planDay); if (!it || !it.baseName) return;
      const lib = D.findByName(it.baseName, customPool());
      it.name = it.baseName; delete it.baseName;
      if (lib) { it.group = lib.group; it.unit = lib.unit; it.note = lib.note; }
      savePlan(); render(); toast('Voltou ao exercício original.');
    },
    'pi-add': () => openSheet({ kind: 'pick', mode: 'add', ctx: 'plan', group: 'all', eq: [], q: '' }),
    'pick-eq': t => { const sh = S.sheet, q = t.dataset.q; sh.eq = sh.eq.includes(q) ? sh.eq.filter(x => x !== q) : sh.eq.concat(q); sh.keepScroll = true; renderSheet(); },
    'pick-group': t => { S.sheet.group = t.dataset.g; renderSheet(); },
    pick: t => {
      const sh = S.sheet, e = sh.list[+t.dataset.i]; if (!e) return;
      if (sh.mode === 'add') { addToDay(e); closeSheet(); }
      else chooseSwap(e);
    },
    'custom-open': () => { const sh = S.sheet; openSheet({ kind: 'custom', from: sh.mode, ctx: sh.ctx, group: sh.group === 'all' ? 'quadriceps' : sh.group, prev: sh }); },
    'custom-save': () => {
      const name = gv('c-name').trim(); if (!name) return toast('Dê um nome ao exercício.');
      const sets = Math.max(1, Math.min(10, Math.round(L.parseNum(gv('c-sets')) || 3)));
      const e = { name, group: gv('c-group'), equip: [], sets, reps: gv('c-reps').trim() || '10–12', unit: gv('c-unit') };
      if (!S.custom.some(c => D.norm(c.name) === D.norm(name))) { S.custom.push(e); saveCustom(); }
      const prev = S.sheet.prev; closeSheet();
      if (prev.mode === 'add') addToDay(Object.assign({ pattern: 'custom', note: '' }, e));
      else { S.sheet = prev; chooseSwap(Object.assign({ pattern: 'custom', note: '' }, e)); }
    },
    'edit-save': () => {
      const sh = S.sheet, it = planItem(sh.id, sh.day);
      const name = gv('e-name').trim(); if (!name) return toast('O exercício precisa de um nome.');
      const reps = gv('e-reps').trim(); if (!/\d/.test(reps)) return toast('Informe as repetições, por exemplo 8–12.');
      it.name = name; it.sets = Math.max(1, Math.min(10, Math.round(L.parseNum(gv('e-sets')) || it.sets)));
      it.reps = reps; it.unit = gv('e-unit'); it.note = gv('e-note').trim();
      savePlan(); closeSheet(); render(); toast('Exercício atualizado.');
    },

    /* evolução */
    'prog-tab': t => { S.ui.progTab = t.dataset.tab; render(); },
    metric: t => { S.ui.metric = t.dataset.m; render(); },
    'toggle-session': t => { S.ui.openSession = S.ui.openSession === t.dataset.id ? null : t.dataset.id; render(); },
    'del-session': async t => {
      const s = S.sessions.find(x => x.id === t.dataset.id);
      if (await ask({ title: 'Excluir treino?', msg: 'O treino de ' + L.fmtFull(s.date) + ' e suas cargas serão removidos da evolução.', ok: 'Excluir', danger: true })) { softDelete('sessions', s); S.ui.openSession = null; render(); toast('Treino excluído.'); }
    },
    'body-add': () => openSheet({ kind: 'body' }),
    'body-edit': t => openSheet({ kind: 'body', id: t.dataset.id }),
    'body-metric': t => { S.ui.bodyMetric = t.dataset.m; render(); },
    'body-save': () => {
      const sh = S.sheet, date = gv('b-date'); if (!date) return toast('Informe a data.');
      const rec = sh.id ? S.body.find(x => x.id === sh.id) : { id: L.uid(), createdAt: stamp() };
      let any = false;
      for (const f of BODY_FIELDS) {
        const raw = gv('b-' + f.k).trim(), n = L.parseNum(raw);
        if (raw && (n == null || n <= 0 || n > 500)) return toast('Valor inválido em ' + f.label.toLowerCase() + '.');
        rec[f.k] = raw ? n : null; if (raw) any = true;
      }
      if (!any) return toast('Preencha pelo menos uma medida.');
      rec.date = date; if (!sh.id) S.body.push(rec);
      saveRec('body', rec); closeSheet(); render(); toast('Medição salva.');
    },
    'body-del': async () => {
      const rec = S.body.find(x => x.id === S.sheet.id);
      if (await ask({ title: 'Excluir medição?', msg: 'A medição de ' + L.fmtFull(rec.date) + ' será removida.', ok: 'Excluir', danger: true })) { softDelete('body', rec); closeSheet(); render(); toast('Medição excluída.'); }
    },

    /* cardio */
    'cardio-add': () => openSheet({ kind: 'cardio', modality: 'Esteira', intensity: 'Moderada' }),
    'cardio-edit': t => { const e = S.cardio.find(x => x.id === t.dataset.id); openSheet({ kind: 'cardio', id: e.id, modality: e.modality, intensity: e.intensity || '' }); },
    'cardio-mod': t => { const sh = S.sheet; snapCardio(sh); sh.modality = t.dataset.m; sh.keepScroll = true; renderSheet(); },
    'cardio-int': t => { const sh = S.sheet; snapCardio(sh); sh.intensity = sh.intensity === t.dataset.i ? '' : t.dataset.i; sh.keepScroll = true; renderSheet(); },
    'cardio-save': () => {
      const sh = S.sheet, el = document.getElementById('k-other');
      let modality = sh.modality; if (el) modality = el.value.trim() || 'Outra';
      const minutes = Math.round(L.parseNum(gv('k-min')) || 0); if (minutes < 1 || minutes > 600) return toast('Informe o tempo em minutos.');
      const kmRaw = gv('k-km').trim(), km = L.parseNum(kmRaw); if (kmRaw && (km == null || km > 500)) return toast('Distância inválida.');
      const date = gv('k-date'); if (!date) return toast('Informe a data.');
      const rec = sh.id ? S.cardio.find(x => x.id === sh.id) : { id: L.uid(), createdAt: stamp() };
      Object.assign(rec, { modality, minutes, distance: kmRaw ? km : null, intensity: sh.intensity || '', date, note: gv('k-note').trim() });
      if (!sh.id) S.cardio.push(rec);
      saveRec('cardio', rec); closeSheet(); render(); toast('Cardio salvo.');
    },
    'cardio-del': async () => {
      const rec = S.cardio.find(x => x.id === S.sheet.id);
      if (await ask({ title: 'Excluir atividade?', msg: 'O cardio de ' + L.fmtFull(rec.date) + ' será removido.', ok: 'Excluir', danger: true })) { softDelete('cardio', rec); closeSheet(); render(); toast('Atividade excluída.'); }
    },

    /* mais */
    export: () => exportBackup(false),
    'export-share': () => exportBackup(true),
    'import-pick': () => $('#file-in').click(),
    'import-go': async t => {
      if (t.dataset.mode === 'replace') {
        const ok = await ask({ title: 'Substituir tudo?', msg: 'Todos os dados atuais deste aparelho serão apagados e trocados pelos do backup' + (S.active ? ', e o treino em andamento será encerrado' : '') + '.', ok: 'Substituir', danger: true });
        if (!ok) return;
      }
      applyImport(t.dataset.mode);
    },
    install: async () => { const e = S.installEvt; if (!e) return; e.prompt(); try { await e.userChoice; } catch (x) { /* ignore */ } S.installEvt = null; render(); },
    'reset-plan': async () => {
      if (await ask({ title: 'Restaurar ficha original?', msg: 'A ficha volta para a divisão semanal inicial. Seu histórico de treinos não muda.', ok: 'Restaurar', danger: true })) { S.plan = D.defaultPlan(L.uid); savePlan(); render(); toast('Ficha original restaurada.'); }
    },
    'reset-all': async () => {
      if (!(await ask({ title: 'Apagar todos os dados?', msg: 'Treinos, cargas, medidas, cardio e ficha serão apagados deste aparelho.', ok: 'Continuar', danger: true }))) return;
      if (!(await ask({ title: 'Tem certeza?', msg: 'Isso não pode ser desfeito. Se quiser guardar seus dados, cancele e baixe um backup antes.', ok: 'Apagar tudo', danger: true }))) return;
      try { for (const s of DB.STORES) await DB.clear(s); S.active = null; stopRest(); releaseWake(); await loadAll(); S.ui.planDay = new Date().getDay(); go('home'); render(); toast('Dados apagados.'); } catch (e) { fail(e); }
    },

    /* folhas e diálogos */
    'sheet-close': () => closeSheet(),
    'dlg-yes': () => closeDlg(true),
    'dlg-no': () => closeDlg(false)
  };

  function snapCardio(sh) {
    const o = document.getElementById('k-other');
    sh.draft = { min: gv('k-min'), km: gv('k-km'), date: gv('k-date') || L.isoDate(), note: gv('k-note'), other: o ? o.value : '' };
  }

  function chooseSwap(e) {
    const sh = S.sheet;
    if (sh.ctx === 'plan') {
      const it = planItem(sh.id, sh.day); if (!it) return;
      swapInPlan(it, e); savePlan(); closeSheet(); render(); toast('Exercício substituído. O histórico do original continua guardado.');
    } else {
      const ex = S.active.exercises[sh.exIdx];
      openSheet({ kind: 'swapchoice', exIdx: sh.exIdx, exName: ex.name, entry: e });
    }
  }

  /* ---------- campos ---------- */
  const ON_INPUT = {
    load: t => { S.active.exercises[S.active.cur].sets[+t.dataset.k].load = L.parseNum(t.value); saveActiveSoon(); },
    reps: t => { S.active.exercises[S.active.cur].sets[+t.dataset.k].reps = L.parseNum(t.value); saveActiveSoon(); },
    memo: t => { const ex = S.active.exercises[S.active.cur], k = L.normName(ex.name); if (t.value.trim()) S.memos[k] = t.value; else delete S.memos[k]; debounce('memo', () => saveKV('memos', S.memos), 500); },
    dayTitle: t => { S.plan.days[S.ui.planDay].title = t.value; debounce('plan', savePlan, 500); },
    pickQ: t => { const sh = S.sheet; sh.q = t.value.trim(); $('#pick-list').innerHTML = pickListHtml(sh); },
    setting: t => { if (t.type === 'checkbox' || t.tagName === 'SELECT') return; S.settings[t.dataset.key] = t.value; debounce('settings', saveSettings, 500); }
  };
  const ON_CHANGE = {
    exSel: t => { S.ui.exKey = t.value; render(); },
    setting: t => {
      const k = t.dataset.key;
      if (t.type === 'checkbox') S.settings[k] = t.checked;
      else if (t.tagName === 'SELECT') S.settings[k] = +t.value;
      else S.settings[k] = t.value;
      saveSettings();
      if (k === 'sound' && t.checked) { unlockAudio(); beep(); }
    },
    importFile: async t => {
      const f = t.files && t.files[0]; if (!f) return;
      let obj; try { obj = JSON.parse(await f.text()); } catch (e) { t.value = ''; return toast('Não consegui ler este arquivo. Escolha um backup .json do Projeto Shape.'); }
      t.value = '';
      const v = L.validateBackup(obj); if (!v.ok) return toast(v.error);
      S.pendingImport = obj; openSheet({ kind: 'import' });
    },
    pickQ: () => {}
  };

  document.addEventListener('click', e => {
    const tipG = e.target.closest('[data-tip]');
    if (tipG && !e.target.closest('[data-act]')) {
      const chart = tipG.closest('.chart');
      if (chart) {
        chart.querySelector('.chart-cap').textContent = tipG.getAttribute('data-tip');
        $$('g.sel', chart).forEach(x => x.classList.remove('sel')); tipG.classList.add('sel');
      }
      return;
    }
    const t = e.target.closest('[data-act]'); if (!t) return;
    const fn = ACTS[t.dataset.act]; if (!fn) return;
    unlockAudio();
    try { const r = fn(t, e); if (r && r.catch) r.catch(fail); } catch (err) { console.error(err); toast('Algo deu errado. Tente novamente.'); }
  });
  document.addEventListener('input', e => { const k = e.target.dataset && e.target.dataset.in; if (k && ON_INPUT[k]) ON_INPUT[k](e.target, e); });
  document.addEventListener('change', e => { const k = e.target.dataset && e.target.dataset.in; if (k && ON_CHANGE[k]) ON_CHANGE[k](e.target, e); });
  document.addEventListener('pointerdown', unlockAudio, { passive: true });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { if (S.dlg) closeDlg(false); else if (S.sheet) closeSheet(); }
    if (e.key === 'Enter' && e.target.matches && e.target.matches('.set input')) { e.target.blur(); }
  });
  window.addEventListener('hashchange', render);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') saveActiveNow();
    else { tick(); wantWake(); }
  });
  window.addEventListener('pagehide', saveActiveNow);
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); S.installEvt = e; if (S.route === 'mais') render(); });
  window.addEventListener('appinstalled', () => { S.installEvt = null; if (S.route === 'mais') render(); });

  /* ---------- início ---------- */
  async function init() {
    try {
      const o = await DB.open(); S.dbMode = o.mode;
      await loadAll();
    } catch (e) {
      console.error(e);
      $('#boot').textContent = 'Não consegui abrir o armazenamento. Feche outras abas do app e recarregue.';
      return;
    }
    try {
      if (navigator.storage && navigator.storage.persist) {
        navigator.storage.persist().then(g => { S.persisted = g; }).catch(() => {});
        navigator.storage.persisted().then(p => { S.persisted = p; }).catch(() => {});
      }
    } catch (e) { /* ignore */ }
    render(); renderTimerBar();
    setInterval(tick, 500);
    $('#boot').classList.add('gone'); setTimeout(() => { const b = $('#boot'); if (b) b.remove(); }, 400);
    if (S.dbMode !== 'idb') toast('Armazenamento básico em uso. Faça backups com frequência.');

    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
      const hadController = !!navigator.serviceWorker.controller;
      navigator.serviceWorker.register('sw.js').catch(() => {});
      navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadController) toast('App atualizado. Feche e abra de novo para usar a versão nova.'); });
    }
  }

  window.__shape = { S, L, D, go, startDay, render }; // facilita testes e depuração
  init();
})();
