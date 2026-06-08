let state = {
  currentScreen: 'timer',
  timerRunning: false, timerPaused: false,
  timerInterval: null,
  selectedDate: new Date(),
  addFormVisible: false,
  todayLoggedSec: 0,
};

function haptic() { try { navigator.vibrate(15); } catch {} }

let _undoTimer = null;
let _undoCommit = null;

function commitPendingUndo() {
  if (_undoTimer) { clearTimeout(_undoTimer); _undoTimer = null; }
  if (_undoCommit) { _undoCommit(); _undoCommit = null; }
}

function toast(msg, isError) {
  commitPendingUndo();
  const el = document.getElementById('toast');
  el.innerHTML = msg;
  el.className = 'show' + (isError ? ' error' : '');
  clearTimeout(el._timer);
  el._timer = setTimeout(() => { el.className = ''; }, 2500);
}

function toastWithUndo(msg, undoLabel, onUndo, onCommit) {
  commitPendingUndo();
  const el = document.getElementById('toast');
  clearTimeout(el._timer);
  el._timer = null;
  el.className = 'show';
  el.innerHTML = `${msg} <button class="toast-undo-btn" id="toast-undo-btn">${undoLabel}</button>`;

  _undoCommit = onCommit || (() => {});

  document.getElementById('toast-undo-btn').addEventListener('click', async (e) => {
    e.stopPropagation();
    el.className = '';
    clearTimeout(_undoTimer); _undoTimer = null;
    _undoCommit = null;
    try { await onUndo(); } catch (err) { toast('Undo failed', true); }
  });

  _undoTimer = setTimeout(() => {
    el.className = '';
    if (_undoCommit) { _undoCommit(); _undoCommit = null; }
    _undoTimer = null;
  }, 5000);
}

document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => switchScreen(btn.dataset.screen));
});

function switchScreen(name) {
  state.currentScreen = name;
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-' + name).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelector(`.nav-item[data-screen="${name}"]`).classList.add('active');
  if (name === 'day') refreshDayView();
  if (name === 'reports') refreshReports();
  if (name === 'settings') loadSettings();
}

const timerDisplay = document.getElementById('timer-display');
const timerStatus = document.getElementById('timer-status');
const timerCommentEl = document.getElementById('timer-comment');

document.getElementById('btn-start').addEventListener('click', showStartCommentSelector);
document.getElementById('btn-start-confirm').addEventListener('click', confirmStartTimer);
document.getElementById('btn-start-cancel').addEventListener('click', hideStartCommentSelector);
document.getElementById('btn-pause').addEventListener('click', togglePause);
document.getElementById('btn-stop').addEventListener('click', stopTimer);
document.getElementById('btn-task').addEventListener('click', showTaskSelector);
document.getElementById('btn-task-confirm').addEventListener('click', confirmTaskSwitch);
document.getElementById('btn-task-cancel').addEventListener('click', hideTaskSelector);
document.getElementById('start-time-input').addEventListener('input', autoFormatTime);

function showStartCommentSelector() {
  document.getElementById('timer-controls-start').classList.add('hidden');
  document.getElementById('start-comment-selector').classList.remove('hidden');
  const input = document.getElementById('start-comment-input');
  input.value = '';
  document.getElementById('start-time-input').value = '';
  input.dispatchEvent(new Event('input'));
}

function hideStartCommentSelector() {
  document.getElementById('start-comment-selector').classList.add('hidden');
  document.getElementById('timer-controls-start').classList.remove('hidden');
}

async function confirmStartTimer() {
  const input = document.getElementById('start-comment-input');
  const comment = input.value || '';
  const startTime = normalizeTime(document.getElementById('start-time-input').value);
  try {
    await engine.start(comment, startTime);
    state.timerRunning = true; state.timerPaused = false;
    timerCommentEl.textContent = comment || 'work';
    document.getElementById('start-comment-selector').classList.add('hidden');
    document.getElementById('timer-controls-running').classList.remove('hidden');
    timerStatus.textContent = 'RUNNING';
    timerStatus.className = 'timer-status running';
    startTimerTick();
    haptic();
    toast('Timer started');
  } catch (e) { toast('Failed to start timer: ' + e.message, true); }
}

