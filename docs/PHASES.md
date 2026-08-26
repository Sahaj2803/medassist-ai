# MedAssist — Build History (Phase-by-Phase)

This document is the detailed, phase-by-phase build log for MedAssist,
preserved from development. Each phase section includes what was built,
why specific decisions were made, and exactly how it was verified. For
the current, user-facing project overview, see the root
[`README.md`](../README.md). For API and database reference, see
[`API.md`](./API.md) and [`DATABASE_SCHEMA.md`](./DATABASE_SCHEMA.md).

---

# MedAssist — Phase 1: Foundation & Landing Page

AI-powered healthcare platform (MERN + Gemini + OCR). This phase sets up the
real project skeleton — a Vite/React frontend and an Express/MongoDB backend
— plus the public landing page shell (Navbar, Footer, Hero).

## 1. Folder structure

```
medassist/
├── client/                      # React + Vite frontend
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── package.json
│   ├── .env.example
│   ├── public/
│   │   └── favicon.svg
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css
│       ├── router/
│       │   └── AppRouter.jsx
│       ├── layouts/
│       │   └── MainLayout.jsx
│       ├── components/
│       │   ├── layout/
│       │   │   ├── Navbar.jsx
│       │   │   └── Footer.jsx
│       │   └── common/          # (reserved for Phase 2+)
│       ├── pages/
│       │   ├── LandingPage.jsx
│       │   └── NotFoundPage.jsx
│       ├── services/
│       │   └── api.js
│       ├── hooks/                # (reserved for Phase 2+)
│       ├── context/               # (reserved for Phase 2+)
│       ├── utils/                 # (reserved for Phase 2+)
│       └── assets/
│
└── backend/                     # Node + Express API
    ├── server.js
    ├── app.js
    ├── package.json
    ├── .env.example
    ├── config/
    │   ├── db.js
    │   └── env.js
    ├── middleware/
    │   └── errorHandler.js
    ├── routes/
    │   └── health.routes.js
    ├── controllers/              # (reserved for Phase 2+)
    ├── models/                   # (reserved for Phase 2+)
    ├── services/                  # (reserved for Phase 2+)
    ├── utils/                     # (reserved for Phase 2+)
    └── uploads/                   # multer upload target (Phase 3)
```

## 2. Install

```bash
# Backend
cd medassist/backend
npm install

# Frontend
cd ../client
npm install
```

## 3. Environment variables

```bash
# backend
cp backend/.env.example backend/.env
# then edit MONGO_URI and JWT_SECRET

# frontend
cp client/.env.example client/.env
```

You need a running MongoDB instance (local `mongod` or a MongoDB Atlas
connection string) for `MONGO_URI`.

## 4. Run

```bash
# Terminal 1 — backend (http://localhost:5000)
cd medassist/backend
npm run dev

# Terminal 2 — frontend (http://localhost:5173)
cd medassist/client
npm run dev
```

Vite is configured to proxy `/api` and `/uploads` to `http://localhost:5000`,
so the frontend can call `axios.get("/api/health")` directly with no CORS
issues in development.

## 5. Testing Phase 1

- Visit `http://localhost:5173` — the MedAssist landing page should render:
  navbar (sticky, responsive, mobile menu), animated hero with the
  prescription-scan visual, feature grid, "how it works" steps, and footer.
- Visit `http://localhost:5000/api/health` — should return:
  ```json
  { "success": true, "service": "MedAssist API", "status": "healthy", "timestamp": "..." }
  ```
- Visit `http://localhost:5000/` — should return
  `{ "success": true, "message": "MedAssist API is running" }`.
- Visit an unknown frontend route (e.g. `/foo`) — should render the styled
  404 page.
- Visit an unknown backend route (e.g. `/api/foo`) — should return a JSON
  404 via the centralized error handler.

## 6. What's next

Reply **NEXT** to start Phase 2: JWT authentication (Register, Login,
Protected Routes, Profile).

---

# Phase 2: Authentication (JWT, Register, Login, Protected Routes, Profile)

## New backend files

```
backend/
├── models/
│   └── User.js                  # schema, bcrypt hashing, JWT + reset-token methods
├── middleware/
│   ├── auth.js                  # protect(), authorize(...roles)
│   └── validate.js              # express-validator error formatter
├── controllers/
│   └── auth.controller.js       # register, login, logout, getMe, updateProfile,
│                                 # updatePassword, forgotPassword, resetPassword
├── routes/
│   └── auth.routes.js           # mounted at /api/auth
└── utils/
    └── sendTokenResponse.js     # signs JWT, sets httpOnly cookie, returns user
```

`app.js` now mounts `app.use("/api/auth", authRoutes)`.

## New frontend files

