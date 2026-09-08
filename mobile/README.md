# MedAssist Mobile

Expo / React Native mobile app for MedAssist AI. Independent from `client/`
(the existing web app) — shares nothing but the backend API and MongoDB.

## Architecture

```
mobile (Expo Router, React Native)
   ↓  HTTPS + Bearer JWT
backend/  (Express, unchanged)
   ↓
MongoDB, AI Gateway (Gemini + Groq)
```

- **No new backend, no duplicated business logic.** Every screen calls an
  existing `backend/routes/*.routes.js` endpoint through `mobile/services/`.
- **No Gemini/Groq keys in the app.** The mobile bundle only ever talks to
  the Express API; AI calls happen server-side exactly as they do for the
  web client.
- **Email-only reminders.** The mobile app manages reminder *definitions*
  (CRUD) and today's dose list via the existing `/api/reminders` routes.
  Actual dose-time delivery is `backend/services/reminderScheduler.js`
  (node-cron) + `emailService.js` and runs independent of whether the app
  is open. No WhatsApp/Twilio code exists anywhere in this app or the
  backend.

## Authentication — how it works without browser cookies

The web app authenticates via an httpOnly cookie set by
`sendTokenResponse()` in `backend/utils/sendTokenResponse.js`. React
Native has no shared cookie jar with `fetch`/axios, so cookies aren't a
usable strategy on mobile.

**No backend change was required.** Inspection of
`backend/middleware/auth.js`'s `protect` middleware showed it already
falls back to `Authorization: Bearer <token>` when no cookie is present,
and `sendTokenResponse()` already returns `token` in the JSON body
alongside setting the cookie. So:

1. On login/register, the mobile app reads `data.token` from the response.
2. It's stored in `expo-secure-store` (iOS Keychain / Android Keystore),
   never AsyncStorage, never logged.
3. `services/api.js`'s request interceptor attaches
   `Authorization: Bearer <token>` to every request.
4. A 401 response anywhere clears the session and routes back to Login
   (`services/api.js` → `AuthContext.jsx`).

This is purely additive — the web app's cookie flow is untouched.

## Project structure

```
mobile/
├── app/                     # Expo Router file-based routes
│   ├── _layout.jsx          # Root: providers + auth-gated stack
│   ├── (auth)/               login, register, forgot-password
│   ├── (tabs)/                index (Dashboard), prescriptions, medicines,
│   │                          lab-reports, chat
│   ├── prescription/         [id], upload
│   ├── medicine/              [id]
│   ├── lab-report/            [id], upload
│   ├── reminders/              index, create, [id]
│   ├── health-score.jsx
│   ├── timeline.jsx
│   ├── profile.jsx
│   └── settings.jsx
├── components/
│   ├── ui/                   Screen, Card, Button, TextField, Badge, States
│   ├── DataCards.jsx          Prescription/Medicine/LabResult/Reminder/Timeline cards
│   └── HealthScoreRing.jsx    SVG radial score (react-native-svg)
├── services/                  One file per backend resource, thin axios wrappers
├── context/AuthContext.jsx    Session state, login/register/logout, 401 handling
├── hooks/useAuth.js
├── constants/theme.js         Mirrors client/tailwind.config.js tokens
├── constants/config.js        API_BASE_URL, storage keys, supported languages
├── utils/secureStorage.js     expo-secure-store wrapper for the JWT
└── assets/                    Placeholder icon/splash — see note below
```

## Backend APIs reused (no duplication)

| Feature | Endpoint(s) |
|---|---|
| Auth | `POST /api/auth/register`, `/login`, `/logout`, `GET /me`, `PUT /profile`, `PUT /update-password`, `POST /forgot-password`, `PUT /reset-password/:token` |
| Prescriptions | `POST /api/prescriptions` (multipart), `GET /`, `GET /:id`, `PUT /:id`, `DELETE /:id`, `POST /:id/analyze` |
| Medicines | `GET /api/medicines`, `GET /:id`, `POST /:id/analyze` |
| Lab Reports | `POST /api/lab-reports/upload` (multipart), `GET /`, `GET /:id`, `POST /:id/analyze`, `DELETE /:id` |
| Reminders | `GET /api/reminders`, `/today`, `/stats`, `POST /`, `PUT /:id`, `DELETE /:id`, `PUT /:id/mark` |
| Chat | `GET /api/chat`, `GET /:id`, `POST /`, `DELETE /:id` |
| Health | `GET /api/health-insights/score`, `/timeline` |
| Diet (wired, not yet screened) | `GET /api/diet/context`, `POST /generate`, `POST /:id/regenerate`, `GET /history`, `GET /:id`, `DELETE /:id` |

