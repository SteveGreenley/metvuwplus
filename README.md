# MetVUW Plus

A Chrome extension that adds usability enhancements to [metvuw.co.nz](https://metvuw.co.nz/) — a New Zealand weather forecast service providing map-based forecasts, satellite imagery, and radar.

---

## Features

### Forecast, Satellite & Radar pages

**Lightbox viewer**
Click any thumbnail to open a full-size image in a lightbox overlay. The legend/scale image is shown alongside the forecast map at matching height. Navigation and playback controls appear in a panel below the image.

**Animated slideshow**
The lightbox starts playing automatically when opened. Use the controls in the bottom panel to pause, resume, and adjust playback speed.

**Scrub bar**
A segmented progress bar spans the full width of the lightbox. Each segment represents one time step:
- Hover over any segment to instantly preview that frame (scrubbing)
- Click a segment to jump to it and pause
- Move the mouse away to resume playback from where you left off

**Keyboard navigation**
Arrow keys work everywhere — both on the thumbnail page and inside the lightbox.

| Key | Action |
|-----|--------|
| `←` / `→` | Step through time steps |
| `↑` / `↓` | Switch forecast type (forecast page only) |
| `Shift` + `↑` / `↓` | Switch region (forecast page only) |
| `Enter` | Open selected thumbnail in lightbox |
| `Esc` | Close lightbox |
| `Space` | Play / Pause |
| `+` / `−` | Faster / Slower |

### Forecast page only

**Save default view**
A **★ Save as default** button lets you save your preferred region, forecast type, and number of days. When enabled, visiting the forecast index page automatically redirects to your saved view.

**Popup preferences**
Click the extension icon in the Chrome toolbar to open the preferences popup, where you can set or clear your default view and toggle auto-redirect.

---

## Supported pages

| Page | URL pattern |
|------|-------------|
| Forecast maps | `/forecast/forecast.php` |
| Satellite imagery | `/satellite/` |
| Radar | `/radar/radar.php` |

---

## Installation

This extension is not published to the Chrome Web Store. Install it in developer mode:

1. Clone or download this repository.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** (toggle in the top-right corner).
4. Click **Load unpacked** and select the `metvuwplus/` folder.

The extension icon will appear in the Chrome toolbar. Pin it for quick access to the preferences popup.

---

## Project structure

```
metvuwplus/
├── manifest.json          # Extension manifest (Manifest V3)
├── content/
│   ├── content.js         # Main content script — lightbox, keyboard nav, slideshow
│   ├── content.css        # Injected styles
│   └── redirect.js        # Auto-redirect on the forecast index page
├── popup/
│   ├── popup.html         # Preferences UI
│   ├── popup.js           # Reads/writes chrome.storage.sync
│   └── popup.css          # Popup styles
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## Development

No build step is required — the extension is plain HTML, CSS, and JavaScript.

After editing any file, reload the extension at `chrome://extensions/` by clicking the refresh icon on the MetVUW Plus card, then reload the metvuw.co.nz page.