async function updateRecentComments(newComment) {
  const comments = await db.getComments();
  const updated = [newComment, ...comments.filter(c => c !== newComment)].slice(0, 50);
  await db.saveComments(updated);
}

function startTimerTick() {
  if (state.timerInterval) clearInterval(state.timerInterval);
  state.timerInterval = setInterval(updateTimerDisplay, 1000);
  updateTimerDisplay();
}

function updateTimerDisplay() {
  const status = engine.getStatus();
  if (!status.running) { stopTimerTick(); return; }
  const elapsed = Math.floor(status.elapsed_ns / 1e9);
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  timerDisplay.textContent = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  timerStatus.textContent = status.paused ? 'PAUSED' : 'RUNNING';
  timerStatus.className = 'timer-status ' + (status.paused ? 'paused' : 'running');
  state.timerPaused = status.paused;
  const totalSec = state.todayLoggedSec + elapsed;
  const th = Math.floor(totalSec / 3600);
  const tm = Math.floor((totalSec % 3600) / 60);
  const todayEl = document.getElementById('today-total');
  todayEl.textContent = totalSec > 0 ? 'Today: ' + th + 'h ' + tm + 'm' : '';
}

function stopTimerTick() {
  if (state.timerInterval) { clearInterval(state.timerInterval); state.timerInterval = null; }
}

async function loadTodayTotal() {
  const dateStr = fmtDate(new Date());
  const entries = await db.entriesByDate(dateStr);
  let sec = 0;
  entries.forEach(e => { sec += parseDuration(e.duration); });
  state.todayLoggedSec = sec;
  const todayEl = document.getElementById('today-total');
  if (!state.timerRunning && sec > 0) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    todayEl.textContent = 'Today: ' + h + 'h ' + m + 'm';
  } else if (!state.timerRunning) {
    todayEl.textContent = '';
  }
}

async function togglePause() { await engine.togglePause(); haptic(); }

async function stopTimer() {
  try {
    const savedState = engine.state ? { ...engine.state } : null;
    const entry = await engine.stop();
    state.timerRunning = false; state.timerPaused = false;
    stopTimerTick();
    timerDisplay.textContent = '00:00:00';
    timerStatus.textContent = 'Ready';
    timerStatus.className = 'timer-status';
    timerCommentEl.textContent = '';
    document.getElementById('timer-controls-start').classList.remove('hidden');
    document.getElementById('timer-controls-running').classList.add('hidden');
    if (entry && entry.comment) updateRecentComments(entry.comment);
    loadTodayTotal();
    haptic();
    toastWithUndo(`Logged (${entry.duration})`, 'UNDO', async () => {
      await db.deleteEntry(entry.id);
      engine.state = savedState;
      await db.saveTimerState(savedState);
      engine._startAutoSave();
      engine._notify();
      state.timerRunning = true; state.timerPaused = savedState.paused;
      document.getElementById('timer-controls-start').classList.add('hidden');
      document.getElementById('timer-controls-running').classList.remove('hidden');
      timerCommentEl.textContent = savedState.comment || 'work';
      timerStatus.textContent = savedState.paused ? 'PAUSED' : 'RUNNING';
      timerStatus.className = 'timer-status ' + (savedState.paused ? 'paused' : 'running');
      startTimerTick();
      loadTodayTotal();
    });
  } catch (e) { toast('Failed to stop: ' + e.message, true); }
}

function showTaskSelector() {
  state.taskInputVisible = true;
  document.getElementById('timer-controls-running').classList.add('hidden');
  document.getElementById('task-selector').classList.remove('hidden');
  const input = document.getElementById('task-input');
  input.value = '';
  input.dispatchEvent(new Event('input'));
}

