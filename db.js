/* Projeto Shape — armazenamento persistente em IndexedDB (com reserva em localStorage).
 * Lojas: kv (configurações/ficha), sessions (treinos), body (medidas), cardio.
 * Todos os registros têm { id, updatedAt } para permitir sincronização futura. */
(function (root) {
  'use strict';
  const NAME = 'projeto-shape';
  const VERSION = 1;
  const STORES = ['kv', 'sessions', 'body', 'cardio'];
  let idb = null;
  let mode = 'idb'; // 'idb' | 'ls'

  function reqP(r) {
    return new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  }

  /* ----- reserva: localStorage ----- */
  const lsKey = s => 'shape:' + s;
  function lsRead(store) {
    try { return JSON.parse(localStorage.getItem(lsKey(store)) || '{}'); } catch (e) { return {}; }
  }
  function lsWrite(store, obj) { localStorage.setItem(lsKey(store), JSON.stringify(obj)); }

  function open() {
    return new Promise(resolve => {
      if (typeof indexedDB === 'undefined') { mode = 'ls'; return resolve({ mode }); }
      let req;
      try { req = indexedDB.open(NAME, VERSION); } catch (e) { mode = 'ls'; return resolve({ mode }); }
      req.onupgradeneeded = () => {
        const db = req.result;
        STORES.forEach(s => { if (!db.objectStoreNames.contains(s)) db.createObjectStore(s, { keyPath: 'id' }); });
      };
      req.onsuccess = () => {
        idb = req.result;
        idb.onversionchange = () => { idb.close(); };
        resolve({ mode });
      };
      req.onerror = () => { mode = 'ls'; resolve({ mode }); };
      req.onblocked = () => { /* outra aba antiga aberta; segue tentando */ };
    });
  }

  async function getAll(store) {
    if (mode === 'ls') return Object.values(lsRead(store));
    return reqP(idb.transaction(store, 'readonly').objectStore(store).getAll());
  }

  function putMany(store, recs) {
    if (mode === 'ls') {
      try { const o = lsRead(store); recs.forEach(r => { o[r.id] = r; }); lsWrite(store, o); return Promise.resolve(); }
      catch (e) { return Promise.reject(e); }
    }
    return new Promise((res, rej) => {
      const t = idb.transaction(store, 'readwrite');
      const st = t.objectStore(store);
      recs.forEach(r => st.put(r));
      t.oncomplete = () => res();
      t.onerror = () => rej(t.error);
      t.onabort = () => rej(t.error || new Error('Transação cancelada'));
    });
  }
  const put = (store, rec) => putMany(store, [rec]);

  function del(store, id) {
    if (mode === 'ls') {
      try { const o = lsRead(store); delete o[id]; lsWrite(store, o); return Promise.resolve(); }
      catch (e) { return Promise.reject(e); }
    }
    return new Promise((res, rej) => {
      const t = idb.transaction(store, 'readwrite');
      t.objectStore(store).delete(id);
      t.oncomplete = () => res();
      t.onerror = () => rej(t.error);
      t.onabort = () => rej(t.error || new Error('Transação cancelada'));
    });
  }

  function clear(store) {
    if (mode === 'ls') { try { lsWrite(store, {}); return Promise.resolve(); } catch (e) { return Promise.reject(e); } }
    return new Promise((res, rej) => {
      const t = idb.transaction(store, 'readwrite');
      t.objectStore(store).clear();
      t.oncomplete = () => res();
      t.onerror = () => rej(t.error);
      t.onabort = () => rej(t.error || new Error('Transação cancelada'));
    });
  }

  root.ShapeDB = { STORES, open, getAll, put, putMany, del, clear, get mode() { return mode; } };
})(typeof self !== 'undefined' ? self : this);
