const engine = {
  state: null,
  _saveTimer: null,
  _tickCbs: [],

  async init() {
    this.state = await db.getTimerState();
    if (this.state && this.state.running) this._startAutoSave();
    this._notify();
  },

  async start(comment, startTimeStr) {
    const now = new Date();
    const st = startTimeStr ? parseDateTime(startTimeStr) : now;
    this.state = {
      running: true,
      startTime: st.toISOString(),
      comment: comment || 'work',
      paused: false,
      pausedDuration: 0,
      pauseStart: null,
    };
    await db.saveTimerState(this.state);
    this._startAutoSave();
    this._notify();
    return this.state;
  },

  async togglePause() {
    if (!this.state || !this.state.running) return;
    if (this.state.paused) {
      const pauseMs = Date.now() - new Date(this.state.pauseStart).getTime();
      this.state.pausedDuration += pauseMs;
      this.state.paused = false;
      this.state.pauseStart = null;
    } else {
      this.state.paused = true;
      this.state.pauseStart = new Date().toISOString();
    }
    await db.saveTimerState(this.state);
    this._notify();
  },

  async stop() {
    if (!this.state || !this.state.running) return;
    const entry = this._buildEntry();
    entry.id = await db.addEntry(entry);
    await db.clearTimerState();
    this._stopAutoSave();
    this.state = null;
    this._notify();
    return entry;
  },

  async switchTask(comment) {
    if (!this.state || !this.state.running) return;
    const entry = this._buildEntry();
    entry.id = await db.addEntry(entry);
    this.state.startTime = new Date().toISOString();
    this.state.comment = comment || 'work';
    this.state.paused = false;
    this.state.pausedDuration = 0;
    this.state.pauseStart = null;
    await db.saveTimerState(this.state);
    this._notify();
  },

  getStatus() {
    if (!this.state || !this.state.running)
      return { running: false, paused: false, elapsed_ns: 0, comment: '' };
    return {
      running: true,
      paused: this.state.paused,
      elapsed_ns: this._computeElapsed() * 1e9,
      comment: this.state.comment || '',
    };
  },

  onTick(cb) { this._tickCbs.push(cb); },

  _computeElapsed() {
    const now = Date.now();
    const start = new Date(this.state.startTime).getTime();
    let elapsed = now - start - this.state.pausedDuration;
    if (this.state.paused && this.state.pauseStart)
      elapsed -= now - new Date(this.state.pauseStart).getTime();
    return Math.max(0, Math.floor(elapsed / 1000));
  },

  _buildEntry() {
    const end = new Date();
    const start = new Date(this.state.startTime);
    const elapsedSec = (end.getTime() - start.getTime() - this.state.pausedDuration) / 1000;
    return {
      date: fmtDate(start),
      start: start.toTimeString().slice(0, 8),
      end: end.toTimeString().slice(0, 8),
      duration: fmtDuration(elapsedSec),
      comment: this.state.comment || 'work',
      createdAt: new Date().toISOString(),
    };
  },

  _startAutoSave() {
    this._stopAutoSave();
    this._saveTimer = setInterval(async () => {
      if (this.state && this.state.running) await db.saveTimerState(this.state);
    }, 10000);
  },

  _stopAutoSave() {
    if (this._saveTimer) { clearInterval(this._saveTimer); this._saveTimer = null; }
  },

  _notify() { this._tickCbs.forEach(cb => cb(this.getStatus())); },

  async buildReports() {
    const all = await db.allEntries();
    const daily = {}, weekly = {}, monthly = {}, yearly = {};
    const dk = {}, wk = {}, mk = {}, yk = {};

    all.forEach(e => {
      if (!e.date || !e.duration) return;
      const sec = parseDuration(e.duration);
      if (sec <= 0) return;
      if (!daily[e.date]) daily[e.date] = {};
      daily[e.date][e.comment] = (daily[e.date][e.comment] || 0) + sec;
      dk[e.date] = true;

      const d = new Date(e.date + 'T12:00:00');
      const w = getWeekKey(d);
      if (!weekly[w]) weekly[w] = {};
      weekly[w][e.comment] = (weekly[w][e.comment] || 0) + sec;
      wk[w] = true;

      const m = e.date.slice(0, 7);
      if (!monthly[m]) monthly[m] = {};
      monthly[m][e.comment] = (monthly[m][e.comment] || 0) + sec;
      mk[m] = true;

      const y = e.date.slice(0, 4);
      if (!yearly[y]) yearly[y] = {};
      yearly[y][e.comment] = (yearly[y][e.comment] || 0) + sec;
      yk[y] = true;
    });

    const toItems = (map, keys) => Object.keys(keys).sort().reverse().map(k => {
      const totalSec = Object.values(map[k]).reduce((a, b) => a + b, 0);
      const comments = {};
      Object.entries(map[k]).sort((a, b) => b[1] - a[1]).forEach(([c, s]) => { comments[c] = fmtDuration(s); });
      const item = { key: k, total: fmtDuration(totalSec), total_ns: totalSec * 1e9, comments };
      if (k.match(/^\d{4}-W\d{2}$/)) item.week_range = weekKeyToRange(k);
      return item;
    });

    return {
      daily: toItems(daily, dk), weekly: toItems(weekly, wk),
      monthly: toItems(monthly, mk), yearly: toItems(yearly, yk),
    };
  },
};

function getWeekKey(d) {
  const jan4 = new Date(d.getFullYear(), 0, 4);
  const week = Math.ceil((((d - jan4) / 86400000) + jan4.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2,'0')}`;
}

function weekKeyToRange(key) {
  const m = key.match(/^(\d{4})-W(\d{2})$/);
  if (!m) return '';
  const jan4 = new Date(+m[1], 0, 4);
  const dow = jan4.getDay() || 7;
  const mon = new Date(jan4);
  mon.setDate(jan4.getDate() - dow + 1 + (+m[2] - 1) * 7);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  const f = (dt) => dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `(${f(mon)}-${f(sun)})`;
}

function parseDateTime(str) {
  const p = str.split(':');
  const d = new Date();
  d.setHours(+p[0]||0, +p[1]||0, 0, 0);
  return d;
}

function fmtDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function fmtDuration(sec) {
  if (sec <= 0) return '0s';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  let r = '';
  if (h > 0) r += h + 'h';
  if (m > 0) r += m + 'm';
  if (s > 0 && h === 0) { if (m > 0) r += s + 's'; else r = s + 's'; }
  return r || '0s';
}

function parseDuration(str) {
  if (!str) return 0;
  const h = str.match(/(\d+)h/), m = str.match(/(\d+)m/), s = str.match(/(\d+)s/);
  return (h ? +h[1] * 3600 : 0) + (m ? +m[1] * 60 : 0) + (s ? +s[1] : 0);
}

function parseTime(str) {
  if (!str) return 0;
  const p = str.split(':');
  return (+p[0]||0) * 60 + (+p[1]||0);
}

function isHHMM(val) { return /^(\d{2}:\d{2}|\d{4})$/.test(val); }

function normalizeTime(val) {
  if (!val) return val;
  return /^\d{4}$/.test(val) ? val.slice(0,2) + ':' + val.slice(2) : val;
}