function hideTaskSelector() {
  state.taskInputVisible = false;
  document.getElementById('task-selector').classList.add('hidden');
  document.getElementById('timer-controls-running').classList.remove('hidden');
}

async function confirmTaskSwitch() {
  const input = document.getElementById('task-input');
  const comment = input.value || 'work';
  try {
    await engine.switchTask(comment);
    timerCommentEl.textContent = comment;
    updateRecentComments(comment);
    hideTaskSelector();
    haptic();
    toast('Task switched to: ' + comment);
  } catch (e) { toast('Failed: ' + e.message, true); }
}

document.getElementById('task-input').addEventListener('input', function() {
  refreshSuggestions(this, document.getElementById('task-suggestions'), v => this.value = v);
});
document.getElementById('start-comment-input').addEventListener('input', function() {
  refreshSuggestions(this, document.getElementById('start-comment-suggestions'), v => this.value = v);
});
document.getElementById('add-comment').addEventListener('input', function() {
  refreshSuggestions(this, document.getElementById('add-comment-suggestions'), v => this.value = v);
});

async function refreshSuggestions(input, container, onSelect) {
  try {
    const comments = await db.getComments();
    const clean = comments.filter(c => c && c.trim());
    const val = input.value.toLowerCase();
    const filtered = val ? clean.filter(c => c.toLowerCase().startsWith(val)) : clean.slice(0, 10);
    container.innerHTML = '';
    filtered.forEach(c => {
      const chip = document.createElement('span');
      chip.className = 'chip';
      chip.textContent = c;
      chip.addEventListener('click', () => { input.value = c; container.innerHTML = ''; if (onSelect) onSelect(c); });
      container.appendChild(chip);
    });
  } catch {}
}

document.getElementById('day-prev').addEventListener('click', () => changeDay(-1));
document.getElementById('day-next').addEventListener('click', () => changeDay(1));

(function() {
  let startX = 0;
  const dayScreen = document.getElementById('screen-day');
  dayScreen.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
  dayScreen.addEventListener('touchend', e => {
    if (state.currentScreen !== 'day') return;
    const diff = e.changedTouches[0].clientX - startX;
    if (Math.abs(diff) > 60) changeDay(diff > 0 ? -1 : 1);
  }, { passive: true });
})();

function changeDay(delta) {
  state.selectedDate.setDate(state.selectedDate.getDate() + delta);
  refreshDayView();
}

document.getElementById('btn-add-entry').addEventListener('click', toggleAddForm);
document.getElementById('btn-add-cancel').addEventListener('click', toggleAddForm);
document.getElementById('btn-add-save').addEventListener('click', saveAddEntry);

function toggleAddForm() {
  state.addFormVisible = !state.addFormVisible;
  document.getElementById('add-entry-form').classList.toggle('hidden', !state.addFormVisible);
  if (state.addFormVisible) {
    document.getElementById('add-start').value = '';
    document.getElementById('add-end').value = '';
    document.getElementById('add-comment').value = '';
    document.getElementById('add-comment').dispatchEvent(new Event('input'));
  }
}

document.getElementById('add-start').addEventListener('input', autoFormatTime);
document.getElementById('add-end').addEventListener('input', autoFormatTime);

