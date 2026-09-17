# HeatMap

A cross-platform HeatMap habit, fitness, and diet tracking application built with React Native and Expo.

## Features
- **Cross-Platform**: Runs on iOS, Android, and macOS Desktop (via Expo Web / Electron).
- **Dynamic Views**: Seamlessly switch between Weekly, Monthly, and Yearly contribution matrices.
- **Native Widgets**: Simulated in-app Widget Studio, plus boilerplate for iOS WidgetKit and Android RemoteViews.
- **Strict Aesthetic**: Minimalist grid design. Zero pill buttons, zero emojis, zero gradients. Clean palettes (Emerald, Amber, Obsidian, Cyan, Crimson).
- **Local Storage**: Offline-first using `@react-native-async-storage/async-storage`.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the application:
   ```bash
   # Run for Web / Desktop preview
   npm run web
   
   # Run for macOS Native Window (Requires Electron)
   npm run desktop
   
   # Run on iOS / Android
   npm start
   ```

## Tech Stack
- Expo SDK 52
- React Native
- React Native Web
- Lucide Icons

## Deployment Plan

### 1. Web
- Build static files: `npx expo export -p web`
- Deploy `dist/` folder to **Vercel**, **Netlify**, or **Cloudflare Pages**.

### 2. Mac Desktop (Electron)
- Install `electron-builder`: `npm install -D electron-builder`
- Add build config to `package.json` pointing to `electron/main.js`.
- Run `npx electron-builder --mac` to generate a `.dmg` or `.app`.

### 3. iOS / Android App (App Store & Play Store)
- Use Expo Application Services (EAS).
- Install EAS CLI: `npm install -g eas-cli`
- Run `eas build -p ios` for iOS (requires Apple Developer account).
- Run `eas build -p android` for Android (AAB file for Play Console).

## Connectivity Issues (Expo Go)
If iOS/Android QR codes time out, use tunnel mode to bypass firewalls:
`npx expo start --tunnel`