```
client/src/
├── context/AuthContext.jsx      # user state + register/login/logout/updateProfile
├── hooks/useAuth.js
├── services/authService.js      # axios calls to /api/auth/*
├── components/common/
│   ├── ProtectedRoute.jsx       # redirects to /login if not authenticated
│   ├── GuestRoute.jsx           # redirects to /dashboard if already logged in
│   ├── AuthLayout.jsx           # shared visual shell for auth pages
│   ├── FormField.jsx            # labeled input + inline error
│   └── PageLoader.jsx
└── pages/
    ├── auth/LoginPage.jsx
    ├── auth/RegisterPage.jsx
    ├── auth/ForgotPasswordPage.jsx
    ├── auth/ResetPasswordPage.jsx
    ├── ProfilePage.jsx
    └── DashboardPage.jsx        # placeholder landing spot; full dashboard in Phase 3/5
```

`main.jsx` wraps the app in `<AuthProvider>`. `AppRouter.jsx` adds
`/login`, `/register`, `/forgot-password`, `/reset-password/:resetToken`
(guest-only) and `/dashboard`, `/profile` (protected).

## API endpoints

| Method | Endpoint                          | Access  | Description                       |
|--------|------------------------------------|---------|------------------------------------|
| POST   | `/api/auth/register`               | Public  | Create account, sets JWT cookie    |
| POST   | `/api/auth/login`                  | Public  | Verify credentials, sets JWT cookie|
| POST   | `/api/auth/logout`                 | Private | Clears the JWT cookie              |
| GET    | `/api/auth/me`                     | Private | Returns the logged-in user         |
| PUT    | `/api/auth/profile`                | Private | Update name / phone / avatar       |
| PUT    | `/api/auth/update-password`        | Private | Change password (requires current) |
| POST   | `/api/auth/forgot-password`        | Public  | Generates reset token (logged server-side until Phase 5 wires Nodemailer) |
| PUT    | `/api/auth/reset-password/:token`  | Public  | Sets new password from a valid token |

## Install (new packages already in package.json from Phase 1)

No new packages needed — `bcryptjs`, `jsonwebtoken`, `express-validator`,
and `cookie-parser` were already declared. Just re-run install if you
haven't since Phase 1:

```bash
cd backend && npm install
cd ../client && npm install
```

## Testing Phase 2

Automated checks already run against this code (no live MongoDB required):
- Frontend: `npm run build` compiles clean with all new auth pages/routes.
- Backend: every file passes `node --check`; the Express app boots and:
  - `POST /api/auth/register` with an empty/invalid body returns `400`
    with field-level validation messages, **before** touching the database.
  - `GET /api/auth/me` without a token returns `401 "Not authorized. Please log in."`.
  - `POST /api/auth/login` with an invalid body returns `400` with validation messages.
  - bcrypt hashing and JWT sign/verify (the exact calls `User.js` makes)
    round-trip correctly.

To test the full flow end-to-end, you need a running MongoDB
(`MONGO_URI` in `backend/.env`):

1. `npm run dev` in both `backend/` and `client/`.
2. Go to `http://localhost:5173/register`, create an account →
   redirected to `/dashboard`, navbar shows your name.
3. Refresh the page — you should stay logged in (session cookie is
   verified via `GET /api/auth/me` on load).
4. Visit `/profile`, update your name/phone, then change your password.
5. Click **Log out** → redirected to `/`, navbar reverts to Login/Get started.
6. Try visiting `/dashboard` while logged out → redirected to `/login`.
7. Try visiting `/login` while logged in → redirected to `/dashboard`.
8. `POST /api/auth/forgot-password` with a registered email → check the
   backend console for the logged reset link, open
   `/reset-password/<token>`, set a new password.

## What's next

Reply **NEXT** to start Phase 3: Prescription upload, OCR, database
storage, and prescription history.

---

# Phase 3: Prescription Upload, OCR, Database, History

## New backend files

```
backend/
├── models/
│   ├── Prescription.js          # file metadata, OCR text/confidence, status
│   └── Medicine.js               # parsed medicine, per-field confidence, review flag
├── middleware/
│   └── upload.js                 # Multer disk storage, file-type/size validation
├── services/
│   ├── ocrService.js             # Tesseract.js for images, pdf-parse for PDFs
│   └── medicineParser.js         # regex-based extraction: name/dosage/frequency/
│                                  # duration/instructions, with a 0-1 confidence score
├── controllers/
│   └── prescription.controller.js
└── routes/
    └── prescription.routes.js    # mounted at /api/prescriptions, all routes protected
```

`app.js` now mounts `app.use("/api/prescriptions", prescriptionRoutes)` and
serves uploaded files statically from `/uploads`.

### How OCR + parsing works

1. **Upload** — `POST /api/prescriptions` (multipart, field name `file`)
   accepts JPG/PNG/WEBP/PDF up to 10MB, stored under
   `backend/uploads/prescriptions/<userId>/`.
2. **Extract** — images go through Tesseract.js (`ocrService.js`), which
   returns raw text plus Tesseract's own confidence score. PDFs go through
   `pdf-parse`, which reads the embedded text layer directly (high
   confidence) — a PDF with almost no extractable text is likely a scanned
   image and is scored low so it still gets flagged for review.
