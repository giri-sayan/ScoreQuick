<div align="center">

  <img src="icons/icon128.png" alt="ScoreQuick Logo" width="100" height="100" />

# ScoreQuick ⚡

### Real-Time Live Sports Scores & News Extension for Your Browser

[![Manifest V3](https://img.shields.io/badge/Chrome%20Extension-Manifest%20V3-blue?style=for-the-badge&logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Version](https://img.shields.io/badge/Version-1.2.0-green?style=for-the-badge)](https://github.com/giri-sayan/ScoreQuick)
[![Sports](https://img.shields.io/badge/Sports-Football%20%7C%20Cricket%20%7C%20F1-orange?style=for-the-badge)](https://github.com/giri-sayan/ScoreQuick)
[![License](https://img.shields.io/badge/License-Proprietary%20%7C%20All%20Rights%20Reserved-red?style=for-the-badge)](#-license--copyright)

  <p align="center">
    <strong>ScoreQuick</strong> is a lightning-fast, privacy-focused browser extension providing real-time live scores, comprehensive match centers, followed team hubs, and breaking sports news across <b>Football</b>, <b>Cricket</b>, and <b>Formula 1</b>.
  </p>

  <p align="center">
    <a href="#-key-features">Key Features</a> •
    <a href="#-sports-coverage">Sports Coverage</a> •
    <a href="#-data-sources--acknowledgements">Data Sources</a> •
    <a href="#-installation">Installation</a> •
    <a href="#-architecture--codebase">Architecture</a> •
    <a href="#-permissions--privacy">Permissions</a> •
    <a href="#-author">Author</a>
  </p>

</div>

---

## 🚀 Key Features

- ⚡ **Unified Live Scoreboard**: Real-time scores and live match statuses for Football, Cricket, and Formula 1 in a single popup.
- ⭐ **Personalized Followed Tab**: Follow your favorite clubs, national teams, cricket franchises, tournaments, F1 drivers, and constructors.
- 🕒 **Smart 4-Day Window Feed**: Displays live matches, yesterday's results, today's schedule, and upcoming fixtures (next 48h) seamlessly.
- 📰 **Rich Sports News Feed**: Breaking headlines aggregated directly from global football news, HD cricket stories, and F1 updates with Followed team filters.
- 🔍 **Discover & Global Search**: Browse and search top European & international football clubs, cricket nations & IPL teams, and F1 drivers/constructors.
- 🏆 **High-Resolution Vector Crests**: Official tournament, league, and team badges for clean, modern presentation.
- 🔄 **Configurable Auto-Refresh**: Customizable polling rates (`10s`, `30s`, `1m`) with smooth animated indicators and sub-second load times.
- 🔔 **Instant Live Alerts & Badge**: Background polling with toolbar badge counters for live followed matches and desktop notifications.
- 🌙 **Midnight Purple & Obsidian Dark UI**: Compact, high-contrast dark theme engineered for fast glanceability.

---

## 🏟️ Sports Coverage

### ⚽ Football Hub

- **Live Match Centers**: Real-time match minute, live scores, halftime/fulltime scores, penalty shootouts, and aggregate scores.
- **Competitions Covered**: Premier League, UEFA Champions League, LaLiga, Serie A, Bundesliga, Ligue 1, Europa League, MLS, Saudi Pro League, Indian Super League (ISL), and international tournaments.
- **Verified Crests**: High-resolution club crests and competition badges.
- **Direct Match Links**: Fast 1-click navigation to match details and live commentary.

### 🏏 Cricket Hub

- **Ball-by-Ball Accuracy**: Live runs, wickets, current overs, striker/non-striker on crease, bowler figures, and target situations.
- **Dual-Feed Redundancy**: Redundant live data architecture for high availability and zero downtime.
- **Official Tournament Crests**: Dedicated vector crests for **IPL**, **WPL**, **BBL**, **PSL**, **SA20**, **CPL**, **The Hundred**, **MLC**, **ILT20**, **LPL**, **Ranji Trophy**, **County Championship**, **Ashes**, **WTC**, and all **ICC World Cups**.
- **Unified Series Grouping**: Groups matches by canonical tournament name with dynamic series badges.

### 🏎️ Formula 1 Hub

- **Race Weekend Schedule**: Live countdown and exact local start times for Practice sessions (FP1, FP2, FP3), Sprint Qualifying, Sprint, Qualifying, and Grand Prix Main Race.
- **Previous Grand Prix Results**: Podium finishers (P1, P2, P3), pole position setter, and fastest lap holder.
- **Championship Standings**: Real-time Driver & Constructor championship leaderboards with official team colors.

---

## 🌐 Data Sources & Acknowledgements

ScoreQuick aggregates open and public sports feeds to deliver real-time data:

| Sport / Feature                     | Underlying Provider & Source APIs                                                                                             |
| :---------------------------------- | :---------------------------------------------------------------------------------------------------------------------------- |
| **Football Scores & News**          | **FotMob API & ESPN Soccer** (Real-time fixtures, live minute, club badges & world news)                                      |
| **Cricket Scores & Over Telemetry** | **CREX & ESPNcricinfo** (Live ball-by-ball commentary, match scorepanels & HD cover images)                                   |
| **Formula 1 Schedule & Standings**  | **Official Formula 1 Live Timing, Ergast / Jolpica API & ESPN F1** (Grand Prix weekends, driver/constructor standings & news) |
| **Tournament Vector Crests**        | **Akamai Cricket Vectors, ESPN CDN & Official Sport CDNs**                                                                    |

_All product names, logos, and brands are property of their respective owners. Their mention here is solely for informational and source attribution purposes._

---

## 📦 Project Structure

```text
ScoreQuick/
├── 📄 manifest.json             # Manifest V3 Extension configuration
├── 📄 background.js            # Background service worker (polling & badge alarms)
├── 📄 README.md                # Project documentation & data source attributions
├── 📁 icons/                   # Extension icons (16px, 48px, 128px)
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── 📁 popup/                   # Popup user interface
│   ├── popup.html             # Main popup DOM structure
│   ├── popup.css              # Glassmorphic dark styling & animations
│   └── popup.js               # Reactive UI controller & rendering engine
└── 📁 services/                # Modular API integration layer
    ├── football.js            # Football live match scores, standings & league sorting
    ├── cricket.js             # Cricket multi-feed aggregator & ball-by-ball telemetry
    ├── f1.js                  # Formula 1 schedule, timing, and standings engine
    ├── news.js                # Multi-sport rich news aggregation service
    ├── favorites.js           # Followed teams catalog, fuzzy matching & verified crests
    └── notifications.js       # Background badge counts & desktop alerts
```

---

## 🛠️ Installation & Setup

### For Users / Developers

1. **Clone or Download the Repository**:

   ```bash
   git clone https://github.com/giri-sayan/ScoreQuick.git
   ```

   _(or download and extract the ZIP file from GitHub)_

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

| Setting                  | Options                                         | Default  | Description                                            |
| :----------------------- | :---------------------------------------------- | :------- | :----------------------------------------------------- |
| **Auto-Refresh Rate**    | `10s`, `30s`, `1m`                              | `10s`    | Interval for background and active popup score refresh |
| **Default Startup View** | Discover, Followed, Football, Cricket, F1, News | Discover | Initial tab displayed upon extension installation      |
| **Followed Filter**      | All / Followed                                  | Followed | Toggle to view all matches vs followed teams only      |
| **Desktop Alerts**       | On / Off                                        | On       | Instant notification when followed team starts/scores  |

---

## 🔒 Permissions & Privacy

ScoreQuick is built with a **strict privacy-first philosophy**:

- ❌ **No telemetry, analytics, or user tracking.**
- ❌ **No personal data collection.**
- ✅ **Local Storage only**: Followed teams, preferred refresh intervals, and cached feeds are stored strictly inside your browser's local `chrome.storage`.
- 🌐 **Host Permissions**:
  - `fotmob.com` (Football fixtures and world news)
  - `static.flashscore.com` (Football competition badges and club/national crests)
  - `images.onefootball.com` (Football competition badges and backup crests)
  - `indiansuperleague.com` (Official Indian Super League badges and club crests)
  - `crex.com` & `crickapi.com` (Cricket live scoreboards & match centers)
  - `espncricinfo.com` & `espncdn.com` (Cricket scorepanels, HD news images, crests)
  - `formula1.com` & `jolpi.ca` (Formula 1 weekend schedules and driver standings)
  - `cricketvectors.akamaized.net` (High-resolution tournament vector badges)

---

## 👨‍💻 Author

**Sayan Giri**

- GitHub: [@giri-sayan](https://github.com/giri-sayan)
- Repository: [https://github.com/giri-sayan/ScoreQuick](https://github.com/giri-sayan/ScoreQuick)

---

## 📄 License & Copyright

**Copyright © 2026 Sayan Giri. All Rights Reserved.**

This software is **Proprietary and Confidential**. Unauthorized copying, reproduction, distribution, decompilation, reverse engineering, or commercial use of this codebase, via any medium, is strictly prohibited without prior written permission. See the [LICENSE](LICENSE) file for the full proprietary terms.