async function saveAddEntry() {
  const start = normalizeTime(document.getElementById('add-start').value);
  const end = normalizeTime(document.getElementById('add-end').value);
  const comment = document.getElementById('add-comment').value || 'work';
  if (!end) { toast('End time required', true); return; }
  if (!isHHMM(start) || !isHHMM(end)) { toast('Use HH:MM or HHMM format', true); return; }

  const dateStr = fmtDate(state.selectedDate);
  const existing = await db.entriesByDate(dateStr);
  const now = new Date();
  const st = new Date(now.getFullYear(), now.getMonth(), now.getDate(), +start.split(':')[0], +start.split(':')[1]);
  const et = new Date(now.getFullYear(), now.getMonth(), now.getDate(), +end.split(':')[0], +end.split(':')[1]);
  st.setFullYear(state.selectedDate.getFullYear(), state.selectedDate.getMonth(), state.selectedDate.getDate());
  et.setFullYear(state.selectedDate.getFullYear(), state.selectedDate.getMonth(), state.selectedDate.getDate());
  const dur = (et - st) / 1000;

  existing.push({ date: dateStr, start: st.toTimeString().slice(0,8), end: et.toTimeString().slice(0,8), duration: fmtDuration(dur), comment, createdAt: new Date().toISOString() });

  try {
    await db.replaceDayEntries(dateStr, existing);
    updateRecentComments(comment);
    toast('Entry added');
    toggleAddForm();
    refreshDayView();
  } catch (e) { toast('Failed: ' + e.message, true); }
}

async function refreshDayView() {
  const dateStr = fmtDate(state.selectedDate);
  document.getElementById('day-title').textContent = state.selectedDate.toLocaleDateString(undefined, {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
  });
  try {
    const entries = await db.entriesByDate(dateStr);
    renderDayEntries(entries, dateStr);
  } catch (err) {
    console.error('refreshDayView failed:', err);
    document.getElementById('day-entries').innerHTML = '<div class="no-entries">Failed to load</div>';
  }
}

function renderDayEntries(entries, dateStr) {
  const container = document.getElementById('day-entries');
  if (!entries || entries.length === 0) {
    container.innerHTML = '<div class="no-entries">No entries for this day.</div>';
    return;
  }
  container.innerHTML = '';
  let totalSec = 0;
  const overlap = {};
  for (let i = 0; i < entries.length; i++) {
    const stA = parseTime(entries[i].start);
    const etA = parseTime(entries[i].end);
    for (let j = i + 1; j < entries.length; j++) {
      const stB = parseTime(entries[j].start);
      const etB = parseTime(entries[j].end);
      if (stA < etB && stB < etA) { overlap[i] = true; overlap[j] = true; }
    }
  }
  entries.forEach((entry, idx) => {
    totalSec += parseDuration(entry.duration);

    const row = document.createElement('div');
    row.className = 'entry-row' + (overlap[idx] ? ' overlap' : '');

    const time = document.createElement('span'); time.className = 'entry-time'; time.textContent = `${entry.start.slice(0,5)} - ${entry.end.slice(0,5)}`;
    const dur = document.createElement('span'); dur.className = 'entry-dur'; dur.textContent = entry.duration;
    const comment = document.createElement('span'); comment.className = 'entry-comment'; comment.textContent = entry.comment;
    const actions = document.createElement('span'); actions.className = 'entry-actions';
    const editBtn = document.createElement('button'); editBtn.className = 'edit-btn'; editBtn.innerHTML = '&#9998;';
    editBtn.addEventListener('click', () => openEditModal(entry, idx, dateStr));
    const delBtn = document.createElement('button'); delBtn.className = 'delete-btn'; delBtn.innerHTML = '&#10005;';
    delBtn.addEventListener('click', () => deleteEntry(idx, dateStr));
    actions.appendChild(editBtn); actions.appendChild(delBtn);
    row.appendChild(time); row.appendChild(dur); row.appendChild(comment); row.appendChild(actions);

    container.appendChild(row);
  });
  if (totalSec > 0) {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const totalRow = document.createElement('div');
    totalRow.className = 'day-total';
    totalRow.textContent = 'Total: ' + (h > 0 ? h + 'h ' : '') + m + 'm';
    container.appendChild(totalRow);
  }
}

