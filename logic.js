/* Projeto Shape — lógica pura (sem DOM): datas, cálculos, histórico, backup. Testável em Node. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ShapeLogic = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const BACKUP_VERSION = 1;
  const APP_ID = 'projeto-shape';

  /* ---------- util ---------- */
  const pad = n => String(n).padStart(2, '0');
  function uid() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
  }
  function normName(s) {
    return String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
  }

  /* ---------- datas (sempre no fuso local) ---------- */
  function isoDate(d) {
    d = d || new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function parseISO(s) { const p = String(s).split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); }
  function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
  function weekStart(d) {
    const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); // segunda-feira
    return x;
  }
  function daysBetween(a, b) {
    return Math.round((Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) - Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) / 86400000);
  }
  function fmtShort(iso) { const p = iso.split('-'); return p[2] + '/' + p[1]; }
  function fmtFull(iso) { const p = iso.split('-'); return p[2] + '/' + p[1] + '/' + p[0]; }
  function relDay(iso, today) {
    const n = daysBetween(parseISO(iso), today || new Date());
    if (n <= 0) return 'hoje';
    if (n === 1) return 'ontem';
    return 'há ' + n + ' dias';
  }
  function longDate(d) {
    const s = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(d);
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  function monthLabel(iso) {
    const d = parseISO(iso);
    const s = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(d);
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  /* ---------- números ---------- */
  function parseNum(v) {
    if (v == null) return null;
    if (typeof v === 'number') return isFinite(v) && v >= 0 ? v : null;
    const s = String(v).trim().replace(/\s/g, '').replace(',', '.');
    if (s === '') return null;
    const n = Number(s);
    return isFinite(n) && n >= 0 ? n : null;
  }
  function fmtNum(n, max) {
    if (n == null || isNaN(n)) return '–';
    return Number(n).toLocaleString('pt-BR', { maximumFractionDigits: max == null ? 2 : max });
  }
  function inputNum(n) { return n == null ? '' : String(n).replace('.', ','); }
  function fmtClock(sec) {
    sec = Math.max(0, Math.ceil(sec));
    return pad(Math.floor(sec / 60)) + ':' + pad(sec % 60);
  }
  function fmtElapsed(sec) {
    sec = Math.max(0, Math.floor(sec));
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    return h > 0 ? h + ':' + pad(m) + ':' + pad(s) : pad(m) + ':' + pad(s);
  }
  function fmtDuration(sec) {
    sec = Math.round(sec || 0);
    if (sec < 60) return sec + ' s';
    if (sec < 3600) return Math.round(sec / 60) + ' min';
    const h = Math.floor(sec / 3600), m = Math.round((sec % 3600) / 60);
    return m === 60 ? (h + 1) + 'h00' : h + 'h' + pad(m);
  }
  function repRange(s) {
    const n = (String(s == null ? '' : s).match(/\d+/g) || []).map(Number);
    if (!n.length) return { min: null, max: null };
    return { min: n[0], max: n.length > 1 ? n[1] : n[0] };
  }
  function repsLabel(ex) {
    return ex.reps + (ex.unit === 'sec' ? ' s' : '') + (ex.note ? ' ' + ex.note : '');
  }

  /* ---------- séries e sessões ---------- */
  const doneSets = ex => (ex.sets || []).filter(s => s.done);

  function sessionStats(s) {
    let exercisesDone = 0, setsDone = 0, volume = 0;
    (s.exercises || []).forEach(ex => {
      const d = doneSets(ex);
      if (d.length) exercisesDone++;
      d.forEach(x => { setsDone++; volume += (x.load || 0) * (x.reps || 0); });
    });
    return { exercisesDone, setsDone, volume };
  }

  function finalizeSession(active, endedAt) {
    const exercises = active.exercises.map(ex => ({
      planId: ex.planId, name: ex.name, origName: ex.origName || null, group: ex.group,
      unit: ex.unit || 'reps', repsTarget: ex.reps, setsPlanned: ex.setsPlanned, note: ex.note || '',
      sets: ex.sets.map(s => ({ load: parseNum(s.load), reps: parseNum(s.reps), done: !!s.done }))
    }));
    return {
      id: active.id, date: active.date, startedAt: active.startedAt, endedAt,
      durationSec: Math.max(1, Math.round((endedAt - active.startedAt) / 1000)),
      dayIdx: active.dayIdx, title: active.title, exercises,
      createdAt: active.startedAt, updatedAt: endedAt
    };
  }

  function estimateMinutes(items, restSec) {
    const sets = items.reduce((a, i) => a + (Number(i.sets) || 0), 0);
    const raw = (sets * (45 + (restSec || 90))) / 60;
    return Math.max(5, Math.round(raw / 5) * 5);
  }

  /* ---------- histórico por exercício ---------- */
  function lastPerformance(sessions, name, excludeId) {
    const key = normName(name);
    let best = null;
    sessions.forEach(s => {
      if (s.deleted || s.id === excludeId) return;
      (s.exercises || []).forEach(ex => {
        if (normName(ex.name) !== key) return;
        const d = doneSets(ex);
        if (!d.length) return;
        if (!best || s.startedAt > best.startedAt) {
          best = { sessionId: s.id, date: s.date, startedAt: s.startedAt, unit: ex.unit || 'reps', sets: d.map(x => ({ load: x.load, reps: x.reps })) };
        }
      });
    });
    return best;
  }

  function e1rm(load, reps) { return load > 0 && reps > 0 ? load * (1 + reps / 30) : 0; }

  /** Mapa nomeNormalizado → { name, entries:[{date,startedAt,sessionId,top,volume,e1rm,sets}] } (ordem cronológica). */
  function historyByExercise(sessions) {
    const map = {};
    sessions.filter(s => !s.deleted).sort((a, b) => a.startedAt - b.startedAt).forEach(s => {
      (s.exercises || []).forEach(ex => {
        const d = doneSets(ex);
        if (!d.length) return;
        const key = normName(ex.name);
        const h = map[key] || (map[key] = { key, name: ex.name, unit: ex.unit || 'reps', entries: [] });
        h.name = ex.name;
        let top = 0, volume = 0, best1 = 0;
        d.forEach(x => {
          top = Math.max(top, x.load || 0);
          volume += (x.load || 0) * (x.reps || 0);
          best1 = Math.max(best1, e1rm(x.load, x.reps));
        });
        h.entries.push({ date: s.date, startedAt: s.startedAt, sessionId: s.id, top, volume, e1rm: best1, sets: d.map(x => ({ load: x.load, reps: x.reps })) });
      });
    });
    return map;
  }

  function personalBest(entries) {
    let best = null;
    entries.forEach(e => e.sets.forEach(s => {
      if (s.load == null) return;
      if (!best || s.load > best.load || (s.load === best.load && (s.reps || 0) > (best.reps || 0))) best = { load: s.load, reps: s.reps, date: e.date };
    }));
    return best;
  }

  function suggestProgression(last, rng, unit) {
    if (!last || unit === 'sec' || rng.max == null) return null;
    const sets = last.sets.filter(s => s.reps != null);
    if (!sets.length) return null;
    if (sets.every(s => s.reps >= rng.max))
      return { type: 'up', text: 'Na última vez você chegou a ' + rng.max + ' repetições em todas as séries. Que tal subir a carga hoje?' };
    if (sets.some(s => s.reps < rng.min))
      return { type: 'hold', text: 'Algumas séries ficaram abaixo de ' + rng.min + ' repetições. Mantenha a carga e busque mais repetições.' };
    return null;
  }

  /* ---------- semana / frequência ---------- */
  function weeklyCounts(sessions, n, today) {
    const ws0 = weekStart(today || new Date());
    const out = [];
    for (let i = n - 1; i >= 0; i--) {
      const start = addDays(ws0, -7 * i);
      const end = addDays(start, 7);
      const si = isoDate(start), ei = isoDate(end);
      out.push({ start: si, label: fmtShort(si), count: sessions.filter(s => !s.deleted && s.date >= si && s.date < ei).length });
    }
    return out;
  }
  function weeklyMinutes(items, n, today) {
    const ws0 = weekStart(today || new Date());
    const out = [];
    for (let i = n - 1; i >= 0; i--) {
      const start = addDays(ws0, -7 * i), end = addDays(start, 7);
      const si = isoDate(start), ei = isoDate(end);
      const inW = items.filter(c => !c.deleted && c.date >= si && c.date < ei);
      out.push({ start: si, label: fmtShort(si), minutes: inW.reduce((a, c) => a + (c.minutes || 0), 0), km: inW.reduce((a, c) => a + (c.distance || 0), 0), count: inW.length });
    }
    return out;
  }
  function weekDays(sessions, plan, today) {
    const ws0 = weekStart(today);
    const todayIso = isoDate(today);
    const out = [];
    for (let i = 0; i < 7; i++) {
      const d = addDays(ws0, i), iso = isoDate(d), dow = d.getDay();
      out.push({
        iso, dow, isToday: iso === todayIso, future: iso > todayIso,
        trained: sessions.some(s => !s.deleted && s.date === iso),
        planned: !!(plan.days[dow] && plan.days[dow].items.length)
      });
    }
    return out;
  }
  function sessionsInWeek(sessions, today) {
    const si = isoDate(weekStart(today)), ei = isoDate(addDays(weekStart(today), 7));
    return sessions.filter(s => !s.deleted && s.date >= si && s.date < ei);
  }

  /* ---------- medidas corporais ---------- */
  function bodyDelta(entries, field) {
    const list = entries.filter(e => !e.deleted && e[field] != null).sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt);
    if (!list.length) return null;
    const latest = list[list.length - 1], first = list[0], prev = list.length > 1 ? list[list.length - 2] : null;
    return {
      latest: latest[field], date: latest.date,
      diffPrev: prev ? +(latest[field] - prev[field]).toFixed(2) : null,
      diffFirst: list.length > 1 ? +(latest[field] - first[field]).toFixed(2) : null,
      count: list.length
    };
  }

  /* ---------- ficha ---------- */
  function movePlan(arr, from, to) {
    if (to < 0 || to >= arr.length || from === to) return arr;
    const a = arr.slice(); const [x] = a.splice(from, 1); a.splice(to, 0, x); return a;
  }

  /* ---------- backup (estrutura pronta para sincronização: id + updatedAt + exclusão lógica) ---------- */
  const TRANSIENT_KV = ['active', 'timer'];

  function buildBackup(parts) {
    return {
      app: APP_ID, version: BACKUP_VERSION, exportedAt: new Date(parts.now || Date.now()).toISOString(),
      deviceId: parts.deviceId || null,
      data: {
        kv: (parts.kv || []).filter(r => !TRANSIENT_KV.includes(r.id) && r.id !== 'meta'),
        sessions: parts.sessions || [], body: parts.body || [], cardio: parts.cardio || []
      }
    };
  }

  function validateBackup(obj) {
    if (!obj || typeof obj !== 'object') return { ok: false, error: 'Arquivo inválido.' };
    if (obj.app !== APP_ID) return { ok: false, error: 'Este arquivo não é um backup do Projeto Shape.' };
    if (typeof obj.version !== 'number' || obj.version > BACKUP_VERSION) return { ok: false, error: 'Versão de backup não suportada. Atualize o aplicativo.' };
    const d = obj.data;
    if (!d || typeof d !== 'object') return { ok: false, error: 'Backup sem dados.' };
    for (const k of ['kv', 'sessions', 'body', 'cardio']) {
      if (!Array.isArray(d[k])) return { ok: false, error: 'Backup incompleto (faltando "' + k + '").' };
      if (!d[k].every(r => r && typeof r === 'object' && typeof r.id === 'string')) return { ok: false, error: 'Backup com registros inválidos em "' + k + '".' };
    }
    return { ok: true };
  }

  function mergeRecords(local, incoming) {
    const map = new Map(local.map(r => [r.id, r]));
    incoming.forEach(r => {
      const cur = map.get(r.id);
      if (!cur || (r.updatedAt || 0) > (cur.updatedAt || 0)) map.set(r.id, r);
    });
    return Array.from(map.values());
  }

  function countBackup(obj) {
    const d = obj.data;
    return {
      sessions: d.sessions.filter(r => !r.deleted).length,
      body: d.body.filter(r => !r.deleted).length,
      cardio: d.cardio.filter(r => !r.deleted).length,
      exportedAt: obj.exportedAt
    };
  }

  return {
    BACKUP_VERSION, uid, normName, pad,
    isoDate, parseISO, addDays, weekStart, daysBetween, fmtShort, fmtFull, relDay, longDate, monthLabel,
    parseNum, fmtNum, inputNum, fmtClock, fmtElapsed, fmtDuration, repRange, repsLabel,
    doneSets, sessionStats, finalizeSession, estimateMinutes,
    lastPerformance, e1rm, historyByExercise, personalBest, suggestProgression,
    weeklyCounts, weeklyMinutes, weekDays, sessionsInWeek, bodyDelta, movePlan,
    buildBackup, validateBackup, mergeRecords, countBackup
  };
});
