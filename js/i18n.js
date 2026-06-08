const langs = {
  en: {
    timer: 'Timer',
    day: 'Day',
    reports: 'Reports',
    settings: 'Settings',

    start: 'Start',
    start_timer: 'Start Timer',
    stop: 'Stop',
    pause: 'Pause',
    resume: 'Resume',
    switch_task: 'Switch Task',
    confirm: 'Confirm',
    cancel: 'Cancel',
    save: 'Save',
    add_entry: '+ Add Entry',
    save_settings: 'Save Settings',
    install: 'Install',

    status_ready: 'Ready',
    status_running: 'RUNNING',
    status_paused: 'PAUSED',

    today: 'Today',
    total: 'Total',

    toast_started: 'Timer started',
    toast_stopped: 'Time logged',
    toast_entry_added: 'Entry added',
    toast_entry_updated: 'Entry updated',
    toast_entry_deleted: 'Entry deleted',
    toast_settings_saved: 'Settings saved',
    toast_data_cleared: 'All data cleared',
    toast_switched: 'Task switched to',
    toast_undo_label: 'UNDO',
    toast_undo_failed: 'Undo failed',
    toast_failed_start: 'Failed to start timer',
    toast_failed_stop: 'Failed to stop',
    toast_failed_action: 'Failed',
    toast_failed_settings: 'Failed to load settings',
    toast_failed_save: 'Failed to save settings',

    placeholder_comment: 'Task description (default: work)',
    placeholder_start_time: 'Start time (optional: HH:MM)',
    placeholder_task: 'Task description (default: work)',
    placeholder_start: 'Start (HH:MM)',
    placeholder_end: 'End (HH:MM)',
    placeholder_comment_short: 'Comment',
    placeholder_comment_edit: 'Comment',

    day_no_entries: 'No entries for this day.',
    day_failed_load: 'Failed to load',
    day_title_date: 'Today',
    reports_loading: 'Loading...',
    reports_no_logs: 'No logs yet.',
    reports_daily: 'Daily Totals',
    reports_weekly: 'Weekly Totals',
    reports_monthly: 'Monthly Totals',
    reports_yearly: 'Yearly Totals',
    reports_newer: 'newer',
    reports_older: 'older',
    reports_goal_prefix: 'Goal',

    settings_disable_goals: 'Disable Goals',
    settings_weekly_target: 'Weekly Target (hours)',
    settings_yearly_target: 'Yearly Target (hours)',
    settings_vacation_days: 'Vacation Days',
    settings_show_daily: 'Show Daily',
    settings_show_weekly: 'Show Weekly',
    settings_show_monthly: 'Show Monthly',
    settings_show_yearly: 'Show Yearly',
    settings_theme: 'Theme',
    settings_theme_system: 'System',
    settings_theme_light: 'Light',
    settings_theme_dark: 'Dark',
    settings_data: 'Data',
    settings_export_csv: 'Export CSV',
    settings_export_json: 'Export JSON (Backup)',
    settings_import_json: 'Import JSON (Restore)',
    settings_reset_data: 'Reset All Data',
    settings_reset_confirm: 'Delete ALL time entries, settings, and data? This cannot be undone.',

    edit_title: 'Edit Entry',
    edit_save: 'Save',
    edit_cancel: 'Cancel',
    edit_delete_confirm: 'Delete this entry?',

    install_banner: 'Add to Home Screen for quick access',

    overlap_no: 'No entries for this day.',
  },

  da: {
    timer: 'Timer',
    day: 'Dag',
    reports: 'Rapporter',
    settings: 'Indstillinger',

    start: 'Start',
    start_timer: 'Start timer',
    stop: 'Stop',
    pause: 'Pause',
    resume: 'Fortsæt',
    switch_task: 'Skift opgave',
    confirm: 'Bekræft',
    cancel: 'Annuller',
    save: 'Gem',
    add_entry: '+ Tilføj',
    save_settings: 'Gem indstillinger',
    install: 'Installer',

    status_ready: 'Klar',
    status_running: 'I GANG',
    status_paused: 'PAUSE',

    today: 'I dag',
    total: 'I alt',

    toast_started: 'Timer startet',
    toast_stopped: 'Tid registreret',
    toast_entry_added: 'Opgave tilføjet',
    toast_entry_updated: 'Opgave opdateret',
    toast_entry_deleted: 'Opgave slettet',
    toast_settings_saved: 'Indstillinger gemt',
    toast_data_cleared: 'Alt data slettet',
    toast_switched: 'Skiftet til',
    toast_undo_label: 'FORTRYD',
    toast_undo_failed: 'Fortryd mislykkedes',
    toast_failed_start: 'Kunne ikke starte timer',
    toast_failed_stop: 'Kunne ikke stoppe timer',
    toast_failed_action: 'Fejl',
    toast_failed_settings: 'Kunne ikke hente indstillinger',
    toast_failed_save: 'Kunne ikke gemme indstillinger',

    placeholder_comment: 'Opgave (default: work)',
    placeholder_start_time: 'Starttid (valgfri: TT:MM)',
    placeholder_task: 'Opgave (default: work)',
    placeholder_start: 'Start (TT:MM)',
    placeholder_end: 'Slut (TT:MM)',
    placeholder_comment_short: 'Kommentar',
    placeholder_comment_edit: 'Kommentar',

    day_no_entries: 'Ingen opgaver denne dag.',
    day_failed_load: 'Kunne ikke hente',
    day_title_date: 'I dag',
    reports_loading: 'Henter...',
    reports_no_logs: 'Ingen data endnu.',
    reports_daily: 'Daglige totaler',
    reports_weekly: 'Ugentlige totaler',
    reports_monthly: 'Månedlige totaler',
    reports_yearly: 'Årlige totaler',
    reports_newer: 'nyere',
    reports_older: 'ældre',
    reports_goal_prefix: 'Mål',

    settings_disable_goals: 'Deaktiver mål',
    settings_weekly_target: 'Ugentligt mål (timer)',
    settings_yearly_target: 'Årligt mål (timer)',
    settings_vacation_days: 'Feriedage',
    settings_show_daily: 'Vis daglig',
    settings_show_weekly: 'Vis ugentlig',
    settings_show_monthly: 'Vis månedlig',
    settings_show_yearly: 'Vis årlig',
    settings_theme: 'Tema',
    settings_theme_system: 'System',
    settings_theme_light: 'Lys',
    settings_theme_dark: 'Mørk',
    settings_data: 'Data',
    settings_export_csv: 'Eksporter CSV',
    settings_export_json: 'Eksporter JSON (Sikkerhedskopi)',
    settings_import_json: 'Importer JSON (Gendan)',
    settings_reset_data: 'Nulstil alt data',
    settings_reset_confirm: 'Slet ALLE tidsregistreringer, indstillinger og data? Dette kan ikke fortrydes.',

    edit_title: 'Rediger opgave',
    edit_save: 'Gem',
    edit_cancel: 'Annuller',
    edit_delete_confirm: 'Slet denne opgave?',

    install_banner: 'Føj til Hjemmeskærm for hurtig adgang',

    overlap_no: 'Ingen opgaver denne dag.',
  },
};

function detectLang() {
  const saved = localStorage.getItem('kairotic-lang');
  if (saved && langs[saved]) return saved;
  const browser = (navigator.language || '').slice(0, 2);
  if (langs[browser]) return browser;
  return 'en';
}

let currentLang = detectLang();

function t(key) {
  return langs[currentLang]?.[key] || langs.en[key] || key;
}

function setLang(code) {
  if (!langs[code]) return;
  currentLang = code;
  localStorage.setItem('kairotic-lang', code);
  // Scan DOM for data-i18n
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
}