function openEditModal(entry, idx, dateStr) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <h3>Edit Entry</h3>
      <input type="text" id="edit-start" value="${entry.start.slice(0,5)}" placeholder="Start (HH:MM)" inputmode="numeric">
      <input type="text" id="edit-end" value="${entry.end.slice(0,5)}" placeholder="End (HH:MM)" inputmode="numeric">
      <input type="text" id="edit-comment" value="${entry.comment}" placeholder="Comment">
      <div id="edit-comment-suggestions" class="suggestions"></div>
      <div class="modal-actions">
        <button class="btn btn-sm" id="edit-save">Save</button>
        <button class="btn btn-sm btn-secondary" id="edit-cancel">Cancel</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  document.getElementById('edit-comment').addEventListener('input', function() {
    refreshSuggestions(this, document.getElementById('edit-comment-suggestions'), v => this.value = v);
  });
  document.getElementById('edit-start').addEventListener('input', autoFormatTime);
  document.getElementById('edit-end').addEventListener('input', autoFormatTime);
  document.getElementById('edit-cancel').addEventListener('click', (e) => { e.stopPropagation(); overlay.remove(); });
  document.getElementById('edit-cancel').addEventListener('touchend', (e) => { e.stopPropagation(); });
  document.getElementById('edit-save').addEventListener('click', async (e) => {
    e.stopPropagation();
    const start = normalizeTime(document.getElementById('edit-start').value);
    const end = normalizeTime(document.getElementById('edit-end').value);
    const comment = document.getElementById('edit-comment').value || 'work';
    if (!isHHMM(start) || !isHHMM(end)) { toast('Use HH:MM or HHMM format', true); return; }
    try {
      const existing = await db.entriesByDate(dateStr);
      const now = new Date();
      const st = new Date(now.getFullYear(), now.getMonth(), now.getDate(), +start.split(':')[0], +start.split(':')[1]);
      const et = new Date(now.getFullYear(), now.getMonth(), now.getDate(), +end.split(':')[0], +end.split(':')[1]);
      st.setFullYear(state.selectedDate.getFullYear(), state.selectedDate.getMonth(), state.selectedDate.getDate());
      et.setFullYear(state.selectedDate.getFullYear(), state.selectedDate.getMonth(), state.selectedDate.getDate());
      const dur = (et - st) / 1000;
      await db.updateEntry(existing[idx].id, { date: dateStr, start: st.toTimeString().slice(0,8), end: et.toTimeString().slice(0,8), duration: fmtDuration(dur), comment, createdAt: existing[idx].createdAt || new Date().toISOString() });
      updateRecentComments(comment);
      toast('Entry updated');
      overlay.remove();
      refreshDayView();
    } catch (e) { toast('Failed: ' + e.message, true); }
  });
  document.getElementById('edit-save').addEventListener('touchend', (e) => { e.stopPropagation(); });
}

async function deleteEntry(idx, dateStr) {
  try {
    const existing = await db.entriesByDate(dateStr);
    const entry = existing[idx];
    await db.deleteEntry(entry.id);
    refreshDayView();
    toastWithUndo('Entry deleted', 'UNDO', async () => {
      await db.addEntry({ date: entry.date, start: entry.start, end: entry.end, duration: entry.duration, comment: entry.comment, createdAt: entry.createdAt || new Date().toISOString() });
      refreshDayView();
    });
  } catch (e) { toast('Failed: ' + e.message, true); }
}

const reportWindows = { daily: 5, weekly: 5, monthly: 12, yearly: 10 };
const reportOffsets = { daily: 0, weekly: 0, monthly: 0, yearly: 0 };
let reportSortMode = 0;

