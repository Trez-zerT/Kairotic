const DB_NAME = 'kairotic';
const DB_VERSION = 1;

let _db = null;

function openDB() {
  return new Promise((resolve, reject) => {
    if (_db) return resolve(_db);
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('entries')) {
        const store = db.createObjectStore('entries', { keyPath: 'id', autoIncrement: true });
        store.createIndex('date', 'date', { unique: false });
      }
      if (!db.objectStoreNames.contains('config')) db.createObjectStore('config');
      if (!db.objectStoreNames.contains('comments')) db.createObjectStore('comments');
      if (!db.objectStoreNames.contains('timerState')) db.createObjectStore('timerState');
    };
    req.onsuccess = (e) => { _db = e.target.result; resolve(_db); };
    req.onerror = () => reject(req.error);
  });
}

const db = {
  async entriesByDate(dateStr) {
    const d = await openDB();
    return new Promise((resolve, reject) => {
      const req = d.transaction('entries', 'readonly').objectStore('entries').getAll();
      req.onsuccess = () => {
        const entries = (req.result || []).filter(e => e.date === dateStr).sort((a, b) => (a.start||'').localeCompare(b.start||''));
        resolve(entries);
      };
      req.onerror = () => reject(req.error);
    });
  },

  async allEntries() {
    const d = await openDB();
    return new Promise((resolve, reject) => {
      const req = d.transaction('entries', 'readonly').objectStore('entries').getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },

  async addEntry(entry) {
    const d = await openDB();
    return new Promise((resolve, reject) => {
      const req = d.transaction('entries', 'readwrite').objectStore('entries').add(entry);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },

  async updateEntry(id, entry) {
    const d = await openDB();
    return new Promise((resolve, reject) => {
      entry.id = id;
      const req = d.transaction('entries', 'readwrite').objectStore('entries').put(entry);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },

  async deleteEntry(id) {
    const d = await openDB();
    return new Promise((resolve, reject) => {
      const req = d.transaction('entries', 'readwrite').objectStore('entries').delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },

  async replaceDayEntries(dateStr, entries) {
    const d = await openDB();
    const existing = await db.entriesByDate(dateStr);
    const tx = d.transaction('entries', 'readwrite');
    const store = tx.objectStore('entries');
    return new Promise((resolve, reject) => {
      let pending = existing.length + entries.length;
      const done = () => { if (--pending <= 0) resolve(); };
      existing.forEach(e => { const r = store.delete(e.id); r.onsuccess = done; r.onerror = () => reject(r.error); });
      entries.forEach(e => { const r = store.add(e); r.onsuccess = done; r.onerror = () => reject(r.error); });
      if (pending <= 0) resolve();
    });
  },

  async getConfig() {
    const d = await openDB();
    return new Promise((resolve, reject) => {
      const req = d.transaction('config', 'readonly').objectStore('config').get('config');
      req.onsuccess = () => resolve(req.result || { weekly_target: 40, no_goal: false, show_daily: true, show_weekly: true, show_monthly: true, show_yearly: true, yearly_target: 0, vacation_days: 0 });
      req.onerror = () => reject(req.error);
    });
  },

  async saveConfig(cfg) {
    const d = await openDB();
    return new Promise((resolve, reject) => {
      const req = d.transaction('config', 'readwrite').objectStore('config').put(cfg, 'config');
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },

  async getComments() {
    const d = await openDB();
    return new Promise((resolve, reject) => {
      const req = d.transaction('comments', 'readonly').objectStore('comments').get('comments');
      req.onsuccess = () => resolve(req.result || ['Coding','Meeting','Research','Documentation','Testing','Debugging','Planning','Support','Review','Design']);
      req.onerror = () => reject(req.error);
    });
  },

  async saveComments(comments) {
    const d = await openDB();
    return new Promise((resolve, reject) => {
      const req = d.transaction('comments', 'readwrite').objectStore('comments').put(comments, 'comments');
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },

  async getTimerState() {
    const d = await openDB();
    return new Promise((resolve, reject) => {
      const req = d.transaction('timerState', 'readonly').objectStore('timerState').get('timer');
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  },

  async saveTimerState(state) {
    const d = await openDB();
    return new Promise((resolve, reject) => {
      const req = d.transaction('timerState', 'readwrite').objectStore('timerState').put(state, 'timer');
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },

  async clearTimerState() {
    const d = await openDB();
    return new Promise((resolve, reject) => {
      const req = d.transaction('timerState', 'readwrite').objectStore('timerState').delete('timer');
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },

  async importAll(data) {
    const d = await openDB();
    return new Promise((resolve, reject) => {
      const tx = d.transaction(['entries','config','comments'], 'readwrite');
      tx.objectStore('entries').clear();
      if (data.entries) data.entries.forEach(e => tx.objectStore('entries').add(e));
      if (data.config) tx.objectStore('config').put(data.config, 'config');
      if (data.recentComments) tx.objectStore('comments').put(data.recentComments, 'comments');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },
};
