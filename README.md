# MedAssist

**AI-powered prescription scanning, medicine analysis, and smart reminders — a full-stack MERN healthcare platform.**

MedAssist reads handwritten prescriptions with Google Gemini Vision,
explains every medicine in plain language, checks for drug interactions
across a person's full medicine history, builds a reminder schedule
automatically, and answers follow-up questions through a medicine-aware
chatbot — all behind a real authentication system with an admin panel
for platform oversight.

---

## Features

**Prescription intelligence**
- Upload a photo or PDF of a prescription — Gemini Vision reads it
  directly (no separate OCR engine), including messy handwriting
- Structured extraction: medicine name, dosage, frequency, duration,
  and instructions, with a confidence score per medicine
- Low-confidence extractions are flagged for a quick user confirm
  instead of being trusted silently

**AI medicine analysis**
- Plain-language explanation of what a medicine is for, common vs.
  serious side effects, and precautions
- Drug interaction detection across **all** of a person's confirmed
  medicines, not just the current prescription — severity-rated
  (mild/moderate/severe) with a plain-language explanation

**Smart reminders**
- Reminders are created automatically the moment a medicine is
  confirmed, with times derived from its frequency
- Email (Nodemailer) and WhatsApp (Twilio or Meta, swappable via one
  env var) delivery, plus browser notifications
- A reminder dashboard: upcoming, missed, and completed doses, with a
  3-hour grace period before a dose is auto-marked missed

**Medicine-aware chatbot**
- Ask questions grounded in your own confirmed medicines and recent
  prescriptions, not just generic information
- Never diagnoses; flags emergencies and defers real medical decisions
  to a doctor or pharmacist

**Admin panel**
- Platform-wide stats, searchable user management, role promotion,
  account suspension (enforced immediately, not just on next login),
  and cross-user prescription oversight

**Security**
- JWT in an httpOnly cookie, bcrypt password hashing, Helmet, rate
  limiting, Mongo query sanitization, and role-based access control
  throughout

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18 (Vite), React Router, Tailwind CSS, Framer Motion, React Hook Form |
| Backend | Node.js, Express, Mongoose |
| Database | MongoDB |
| Auth | JWT (httpOnly cookie) + bcrypt |
| AI | Google Gemini via `@google/genai` — Vision for OCR, text generation for analysis/chat |
| File upload | Multer |
| Reminders | node-cron, Nodemailer, Twilio/Meta WhatsApp |
| Testing | Node.js built-in test runner (`node:test`) |
| Deployment | Docker, Docker Compose, nginx |

---

## Quick start

```bash
git clone <this-repo>
cd medassist

# Backend
cd backend
cp .env.example .env    # fill in MONGO_URI, JWT_SECRET, GEMINI_API_KEY at minimum
npm install
npm run dev              # http://localhost:5000

# Frontend (new terminal)
cd ../client
cp .env.example .env
npm install
npm run dev               # http://localhost:5173
```

You'll need a running MongoDB (local `mongod` or a free
[MongoDB Atlas](https://www.mongodb.com/atlas) cluster) and a
[Gemini API key](https://aistudio.google.com/app/apikey).

**First admin account:** register a normal account through the app,
then run `npm run seed:admin -- you@example.com` from `backend/`.

**Prefer one command?** See [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md)
for `docker compose up`.

## Running tests

```bash
cd backend
npm test
```

48 tests across 10 suites covering auth/admin guards, the reminder
frequency-parsing logic, Gemini JSON-response parsing, OCR result
normalization, chat title derivation, notification-service graceful
degradation, and User model methods — all runnable without a database
connection or live API calls.

---

## Documentation

| Doc | What's in it |
|---|---|
| [`docs/API.md`](./docs/API.md) | Every endpoint, request/response shape, auth requirements |
| [`docs/DATABASE_SCHEMA.md`](./docs/DATABASE_SCHEMA.md) | ERD (Mermaid) + field-by-field reference for all 5 collections |
| [`docs/FOLDER_STRUCTURE.md`](./docs/FOLDER_STRUCTURE.md) | Full project tree with what each piece does |
| [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) | Docker Compose and manual/platform deployment, with a production checklist |
| [`docs/PHASES.md`](./docs/PHASES.md) | The complete phase-by-phase build log — what was built, why, and how each phase was verified |

## Project structure (high level)

```
medassist/
├── backend/    # Express API — see docs/FOLDER_STRUCTURE.md for the full tree
├── client/     # React (Vite) frontend
├── docs/       # Documentation (this table)
└── docker-compose.yml
```

## Known limitations

- **Reminder times are server-timezone-based** — there's no per-user
  timezone field yet. Fine for a single-region deployment; see
  `docs/DATABASE_SCHEMA.md` for the note on where a `timezone` field
  would go.
- **Uploaded files use local disk storage** (Multer) — fine for a
  single-server or Docker Compose deployment with a persistent volume,
  but platforms with ephemeral filesystems need an object-storage swap
  (see `docs/DEPLOYMENT.md`).
- **PDF OCR** relies on the embedded text layer (`pdf-parse`) rather
  than rasterizing scanned-image PDFs; a scanned PDF returns a clear
  message asking for a photo upload instead.

## License

This project was built as a learning/portfolio exercise and doesn't
carry a specific license — add one appropriate to your use case before
using it in production.
