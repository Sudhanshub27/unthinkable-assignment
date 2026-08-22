# 🏢 Society Maintenance Tracker

A comprehensive, full-stack application for apartment societies to manage maintenance complaints end-to-end. Residents can raise complaints with categories and optional photos, admins triage and resolve them through a tracked workflow with priorities, and everyone stays informed via a notice board and email notifications.

---

## ✨ Features & Highlights

- 🔐 **Role-Based Authentication**: JWT-based authentication for **Resident** and **Admin** roles.
- 📋 **Complaint Lifecycle Management**: Track complaints through `Open` ➔ `In Progress` ➔ `Resolved` states.
- 📜 **Append-Only Audit History**: Every status or priority change records a immutable log entry with actor ID, role, old/new values, note, and timestamp.
- 🖼️ **Photo Upload & Lightbox**: Support for image upload handling (JPEG/PNG/WEBP/GIF) with instant preview and interactive full-screen lightbox.
- ⚠️ **Automated & Manual Overdue Detection**: Complaints remaining open beyond an admin-configurable threshold (days) are automatically flagged as overdue and prioritized at the top of the admin queue. Admins can also manually flag urgent items.
- 📢 **Interactive Notice Board**: Admins can post announcements and mark critical ones as **Important** to pin them to the top and automatically broadcast emails to all residents.
- 📧 **Email Integration**: Automated notifications for status updates and important notices via Nodemailer (supports SMTP providers like Gmail, Brevo, or mock console mode for zero-config testing).
- 📊 **Analytics Dashboard**: Real-time metrics on total complaints, overdue count, status distribution, and visual category breakdown progress bars.
- ⚡ **Dual Database Support**: Zero-config local development out-of-the-box using SQLite, plus 100% PostgreSQL compatibility for cloud hosted environments (Render, Neon, Supabase).

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js, PostgreSQL (`pg`) / SQLite (`better-sqlite3`), JWT Authentication, bcryptjs, Multer (file upload), Nodemailer (email).
- **Frontend**: React 18 (Vite), React Router v6, Axios, Custom HSL Glassmorphism CSS Design System.
- **Database**: PostgreSQL (Production) / SQLite (Zero-config local fallback).

---

## 📂 Repository Structure

```
society-maintenance-tracker/
├── backend/
│   ├── src/
│   │   ├── db/           # schema.sql, pool.js (Dual PG/SQLite adapter), migrate.js, seed.js
│   │   ├── middleware/   # auth.js (JWT & Admin guard), upload.js (Multer)
│   │   ├── routes/       # auth, complaints, notices, dashboard, settings
│   │   ├── utils/        # email.js, overdue.js
│   │   └── server.js     # Express server entry point
│   ├── uploads/          # Static photo uploads directory
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/          # Axios HTTP client with interceptors
│   │   ├── components/   # Navbar, Badges, ProtectedRoute
│   │   ├── context/      # AuthContext
│   │   ├── pages/        # ResidentComplaints, AdminComplaints, AdminDashboard, NoticeBoard, Login, Register
│   │   ├── styles.css    # Modern HSL CSS Design System
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── .env.example
│   └── package.json
├── SYSTEM_DESIGN.md      # 800-word system design write-up
└── README.md
```

---

## 🚀 Quick Setup Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

---

### Option A: Zero-Config Local Setup (Uses SQLite automatically)

No database installation required!

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Sudhanshub27/unthinkable-assignment.git
   cd unthinkable-assignment
   ```

2. **Setup and run Backend**:
   ```bash
   cd backend
   npm install
   npm run migrate    # Initializes database schema
   npm run seed       # Creates default admin user
   npm run dev        # Starts API server on http://localhost:4000
   ```

3. **Setup and run Frontend** (in a new terminal window):
   ```bash
   cd frontend
   npm install
   npm run dev        # Starts React Vite dev server on http://localhost:5173
   ```

4. **Access Application**:
   Open [http://localhost:5173](http://localhost:5173) in your browser.

---

### Option B: PostgreSQL Local / Production Setup

1. **Create PostgreSQL Database**:
   ```bash
   createdb society_tracker
   ```

2. **Configure Backend `.env`**:
   Copy `backend/.env.example` to `backend/.env` and update your PostgreSQL connection string:
   ```env
   PORT=4000
   CORS_ORIGIN=http://localhost:5173
   DATABASE_URL=postgresql://postgres:password@localhost:5432/society_tracker
   DATABASE_SSL=false
   JWT_SECRET=your-super-secret-jwt-key
   SEED_ADMIN_EMAIL=admin@society.com
   SEED_ADMIN_PASSWORD=Admin@123
   ```

3. **Run Migration & Seed**:
   ```bash
   cd backend
   npm run migrate
   npm run seed
   npm run dev
   ```

---

## 🔑 Default Credentials

After running `npm run seed`:

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@society.com` | `Admin@123` |
| **Resident** | Register any account from the `/register` page | *User chosen* |

