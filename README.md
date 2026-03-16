# Tsuzuku つづく

> Never lose track of where you left off.

Tsuzuku is a Chrome extension that automatically tracks your anime progress on [Franime.fr](https://franime.fr) and [Crunchyroll](https://www.crunchyroll.com). It remembers the title, season, and episode you're on — so you never have to.

---

## Features

- Auto-detects the anime, season, and episode you're watching
- Saves your progress as you watch
- Popup to browse and manage your full watch list
- Status tracking: Watching, Completed, On Hold, Dropped, Plan to Watch
- Manual episode/season override

## Supported Sites

| Site | URL |
|------|-----|
| Franime | `franime.fr` |
| Crunchyroll | `crunchyroll.com` |

## Stack

- [WXT](https://wxt.dev) (Vite-based Chrome extension framework)
- Chrome Extension Manifest V3
- Vanilla JS
- `chrome.storage.local` for persistence

## Project Structure

```
Tsuzuku/
├── entrypoints/
│   ├── background.js           # Service worker
│   ├── franime.content.js      # Content script for Franime
│   ├── crunchyroll.content.js  # Content script for Crunchyroll
│   └── popup/
│       ├── index.html
│       ├── main.js
│       └── style.css
├── utils/
│   └── storage.js              # Shared storage helpers
├── public/
│   └── icon*.png               # Extension icons
└── wxt.config.js
```

## Development

```bash
npm install
npm run dev      # dev mode with hot reload
npm run build    # production build → .output/chrome-mv3/
npm run zip      # package for Chrome Web Store upload
```

Load in Chrome:
1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** → select `.output/chrome-mv3/`

## Publishing

See [`doc/publishing.md`](doc/publishing.md) for the full guide to releasing on the Chrome Web Store.
