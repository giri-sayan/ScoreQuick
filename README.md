<div align="center">

  <img src="icons/icon128.png" alt="ScoreQuick Logo" width="100" height="100" />

  # ScoreQuick ⚡
  ### Real-Time Live Sports Scores & News Extension for Your Browser

  [![Manifest V3](https://img.shields.io/badge/Chrome%20Extension-Manifest%20V3-blue?style=for-the-badge&logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/mv3/intro/)
  [![Version](https://img.shields.io/badge/Version-1.2.0-green?style=for-the-badge)](https://github.com/giri-sayan/ScoreQuick)
  [![Sports](https://img.shields.io/badge/Sports-Football%20%7C%20Cricket%20%7C%20F1-orange?style=for-the-badge)](https://github.com/giri-sayan/ScoreQuick)
  [![License](https://img.shields.io/badge/License-MIT-purple?style=for-the-badge)](LICENSE)

  <p align="center">
    <strong>ScoreQuick</strong> is a lightning-fast, privacy-focused browser extension providing real-time live scores, comprehensive match centers, followed team hubs, and breaking sports news across <b>Football (FotMob)</b>, <b>Cricket (CREX & ESPNcricinfo)</b>, and <b>Formula 1 (Official F1)</b>.
  </p>

  <p align="center">
    <a href="#-key-features">Key Features</a> •
    <a href="#-sports-coverage">Sports Coverage</a> •
    <a href="#-installation">Installation</a> •
    <a href="#-architecture--codebase">Architecture</a> •
    <a href="#-permissions--privacy">Permissions</a> •
    <a href="#-author">Author</a>
  </p>

</div>

---

## 🚀 Key Features

- ⚡ **Unified Live Scoreboard**: Real-time scores and live match statuses for Football, Cricket, and Formula 1 in a single popup.
- ⭐ **Personalized Followed Tab**: Follow your favorite clubs, cricket teams, tournaments, F1 drivers, and constructors.
- 🕒 **Smart 24-Hour Feed Window**: Displays live matches, recently finished games (past 24h), and upcoming fixtures (next 24h) without clutter.
- 📰 **Rich Sports News Feed**: Breaking headlines aggregated directly from **FotMob World News**, **ESPNcricinfo HD RSS Stories**, and **CREX News**.
- 🔍 **Discover & Global Search**: Browse and search hundreds of popular clubs, international cricket teams, tournaments, and drivers.
- 🏆 **High-Resolution Vector Crests**: Crisp official tournament and league vector logos for all major competitions.
- 🔄 **Configurable Auto-Refresh**: Select from customizable refresh intervals (`10s`, `30s`, `1m`, `5m`) with smooth animated indicators.
- 🔔 **Instant Live Alerts & Badge**: Background polling with toolbar badge counters for live followed matches and desktop notifications.
- 🌙 **Modern Glassmorphism Dark UI**: Compact, high-contrast dark theme engineered for fast glanceability.

---

## 🏟️ Sports Coverage

### ⚽ Football (FotMob Integration)
- **Live Match Centers**: Real-time match minute, live scores, halftime/fulltime scores, penalty shootouts, and aggregate scores.
- **Competitions Covered**: Premier League, UEFA Champions League, LaLiga, Serie A, Bundesliga, Ligue 1, Europa League, MLS, Saudi Pro League, and global domestic cups.
- **Verified Club Crests**: High-resolution team and league badges rendered directly from FotMob CDN.
- **Deep Links**: Direct 1-click navigation to FotMob match centers and live ticker commentary.

### 🏏 Cricket (CREX & ESPNcricinfo Dual-Feed Engine)
- **Ball-by-Ball Accuracy**: Live runs, wickets, current overs, innings indicators (`batting` vs `bowling`), required run rates, and match situations.
- **Dual-Feed Redundancy**: Combines **CREX** real-time scraper with **ESPNcricinfo** scorepanels for 100% uptime.
- **Official Tournament Logos**: Dedicated vector crests for **IPL**, **WPL**, **BBL**, **PSL**, **SA20**, **CPL**, **The Hundred**, **MLC**, **ILT20**, **LPL**, **Ranji Trophy**, **County Championship**, **Ashes**, **WTC**, and all **ICC World Cups**.
- **Unified Series Grouping**: Groups matches by canonical tournament name with dynamic series vector badges.

### 🏎️ Formula 1 (Official F1 & Jolpi CA Integration)
- **Race Weekend Schedule**: Live countdown and exact local start times for Practice sessions (FP1, FP2, FP3), Sprint Qualifying, Sprint, Qualifying, and Grand Prix Main Race.
- **Previous Grand Prix Results**: Podium finishers (P1, P2, P3), pole position setter, and fastest lap holder.
- **Championship Standings**: Real-time Driver & Constructor championship leaderboards with official team colors.

### 📰 Sports News Aggregator
- **ESPNcricinfo HD Stories**: Verified picture enclosures from `img1.hscicdn.com` and `p.imgci.com`.
- **CREX Top Stories**: Sanitized Google Cloud Storage news images with automatic entity decoding.
- **FotMob World News**: Global football breaking news with lead paragraphs and publication timestamps.
- **Followed News Filtering**: Filter news stories mentioning only the clubs, cricket teams, or drivers you follow.

---

## 📦 Project Structure

```text
ScoreQuick/
├── 📄 manifest.json             # Manifest V3 Extension configuration
├── 📄 background.js            # Background service worker (polling & badge alarms)
├── 📄 README.md                # Project documentation
├── 📁 icons/                   # Extension icons (16px, 48px, 128px)
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── 📁 popup/                   # Popup user interface
│   ├── popup.html             # Main popup DOM structure
│   ├── popup.css              # Glassmorphic dark styling & animations
│   └── popup.js               # Reactive UI controller & rendering engine
└── 📁 services/                # Modular API integration layer
    ├── fotmob.js              # FotMob world news & football live match scraper
    ├── crex.js                # CREX & ESPNcricinfo cricket match aggregator
    ├── f1.js                  # Formula 1 schedule, timing, and standings API
    ├── news.js                # Multi-sport rich news aggregation service
    ├── favorites.js           # Followed teams/leagues catalog & fuzzy matching
    └── notifications.js       # Background badge counts & desktop alerts
```

---

## 🛠️ Installation & Setup

### For Users / Developers

1. **Clone or Download the Repository**:
   ```bash
   git clone https://github.com/giri-sayan/ScoreQuick.git
   ```
   *(or download and extract the ZIP file from GitHub)*

2. **Open Google Chrome Extensions Page**:
   - Navigate to `chrome://extensions/` in your browser address bar.
   - Enable **Developer mode** toggle in the top-right corner.

3. **Load Unpacked Extension**:
   - Click the **Load unpacked** button in the top-left corner.
   - Select the `ScoreQuick` root directory containing `manifest.json`.

4. **Pin to Toolbar**:
   - Click the puzzle icon (Extensions menu) on the Chrome toolbar and pin **ScoreQuick**.
   - Click the ScoreQuick icon to open the live popup!

---

## ⚙️ Configuration & Settings

| Setting | Options | Default | Description |
| :--- | :--- | :--- | :--- |
| **Auto-Refresh Rate** | `10s`, `30s`, `1m` | `10s` | Interval for background and active popup score refresh |
| **Default Startup View** | Discover, Followed, Football, Cricket, F1, News | Discover | Initial tab displayed upon extension installation |
| **Followed Filter** | All / Followed | Followed | Toggle to view all matches vs followed teams only |
| **Desktop Alerts** | On / Off | On | Instant notification when followed team starts/scores |

---

## 🔒 Permissions & Privacy

ScoreQuick is built with a **strict privacy-first philosophy**:
- ❌ **No telemetry, analytics, or user tracking.**
- ❌ **No personal data collection.**
- ✅ **Local Storage only**: Followed teams, preferred refresh intervals, and cached feeds are stored strictly inside your browser's local `chrome.storage`.
- 🌐 **Host Permissions**:
  - `fotmob.com` (Football fixtures and world news)
  - `crex.live` & `crickapi.com` (Cricket live scoreboards)
  - `espncricinfo.com` & `espncdn.com` (Cricket scorepanels, HD news images, crests)
  - `formula1.com` & `jolpi.ca` (Official F1 weekend schedules and driver standings)
  - `cricketvectors.akamaized.net` (High-resolution tournament vector badges)

---

## 👨‍💻 Author

**Sayan Giri**
- GitHub: [@giri-sayan](https://github.com/giri-sayan)
- Repository: [https://github.com/giri-sayan/ScoreQuick](https://github.com/giri-sayan/ScoreQuick)

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.
