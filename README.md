<div align="center">
  <img src="frontend/public/logo.png" alt="Angan Logo" width="110" />
  <h1>Angan — Society Maintenance Tracker</h1>
  <p><i>The digital courtyard for modern housing societies</i></p>
</div>

A production-ready, full-stack housing society management platform designed to streamline maintenance complaint triage, resolution tracking, official announcements, and community governance. Built with **Node.js**, **Express**, **React (Vite)**, and dual **SQLite / PostgreSQL** database compatibility.

---

## 🌐 Live Production Links

* **Live Web Application**: [https://unthinkable-assignment-sudhanshu.vercel.app](https://unthinkable-assignment-sudhanshu.vercel.app)
* **Live REST API Endpoint**: [https://unthinkable-assignment-vcj0.onrender.com/api](https://unthinkable-assignment-vcj0.onrender.com/api)
* **API Health Check**: [https://unthinkable-assignment-vcj0.onrender.com/api/health](https://unthinkable-assignment-vcj0.onrender.com/api/health)
* **GitHub Repository**: [https://github.com/Sudhanshub27/unthinkable-assignment](https://github.com/Sudhanshub27/unthinkable-assignment)

---

## 🗝️ Demo Credentials

For quick evaluation, use the pre-configured credentials below or register a new resident account:

| Role | Email | Password | Access & Capabilities |
|---|---|---|---|
| 🛡️ **Admin** | `admin@society.com` | `Admin@123` | KPI Dashboard, Complaint Triage Queue, SLA Threshold Settings, Notice Posting |
| 👤 **Resident** | `resident@society.com` | `Resident@123` | Submit Complaints with Photos, Track Resolution Timeline, View Notice Board |

---

## 📌 Executive Summary & Problem Scope

Apartment societies process a continuous volume of maintenance issues (plumbing leaks, electrical outages, security concerns, elevator repairs). Without a structured digital management platform:
1. **Management** lacks visibility into unresolved issues, overdue SLAs, and recurring problem categories.
2. **Residents** face uncertainty without real-time updates or history tracking for raised issues.

**Angan** resolves these challenges by introducing:
* An **immutable append-only audit trail** for every complaint transition.
* A **dynamic overdue SLA engine** that automatically highlights delayed issues.
* A **role-based operations console** for administrators to triage queues, adjust priorities, and publish announcements.
* An **asynchronous email notification pipeline** keeping residents updated at every step.

---

## 🗺️ Application Journey & Operational Route

```
                                  +-----------------------+
                                  |   Angan Landing Page  |
                                  |  (Overview & Portals) |
                                  +-----------+-----------+
                                              |
                        +---------------------+---------------------+
                        |                                           |
             +----------v----------+                     +----------v----------+
             |   Resident Portal   |                     |     Admin Portal    |
             +----------+----------+                     +----------+----------+
                        |                                           |
     +------------------+------------------+     +------------------+------------------+
     |                  |                  |     |                  |                  |
+----v-----+      +-----v----+      +------v---+ |      +-----------v--+   +-------------v+   +-------------v+
| Submit   |      | Track    |      | Digital  | |      | Operations   |   | Triage Queue |   | Society      |
| Issue    |      | Status & |      | Notice   | |      | KPI          |   | (Filters,    |   | Settings &   |
| (Photos) |      | Timeline |      | Board    | |      | Dashboard    |   | SLA Flags)   |   | SLA Config   |
+----------+      +----------+      +----------+ |      +--------------+   +--------------+   +--------------+
                                                 |
                                     +-----------v-----------+
                                     | Notice Board Admin    |
                                     | (Important/Pinned)    |
                                     +-----------------------+
```

### 1. Resident Workflow
1. **Authentication**: Sign up with name, email, password, and flat number assignment, or log in via JWT session.
2. **Raise Maintenance Request**: Submit issues selecting from structured categories (*Plumbing, Electrical, Cleaning, Security, Lift, Parking, Other*), detailed descriptions, and optional photo attachments.
3. **Live Track & Audit Timeline**: Monitor real-time status (`Open` ➔ `In Progress` ➔ `Resolved`), priority levels, and inspect an append-only timeline log detailing every admin note and status change.
4. **Community Notice Board**: Read general society notices and pinned high-priority announcements.

### 2. Admin Operations Workflow
1. **Executive Dashboard**: Monitor real-time KPI metrics including total complaints, active issues by status, category breakdown distributions, and count of overdue complaints.
2. **Complaint Triage & Queue Management**: Filter and search complaints by status, category, priority, date range, resident name, flat number, or SLA breach status.
3. **Atomic State Updates**: Modify complaint status, priority level (`Low`, `Medium`, `High`), manual overdue flags, and operational audit notes simultaneously within an isolated SQL transaction.
4. **Dynamic SLA Governance**: Configure society overdue threshold parameters (in days) dynamically from the Settings UI without restarting the application.
5. **Notice Broadcasting**: Create standard or pinned announcements with automated email notifications dispatched to residents.

---

## 🌟 Feature Checklist (Requirement Parity)

| Category | Feature Requirement | Status | Implementation Details |
|---|---|---|---|
| **Input** | Resident Complaint with Category & Description | ✅ Complete | Express validation & parameterized SQL insertion |
| **Input** | Optional Photo Attachment | ✅ Complete | Multer disk storage + Binary magic-byte header inspection |
| **Input** | Admin Status & Priority Updates | ✅ Complete | Atomic `PATCH /api/complaints/:id` transaction |
| **Input** | Admin Notice Board Posting | ✅ Complete | Pinned important notices with email broadcast trigger |
| **Output** | Tracked Complaints with Full History Log | ✅ Complete | Append-only `complaint_history` audit table |
| **Output** | Digital Notice Board | ✅ Complete | `GET /api/notices` with pinned importance sorting |
| **Output** | Automated Overdue SLA Escalation | ✅ Complete | Dynamic read-time calculation + manual override flag |
| **Output** | Email Notifications | ✅ Complete | Asynchronous Resend API / Nodemailer worker with mock fallback |
| **Dashboard**| KPI Counters & Category Analytics | ✅ Complete | Operational aggregates via `GET /api/dashboard` |

---

## 🏗️ Architecture & System Design

### System Architecture Diagram

```mermaid
flowchart TD
    Client[Browser / React + Vite UI] <-->|HTTP / JSON API| Axios[Axios API Client]
    Axios <-->|Bearer Token Auth| Express[Express.js REST API Server]
    
    subgraph Express Backend Pipeline
        Express --> AuthMW[JWT & Role Authorization Middleware]
        AuthMW --> Routes[API Route Handlers]
        
        subgraph API Routes
            Routes --> AuthRoute[POST /api/auth/*]
            Routes --> ComplaintRoute[GET/POST/PATCH /api/complaints/*]
            Routes --> NoticeRoute[GET/POST/DELETE /api/notices/*]
            Routes --> DashRoute[GET /api/dashboard]
            Routes --> SettingsRoute[GET/PUT /api/settings/*]
        end
        
        ComplaintRoute --> UploadMW[Multer + Magic-Byte Upload Filter]
        ComplaintRoute --> EmailUtil[Asynchronous Email Worker]
        NoticeRoute --> EmailUtil
    end

    subgraph Data Abstraction Layer
        Routes <--> Pool[Dual Adapter DB Layer pool.js]
        Pool <--> SQLite[(SQLite Local DB)]
        Pool <--> Postgres[(PostgreSQL Production DB)]
    end
```

### Complaint Lifecycle & State Machine

```mermaid
stateDiagram-v2
    [*] --> Open: Resident Submits Complaint (Optional Photo Uploaded)
    
    state Open {
        [*] --> NormalAge
        NormalAge --> SLA_Breached: Age > Threshold Days
        NormalAge --> Manually_Flagged: Admin Overdue Toggle Checked
    }
    
    Open --> InProgress: Admin Triages & Dispatches Work (Audit Note Logged)
    
    state InProgress {
        [*] --> InProgNormal
        InProgNormal --> InProgBreached: Exceeds SLA Threshold
    }
    
    InProgress --> Resolved: Admin Marks Resolved (Timestamp Stamped)
    Resolved --> [*]: Complaint Closed
```

---

## 🗄️ Database Design & Audit History Model

The application utilizes a relational schema supporting foreign key constraints, explicit indexing, and append-only audit history.

```mermaid
erDiagram
    users ||--o{ complaints : "raises"
    users ||--o{ complaint_history : "performs action"
    users ||--o{ notices : "posts"
    complaints ||--o{ complaint_history : "tracks changes"

    users {
        int id PK
        string name
        string email UK
        string password_hash
        string role
        string flat_number
        timestamp created_at
    }

    complaints {
        int id PK
        int resident_id FK
        string category
        text description
        string photo_url
        string status
        string priority
        boolean is_overdue_flag
        timestamp resolved_at
        timestamp created_at
        timestamp updated_at
    }

    complaint_history {
        int id PK
        int complaint_id FK
        int actor_id FK
        string actor_role
        string change_type
        string old_value
        string new_value
        text note
        timestamp created_at
    }

    notices {
        int id PK
        string title
        text body
        boolean is_important
        int posted_by FK
        timestamp created_at
    }

    settings {
        string key PK
        string value
        timestamp updated_at
    }
```

### Why `complaint_history` exists as an Append-Only Table
Storing only the current status in `complaints` loses operational context regarding when changes occurred, who authorized them, and what notes were attached. Storing status transitions as an **append-only history log** in `complaint_history` guarantees:
1. **Immutable Audit Trail**: Every status transition, priority adjustment, and manual overdue flag is recorded with timestamped precision.
2. **Actor Accountability**: Explicitly records `actor_id` and `actor_role` (*Resident* vs. *Admin*).
3. **Decoupled Read Performance**: Keeps the primary `complaints` table lightweight for fast list/filter queries while serving audit history on demand via indexed `WHERE complaint_id = ?` queries.

---

## 💡 Key Technical Decisions

1. **Atomic Triage Updates**: When an admin updates a complaint, status changes, priority shifts, overdue flags, and audit notes are executed inside a single database transaction (`BEGIN ... COMMIT`), preventing partial updates or state drift.
2. **Derivation-Based Overdue Detection**: Rather than running brittle background cron jobs to flip database booleans, overdue status is calculated dynamically at read time (`status != 'Resolved' AND age > threshold_days`). This guarantees that overdue calculations are always 100% accurate and immediate.
3. **Secure Binary Header Image Inspection**: Uploaded files are inspected for binary magic-byte signatures (`89 50 4E 47` for PNG, `FF D8 FF` for JPEG) in memory. This prevents MIME-type spoofing and malicious file execution.
4. **Dual SQLite & PostgreSQL Compatibility**: The custom `pool.js` database abstraction layer automatically seamlessly detects environment parameters, executing SQLite for zero-config local development and PostgreSQL for cloud production hosting.
5. **Asynchronous Non-Blocking Email Pipeline**: Outbound notification dispatches execute as un-awaited background tasks, ensuring user API responses remain fast and sub-50ms regardless of external mail server latency.

---

## 🛠️ Tech Stack & Engineering Specifications

* **Frontend**: React 18, Vite, React Router v6, Axios, Lucide React, HSL Color Token CSS Design System.
* **Backend**: Node.js, Express.js.
* **Database**: Dual Adapter (`sqlite3` for local dev, `pg` for cloud PostgreSQL).
* **Authentication**: JSON Web Tokens (JWT) with HTTP Bearer authorization headers and `bcryptjs` password hashing (salt rounds = 10).
* **File Upload & Inspection**: Multer with disk storage, file extension filtering, and binary magic-byte header inspection.
* **Email Service**: Resend API integration with Nodemailer SMTP fallback and safe console logging mode.

---

## 🚀 Local Setup Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### Step-by-Step Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/Sudhanshub27/unthinkable-assignment.git
   cd unthinkable-assignment
   ```

2. **Backend Setup**:
   ```bash
   cd backend
   npm install
   ```

3. **Database Migration & Seeding**:
   ```bash
   npm run migrate    # Creates database schema tables
   npm run seed       # Seeds initial admin & resident demo accounts
   ```

4. **Start Backend Server**:
   ```bash
   npm run dev        # Backend running on http://localhost:4000
   ```

5. **Frontend Setup** (in a second terminal):
   ```bash
   cd frontend
   npm install
   npm run dev        # Frontend running on http://localhost:5173
   ```

6. **Open in Browser**:
   Navigate to `http://localhost:5173` to explore the application.

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)

```env
# Server Configuration
PORT=4000
CORS_ORIGIN=http://localhost:5173

# Database (PostgreSQL URL; falls back to local SQLite if omitted)
DATABASE_URL=postgresql://user:password@localhost:5432/society_tracker
DATABASE_SSL=false

# Authentication
JWT_SECRET=your_secure_random_jwt_secret_key

# Default Seed Accounts
SEED_ADMIN_EMAIL=admin@society.com
SEED_ADMIN_PASSWORD=Admin@123

# Email Service (Optional - logs to console if omitted)
RESEND_API_KEY=re_your_resend_api_key
RESEND_FROM=Angan Society <notifications@angan.app>
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:4000/api
```

---

## 📚 REST API Reference

All protected endpoints require header: `Authorization: Bearer <JWT_TOKEN>`.

| Method | Endpoint | Auth Required | Role | Description |
|---|---|---|---|---|
| `POST` | `/api/auth/register` | ❌ Public | None | Register new resident account |
| `POST` | `/api/auth/login` | ❌ Public | None | Authenticate user & return JWT token |
| `GET` | `/api/dashboard` | ✅ Yes | Admin | Fetch operational KPI metrics & category breakdown |
| `GET` | `/api/complaints` | ✅ Yes | Admin | List all complaints (supports search & multi-filters) |
| `GET` | `/api/complaints/mine` | ✅ Yes | Resident | List logged-in resident's complaints |
| `GET` | `/api/complaints/:id` | ✅ Yes | Any | Fetch single complaint details + audit timeline |
| `POST` | `/api/complaints` | ✅ Yes | Resident | Submit new complaint (`multipart/form-data`) |
| `PATCH` | `/api/complaints/:id` | ✅ Yes | Admin | Atomic triage update (status, priority, note, flag) |
| `GET` | `/api/notices` | ✅ Yes | Any | List society notices (pinned notices listed first) |
| `POST` | `/api/notices` | ✅ Yes | Admin | Publish notice (broadcasts email if `is_important: true`) |
| `DELETE`| `/api/notices/:id` | ✅ Yes | Admin | Delete notice by ID |
| `GET` | `/api/notifications` | ✅ Yes | Any | Fetch user's in-app notification feed & unread count |
| `PATCH` | `/api/notifications/read-all` | ✅ Yes | Any | Mark all in-app notifications as read |
| `PATCH` | `/api/notifications/:id/read` | ✅ Yes | Any | Mark specific notification as read |
| `GET` | `/api/email-logs` | ✅ Yes | Admin | Audit trail of outbound email delivery logs |
| `GET` | `/api/settings/overdue-threshold` | ✅ Yes | Admin | Retrieve active SLA threshold (in days) |
| `PUT` | `/api/settings/overdue-threshold` | ✅ Yes | Admin | Update society SLA threshold setting |

---

## 📄 Additional Artifacts

* **System Design Write-Up**: Complete 750-word architecture document available in [`SYSTEM_DESIGN.md`](./SYSTEM_DESIGN.md).