*(Note: Admin login has a quick fill button on the login screen for easy testing).*

---

## 📧 Email Configuration

The app sends automated emails on:
1. **Complaint Status Updates** (sent to the resident who raised the complaint).
2. **Important Community Notices** (broadcast to all registered residents).

To enable real email delivery via SMTP (e.g. Gmail App Password, Brevo, Mailtrap):
Set the following in `backend/.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com
```

> **Note**: If SMTP environment variables are left blank, email notifications operate in **mock mode**, logging email content cleanly to the backend server console without throwing errors or breaking API requests.

---

## 📚 API Documentation

All protected endpoints require the HTTP header: `Authorization: Bearer <JWT_TOKEN>`.

### Authentication
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register resident account (`name`, `email`, `password`, `flatNumber`) |
| `POST` | `/api/auth/login` | Public | Authenticate user (`email`, `password`), returns JWT & user object |

### Complaints
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/complaints` | Resident | Create complaint (multipart/form-data: `category`, `description`, `photo`) |
| `GET` | `/api/complaints/mine` | Resident | Fetch resident's own complaints with complete audit history |
| `GET` | `/api/complaints` | Admin | Fetch all complaints (filterable by `category`, `status`, `from`, `to`) |
| `GET` | `/api/complaints/:id` | Resident/Admin | Fetch single complaint details and audit history |
| `PATCH` | `/api/complaints/:id/status` | Admin | Update status (`Open`, `In Progress`, `Resolved`), record note & trigger email |
| `PATCH` | `/api/complaints/:id/priority` | Admin | Update priority (`Low`, `Medium`, `High`) & record audit entry |
| `PATCH` | `/api/complaints/:id/overdue-flag` | Admin | Manually toggle overdue override flag (`flag: boolean`) |
| `GET` | `/api/complaints/meta/categories` | Authenticated | List all complaint categories |

### Notices
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/notices` | Authenticated | Fetch notices (important notices pinned to top) |
| `POST` | `/api/notices` | Admin | Create notice (`title`, `body`, `isImportant`). Broadcasts email if important |
| `DELETE` | `/api/notices/:id` | Admin | Delete a notice by ID |

### Dashboard & Settings
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/dashboard` | Admin | Aggregate counts (total, overdue, status distribution, category breakdown) |
| `GET` | `/api/settings/overdue-threshold` | Admin | Get current overdue threshold in days |
| `PUT` | `/api/settings/overdue-threshold` | Admin | Update overdue threshold (`days: number`) |

---

## 🗄️ Database Schema Summary

See [`backend/src/db/schema.sql`](backend/src/db/schema.sql) for full DDL:

- `users`: User profiles with roles (`resident`, `admin`), hashed passwords, and flat numbers.
- `complaints`: Primary complaint records with category, status, priority, photo URL, and timestamp flags.
- `complaint_history`: Immutable audit trail tracking every creation, status transition, priority change, actor, and note.
- `notices`: Community notices with pinned importance flag (`is_important`).
- `settings`: System settings key-value store holding configurable parameters like `overdue_threshold_days`.

---

## 🌐 Hosted Deployment Guide

### Backend (Render Web Service)
1. Create a **Web Service** on Render connected to `backend/`.
2. Environment: `Node`. Build Command: `npm install`. Start Command: `node src/server.js`.
3. Add environment variables:
   - `DATABASE_URL` (Internal or External PostgreSQL URL)
   - `DATABASE_SSL` = `true`
   - `JWT_SECRET` = `random-secret-key`
   - `CORS_ORIGIN` = `https://your-frontend.vercel.app`
4. Run `npm run migrate` and `npm run seed` once from Render Shell or deployment hook.

### Frontend (Vercel)
1. Import project into Vercel and set Root Directory to `frontend`.
2. Build Command: `npm run build`. Output Directory: `dist`.
3. Set Environment Variable:
   - `VITE_API_URL` = `https://your-backend.onrender.com/api`

---

## 📄 System Design Document

For in-depth architectural details covering Complaint History Modeling, Overdue Detection, Photo Upload Handling, and Non-blocking Notification Flow, please refer to [`SYSTEM_DESIGN.md`](SYSTEM_DESIGN.md).