3. **Parse** — `medicineParser.js` splits the OCR text into lines, filters
   out header/footer noise (doctor name, patient info, signature lines),
   and pulls out medicine name, dosage (e.g. `500mg`), frequency (normalizes
   `OD/BD/TID/QID/HS/SOS`, `1-0-1` style schedules, and plain English), and
   duration. Each candidate gets its own 0–1 confidence score.
4. **Review** — any medicine below `REVIEW_CONFIDENCE_THRESHOLD` (0.6) is
   saved with `needsReview: true`. The prescription's overall `status`
   becomes `needs_review` until every flagged medicine is confirmed or
   corrected, at which point it flips to `processed`.
5. Users can also manually add a medicine the OCR missed entirely.

> **Note on OCR in this sandbox:** Tesseract.js downloads its English
> language model on first use and needs outbound internet access to do so.
> The routing, validation, parsing, and review-workflow logic above were
> all verified directly; end-to-end OCR against a real image should be
> tested in an environment with normal internet access (it will work
> out of the box there).

## New frontend files

```
client/src/
├── services/prescriptionService.js
├── components/prescriptions/
│   ├── StatusBadge.jsx
│   ├── MedicineCard.jsx          # inline edit/confirm for one medicine
│   └── AddMedicineForm.jsx
└── pages/prescriptions/
    ├── UploadPrescriptionPage.jsx  # drag-and-drop, upload progress
    ├── PrescriptionHistoryPage.jsx # grid of past uploads with status
    └── PrescriptionDetailPage.jsx  # file preview, OCR text, medicine review
```

`AppRouter.jsx` adds `/prescriptions`, `/prescriptions/upload`, and
`/prescriptions/:id` (all protected). The Navbar now links to
**Prescriptions**, and the Dashboard shows a live "Recent prescriptions"
strip pulled from the real API.

## API endpoints

| Method | Endpoint                                         | Description                          |
|--------|---------------------------------------------------|---------------------------------------|
| POST   | `/api/prescriptions`                               | Upload file, run OCR + parsing        |
| GET    | `/api/prescriptions`                               | Paginated history (`?page`, `?limit`, `?status`) |
| GET    | `/api/prescriptions/:id`                           | Single prescription + populated medicines |
| PUT    | `/api/prescriptions/:id`                           | Update doctor/date/notes metadata     |
| DELETE | `/api/prescriptions/:id`                           | Delete prescription, medicines, and file |
| POST   | `/api/prescriptions/:id/medicines`                 | Manually add a missed medicine        |
| PUT    | `/api/prescriptions/:id/medicines/:medicineId`     | Confirm/correct a flagged medicine    |

All routes require a valid session (`protect` middleware).

## Testing Phase 3

Verified without a live OCR run:
- Frontend builds clean with all new prescription pages/components.
- Every backend file passes `node --check`.
- `GET/POST /api/prescriptions` and `GET /api/prescriptions/:id` all
  correctly return `401` without a valid session.
- `medicineParser.js` was run directly against realistic OCR-style text
  and correctly extracted medicine name, dosage, frequency, duration, and
  instructions with sensible confidence scores (verified output included
  above in dev notes).

With a running MongoDB and normal internet access (for Tesseract's
language model):
1. Log in, go to **Prescriptions → Upload new**.
2. Drag in a prescription photo or PDF — watch the upload progress bar.
3. You're redirected to the detail page; medicines below the confidence
   threshold show a "Confirm this" badge — edit and save them.
4. Add any medicine the scan missed with the manual add form.
5. Once every flagged medicine is confirmed, the status badge flips to
   **Processed**.
6. Go to **Prescriptions** (history) — see the full grid with statuses.
7. Delete a prescription — confirm it (and its medicines) disappear, and
   the uploaded file is removed from disk.

## What's next

Reply **NEXT** to start Phase 4: Google Gemini medicine analysis, plain-
language summaries, side effects, and drug interaction detection.

---

# Phase 4: Google Gemini Medicine Analysis & Drug Interactions

## New backend files

```
backend/
├── services/
│   └── geminiService.js          # analyzeMedicine(), checkInteractions()
├── controllers/
│   └── medicine.controller.js    # listMedicines, getMedicineById, analyzeMedicine
└── routes/
    └── medicine.routes.js        # mounted at /api/medicines, all protected
```

`app.js` now mounts `app.use("/api/medicines", medicineRoutes)`.
`prescription.controller.js` gained `analyzePrescription`, mounted at
`POST /api/prescriptions/:id/analyze`.

### Model changes

- `Medicine.js` — `aiAnalysis` is now `Mixed` (holds whatever
  `geminiService.analyzeMedicine` returns: `summary`, `commonUses`,
  `sideEffects.common/serious`, `precautions`, `disclaimer`), plus
  `aiAnalyzedAt` and `aiAnalysisError`.
- `Prescription.js` — added `interactions` (array of
  `{medicineA, medicineB, severity, description}`) and
  `interactionsCheckedAt`.

### How it works

1. **Per-medicine analysis** — `POST /api/medicines/:id/analyze` or the
   "Explain this medicine with AI" button sends the medicine's name,
   dosage, frequency, and instructions to Gemini (`gemini-1.5-flash`) with
   a prompt that forces a strict JSON shape. The response is parsed
   defensively — markdown fences are stripped, and if Gemini adds any
   stray text, the first valid `{...}`/`[...]` block is extracted.