async function refreshReports() {
  const container = document.getElementById('reports-content');
  container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-dim)">Loading...</div>';
  try {
    const data = await engine.buildReports();
    const cfg = await db.getConfig();
    container.innerHTML = '';
    if (!cfg.no_goal) {
      const gh = document.createElement('div');
      gh.style.cssText = 'text-align:center;padding:12px;background:var(--surface);border-radius:var(--radius);margin-bottom:8px';
      gh.innerHTML = `<strong>Goal: ${cfg.weekly_target.toFixed(1)}h/week</strong>`;
      container.appendChild(gh);
    }
    const sections = [
      { key: 'daily', label: 'Daily Totals', items: data.daily, target: cfg.weekly_target * 3600 * 1e9 },
      { key: 'weekly', label: 'Weekly Totals', items: data.weekly, target: cfg.weekly_target * 3600 * 1e9 },
      { key: 'monthly', label: 'Monthly Totals', items: data.monthly, target: cfg.weekly_target * 3600 * 52 / 12 * 1e9 },
      { key: 'yearly', label: 'Yearly Totals', items: data.yearly, target: cfg.weekly_target * 3600 * 52 * 1e9 },
    ];

    const renderReportSection = (s) => {
      if (!cfg['show_'+s.key] && !cfg.no_goal) return null;
      if (!s.items || !s.items.length) return null;
      const win = reportWindows[s.key];
      const offset = reportOffsets[s.key];
      const pageItems = s.items.slice(offset, offset + win);
      const totalPages = Math.ceil(s.items.length / win);
      const currentPage = totalPages === 0 ? 0 : Math.floor(offset / win) + 1;
      const section = document.createElement('div'); section.className = 'report-section';
      const header = document.createElement('div'); header.className = 'report-header';
      header.innerHTML = `${s.label} <span style="display:flex;align-items:center;gap:8px"><button class="btn-sort-report" title="Toggle sort: alpha / by hours / recent">&#8645;</button><span class="toggle-icon">&#9660;</span></span>`;
      header.querySelector('.btn-sort-report').addEventListener('click', (e) => { e.stopPropagation(); reportSortMode = (reportSortMode+1)%3; renderAllSections(); });
      const body = document.createElement('div'); body.className = 'report-body';
      pageItems.forEach(item => {
        const div = document.createElement('div'); div.className = 'report-item';
        const ih = document.createElement('div'); ih.className = 'report-item-header';
        const kd = item.week_range ? `${item.key} ${item.week_range}` : item.key;
        ih.innerHTML = `<span class="report-key">${kd}</span><span class="report-total">${item.total}</span>`;
        div.appendChild(ih);
        if (!cfg.no_goal && s.target > 0) {
          const ratio = Math.min(item.total_ns / s.target, 1);
          const bar = document.createElement('div'); bar.className = 'report-bar';
          const fill = document.createElement('div'); fill.className = 'report-bar-fill';
          fill.style.width = (ratio*100)+'%'; fill.style.background = ratio < 0.5 ? '#e74c3c' : ratio < 0.9 ? '#f1c40f' : '#2ecc71';
          bar.appendChild(fill); div.appendChild(bar);
        }
        const comments = document.createElement('div'); comments.className = 'report-comments';
        let entries = Object.entries(item.comments);
        if (reportSortMode === 0) entries.sort((a,b) => a[0].localeCompare(b[0]));
        else if (reportSortMode === 1) entries.sort((a,b) => parseDuration(b[1]) - parseDuration(a[1]));
        entries.forEach(([c,d]) => {
          const chip = document.createElement('span'); chip.className = 'report-comment';
          chip.textContent = `${c}: ${d}`; comments.appendChild(chip);
        });
        div.appendChild(comments); body.appendChild(div);
      });
      const nav = document.createElement('div'); nav.className = 'report-page-nav';
      const prevBtn = document.createElement('button'); prevBtn.className = 'btn-page-nav'; prevBtn.innerHTML = '◀ newer'; prevBtn.disabled = currentPage <= 1;
      prevBtn.addEventListener('click', (e) => { e.stopPropagation(); reportOffsets[s.key] = Math.max(0, reportOffsets[s.key] - win); renderAllSections(); });
      const nextBtn = document.createElement('button'); nextBtn.className = 'btn-page-nav'; nextBtn.innerHTML = 'older ▶'; nextBtn.disabled = currentPage >= totalPages;
      nextBtn.addEventListener('click', (e) => { e.stopPropagation(); reportOffsets[s.key] = Math.min(s.items.length - win, reportOffsets[s.key] + win); if (reportOffsets[s.key] < 0) reportOffsets[s.key] = 0; renderAllSections(); });
      const pageLabel = document.createElement('span'); pageLabel.className = 'page-label'; pageLabel.textContent = `${currentPage}/${totalPages}`;
      nav.appendChild(prevBtn); nav.appendChild(pageLabel); nav.appendChild(nextBtn); body.appendChild(nav);
      header.addEventListener('click', () => { header.classList.toggle('collapsed'); body.classList.toggle('collapsed'); });
      section.appendChild(header); section.appendChild(body);
      return section;
    };

    const renderAllSections = () => {
      container.innerHTML = '';
      if (!cfg.no_goal) {
        const gh = document.createElement('div');
        gh.style.cssText = 'text-align:center;padding:12px;background:var(--surface);border-radius:var(--radius);margin-bottom:8px';
        gh.innerHTML = `<strong>Goal: ${cfg.weekly_target.toFixed(1)}h/week</strong>`;
        container.appendChild(gh);
      }
      let rendered = 0;
      sections.forEach(s => { const el = renderReportSection(s); if (el) { container.appendChild(el); rendered++; } });
      if (rendered === 0) container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-dim)">No logs yet.</div>';
    };
    renderAllSections();
  } catch { container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--red)">Failed to load reports</div>'; }
}

