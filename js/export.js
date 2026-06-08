const xport = {
  async exportCSV() {
    const entries = await db.allEntries();
    if (!entries.length) { toast('No entries to export', true); return; }
    const rows = [['Date','Start','End','Duration','Comment']];
    entries.sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
    entries.forEach(e => rows.push([e.date, e.start.slice(0,5), e.end.slice(0,5), e.duration, e.comment]));
    const csv = rows.map(r => r.map(c => '"' + String(c).replace(/"/g,'""') + '"').join(',')).join('\n');
    downloadBlob(csv, 'text/csv', 'kairotic-export.csv');
    toast('CSV exported');
  },

  async exportJSON() {
    const entries = await db.allEntries();
    const config = await db.getConfig();
    const comments = await db.getComments();
    const data = { version: 1, exportedAt: new Date().toISOString(), entries, config, recentComments: comments };
    downloadBlob(JSON.stringify(data, null, 2), 'application/json', 'kairotic-backup.json');
    toast('JSON exported');
  },

  importJSON(file) {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!data.entries && !data.config) { toast('Invalid backup file', true); return; }
        if (!confirm('Import will replace ALL current data. Continue?')) return;
        await db.importAll(data);
        toast('Data imported successfully');
        setTimeout(() => location.reload(), 500);
      } catch (err) { toast('Import failed: ' + err.message, true); }
    };
    reader.readAsText(file);
  },
};

function downloadBlob(content, mime, filename) {
  const blob = new Blob([content], { type: mime + ';charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
