# Civic Current Mobile

This repository now runs as an Expo React Native app instead of a Next.js site. The app turns the previous smart-city kit content into a mobile operator dashboard with native cards, forms, command actions, kit directory views, and inventory/rubric sections.

## Run

```bash
npm install
npm run start
```

Optional targets:

- `npm run android`
- `npm run ios`
- `npm run web`

## App Structure

- `App.tsx`: main Expo mobile UI
- `lib/component-inventory.ts`: shared inventory data
- `lib/kit-catalog.ts`: kit directory data
- `app.json`: Expo configuration

## Notes

- The old Next.js app shell and browser-only UI were replaced by native React Native components.
- `npm run lint` now runs a TypeScript check.