2. **Prescription-wide analysis** — `POST /api/prescriptions/:id/analyze`
   (the "Analyze with AI" button) analyzes every not-yet-analyzed medicine
   in that prescription in parallel via `Promise.allSettled`, so one
   failure doesn't block the rest.
3. **Drug interaction detection** — after analysis, the same endpoint
   gathers the names of **all** of the user's medicines that are no
   longer `needsReview` (across every prescription, not just this one —
   this is the "cross-check against your history" from the landing page)
   and sends that full list to Gemini for pairwise interaction checking.
   Results are stored on the prescription with a severity
   (`mild`/`moderate`/`severe`) and shown with color-coded alerts.
4. Medicines still flagged `needsReview` are excluded from both analysis
   and interaction checks until the person confirms them — we don't want
   to analyze or flag interactions against a name that might still be
   OCR-wrong.
5. If `GEMINI_API_KEY` isn't set, every Gemini-backed endpoint returns a
   clean `503` with an actionable message instead of crashing.

## New frontend files

```
client/src/
├── services/medicineService.js
├── components/medicines/
│   ├── AnalysisPanel.jsx          # collapsible AI explanation per medicine
│   └── InteractionAlert.jsx       # severity-coded interaction warnings
└── pages/medicines/
    └── MedicineLibraryPage.jsx    # all medicines across all prescriptions
```

- `MedicineCard.jsx` now renders `AnalysisPanel` for any medicine that
  isn't pending review, with an "Explain this medicine with AI" call to
  action.
- `PrescriptionDetailPage.jsx` gained an **Analyze with AI** button and
  shows `InteractionAlert` once `interactionsCheckedAt` is set.
- Navbar and router add `/medicines` (protected).

## API endpoints

| Method | Endpoint                          | Description                              |
|--------|-------------------------------------|--------------------------------------------|
| GET    | `/api/medicines`                    | All of the user's medicines (`?prescriptionId=`) |
| GET    | `/api/medicines/:id`                | Single medicine detail                     |
| POST   | `/api/medicines/:id/analyze`        | Gemini analysis for one medicine           |
| POST   | `/api/prescriptions/:id/analyze`    | Analyze all medicines in a prescription + cross-check interactions |

## Configuration

Set a real key in `backend/.env`:
```
GEMINI_API_KEY=your_gemini_api_key
```
Get one from [Google AI Studio](https://aistudio.google.com/app/apikey).

## Testing Phase 4

Verified without calling the live Gemini API:
- Frontend builds clean with the new analysis UI.
- Every backend file passes `node --check`.
- `GET/POST /api/medicines*` and `POST /api/prescriptions/:id/analyze`
  all correctly return `401` without a valid session.
- The JSON-extraction logic in `geminiService.js` was tested directly
  against four realistic response shapes — a clean object, a
  markdown-fenced object, an array with a stray preamble sentence, and an
  empty array — and parsed all four correctly.
- Confirmed that calling `analyzeMedicine`/`checkInteractions` with no
  `GEMINI_API_KEY` set returns a clean `503` with an actionable message
  rather than crashing.

With a real `GEMINI_API_KEY` and a running MongoDB:
1. Open a confirmed prescription's detail page and click **Analyze with
   AI** — every medicine gets a plain-language summary, common
   uses, side effects, and precautions.
2. If you have two or more confirmed medicines across any prescriptions,
   the interaction check runs automatically and shows color-coded alerts
   (or a "no interactions detected" confirmation).
3. Visit **Medicines** in the nav to see every medicine you've ever
   scanned in one library, each with its own "Explain with AI" toggle.

## What's next

Reply **NEXT** to start Phase 5: Medicine reminders, email delivery via
Nodemailer, node-cron scheduling, and the reminder dashboard.

---

# Phase 5: Medicine Reminders, Email, node-cron, Reminder Dashboard

## New backend files

```
backend/
├── models/
│   └── Reminder.js               # schedule (times/dates/channels) + embedded dose logs
├── utils/
│   └── scheduleTimes.js          # frequency text → default HH:mm times, duration → end date
├── services/
│   ├── reminderService.js        # auto-create on confirm, "today" occurrences, mark taken/missed
│   ├── emailService.js           # Nodemailer reminder email, no-ops cleanly if SMTP unset
│   ├── whatsappService.js        # provider-agnostic (Twilio/Meta) over plain fetch, no SDK needed
│   └── reminderScheduler.js      # node-cron: dispatch due reminders every minute + sweep missed
├── controllers/
│   └── reminder.controller.js
└── routes/
    └── reminder.routes.js        # mounted at /api/reminders, all protected
```

`app.js` mounts `/api/reminders`. `server.js` calls
`startReminderScheduler()` once, after the DB connects.

### How auto-reminders work

A medicine gets a reminder created automatically the moment it's
**confirmed** — never while still `needsReview`, since its dosage/
frequency might still be wrong:
- High-confidence medicines from `uploadPrescription` (Phase 4's
  `needsReview: false` from the start).
- Medicines the user confirms via `updateMedicine` after a review flag.
- Medicines added manually via `addMedicine`.

`scheduleTimes.js` maps the medicine's `frequency` string (Gemini's
plain-language output, e.g. "Twice daily", "3x daily", "At bedtime",
"As needed") to a default list of times, and `durationDays` to an end
date. "As needed"/PRN medicines get no automatic schedule since there's
no fixed time to remind at.

