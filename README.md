<p align="center">
  <img src="assets/favicon.png" width="80" height="80" alt="TrackHeat Logo" />
</p>

<h1 align="center">TrackHeat</h1>

<p align="center">
  <strong>High-density binary habit matrix engine inspired by GitHub contribution graphs.</strong>
</p>

<p align="center">
  <a href="https://github.com/Jatinbhardwaj-093/HeatMap/releases/tag/v1.1.0"><img src="https://img.shields.io/badge/Release-v1.1.0-238636.svg?style=flat-square" alt="Version 1.1.0" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square" alt="License: MIT" /></a>
  <img src="https://img.shields.io/badge/Expo-SDK_57-black.svg?style=flat-square&logo=expo" alt="Expo SDK 57" />
  <img src="https://img.shields.io/badge/React_Native-0.86-61DAFB.svg?style=flat-square&logo=react" alt="React Native 0.86" />
  <img src="https://img.shields.io/badge/React-19.2-61DAFB.svg?style=flat-square&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-6.0-3178C6.svg?style=flat-square&logo=typescript" alt="TypeScript 6.0" />
  <img src="https://img.shields.io/badge/Platforms-macOS_%7C_Android_%7C_Web_%7C_iOS-green.svg?style=flat-square" alt="Platform Support" />
</p>

<p align="center">
  <a href="#downloads--distribution">Downloads</a> •
  <a href="#core-philosophy">Philosophy</a> •
  <a href="#key-capabilities">Capabilities</a> •
  <a href="#security--privacy-architecture">Security</a> •
  <a href="#screenshots">Screenshots</a> •
  <a href="#quickstart">Quickstart</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#license">License</a>
</p>

---

## Downloads & Distribution

Official binary releases for version 1.1.0:

| Platform | Format | Status | Link |
| :--- | :--- | :--- | :--- |
| **macOS** | DMG (Apple Silicon / ARM64) | Production | [Download TrackHeat-1.1.0-arm64.dmg](https://github.com/Jatinbhardwaj-093/HeatMap/releases/download/v1.1.0/TrackHeat-1.1.0-arm64.dmg) |
| **Android** | Standalone APK | Production | [Download TrackHeat-1.1.0.apk](https://github.com/Jatinbhardwaj-093/HeatMap/releases/download/v1.1.0/TrackHeat-1.1.0.apk) |
| **Web** | Progressive Web Application | Live | [https://trackheat.surge.sh](https://trackheat.surge.sh) |
| **iOS** | Native IPA with WidgetKit | In Development | Coming Soon |

---

<p align="center">
  <img src="assets/screenshots/dashboard.png" width="94%" alt="TrackHeat Dashboard Overview" />
</p>

## Core Philosophy

Most habit trackers fail because they demand excessive bookkeeping: arbitrary numerical quotas, percentage sliders, and cumbersome logs that introduce cognitive resistance.

TrackHeat strips habit tracking down to a pure boolean decision:

> **Did you show up today? Yes or No.**

Inspired by software version control commit momentum, TrackHeat translates human discipline into the visual geometry of contribution matrices. Each consecutive completed day scales tile density and color depth, building unbroken streaks that motivate sustained performance.

---

## Key Capabilities

- **Interactive Android Home Screen Widgets**: Real-time RemoteViews widgets (2x2 small and 4x2 medium) powered by `react-native-android-widget`. Includes 1-tap direct completion toggle, 7-row matrix visualization, custom habit aliases, theme switching (System / Dark / Light), and five color palettes.
- **Native Android Widget Configuration**: Built-in system configuration activity (`WidgetConfigurationScreen`) with live 7-row interactive matrix preview, custom alias naming, and palette selection.
- **Full-Year Annual Grid (52 Weeks)**: View 364 days of consistency in a single centered layout with accurate calendar alignment and month headers.
- **Zero-Scroll Mobile Micro-Matrix**: Mobile viewports automatically calculate micro cell dimensions (~4.5px cells with 1.5px gaps) with non-overlapping bi-monthly markers (Jan, Mar, May, Jul, Sep, Nov) and compact weekday labels (M, W, F, S), eliminating horizontal scroll fatigue.
- **Dynamic Streak Intensity**: Tile brightness and color depth scale organically with consecutive streak length (1 day, 3 days, 7 days, and 14+ days).
- **Curated Color Palettes**:
  - `Emerald Matrix`: Standard GitHub contribution greens
  - `Industrial Amber`: Warm high-contrast amber
  - `Cold Cyan`: Terminal cyan blue
  - `Obsidian`: High-contrast monochrome
  - `Crimson`: High-intensity ruby
- **Per-Habit Independent View Modes**: Toggle between Annual Macro (52 weeks) and Monthly Micro views on each habit card independently.
- **Offline-First Persistence with Cloud Sync**: Dual-tier storage architecture leveraging local `AsyncStorage` alongside seamless background Supabase authentication sync (`user_metadata.habits`).
- **Native macOS Desktop Client**: Packaged via Electron with custom title bar traffic-light alignment, native dragging regions, and offline disk operation.

---

## Security & Privacy Architecture

TrackHeat is engineered with strict defensive security principles:

1. **Electron Hardening**:
   - `webSecurity: true` enforced on all browser windows and widget popups.
   - `nodeIntegration: false` and `contextIsolation: true` preventing renderer-level code execution.
   - Custom `app://` protocol registered with strict path normalization to prevent directory traversal attacks.
   - External links intercepted and routed through the default operating system browser (`shell.openExternal`) rather than loaded within application frames.
   - Unsolicited `<webview>` attachments and in-window navigations explicitly denied.

2. **Data Privacy**:
   - Zero telemetry, analytics beacons, or third-party trackers.
   - User email addresses are kept strictly within private authentication tables and never stored in or exposed via public database profiles.
   - Local device storage mapping for username resolution prevents email harvesting.
   - Offline guest mode allows complete application usage without requiring account registration.

3. **Authentication Controls**:
   - Current password re-authentication verification required before committing password updates.
   - Strict username sanitization (`/^[a-zA-Z0-9_.-]{3,25}$/`) preventing injection and malformed identifiers.

---

## Screenshots

<div align="center">
  <img src="assets/screenshots/landing.png" width="94%" alt="TrackHeat Landing Page" />
  <p><em>TrackHeat responsive landing page with live 52-week matrix simulator</em></p>
</div>

<br />

<div align="center">
  <img src="assets/screenshots/dashboard.png" width="94%" alt="TrackHeat Dashboard" />
  <p><em>Individual tracker dashboard featuring centered matrix grids and inline streak metrics</em></p>
</div>

---

## Quickstart

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- `npm` or `yarn`

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/Jatinbhardwaj-093/HeatMap.git trackheat
cd trackheat
npm install
```

### 2. Run Development Server

```bash
# Run Web Application
npm run web

# Run macOS Desktop App (Requires Electron)
npm run dev:desktop

# Run with Expo Go for Android & iOS
npm start
```

### 3. Production Builds

```bash
# Export static web distribution (outputs to ./dist)
npx expo export -p web

# Build standalone macOS Universal .DMG installer (outputs to ./release)
npm run build:mac

# Build standalone Android APK via EAS
npm run build:apk

# Deploy web bundle to production domain
npm run deploy:web
```

---

## Architecture

TrackHeat is structured around a universal React Native modular architecture:

```
trackheat/
├── assets/                  # App icons, favicons, and screenshots
│   ├── favicon.png          # 3x3 matrix grid icon
│   ├── icon.png             # Unified cross-platform app icon
│   └── screenshots/         # Documentation screenshots
├── electron/
│   └── main.js              # Hardened Electron desktop runner & custom app:// protocol
├── src/
│   ├── components/          # Core application UI components
│   │   ├── AccountModal.tsx # Account profile, username management, and password security
│   │   ├── CreateHeatmapModal.tsx # New habit creation dialog with palette picker
│   │   ├── DayCell.tsx      # Individual matrix tile with intensity levels
│   │   ├── DayDetailModal.tsx # Minimalist binary completion toggler
│   │   ├── DesktopWidgetView.tsx # Floating macOS desktop widget
│   │   ├── Header.tsx       # Navigation bar with theme toggle & account controls
│   │   ├── HeatmapCard.tsx  # Habit tracker card with inline metrics & action menu
│   │   ├── LandingPage.tsx  # Responsive landing page with direct release download links
│   │   ├── LoginScreen.tsx  # Keyboard-aware auth screen with guest mode support
│   │   ├── MonthlyView.tsx  # Month calendar grid with date selection
│   │   ├── StatsOverview.tsx# Aggregate metrics & current streak totals
│   │   ├── ViewSwitcher.tsx # Segmented control for Month and Year views
│   │   ├── WidgetStudioModal.tsx # Home screen widget configuration & preview studio
│   │   └── YearlyView.tsx   # Centered 52-week contribution matrix grid
│   ├── constants/
│   │   └── palettes.ts      # 5-tier intensity color palettes (Dark & Light scales)
│   ├── services/
│   │   └── accountService.ts# Profile updates, username availability, and password management
│   ├── theme/
│   │   └── theme.ts         # ThemeProvider context & light/dark tokens
│   ├── types/
│   │   └── heatmap.ts       # TypeScript models for HeatMaps, Days & Views
│   ├── utils/
│   │   ├── dateUtils.ts     # Grid date mathematics & month header calculations
│   │   ├── platform.ts      # Platform detection & desktop drag helpers
│   │   ├── storage.ts       # Dual-tier offline storage & Supabase cloud sync
│   │   ├── streakUtils.ts   # Streak counter & intensity level algorithms
│   │   └── supabase.ts      # Supabase cloud client initialization
│   └── widgets/             # Native Android home screen widgets
│       ├── TrackHeatWidget.tsx # RemoteViews headless widget component
│       ├── WidgetConfigurationScreen.tsx # Android launcher configuration activity
│       ├── widgetStorage.ts # Headless widget configuration & state store
│       ├── widgetSync.tsx   # Sync bridge pushing in-app updates to Android widgets
│       └── widgetTaskHandler.tsx # Android widget lifecycle broadcast receiver
├── App.tsx                  # Root navigation router, safe area provider & state container
├── app.json                 # Expo SDK 57 project configuration & widget plugin
├── eas.json                 # EAS build pipeline profiles for Android APK
└── package.json             # Manifest, scripts & dependency definitions
```

---

## Tech Stack

| Layer | Technology | Specification |
| :--- | :--- | :--- |
| **Framework** | Expo SDK | `~57.0.26` |
| **Core Runtime** | React & React Native | `react@19.2.3` / `react-native@0.86.3` |
| **Language** | TypeScript | `~6.0.3` |
| **Web Runtime** | React Native Web | `~0.21.0` |
| **Desktop Runtime** | Electron | `^34.0.0` with `electron-builder` |
| **Android Widgets** | react-native-android-widget | Headless RemoteViews AppWidgetProvider |
| **Database & Auth** | Supabase | `@supabase/supabase-js ^2.116.0` |
| **Local Storage** | AsyncStorage | `@react-native-async-storage/async-storage 2.2.0` |
| **Icons** | Lucide Icons | `lucide-react-native` |
| **Safe Area** | React Native Safe Area Context | `~5.7.0` |

---

## Contributing

Contributions, issues, and feature requests are welcome. Feel free to open an issue or submit a pull request on [GitHub](https://github.com/Jatinbhardwaj-093/HeatMap).

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/MyFeature`
3. Commit your changes: `git commit -m 'feat: add feature'`
4. Push to branch: `git push origin feature/MyFeature`
5. Open a Pull Request.

---

## License

Distributed under the **MIT License**. See [LICENSE](LICENSE) for more information.

Copyright (c) 2026 **Jatin Bhardwaj**
