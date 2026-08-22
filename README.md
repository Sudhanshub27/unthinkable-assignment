# Society Maintenance Tracker

A platform for apartment societies to manage maintenance complaints end-to-end: residents raise
complaints with photos, admins triage and resolve them through a tracked workflow, and everyone
stays informed via a notice board and email alerts.

## Tech Stack

- **Backend:** Node.js, Express, PostgreSQL (`pg`), JWT auth, bcrypt, Multer (photo upload), Nodemailer (email)
- **Frontend:** React (Vite), React Router, Axios
- **Database:** PostgreSQL

## Project Structure

```
society-maintenance-tracker/
├── backend/
│   ├── src/
│   │   ├── db/           # schema.sql, migrate.js, seed.js, pool.js
│   │   ├── middleware/   # auth.js (JWT), upload.js (Multer)
│   │   ├── routes/       # auth, complaints, notices, dashboard, settings
│   │   ├── utils/        # email.js, overdue.js
│   │   └── server.js
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/          # axios client
│   │   ├── components/   # Navbar, ProtectedRoute, Badges
│   │   ├── context/      # AuthContext
│   │   ├── pages/        # Login, Register, Resident/Admin views, NoticeBoard
│   │   └── App.jsx
│   ├── .env.example
│   └── package.json
└── SYSTEM_DESIGN.md
```

## Local Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ running locally (or a hosted instance)

### 1. Database
```bash
createdb society_tracker
```

### 2. Backend
```bash
cd backend
cp .env.example .env
# Edit .env: set DATABASE_URL to your Postgres connection string,
# set JWT_SECRET to any long random string.
npm install
npm run migrate     # creates tables
npm run seed        # creates a default admin: admin@society.com / Admin@123
npm run dev          # starts on http://localhost:4000
```

### 3. Frontend
```bash
cd frontend
cp .env.example .env
# VITE_API_URL should point at the backend, e.g. http://localhost:4000/api
npm install
npm run dev          # starts on http://localhost:5173
```

Log in as admin with the seeded credentials, or register a new resident account from the UI.

## Email Setup (optional but recommended)

The backend sends email on: (1) complaint status changes, (2) important notices being posted.
Configure any free-tier SMTP provider in `backend/.env`:

- **Gmail:** use an [App Password](https://myaccount.google.com/apppasswords) (not your regular password), `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`.
- **Brevo (Sendinblue), Mailtrap, etc.** also work — just fill in their SMTP host/port/credentials.

If SMTP env vars are left blank, the app doesn't fail — it logs the email content to the console
instead, so the rest of the app remains fully testable without a mail account.

## Deployment

- **Backend:** Deploy `backend/` to Render as a Web Service. Add a Render PostgreSQL instance and
  set `DATABASE_URL` (with `DATABASE_SSL=true`) plus the other `.env` vars in Render's dashboard.
  Run `npm run migrate` and `npm run seed` once via Render's shell after first deploy.
- **Frontend:** Deploy `frontend/` to Vercel. Set `VITE_API_URL` to your Render backend URL + `/api`.
- Set `CORS_ORIGIN` on the backend to your Vercel frontend URL once it's live.

## API Documentation

All endpoints except `/api/auth/*` and `/api/health` require `Authorization: Bearer <token>`.
Endpoints marked **(admin)** additionally require the logged-in user's role to be `admin`.

### Auth
| Method | Endpoint | Body | Description |
|---|---|---|---|
| POST | `/api/auth/register` | `{ name, email, password, flatNumber }` | Creates a resident account, returns JWT |
| POST | `/api/auth/login` | `{ email, password }` | Returns JWT + user object |

### Complaints
| Method | Endpoint | Body / Query | Description |
|---|---|---|---|
| POST | `/api/complaints` | multipart form: `category`, `description`, `photo` (optional file) | Resident raises a complaint |
| GET | `/api/complaints/mine` | — | Resident's own complaints, each with full history |
| GET | `/api/complaints` **(admin)** | query: `category`, `status`, `from`, `to` | All complaints, filtered; overdue ones sorted to the top |
| GET | `/api/complaints/:id` | — | Single complaint with history (owner or admin only) |
| PATCH | `/api/complaints/:id/status` **(admin)** | `{ status, note }` | Updates status; records a history entry; emails resident |
| PATCH | `/api/complaints/:id/priority` **(admin)** | `{ priority }` | Updates priority; records a history entry |
| PATCH | `/api/complaints/:id/overdue-flag` **(admin)** | `{ flag: boolean }` | Manually flags/unflags a complaint as overdue |
| GET | `/api/complaints/meta/categories` | — | List of valid categories |

### Notices
| Method | Endpoint | Body | Description |
|---|---|---|---|
| GET | `/api/notices` | — | All notices, important ones pinned to top |
| POST | `/api/notices` **(admin)** | `{ title, body, isImportant }` | Posts a notice; emails all residents if important |
| DELETE | `/api/notices/:id` **(admin)** | — | Deletes a notice |

### Dashboard & Settings
| Method | Endpoint | Body | Description |
|---|---|---|---|
| GET | `/api/dashboard` **(admin)** | — | Totals by status, by category, overdue count |
| GET | `/api/settings/overdue-threshold` **(admin)** | — | Current overdue threshold (days) |
| PUT | `/api/settings/overdue-threshold` **(admin)** | `{ days }` | Updates the overdue threshold |

## Database Schema

See [`backend/src/db/schema.sql`](backend/src/db/schema.sql) for the full DDL. Summary:

- **users** — residents and admins, `role` column distinguishes them, `flat_number` for residents.
- **complaints** — one row per complaint; `status`, `priority`, `is_overdue_flag` (manual override).
- **complaint_history** — append-only audit log; one row per creation/status change/priority change,
  with `actor_id`, `actor_role`, `old_value`, `new_value`, `note`, `created_at`.
- **notices** — `is_important` boolean controls pinning.
- **settings** — key/value store, currently holds `overdue_threshold_days`.

## Default Login

After running `npm run seed`:
- **Admin:** `admin@society.com` / `Admin@123`
- **Resident:** register your own from the `/register` page.