### How the scheduler works

`reminderScheduler.js` runs a cron job every minute:
1. **Dispatch** — finds every active reminder whose `times` array
   includes the current `HH:mm`, and (if not already logged for that
   exact minute) creates a `"due"` log entry and sends notifications:
   email via Nodemailer if that channel is enabled, WhatsApp via
   whichever provider `WHATSAPP_PROVIDER` selects, and browser
   (delivered client-side — see below).
2. **Sweep** — any `"due"` log older than a 3-hour grace period that was
   never marked `"taken"` flips to `"missed"`, so the dashboard reflects
   reality instead of showing a stale "due" forever.

Both email and WhatsApp fail **silently and independently** (logged, not
thrown) if not configured or if a send fails — one channel breaking
never blocks the others or crashes the scheduler tick.

### Browser notifications

Implemented as client-side polling (`useReminderNotifications` hook,
wired into `App.jsx`) rather than server push, to avoid needing a
VAPID/service-worker setup for this phase: once a user grants
notification permission, the app polls `GET /api/reminders/today` every
60 seconds and fires a `Notification` for any dose that's newly `"due"`.

### "Today" occurrences — the dashboard's actual data source

`getTodayOccurrences()` computes every dose scheduled for today across
all active reminders **virtually** — merging in whatever the scheduler
has already logged and filling in the rest — so the dashboard is always
complete and correct even in the seconds before the cron has ticked for
a given time slot.

## New frontend files

```
client/src/
├── services/reminderService.js
├── hooks/useReminderNotifications.js
├── components/reminders/
│   ├── StatCard.jsx
│   └── OccurrenceRow.jsx          # one dose row with taken/missed actions
└── pages/reminders/
    └── RemindersPage.jsx          # Upcoming / Missed / Completed, per the spec's dashboard sections
```

`DashboardPage.jsx` now shows live stat cards (upcoming/taken/missed
today) and a "Today's medicines" preview pulled from the same API.

## API endpoints

| Method | Endpoint                    | Description                                  |
|--------|-------------------------------|-----------------------------------------------|
| GET    | `/api/reminders`              | All reminders (`?active=true/false`)          |
| GET    | `/api/reminders/today`        | Every dose occurrence scheduled for today, with status |
| GET    | `/api/reminders/stats`        | Today's counts (pending/due/taken/missed)     |
| POST   | `/api/reminders`              | Manually create a reminder                    |
| PUT    | `/api/reminders/:id`          | Update times/dates/channels/active            |
| DELETE | `/api/reminders/:id`          | Delete a reminder                             |
| PUT    | `/api/reminders/:id/mark`     | Mark a specific dose `taken` or `missed`      |

## Configuration

Already scaffolded in `.env.example` since Phase 1 — fill in real values:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM=MedAssist <no-reply@medassist.app>

WHATSAPP_PROVIDER=twilio     # or "meta"
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=
META_WHATSAPP_TOKEN=
META_WHATSAPP_PHONE_ID=
```

## Known limitation: timezone

Reminder times (`HH:mm`) are interpreted in the **server's** local time —
there's no per-user timezone field yet. For a single-region deployment
this is fine; a future phase could add a `timezone` field to `User` and
convert accordingly.

## Testing Phase 5

Verified directly in this environment:
- Frontend builds clean with the full reminder dashboard.
- Every backend file passes `node --check`.
- The app boots successfully **with the cron scheduler running**, and
  every reminder endpoint (`GET/POST /api/reminders`, `/today`, `/stats`,
  `PUT /:id/mark`) correctly returns `401` without auth.
- `scheduleTimes.js`: tested all frequency patterns end-to-end — this
  caught and fixed a real bug, where `"Once in the morning, night"` was
  matching the standalone bedtime/night check before reaching the
  combined morning+night logic (because it also contains the word
  "night"), incorrectly returning a single 22:00 reminder instead of
  08:00 + 20:00. Reordered the checks; all 12 test cases now pass,
  including duration→end-date math.
- `emailService.js` / `whatsappService.js`: confirmed both fail cleanly
  (return `false`, never throw) when unconfigured or unreachable —
  critical since one channel failing must never block the scheduler tick
  or the other channels.
- Confirmed the cron expression is valid, and that
  `startReminderScheduler()`/`stopReminderScheduler()` are idempotent
  and clean up correctly.

With a running MongoDB and real SMTP/WhatsApp credentials:
1. Confirm a medicine from a prescription — a reminder is created
   automatically (check `GET /api/reminders`).
2. Wait for (or manually set) a scheduled time to pass — the scheduler
   creates a `"due"` log and sends the configured notifications.
3. Visit `/reminders` — see it under **Upcoming** (before its time),
   move to the top once due, and confirm marking it **Taken** or
   **Missed** updates instantly.
4. Leave a due reminder unactioned past the 3-hour grace period — confirm
   it moves to **Missed** on its own.
5. Check the Dashboard — stat cards and the "Today's medicines" preview
   match what `/reminders` shows.

## What's next

Reply **NEXT** to start Phase 6: AI Chatbot.

---

# Phase 6: AI Chatbot

## New backend files

```
backend/
├── models/
│   └── Chat.js                # conversation thread + embedded messages
├── services/
│   └── chatService.js         # builds user medicine context, calls Gemini for a reply
├── controllers/
│   └── chat.controller.js     # listChats, getChatById, sendMessage, deleteChat
└── routes/
    └── chat.routes.js         # mounted at /api/chat, all protected
