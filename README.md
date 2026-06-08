# Kairotic

A time tracker that runs entirely on your phone. No servers, no accounts, your data stays on your device.

Kairotic is a Progressive Web App (PWA). Install it from your browser to your home screen and it works like a native app -- fully offline after the first visit.

## Installing on your phone

### iPhone / iPad
1. Open the Kairotic URL in Safari
2. Tap the Share button (the square with an arrow)
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add" in the top-right corner
5. Kairotic appears on your home screen as a standalone app

### Android
1. Open the Kairotic URL in Chrome
2. Tap the three-dot menu, then "Add to Home Screen"
3. Tap "Install" when prompted
4. Kairotic appears on your home screen and in your app drawer

After installing, Kairotic works without an internet connection. All data is stored locally in your browser.

## Using Kairotic

### Timer
The main screen shows a large timer display with a Start button.

To begin tracking time:
1. Tap the green **Start** button
2. Type a task description in the text field (or tap a suggestion below it)
3. Optionally enter a start time in HH:MM format to log time retroactively
4. Tap **Start Timer**

While the timer is running, three buttons appear:
- **Pause** -- pauses the timer without stopping it. Tap again to resume.
- **Stop** -- stops the timer and logs the entry. An Undo button appears for 5 seconds.
- **Switch Task** -- logs the current entry and starts a new timer immediately with a different description.

The timer uses your device clock, so it stays accurate even when your phone is locked.

### Day View
Shows all time entries for a selected date. Navigate between days using the arrow buttons at the top, or swipe left/right on the screen. Pull down from the top to snap back to today.

Each entry row shows:
- The time range (start to end)
- The duration
- The task description

Tap the pencil icon (edit) to change an entry's times or description. Tap the cross icon (delete) to remove an entry, with a 5-second Undo window.

Entries with overlapping time ranges are highlighted with a violet left border and tint.

Tap **+ Add Entry** at the bottom to manually record a past time block. Enter start and end times in HH:MM or HHMM format (for example, "09:00" or "0900").

### Reports
Shows aggregated time totals grouped by day, week, month, and year. Tap a section header to collapse or expand it.

The sort button (arrows icon) cycles through three ordering modes:
- Alphabetical by task description
- By hours (highest first)
- By recent activity

Each weekly total shows the ISO week number and date range.

If you have set a weekly goal in Settings, progress bars appear showing how close you are to the target.

### Settings
- **Disable Goals** -- hides goal-related displays and targets
- **Weekly Target** -- your desired hours per week (default 40)
- **Yearly Target** -- yearly hour target
- **Vacation Days** -- days subtracted from yearly calculations
- **Show Daily/Weekly/Monthly/Yearly** -- controls which report sections are visible
- **Theme** -- System (follows your device), Light, or Dark

### Data
- **Export CSV** -- downloads a spreadsheet file with all your time entries
- **Export JSON (Backup)** -- downloads a complete backup of all your data
- **Import JSON (Restore)** -- restores from a backup file. Warning: this replaces all current data.
- **Reset All Data** -- permanently deletes everything. This cannot be undone.

## Data storage and privacy

All data is stored in your browser's IndexedDB database on your device. Nothing is sent to any server. Kairotic is a static website that runs entirely in your browser.

### Backup and restore
Export your data regularly using the JSON Backup option in Settings. The file can be imported on a new phone or used to restore after clearing your browser data.

### CSV format
The CSV export contains these columns:
Date, Start, End, Duration, Comment

It can be opened in Numbers, Excel, Google Sheets, or any spreadsheet application.

## Keyboard shortcuts and gestures

### Day view
- Swipe left/right to navigate between days
- Pull down from the top to jump to today's date
- Tap outside any text field to close the keyboard

### Timer
- Press Enter to confirm a task switch
- Press Escape to cancel a task switch

### Entry rows
- Tap the pencil (edit) to modify an entry
- Tap the cross (delete) to remove an entry

## Running locally

If you want to run Kairotic on your own computer:

```
python3 -m http.server 8080 --directory /path/to/kairotic
```

Then open http://localhost:8080 in a browser. The PWA install prompt will appear in Chrome or Edge.

## Deploying

Kairotic is a set of static files. Deploy to any static host:

- **GitHub Pages** -- push to a `gh-pages` branch or enable Pages in repository settings
- **Netlify** -- drag the folder onto the Netlify dashboard
- **Vercel** -- run `vercel` in the project directory
- **Any web server** -- serve the files with a static file server

No build step, no dependencies, no framework.

## Optional companion server

A Go-based server (`tuitime`) is available in a separate repository for optional phone-to-desktop sync. Run the server on a home machine or NAS, and point Kairotic to it. The standalone version does not require this.
