# MedAssist — API Reference

Base URL (local dev): `http://localhost:5000/api`

## Conventions

- **Auth:** JWT, sent as an httpOnly cookie (`token`) set by
  register/login/reset-password, or as `Authorization: Bearer <token>`.
  Routes marked 🔒 require either.
- **Admin:** Routes marked 🔒👑 require 🔒 **and** `role === "admin"`.
- **Response shape:** every endpoint returns `{ success: boolean, ...data }`
  on success, or `{ success: false, message: string }` on error (plus a
  `stack` field, development only).
- **Errors:** standard HTTP status codes — `400` validation, `401`
  unauthenticated, `403` forbidden/suspended, `404` not found, `409`
  conflict (duplicate email), `422` unprocessable (e.g. a PDF with no
  text layer), `502` upstream AI failure, `503` AI service not
  configured.
- **Pagination:** list endpoints that paginate accept `?page=` (default
  1) and `?limit=` (default varies, capped at 50) and return a
  `pagination: { page, limit, total, pages }` object.

---

## Health

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/health` | Public | Liveness check — `{ success, service, status, timestamp }` |

---

## Auth (`/auth`)

| Method | Endpoint | Auth | Body | Description |
|---|---|---|---|---|
| POST | `/auth/register` | Public | `{ name, email, password, phone? }` | Create account, sets JWT cookie, returns `{ token, user }` |
| POST | `/auth/login` | Public | `{ email, password }` | Verify credentials, sets JWT cookie. `403` if `isSuspended` |
| POST | `/auth/logout` | 🔒 | — | Clears the JWT cookie |
| GET | `/auth/me` | 🔒 | — | Returns the logged-in user |
| PUT | `/auth/profile` | 🔒 | `{ name?, phone?, avatar? }` | Update profile fields |
| PUT | `/auth/update-password` | 🔒 | `{ currentPassword, newPassword }` | Change password |
| POST | `/auth/forgot-password` | Public | `{ email }` | Generates a reset token (emailed once Phase 5's Nodemailer wiring is configured; always returns success regardless of whether the email exists, to avoid leaking registered emails) |
| PUT | `/auth/reset-password/:resetToken` | Public | `{ password }` | Sets a new password from a valid, unexpired reset token |

---

## Prescriptions (`/prescriptions`) — all 🔒

| Method | Endpoint | Body | Description |
|---|---|---|---|
| GET | `/prescriptions` | — | Paginated history (`?page`, `?limit`, `?status`) |
| POST | `/prescriptions` | multipart, field `file` | Upload + Gemini Vision extraction. JPG/PNG/WEBP/PDF, 10MB max |
| GET | `/prescriptions/:id` | — | Single prescription, `medicines` populated |
| PUT | `/prescriptions/:id` | `{ doctorName?, prescriptionDate?, notes? }` | Update metadata |
| DELETE | `/prescriptions/:id` | — | Deletes the prescription, its medicines, and the uploaded file |
| POST | `/prescriptions/:id/medicines` | `{ name, dosage?, frequency?, durationDays?, instructions? }` | Manually add a medicine Gemini missed |
| PUT | `/prescriptions/:id/medicines/:medicineId` | `{ name?, dosage?, frequency?, durationDays?, instructions? }` | Confirm/correct a flagged medicine — sets `confirmedByUser: true, needsReview: false` and auto-creates a reminder |
| POST | `/prescriptions/:id/analyze` | — | Runs Gemini analysis on every unanalyzed medicine in this prescription, then cross-checks interactions against **all** of the user's confirmed medicines |

**Upload response** — `{ success, prescription }` where `prescription.medicines`
is populated. If Gemini Vision fails, `status: "failed"` with
`failureReason` set (still `201` — the failure is recorded, not thrown,
so the frontend can show it in history).

---

## Medicines (`/medicines`) — all 🔒

| Method | Endpoint | Query/Body | Description |
|---|---|---|---|
| GET | `/medicines` | `?prescriptionId=` | All of the user's medicines, optionally filtered |
| GET | `/medicines/:id` | — | Single medicine detail |
| POST | `/medicines/:id/analyze` | — | Gemini analysis for one medicine: `summary`, `commonUses`, `sideEffects.common/serious`, `precautions`, `disclaimer` |

---

## Reminders (`/reminders`) — all 🔒

| Method | Endpoint | Query/Body | Description |
|---|---|---|---|
| GET | `/reminders` | `?active=true\|false` | All reminders |
| GET | `/reminders/today` | — | Every dose occurrence scheduled for today, computed live (merges logged occurrences with virtual ones for times the scheduler hasn't ticked yet) |
| GET | `/reminders/stats` | — | Today's counts: pending/due/taken/missed |
| POST | `/reminders` | `{ medicineId?, medicineName, dosage?, times[], startDate?, endDate?, channels? }` | Manually create a reminder |
| PUT | `/reminders/:id` | `{ times?, startDate?, endDate?, channels?, active? }` | Update a reminder's schedule |
| DELETE | `/reminders/:id` | — | Delete a reminder |
| PUT | `/reminders/:id/mark` | `{ scheduledFor, status: "taken"\|"missed" }` | Mark a specific dose occurrence |

Reminders are also created **automatically** the moment a medicine is
confirmed (see `services/reminderService.js` →
`autoCreateReminderForMedicine`), triggered from three places: high-
confidence medicines on upload, `PUT /prescriptions/:id/medicines/:medicineId`,
and `POST /prescriptions/:id/medicines`.

---

## Chat (`/chat`) — all 🔒

| Method | Endpoint | Body | Description |
|---|---|---|---|
| GET | `/chat` | — | All conversation threads (title, preview, `lastMessageAt`) |
| GET | `/chat/:id` | — | Full message history for one thread |
| POST | `/chat` | `{ message, chatId? }` | Send a message. Omit `chatId` to start a new thread; the reply is grounded in the user's own confirmed medicines/prescriptions. Returns the full updated `chat` |
| DELETE | `/chat/:id` | — | Delete a conversation |

---

## Admin (`/admin`) — all 🔒👑

| Method | Endpoint | Query/Body | Description |
|---|---|---|---|
| GET | `/admin/stats` | — | Platform-wide counts: users, prescriptions (by status), medicines, reminders, chats |
| GET | `/admin/users` | `?search=`, `?role=`, `?page`, `?limit` | Paginated, searchable user list |
| GET | `/admin/users/:id` | — | User detail + their activity counts |
| PUT | `/admin/users/:id/role` | `{ role: "user"\|"admin" }` | Promote/demote. Blocked if targeting yourself and demoting |
| PUT | `/admin/users/:id/suspend` | `{ isSuspended: boolean }` | Suspend/reinstate. Blocked if targeting yourself and suspending. Takes effect immediately — an existing session is rejected on its very next request |
| DELETE | `/admin/users/:id` | — | Delete user + cascade all their prescriptions/medicines/reminders/chats. Blocked if targeting yourself |
| GET | `/admin/prescriptions` | `?status=`, `?page`, `?limit` | Cross-user prescription list, `user` populated, for support/moderation |

---

## Static files

| Path | Description |
|---|---|
| `/uploads/prescriptions/<userId>/<filename>` | Uploaded prescription images/PDFs, served directly by Express |