## Backend changes made

**None.** The existing Bearer-token fallback in `protect` middleware and
the token already present in `sendTokenResponse()`'s JSON body were
sufficient. Verified by reading `backend/middleware/auth.js` and
`backend/utils/sendTokenResponse.js` directly (not from docs, which
disagreed with the source in unrelated places, e.g. a stale WhatsApp
mention in `docs/FOLDER_STRUCTURE.md` that doesn't exist in the actual
codebase).

## Setup

```bash
cd mobile
npm install
cp .env.example .env
# edit .env — set EXPO_PUBLIC_API_URL to point at your running backend
npx expo start
```

**API URL by environment:**
- Android emulator → host machine: `http://10.0.2.2:5000/api`
- iOS simulator → `http://localhost:5000/api`
- Physical device (same Wi-Fi as your dev machine) → `http://<your-LAN-IP>:5000/api`

## Screens implemented

Splash/auth-gate, Login, Register, Forgot Password, Dashboard, AI Health
Score, AI Health Timeline, Prescriptions (list), Upload Prescription,
Prescription Details, Medicines (list), Medicine Details, Lab Reports
(list), Upload Lab Report, Lab Report Details, AI Chatbot, Reminders
(today + create + edit/delete), Profile, Settings (language, password,
notification info), Logout.

Not built as a separate screen: standalone Drug Interaction screen —
interactions render inline on Prescription Details (that's where the
existing backend attaches them via `analyzePrescription`), matching how
the data actually flows rather than adding a screen the API doesn't
support directly.

## Packages used

Expo 52, expo-router 4, expo-secure-store, expo-image-picker,
expo-document-picker, expo-linear-gradient, expo-blur (unused currently,
kept for future glass-panel treatments), @expo/vector-icons,
react-native-svg, react-native-safe-area-context, react-native-screens,
react-native-gesture-handler, react-native-reanimated, axios,
@react-native-async-storage/async-storage (installed for future
non-sensitive local caching; not used for the token).

No Redux — screen-local `useState` + `AuthContext` was sufficient for
this scope, matching the "don't over-engineer" instruction.

## Known limitations / honest status

- **Not run.** This sandbox has no network access, so `npm install`,
  `expo start`, and an Android/EAS build could not actually be executed
  or verified here. The code is written to a consistent, standard Expo
  Router 52 + React Native 0.76 API surface, but treat first boot as
  needing a normal debug pass (missing native module linking, RN version
  drift, etc. are the most likely first issues).
- `assets/icon.png`, `adaptive-icon.png`, `splash.png`, `favicon.png` are
  placeholder graphics (a simple teal ring + plus mark on the app's ink
  background), generated locally, not final brand assets — swap them for
  real ones before a production build.
- Camera/gallery/file-picker permission flows are implemented per Expo's
  documented API but untested on-device.
- No push notifications — reminders are intentionally email-only per your
  instructions; there's no local/OS notification scheduling in this app.
- Diet Guide has an API service (`services/dietApi.js`) but no screen yet
  — flagged as available for a future phase rather than silently dropped.
- `eas.json`'s `extra.eas.projectId` in `app.json` is a placeholder —
  run `eas build:configure` to populate it for your Expo account.

## Build commands

```bash
# Local dev
npx expo start

# Android local run (requires Android SDK / emulator)
npx expo run:android

# EAS development build
eas build --platform android --profile development

# EAS production build (AAB)
eas build --platform android --profile production
```

## Next steps for Android deployment

1. `npm install` inside `mobile/` and confirm `npx expo start` boots
   cleanly against a running local backend.
2. `eas build:configure` to generate a real EAS project ID, then replace
   the placeholder in `app.json`.
3. Replace placeholder assets with final MedAssist brand icon/splash.
4. Point `eas.json`'s `production.env.EXPO_PUBLIC_API_URL` at your real
   deployed backend origin.
5. `eas build --platform android --profile production` once the above is
   confirmed working in `development`/`preview` builds first.
