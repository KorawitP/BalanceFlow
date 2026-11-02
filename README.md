# BalanceFlow

Personal finance app for tracking income and expenses, built with **Expo / React Native**,
**TypeScript**, and **Firebase**.

## Features

- Email/password authentication (Firebase Auth)
- Add, edit, and delete transactions
- Monthly budget view and spending reports
- Category breakdown and theming (light/dark)
- Drawer navigation with Expo Router

## Tech stack

| Layer | Choice |
| --- | --- |
| App | Expo + React Native, Expo Router |
| Language | TypeScript |
| Backend | Firebase Auth + Cloud Firestore |
| Tests | Jest (`components/__tests__`, `hooks/__tests__`, `app/**/__tests__`) |

## Getting started

```bash
cd my-mobile-app
npm install
npx expo start
```

Firebase credentials are read from environment variables (see `my-mobile-app/firebaseConfig.ts`):

```
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
```

Never commit real keys — use a local `.env` file.

## Tests

```bash
cd my-mobile-app
npm test
```

## Layout

```
my-mobile-app/
  app/            screens (drawer: index, budget, reports, settings; auth; transaction)
  components/     TransactionItem, themed UI primitives
  contexts/       ThemeContext
  hooks/          useAuth, useBudget
  constants/      categories, theme
  firebaseConfig.ts
```

## License

MIT — see [LICENSE](LICENSE).
