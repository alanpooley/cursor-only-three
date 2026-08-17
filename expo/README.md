# Only Three (Expo app)

Native cross-platform mobile app built with Expo Router + React Native.

**Platform**: Native iOS & Android app, exportable to web
**Framework**: Expo Router + React Native + TypeScript

## Getting started

Requires Node.js and Bun — [install Node.js with nvm](https://github.com/nvm-sh/nvm) and [install Bun](https://bun.sh/docs/installation).

```bash
# Install dependencies
bun install

# Start the web preview (auto-reloading)
bun run start-web

# Start for Expo Go / device
bun run start        # then press "i" for iOS Simulator or "a" for Android Emulator
```

## What technologies are used for this project?

- **React Native** - Cross-platform native mobile development framework
- **Expo** - Toolchain and managed workflow on top of React Native
- **Expo Router** - File-based routing system, with support for web
- **TypeScript** - Type-safe JavaScript
- **React Query** - Server state management
- **Zustand** - Client state management
- **Lucide React Native** - Icons

## Testing the app

### On your phone

1. Install [Expo Go](https://apps.apple.com/app/expo-go/id982107779) (iOS) or the [Expo Go Android app](https://play.google.com/store/apps/details?id=host.exp.exponent)
2. Run `bun run start` and scan the QR code from your development server

### In your browser

Run `bun run start-web` to test in a web browser. Some native features (haptics, notifications, location) aren't available on web.

### iOS Simulator / Android Emulator

If you have Xcode (iOS) or Android Studio installed:

```bash
bun run start -- --ios
bun run start -- --android
```

## Custom Development Builds

For native features not available in Expo Go — native auth, in-app purchases, push notifications, custom native modules — you'll need a [Custom Development Build](https://docs.expo.dev/develop/development-builds/introduction/):

```bash
bun i -g @expo/eas-cli
eas build:configure
eas build --profile development --platform ios
eas build --profile development --platform android
bun start --dev-client
```

## Deployment

### App Store / Google Play

```bash
eas build --platform ios      # or android
eas submit --platform ios     # or android
```

See [Expo's iOS](https://docs.expo.dev/submit/ios/) and [Android](https://docs.expo.dev/submit/android/) deployment guides.

### Web

```bash
eas build --platform web
eas hosting:configure
eas hosting:deploy
```

Or deploy the web build to Vercel/Netlify directly from this repo.

## Project structure

```
├── app/                    # App screens (Expo Router)
│   ├── _layout.tsx        # Root layout
│   ├── index.tsx          # Home screen
│   ├── history.tsx        # History screen
│   ├── settings.tsx       # Settings screen
│   ├── streak.tsx         # Streak screen
│   ├── uncompleted.tsx    # Uncompleted tasks screen
│   └── modal.tsx          # Modal screen
├── components/             # Shared UI components
│   └── home/               # Home-layout-specific components (2.0 Beta)
├── providers/               # App-wide context/state providers
├── services/                 # Storage & notifications
├── constants/                 # Theme & color constants
├── utils/                      # Date/streak helpers
├── assets/                      # Static assets (icons, images)
├── app.json                     # Expo configuration
├── package.json                 # Dependencies and scripts
└── tsconfig.json                # TypeScript configuration
```

## Troubleshooting

- **App not loading on device?** Make sure your phone and computer are on the same WiFi network, or use tunnel mode (`bun run start` already does).
- **Build failing?** Clear cache with `bunx expo start --clear`, or delete `node_modules` and reinstall (`rm -rf node_modules && bun install`).
- See [Expo's troubleshooting guide](https://docs.expo.dev/troubleshooting/build-errors/) for more.