```

`app.js` mounts `app.use("/api/chat", chatRoutes)`.

### How it's "medicine-aware"

Before every reply, `buildUserContext()` pulls the user's own confirmed
medicines (name, dosage, frequency, instructions — same data Phase 3/4
already extracted) and their 5 most recent prescriptions, and folds that
in as the first turn of the Gemini conversation. So a question like
*"what am I taking for my blood pressure?"* is answered from the
person's actual data, not a generic guess. A system instruction (also
sent as part of that first turn, since this call shape doesn't have a
separate system role) keeps the assistant from diagnosing, tells it to
flag anything emergency-sounding, and to defer dosage/medical decisions
to the person's doctor or pharmacist.

Conversation history is capped at the last 16 messages sent to Gemini
per request, so long threads stay bounded in token usage without losing
recent context — the full history is still stored and shown in the UI.

### Data model

`Chat` stores messages as an embedded array (`role: "user"|"assistant"`,
`content`), same pattern as `Reminder`'s embedded logs — a
conversation's messages are always read together with the conversation.
`title` is derived from the first message (truncated, not a separate AI
call) so the sidebar has something readable immediately.

## New frontend files

```
client/src/
├── services/chatService.js
├── components/chat/
│   ├── ChatSidebar.jsx         # conversation list, new/delete
│   └── ChatBubble.jsx          # one message bubble
└── pages/chat/
    └── ChatPage.jsx            # two-pane layout, optimistic send, suggested prompts
```

Router adds `/chat` and `/chat/:id` (protected); Navbar links to **Chat**.

## API endpoints

| Method | Endpoint       | Description                                            |
|--------|-----------------|----------------------------------------------------------|
| GET    | `/api/chat`     | All conversation threads (title, preview, last message time) |
| GET    | `/api/chat/:id` | Full message history for one thread                     |
| POST   | `/api/chat`     | Send a message — `{ message, chatId? }`. Omit `chatId` to start a new thread; returns the full updated chat |
| DELETE | `/api/chat/:id` | Delete a conversation                                    |

If the Gemini call fails, the user's message is still saved (so nothing
typed is lost) before the error is surfaced to the client.

## Testing Phase 6

Verified directly in this environment:
- Frontend builds clean with the full chat UI.
- Every backend file passes `node --check`.
- The app boots and `GET/POST /api/chat` and `GET/DELETE /api/chat/:id`
  all correctly return `401` without auth.
- `deriveTitle()`: tested with a short message (used as-is), a long
  rambling message (correctly truncated to 48 chars with an ellipsis,
  whitespace normalized), and a 100-character string (confirmed the
  output never exceeds the limit).
- Verified the `role: "assistant" → "model"` mapping used when building
  Gemini's conversation history matches the SDK's documented
  `user`/`model` role convention exactly (checked against the installed
  `@google/genai` type definitions, not assumed).
- Confirmed `generateChatReply()` fails fast with a clean `503` when
  `GEMINI_API_KEY` isn't set — and does so *before* touching the
  database, since the config check runs first.

With a real `GEMINI_API_KEY` and a running MongoDB:
1. Go to **Chat**, try one of the suggested prompts or ask your own
   question — a new conversation is created automatically.
2. Ask something referencing your own medicines (e.g. "what am I
   currently taking?") — confirm the answer reflects your actual
   confirmed medicines, not generic information.
3. Continue the conversation — confirm it remembers earlier context.
4. Check the sidebar — the new thread appears with an auto-derived title
   and preview.
5. Start a second conversation, switch between them, delete one.

## What's next

Reply **NEXT** to start Phase 7: Admin Panel.

---

# Phase 7: Admin Panel

## New backend files

```
backend/
├── controllers/
│   └── admin.controller.js   # stats, user management, cross-user prescription oversight
├── routes/
│   └── admin.routes.js       # mounted at /api/admin — protect + authorize("admin") on every route
└── scripts/
    └── seedAdmin.js          # CLI: promote an existing registered user to admin
