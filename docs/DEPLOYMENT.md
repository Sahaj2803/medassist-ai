# MedAssist — Deployment Guide

Two supported paths: **Docker Compose** (everything in one command) or
**deploying each piece separately** to a platform of your choice. Either
way, start with the environment variable checklist below.

> **Note on this guide:** the Dockerfiles and compose file were written
> against standard, current Node/Nginx/Mongo image conventions and
> validated for syntax (YAML parses cleanly, Dockerfile instructions
> follow standard multi-stage patterns), but this sandbox doesn't have a
> Docker daemon available, so an actual `docker compose up` build was
> not run end-to-end here. Test a real build in your own environment
> before relying on it for production.

## 1. Environment variable checklist

Copy `backend/.env.example` to `backend/.env` and fill in real values
for production:

| Variable | Required | Notes |
|---|---|---|
| `NODE_ENV` | Yes | `production` |
| `PORT` | Yes | defaults to 5000 |
| `CLIENT_URL` | Yes | your deployed frontend origin, for CORS |
| `MONGO_URI` | Yes | MongoDB Atlas connection string (or the `mongo` service in Compose) |
| `JWT_SECRET` | Yes | long random string — `openssl rand -hex 32` |
| `JWT_EXPIRES_IN`, `JWT_COOKIE_EXPIRES_IN` | No | defaults are sane (7 days) |
| `GEMINI_API_KEY` | Yes (for OCR/AI/chat) | from [Google AI Studio](https://aistudio.google.com/app/apikey) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` | Yes (for reminder emails) | e.g. Gmail app password, SendGrid, Postmark |
| `WHATSAPP_PROVIDER` + provider creds | No | `"twilio"` or `"meta"`; leave blank to skip WhatsApp entirely |
| `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX` | No | defaults are reasonable for a small-to-medium deployment |

The frontend only needs `client/.env` → `VITE_API_BASE_URL` if you're
**not** using the nginx reverse-proxy setup below (which routes `/api`
same-origin, so no env var is needed at all in that case).

Never commit a real `.env` file — both `client/.gitignore` and
`backend/.gitignore` already exclude it.

## 2. Docker Compose (recommended for a single-VM deployment)

```bash
# From the project root
cp backend/.env.example backend/.env
# edit backend/.env with real values (see checklist above)

docker compose up -d --build
```

This starts three containers:
- **`mongo`** — MongoDB 7, data persisted in the `mongo_data` volume
- **`backend`** — the Express API, uploads persisted in the
  `backend_uploads` volume so they survive container restarts
- **`client`** — nginx serving the built React app, reverse-proxying
  `/api/*` and `/uploads/*` to the `backend` container so the browser
  only ever talks to one origin (no CORS complexity, cookies work
  normally)

Visit `http://localhost` (client/nginx on port 80) and
`http://localhost:5000/api/health` (backend directly, if needed).

To stop: `docker compose down` (add `-v` to also wipe the Mongo volume).

### Updating after a code change
```bash
docker compose up -d --build
```
Compose rebuilds only the images whose source changed.

## 3. Manual / platform deployment

If you'd rather deploy the frontend and backend to separate managed
platforms instead of one VM:

### Backend (Render, Railway, Fly.io, or any Node host)
1. Point the platform at the `backend/` directory.
2. Build command: `npm install`. Start command: `npm start` (runs
   `node server.js`).
3. Set every environment variable from the checklist above in the
   platform's dashboard — **not** in a committed file.
4. Uploaded files are written to `backend/uploads/` on local disk. Most
   PaaS platforms use **ephemeral** filesystems — uploads will be lost
   on redeploy/restart unless you either (a) attach a persistent volume
   if the platform supports one, or (b) swap `multer`'s disk storage for
   an object storage backend (S3-compatible) in `middleware/upload.js`.
   This is a known scaling consideration, not something this project
   solves out of the box.
5. MongoDB: use [MongoDB Atlas](https://www.mongodb.com/atlas) (free
   tier is enough to start) and put its connection string in
   `MONGO_URI`.

### Frontend (Vercel, Netlify, or any static host)
1. Point the platform at the `client/` directory.
2. Build command: `npm run build`. Output directory: `dist`.
3. Set `VITE_API_BASE_URL` to your backend's public URL + `/api` (e.g.
   `https://api.yourapp.com/api`), since without the nginx same-origin
   proxy the frontend needs the full backend URL.
4. Add a SPA rewrite rule (any path → `index.html`) — Vercel/Netlify
   both support this natively (`vercel.json` rewrites or Netlify's
   `_redirects` file) so client-side routes like `/prescriptions/123`
   don't 404 on a hard refresh. `client/nginx.conf` shows the equivalent
   `try_files` rule if you're self-hosting instead.
5. Update the backend's `CLIENT_URL` env var to match this frontend's
   origin, since CORS is locked to that single origin
   (`app.js` → `cors({ origin: env.CLIENT_URL, credentials: true })`).

## 4. First admin account

After deploying, register a normal account through the app, then run
the seed script **from the backend's environment** (SSH/exec into the
container, or a one-off platform job):

```bash
npm run seed:admin -- you@example.com
```

or, inside Docker Compose:

```bash
docker compose exec backend node scripts/seedAdmin.js you@example.com
```

## 5. Production checklist

- [ ] `NODE_ENV=production` — disables verbose error stacks in API
      responses and switches Morgan to `combined` log format
- [ ] Real `JWT_SECRET` (never the placeholder from `.env.example`)
- [ ] MongoDB Atlas (or a properly backed-up self-hosted instance) —
      not the ephemeral Docker Compose volume for real user data
- [ ] HTTPS in front of both the frontend and backend (a platform's
      built-in TLS, or a reverse proxy like Caddy/Traefik in front of
      the Compose stack)
- [ ] `CLIENT_URL` matches your real frontend origin exactly (CORS will
      silently reject cookies otherwise)
- [ ] SMTP credentials set, so reminder emails actually send —
      `emailService.js` fails silently if unset, which is safe but means
      reminders won't notify anyone by email until this is configured
- [ ] A real object storage plan for uploads if deploying to a platform
      with an ephemeral filesystem (see the note above)
- [ ] Run `npm test` in `backend/` as part of CI before every deploy