async function loadSettings() {
  try {
    const cfg = await db.getConfig();
    document.getElementById('setting-no-goal').checked = cfg.no_goal;
    document.getElementById('setting-weekly').value = cfg.weekly_target;
    document.getElementById('setting-yearly').value = cfg.yearly_target || 0;
    document.getElementById('setting-vacation').value = cfg.vacation_days || 0;
    document.getElementById('setting-show-daily').checked = cfg.show_daily;
    document.getElementById('setting-show-weekly').checked = cfg.show_weekly;
    document.getElementById('setting-show-monthly').checked = cfg.show_monthly;
    document.getElementById('setting-show-yearly').checked = cfg.show_yearly;
  } catch { toast('Failed to load settings', true); }
}

document.getElementById('btn-save-settings').addEventListener('click', async () => {
  try {
    await db.saveConfig({
      weekly_target: parseFloat(document.getElementById('setting-weekly').value) || 0,
      no_goal: document.getElementById('setting-no-goal').checked,
      yearly_target: parseFloat(document.getElementById('setting-yearly').value) || 0,
      vacation_days: parseInt(document.getElementById('setting-vacation').value) || 0,
      show_daily: document.getElementById('setting-show-daily').checked,
      show_weekly: document.getElementById('setting-show-weekly').checked,
      show_monthly: document.getElementById('setting-show-monthly').checked,
      show_yearly: document.getElementById('setting-show-yearly').checked,
    });
    toast('Settings saved');
  } catch (e) { toast('Failed to save: ' + e.message, true); }
});

document.getElementById('btn-export-csv').addEventListener('click', () => xport.exportCSV());
document.getElementById('btn-export-json').addEventListener('click', () => xport.exportJSON());
document.getElementById('btn-import').addEventListener('click', () => document.getElementById('import-file').click());
document.getElementById('import-file').addEventListener('change', (e) => {
  if (e.target.files[0]) xport.importJSON(e.target.files[0]);
  e.target.value = '';
});

function autoFormatTime(e) {
  const input = e.target;
  let val = input.value.replace(/[^0-9]/g, '');
  if (val.length > 4) val = val.slice(0, 4);
  if (val.length >= 3) input.value = val.slice(0, 2) + ':' + val.slice(2);
  else input.value = val;
}

