# Class Scheduler Text Formatter

A lightweight client-side web app to manage weekly class schedules and format them for copying. The app uses localStorage to persist schedules, custom options, and formatting templates.

## Features
- Add, edit, and remove weekly classes and temporary (date-specific) classes
- Manage drop-down options (courses, instructors, rooms, buildings) — add, edit, remove, or restore defaults
- Format editor to customize how schedules are exported/copied
- UI enhancements: logo in header, footer for credit/copyright, dark mode, accessible keyboard navigation
- All data stored locally using `localStorage` so it runs entirely in the browser

## Quick Start (Local)
Open the project locally using a simple static server. From the `public` directory:

Using Python 3:
```bash
python -m http.server 8000
# then open http://localhost:8000
```

Using Node (npx):
```bash
npx serve .
# then open http://localhost:5000 (or served port)
```

## Project Structure
- `index.html` - Main UI markup
- `styles.css` - Styling for UI
- `script.js` - Main application logic, event listeners, localStorage management
- `config.js` - Centralized configuration: default courses, instructors, rooms, buildings, and the default format template
- `logo.png` - Project logo (place this file in the same folder to display in the header)

## Customization & Configuration
- Edit `config.js` to change default values for courses, instructors, rooms, and buildings.
- To permanently change the default format (export template), either use the UI Format Editor and save or edit `config.js`'s `DEFAULT_FORMAT_TEMPLATE`.
- The `Manage Options` dialog allows you to hide default options (they remain available to restore), and add custom items.

## Data & Persistence
- Schedules are stored in `localStorage` under keys `defaultSchedules` and `tempSchedules`.
- User-made custom options are stored under `customOptions` (including `removedDefaults` to remember which defaults were hidden).
- Format template is stored under `customFormatTemplate`.

## Behavior Notes
- Temporary classes are **date-specific**: they will not hide weekly default classes and are treated separately when checking for overlaps.
- Overlap checks were improved: classes are only considered overlapping if they are for the same date (or both weekly/no-date), and temporary classes do not trigger overlap warnings against weekly defaults.
- When toggling `Temporary (Today Only)` in the form, the date input will be disabled to avoid unintended changes; the stored date for temporary classes will default to the next occurrence of the selected weekday if not provided.

## Accessibility & Mobile Support
- Keyboard navigation for the day tabs (arrow keys, Home/End, Enter/Space) is enabled.
- Focus, color contrast, and keyboard accessibility improvements are included.

## Contributing
- Fork the repository, make changes, and open a PR with a concise description of the change.
- Keep `config.js` small if you intend to maintain a simple default list; the UI enables customizing without changing source code.

## License & Credits
- This project is licensed under the MIT License — see the `LICENSE` file for details. Replace the placeholder owner name in `LICENSE` ("Jihad Molla") and the year with your preferred details.
- Logo credit: put credit/author details in the footer by editing `index.html` or using the `footerCredit` placeholder (the UI currently uses `Jihad Molla`).

## Troubleshooting & Tips
- If the UI seems stuck after edits, try clearing localStorage or open the app in incognito mode to reset persisted values for testing.
- If an inline handler breaks due to special characters, notify the dev to convert inline event handlers to event listeners.