```

`app.js` mounts `app.use("/api/admin", adminRoutes)`. No new middleware
was needed — `authorize(...roles)` already existed from Phase 2 and is
reused here exactly as designed (`protect, authorize("admin")`).

### Model changes

`User.js` gained `isSuspended` (default `false`). A suspended user is
rejected in **two** places, not just one, so suspension takes effect
immediately rather than only on next login:
- `login` controller — suspended users can't get a new token at all.
- `protect` middleware — an **existing** valid session is also rejected
  on every subsequent request, so suspending someone signs them out
  immediately rather than waiting for their token to expire.

### Bootstrapping the first admin

There's deliberately no API endpoint to grant yourself admin — that
would be a privilege-escalation hole. Instead:

```bash
# 1. Register a normal account through the app first
# 2. Then, from the backend/ directory:
npm run seed:admin -- you@example.com
```

### Self-protection guards

An admin can't demote their own role, suspend their own account, or
delete their own account through the panel — each was verified directly
against both the self-targeting and other-user cases (6 scenarios total,
all correct). This prevents an admin from ever locking themselves out.

### Cascading delete

Deleting a user also deletes everything they own — prescriptions,
medicines, reminders, and chats — so no orphaned records are left
pointing at a nonexistent user.

## New frontend files

```
client/src/
├── services/adminService.js
├── components/common/AdminRoute.jsx   # authenticated AND role === "admin"
├── components/admin/AdminStatCard.jsx
└── pages/admin/
    ├── AdminDashboardPage.jsx         # platform-wide stats
    ├── AdminUsersPage.jsx             # search, pagination, suspend/delete
    └── AdminUserDetailPage.jsx        # per-user activity + role/suspend/delete controls