(function initTheme() {
  const saved = localStorage.getItem('kairotic-theme') || 'system';
  applyTheme(saved);
  document.querySelectorAll('.theme-tab').forEach(tab => {
    if (tab.dataset.theme === saved) tab.classList.add('active');
    tab.addEventListener('click', () => {
      const theme = tab.dataset.theme;
      applyTheme(theme);
      localStorage.setItem('kairotic-theme', theme);
      document.querySelectorAll('.theme-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
    });
  });
})();

function applyTheme(theme) {
  if (theme === 'system') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', theme);
  }
}

(async function() {
  await engine.init();
  const status = engine.getStatus();
  if (status.running) {
    state.timerRunning = true; state.timerPaused = status.paused;
    timerCommentEl.textContent = status.comment || 'work';
    document.getElementById('timer-controls-start').classList.add('hidden');
    document.getElementById('timer-controls-running').classList.remove('hidden');
    timerStatus.textContent = status.paused ? 'PAUSED' : 'RUNNING';
    timerStatus.className = 'timer-status ' + (status.paused ? 'paused' : 'running');
    startTimerTick();
  }
  loadTodayTotal();
})();

document.getElementById('task-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') confirmTaskSwitch();
  if (e.key === 'Escape') hideTaskSelector();
});

document.querySelectorAll('input').forEach(inp => {
  inp.addEventListener('focus', () => {
    setTimeout(() => inp.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
  });
});

document.getElementById('screens').addEventListener('click', (e) => {
  if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT' || e.target.closest('.chip') || e.target.closest('.suggestions')) return;
  document.activeElement?.blur();
});

(function pullToRefresh() {
  let pullStartY = 0, pulling = false;
  const screen = document.getElementById('screen-day');
  screen.addEventListener('touchstart', (e) => {
    if (screen.scrollTop > 5 || state.currentScreen !== 'day') return;
    pullStartY = e.touches[0].clientY;
    pulling = true;
  }, { passive: true });
  screen.addEventListener('touchmove', (e) => {
    if (!pulling) return;
    if (e.touches[0].clientY - pullStartY > 70) {
      pulling = false;
      state.selectedDate = new Date();
      refreshDayView();
      haptic();
    }
  }, { passive: true });
  screen.addEventListener('touchend', () => { pulling = false; }, { passive: true });
})();

document.getElementById('btn-reset-data').addEventListener('click', async () => {
  if (!confirm('Delete ALL time entries, settings, and data? This cannot be undone.')) return;
  try {
    const d = await openDB();
    const tx = d.transaction(['entries', 'config', 'comments', 'timerState'], 'readwrite');
    await Promise.all(['entries', 'config', 'comments', 'timerState'].map(s => new Promise(r => { tx.objectStore(s).clear().onsuccess = r; })));
    toast('All data cleared');
    setTimeout(() => location.reload(), 800);
  } catch (e) { toast('Failed: ' + e.message, true); }
});

(function installBanner() {
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    document.getElementById('install-banner').classList.add('show');
  });
  document.getElementById('install-btn').addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') document.getElementById('install-banner').classList.remove('show');
    deferredPrompt = null;
  });
  document.getElementById('install-dismiss').addEventListener('click', () => {
    document.getElementById('install-banner').classList.remove('show');
    if (deferredPrompt) { deferredPrompt = null; }
  });
  window.addEventListener('appinstalled', () => {
    document.getElementById('install-banner').classList.remove('show');
  });
})();

document.querySelectorAll('.btn').forEach(btn => {
  btn.addEventListener('pointerdown', (e) => {
    const rect = btn.getBoundingClientRect();
    btn.style.setProperty('--x', ((e.clientX - rect.left) / rect.width * 100) + '%');
    btn.style.setProperty('--y', ((e.clientY - rect.top) / rect.height * 100) + '%');
  });
});
