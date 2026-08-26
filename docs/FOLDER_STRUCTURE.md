# MedAssist — Folder Structure

Full project tree, generated directly from the repository (not
hand-maintained, so it stays accurate). See [`API.md`](./API.md) for
endpoint details and [`DATABASE_SCHEMA.md`](./DATABASE_SCHEMA.md) for
the data model behind `models/`.

```
medassist/
├── README.md                        # Project overview, quick start (this repo's front door)
├── docker-compose.yml                # Orchestrates mongo + backend + client
│
├── docs/
│   ├── API.md                        # Full endpoint reference
│   ├── DATABASE_SCHEMA.md            # ERD + collection-by-collection field reference
│   ├── DEPLOYMENT.md                 # Docker + platform deployment guide
│   ├── FOLDER_STRUCTURE.md           # This file
│   └── PHASES.md                     # Phase-by-phase build history and verification log
│
├── backend/                          # Node.js + Express API
│   ├── server.js                     # Entry point — connects DB, starts scheduler, listens
│   ├── app.js                        # Express app: middleware, security, route mounting
│   ├── package.json
│   ├── .env.example
│   ├── Dockerfile
│   ├── .dockerignore
│   │
│   ├── config/
│   │   ├── db.js                     # Mongoose connection
│   │   ├── env.js                    # Centralized environment variable loader
│   │   └── gemini.js                 # @google/genai client + shared JSON-response parser
│   │
│   ├── models/                       # Mongoose schemas — see DATABASE_SCHEMA.md
│   │   ├── User.js
│   │   ├── Prescription.js
│   │   ├── Medicine.js
│   │   ├── Reminder.js               # embeds dose "logs"
│   │   └── Chat.js                   # embeds "messages"
│   │
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── prescription.controller.js
│   │   ├── medicine.controller.js
│   │   ├── reminder.controller.js
│   │   ├── chat.controller.js
│   │   └── admin.controller.js
│   │
│   ├── routes/                       # One file per resource, mounted in app.js
│   │   ├── health.routes.js
│   │   ├── auth.routes.js
│   │   ├── prescription.routes.js
│   │   ├── medicine.routes.js
│   │   ├── reminder.routes.js
│   │   ├── chat.routes.js
│   │   └── admin.routes.js
│   │
│   ├── middleware/
│   │   ├── auth.js                   # protect() / authorize(...roles)
│   │   ├── errorHandler.js           # AppError, asyncHandler, centralized error responses
│   │   ├── upload.js                 # Multer disk storage + file validation
│   │   └── validate.js               # express-validator result formatter
│   │
│   ├── services/                     # Business logic / third-party integrations
│   │   ├── ocrService.js             # Gemini Vision prescription extraction
│   │   ├── geminiService.js          # Medicine analysis + drug interaction checks
│   │   ├── chatService.js            # Medicine-aware chatbot context + Gemini call
│   │   ├── reminderService.js        # Auto-create reminders, compute "today" occurrences
│   │   ├── reminderScheduler.js      # node-cron: dispatch due reminders, sweep missed
│   │   ├── emailService.js           # Nodemailer reminder emails
│   │   └── whatsappService.js        # Twilio/Meta-agnostic WhatsApp sending
│   │
│   ├── utils/
│   │   ├── scheduleTimes.js          # frequency text → default reminder times
│   │   ├── deriveTitle.js            # chat title from first message
│   │   ├── adminGuards.js            # self-action prevention (no self-demote/suspend/delete)
│   │   └── sendTokenResponse.js      # signs JWT, sets httpOnly cookie
│   │
│   ├── scripts/
│   │   └── seedAdmin.js              # CLI: promote a registered user to admin
│   │
│   ├── tests/                        # node:test — run with `npm test`
│   │   ├── auth.test.js
│   │   ├── scheduleTimes.test.js
│   │   ├── gemini.test.js
│   │   ├── ocrService.test.js
│   │   ├── deriveTitle.test.js
│   │   ├── notifications.test.js
│   │   └── user.model.test.js
│   │
│   └── uploads/prescriptions/<userId>/   # Multer's disk storage target (gitignored, volume-mounted in Docker)
│
└── client/                           # React 18 + Vite frontend
    ├── index.html                    # Vite mount shell
    ├── package.json
    ├── vite.config.js                # Dev proxy to backend for /api and /uploads
    ├── tailwind.config.js            # Design tokens (brand/signal/alert/ink/mist palette)
    ├── postcss.config.js
    ├── .env.example
    ├── Dockerfile                    # Multi-stage: Vite build → nginx
    ├── nginx.conf                    # SPA fallback + /api, /uploads reverse proxy
    ├── .dockerignore
    ├── public/favicon.svg
    │
    └── src/
        ├── main.jsx                  # React root, AuthProvider, Toaster
        ├── App.jsx                   # Wires router + reminder notification polling
        ├── index.css                 # Tailwind layers + shared component classes
        │
        ├── router/
        │   └── AppRouter.jsx         # All routes, code-split with React.lazy
        │
        ├── layouts/
        │   └── MainLayout.jsx        # Navbar + Footer shell
        │
        ├── context/
        │   └── AuthContext.jsx       # Session state, checked via GET /api/auth/me on load
        │
        ├── hooks/
        │   ├── useAuth.js
        │   └── useReminderNotifications.js   # Client-side polling → browser Notification API
        │
        ├── services/                 # One file per API resource, thin axios wrappers
        │   ├── api.js                # Shared axios instance (withCredentials for the JWT cookie)
        │   ├── authService.js
        │   ├── prescriptionService.js
        │   ├── medicineService.js
        │   ├── reminderService.js
        │   ├── chatService.js
        │   └── adminService.js
        │
        ├── components/
        │   ├── layout/                       # Navbar, Footer
        │   ├── common/                       # ProtectedRoute, GuestRoute, AdminRoute, FormField, PageLoader, AuthLayout
        │   ├── prescriptions/                # MedicineCard, AddMedicineForm, StatusBadge
        │   ├── medicines/                    # AnalysisPanel, InteractionAlert
        │   ├── reminders/                    # StatCard, OccurrenceRow
        │   ├── chat/                         # ChatSidebar, ChatBubble
        │   └── admin/                        # AdminStatCard
        │
        └── pages/
            ├── LandingPage.jsx, NotFoundPage.jsx, ProfilePage.jsx, DashboardPage.jsx
            ├── auth/                          # Login, Register, ForgotPassword, ResetPassword
            ├── prescriptions/                 # Upload, History, Detail
            ├── medicines/                     # MedicineLibraryPage
            ├── reminders/                     # RemindersPage
            ├── chat/                          # ChatPage
            └── admin/                         # AdminDashboard, AdminUsers, AdminUserDetail
```

## Design conventions this structure follows

- **MVC on the backend:** `routes/` are thin (validation chains +
  wiring only), `controllers/` hold request/response logic,
  `services/` hold anything that talks to Gemini, email, WhatsApp, or
  does non-trivial computation, `models/` are Mongoose schemas only.
- **One service file per external integration** (`ocrService.js`,
  `emailService.js`, `whatsappService.js`) so swapping a provider later
  (e.g. a different AI model, a different email provider) touches one
  file, not scattered call sites.
- **Pure logic extracted to `utils/`** wherever a controller's decision
  could be unit tested without a database or HTTP request —
  `scheduleTimes.js`, `deriveTitle.js`, and `adminGuards.js` all exist
  because of this, and all three have direct test coverage as a result.
- **Frontend `services/` mirror backend resources 1:1** (`prescriptionService.js`
  ↔ `/api/prescriptions`, etc.), so finding the client-side call for any
  endpoint is a matter of matching the name.
- **`components/` are organized by feature area**, not by type, so
  everything related to one part of the product (e.g. `reminders/`)
  lives together.