```

Router adds `/admin`, `/admin/users`, `/admin/users/:id`, gated by
`AdminRoute` (redirects non-admins to `/dashboard` rather than exposing
the panel's existence). The Navbar's **Admin** link only renders for
`user.role === "admin"`.

## API endpoints

| Method | Endpoint                        | Description                              |
|--------|-----------------------------------|--------------------------------------------|
| GET    | `/api/admin/stats`                | Platform-wide counts for the dashboard    |
| GET    | `/api/admin/users`                | Paginated, searchable user list (`?search=`, `?role=`) |
| GET    | `/api/admin/users/:id`            | User detail + their activity counts       |
| PUT    | `/api/admin/users/:id/role`       | Promote/demote (`{ role: "user"\|"admin" }`) |
| PUT    | `/api/admin/users/:id/suspend`    | Suspend/reinstate (`{ isSuspended: boolean }`) |
| DELETE | `/api/admin/users/:id`            | Delete user + cascade all their data      |
| GET    | `/api/admin/prescriptions`        | Cross-user prescription list, for support/moderation |

All routes require `protect` **and** `authorize("admin")`.

## Testing Phase 7

Verified directly in this environment:
- Frontend builds clean with the full admin panel.
- Every backend file passes `node --check`.
- The app boots and every `/api/admin/*` route correctly returns `401`
  without auth.
- Tested `authorize("admin")` directly against both a non-admin user
  (correctly blocked with `403`) and an admin user (correctly allowed
  through) — not just the auth-missing case.
- Tested all **6** self-protection scenarios (self-demote, self-stay-
  admin, demote-someone-else, self-suspend, self-reinstate,
  demote/suspend/delete someone else) against the exact conditionals
  used in the controller — all behave correctly.
- Verified the suspension-check logic added to both `login` and
  `protect` blocks a suspended user and passes an active one.

With a running MongoDB:
1. Register a normal account, then run
   `npm run seed:admin -- you@example.com` from `backend/`.
2. Log in — the **Admin** link appears in the navbar.
3. Visit `/admin` — see platform-wide stats.
4. Visit `/admin/users` — search, view a user's detail page, suspend
   them, then confirm (in another browser/session) they're immediately
   signed out and can't log back in until reinstated.
5. Confirm you can't demote, suspend, or delete your own account from
   the panel — the controls are disabled with an explanatory note.

## What's next

Reply **NEXT** to start Phase 8: Testing, optimization, deployment
configuration, and final documentation.

---

# Migration: Tesseract → Gemini Vision (`@google/genai`)

Tesseract.js performed poorly on handwritten prescriptions, so OCR has
been fully replaced with Gemini Vision using Google's current unified
SDK, `@google/genai`. The old `@google/generative-ai` SDK and the
regex-based `medicineParser.js` are both gone — Gemini now returns
fully structured medicines directly, in one call, instead of raw text
that a separate parser had to guess at.

## What changed

| File | Change |
|------|--------|
| `config/gemini.js` | **New.** Centralized `@google/genai` client (`getGeminiClient()`) shared by both OCR and medicine analysis, plus the shared `parseJsonResponse()` helper. |
| `services/ocrService.js` | **Fully rewritten.** `Tesseract.recognize()` is gone. Images are sent as inline base64 data directly to Gemini Vision; PDFs still use `pdf-parse` for the text layer, but that text is now also sent to Gemini so PDFs get the same structured output as images. |
| `services/medicineParser.js` | **Deleted.** No longer needed — Gemini returns structured `medicines[]` directly. |
| `services/geminiService.js` | Rewritten to use `@google/genai` via `config/gemini.js` instead of `@google/generative-ai`. Its actual behavior (`analyzeMedicine`, `checkInteractions`) is unchanged. |
| `controllers/prescription.controller.js` | `uploadPrescription` now calls `extractPrescriptionData()` and saves the medicines it returns directly — the old "extract text → regex parse → build medicine docs" pipeline collapses into one step. Every other endpoint is untouched. |
| `models/Prescription.js` | Added `aiDoctorNotes` (diagnosis/advice Gemini finds outside the medicine lines) — additive only, nothing removed. |
| `models/Medicine.js`, `middleware/upload.js`, `routes/prescription.routes.js` | **Unchanged.** The medicine shape Gemini now returns already matches what these expected. |
| `package.json` | Removed `tesseract.js`. Removed `@google/generative-ai`, added `@google/genai`. `pdf-parse` kept. |

**No API endpoints changed.** Every route, request shape, and response
shape is identical — this is a pure internal swap of the extraction
engine.

## How Gemini Vision extraction works now

`ocrService.js` exports one function:

```js
extractPrescriptionData(filePath, fileType, mimeType)
// → { ocrText, medicines: [{name, dosage, frequency, durationDays, instructions, confidence}], doctorNotes, confidence }
```

- **Images** — the file's raw bytes are base64-encoded and sent as
  `inlineData` alongside a prompt instructing Gemini to transcribe the
  prescription and return strict JSON. The call sets
  `config: { responseMimeType: "application/json" }`, Gemini's native
  JSON mode, so parsing is reliable; `parseJsonResponse()` in
  `config/gemini.js` is still there as a defensive fallback (stripping
  markdown fences / extracting the first `{...}` block) in case a
  response ever doesn't come back clean.
- **PDFs** — `pdf-parse` extracts the embedded text layer exactly as
  before, and that text is sent to Gemini as a plain text prompt (not
  vision) using the same JSON schema, so PDFs and images end up with
  identical output shape. A PDF with no extractable text (i.e. a scanned
  image saved as PDF) fails with a clear `422` asking the user to upload
  it as a photo instead — rasterizing PDF pages to images would need an
  extra system dependency (e.g. `poppler`) and is out of scope for this
  migration.
- Every medicine below `REVIEW_CONFIDENCE_THRESHOLD` (0.6, now exported
  from `ocrService.js` since `medicineParser.js` is gone) is still
  flagged `needsReview`, exactly as before.

## Configuration

Same environment variable as before — no `.env` changes needed:
```
GEMINI_API_KEY=your_gemini_api_key
```

## Uninstall Tesseract / clean up dependencies

If you're applying this migration to an existing checkout rather than
using this zip (which already has the corrected `package.json`), run:

```bash
cd backend
npm uninstall tesseract.js @google/generative-ai
npm install @google/genai
```

## Testing this migration

Verified directly in this environment (no live Gemini calls needed for
most of it):
- `npm install` confirms **zero** `tesseract.js` files under
  `node_modules`, and `@google/genai` v2.15.0 installs cleanly.
- Every backend file passes `node --check`.
- The app boots and `GET/POST /api/prescriptions*` and `GET /api/medicines`
  all still return `401` without auth — routing is untouched.
- `config/gemini.js`: confirmed `getGeminiClient()` throws a clean `503`
  with no API key, and successfully instantiates a real
  `GoogleGenAI` client (with a working `models.generateContent` method)
  once a key is present — verified directly against the installed
  `@google/genai` v2.15.0 type definitions, not guessed from memory.
- `parseJsonResponse()`: tested against a clean object, a
  markdown-fenced object, an array with a stray preamble sentence, and
  an empty string — all handled correctly.
- The new medicine-normalization logic in `ocrService.js` was tested
  against five realistic Gemini response shapes: clean data, a
  `durationDays` returned as a string instead of a number, a medicine
  entry missing its name (correctly filtered out), completely malformed
  types, and the "nothing legible" empty case — all normalized correctly.
- **Known sandbox limitation:** this container's `pdf-parse` version
  fails on freshly generated PDFs with a `bad XRef entry` error,
  regardless of which tool generates them (tested with three different
  generators) — this looks like a `pdf-parse`/Node-version
  incompatibility in the pdf.js build it bundles, and it predates this
  migration (the PDF-extraction call itself is untouched from Phase 3).
  It's worth a quick real-world PDF test in your own dev environment;
  everything downstream of that call (the "no text layer" 422, sending
  extracted text to Gemini) was verified with hand-constructed input.

With a real `GEMINI_API_KEY`:
1. Upload a handwritten prescription photo — Gemini Vision should read
   it noticeably better than Tesseract did, especially messy shorthand
   like `1-0-1` or `SOS`.
2. Confirm medicines, dosages, and frequencies populate correctly, with
   low-confidence ones still flagged for review exactly as before.
3. Upload a text-based PDF prescription — same structured output.
4. Upload a scanned-image PDF — confirm you get the clear "upload as a
   photo instead" message rather than a silent failure.
