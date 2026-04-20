# Mobile Agent — React Native

## Stack
- React Native + Expo SDK 51
- Navigation: React Navigation (`src/navigation/`)
- State: Zustand (`src/store/`)
- Storage: MMKV encrypted — **never AsyncStorage**
- i18n: `src/i18n/`
- pnpm workspace — root: `../../`

## Colors
- Primary: `#22c55e` (green)
- Danger:  `#ef4444` (red)
- Theme config: `src/theme/`

## File structure
```
components/     ← Reusable RN components
i18n/           ← Arabic/English strings
lib/            ← API client, utils
navigation/     ← React Navigation stacks & tabs
screens/        ← App screens
store/          ← Zustand stores
theme/          ← Colors, spacing, typography
types/          ← TypeScript types
```

## Rules
- Use `MMKV` for all local storage — import from `src/lib/storage`
- Arabic RTL: wrap root with `I18nManager.forceRTL(true)` if needed
- All API calls through `src/lib/` — handle `{ success, data, message }` shape
- Use `StyleSheet.create` — no inline styles
- Expo SDK 51 — use `expo-*` packages, not bare RN equivalents
- Never store raw JWT in plain storage — always encrypted MMKV
