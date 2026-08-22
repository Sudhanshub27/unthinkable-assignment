# 🏢 Society Maintenance Tracker

A full-stack apartment society maintenance platform that allows residents to raise and track complaints while enabling administrators to manage priorities, SLA breaches, notices, and complete audit history. Built with Node.js, Express, React (Vite), and dual SQLite/PostgreSQL database compatibility.

---

## 🌟 Features

### 👤 Resident Capabilities
* **Account Registration & Authentication**: Secure sign-up with flat number designation and JWT token session management.
* **Complaint Submission**: Create maintenance requests across categories (Plumbing, Electrical, Elevator, Security, Common Area, General) with detailed descriptions and optional photo attachments.
* **Secure Photo Uploads**: Multipart image uploading with binary magic-byte validation and instant preview lightbox.
* **Live Complaint Tracking**: Monitor real-time status (`Open`, `In Progress`, `Resolved`), priority levels, and SLA age.
* **Audit History Timeline**: Transparent, read-only inspection of every status transition, priority change, and admin note.
* **Community Notice Board**: Stay informed with society announcements and pinned high-priority updates.
* **User Profile**: View account parameters, flat number assignment, and role designations.

### 🛡️ Admin Capabilities
* **Operations Console Dashboard**: Real-time KPI dashboard featuring total queue counts, open/in-progress/resolved metrics, SLA breach alerts, and dynamic category breakdown charts.
* **Complaint Queue Management**: Comprehensive list view of all resident complaints across the society.
* **Multi-Filter & Search Engine**: Real-time filtering by category, status, priority level, date range, search query (ID, resident name, flat number), and SLA breach flag.
* **Atomic Triage Operations**: Update complaint status, priority level, manual overdue flag, and audit notes simultaneously within an isolated database transaction.
* **Configurable Overdue SLA**: Modify society SLA threshold parameters (in days) dynamically without code redeployment.
* **Notice Board Administration**: Create standard or important announcements with automatic email broadcast triggers.
* **Automated & Manual Overdue System**: Surface complaints exceeding configurable SLA thresholds automatically at the top of the admin queue.
* **Email Notification System**: Asynchronous, non-blocking email alerts sent to residents on status changes and important community announcements.

---

## 🛠️ Tech Stack

* **Frontend**: React 18, Vite, React Router v6, Axios, Modern HSL Vanilla CSS Design System.
* **Backend**: Node.js, Express.js.
* **Database**: Dual Compatibility Layer — SQLite (`better-sqlite3`) for zero-config local development, PostgreSQL (`pg`) for cloud production.
* **Authentication**: JSON Web Tokens (JWT) with HTTP Bearer authorization headers and `bcryptjs` password hashing.
* **Email Service**: Nodemailer with SMTP configuration and safe mock console fallback.
* **File Upload & Validation**: Multer with disk storage, file extension filtering, and binary magic-byte header inspection.

---

## 🏗️ Architecture

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
        ComplaintRoute --> EmailUtil[Nodemailer Async Worker]
        NoticeRoute --> EmailUtil
    end

    subgraph Data Abstraction Layer
        Routes <--> Pool[Dual Adapter DB Layer pool.js]
        Pool <--> SQLite[(SQLite Local DB)]
        Pool <--> Postgres[(PostgreSQL Production DB)]
    end
```

### Complaint Lifecycle & Triage Workflow

```mermaid
stateDiagram-v2
    [*] --> Open: Resident Raises Complaint (Photo Uploaded)
    Open --> InProgress: Admin Triages & Dispatches Work (Note Logged)
    InProgress --> Resolved: Admin Marks Resolved (Timestamp Stamped)
    
    state Open {
        [*] --> NormalAge
        NormalAge --> SLA_Breached: Age > Overdue Threshold Days
        NormalAge --> Manually_Flagged: Admin Overdue Flag Checked
    }
    
    state InProgress {
        [*] --> InProgNormal
        InProgNormal --> InProgBreached: Exceeds SLA Threshold
    }
```

---

## 🗄️ Database Design

The system utilizes a relational schema supporting foreign key constraints, explicit indexing, and append-only audit tracking.

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

### Why `complaint_history` exists as a separate table
Storing only the current status in `complaints` loses critical operational visibility into when changes occurred, who authorized them, and what notes were attached. Storing status transitions as an **append-only history log** in `complaint_history` provides:
1. **Immutable Auditability**: A complete timeline of every status transition, priority change, and overdue override.
2. **Actor Accountability**: Tracks the exact `actor_id` and `actor_role` (Resident vs. Admin) for every action.
3. **Decoupled Data**: Keeps the primary `complaints` table lean for fast list queries while maintaining a detailed history log available on demand via indexed `WHERE complaint_id = ?` queries.

---

## 🔄 Complaint Lifecycle

1. **Status Transition Flow**:
   - `Open` (Default state upon creation by a resident)
   - `In Progress` (Admin acknowledges request and dispatches maintenance personnel)
   - `Resolved` (Issue is remediated; `resolved_at` timestamp is permanently recorded)

2. **Priority Classification**:
   - `Low` (Routine non-urgent tasks, e.g., general query)
   - `Medium` (Standard maintenance, e.g., minor pipe leak)
   - `High` (Urgent hazards, e.g., main lift failure, main electrical outage)

3. **Overdue SLA Determination**:
   $$\text{Age (Days)} = \lfloor \frac{\text{Current Time} - \text{Created Time}}{86400 \text{ seconds}} \rfloor$$
   $$\text{Is Overdue} = (\text{Status} \neq \text{'Resolved'}) \text{ AND } (\text{Age} \ge \text{SLA Threshold} \text{ OR } \text{is\_overdue\_flag} = \text{true})$$

4. **Atomic Admin Triage Operations**:
   When an admin updates a complaint, status changes, priority shifts, overdue flags, and audit notes are sent in a single `PATCH /api/complaints/:id` request. The backend executes all modifications inside an explicit database transaction (`BEGIN ... COMMIT`), guaranteeing that either **all updates and history records persist successfully or none do**.

---

## 🔒 Security Architecture

* **JWT Authentication**: Stateless, signed tokens issued upon login containing `id`, `email`, `name`, and `role` with 7-day expiration.
* **Password Hashing**: Secure salted password storage using `bcryptjs` (salt factor 10).
* **Role-Based Authorization (RBAC)**: Backend `requireAdmin` middleware checks JWT payload and returns `403 Forbidden` if a resident attempts to access administrative endpoints.
* **Strict Production Fail-Safe**: The JWT utility enforces a fatal server exit (`process.exit(1)`) if `JWT_SECRET` is missing in production environments.
* **Parameterized SQL Queries**: All queries use parameterized placeholders (`$1, $2` or `?`) via the `pool.js` abstraction layer to prevent SQL injection vulnerabilities.
* **Image Binary Inspection**: Image uploads inspect magic byte signatures in memory (`isValidImageBuffer`) to ensure uploaded files are valid PNG, JPEG, GIF, or WebP images, preventing MIME-type spoofing.
* **CORS Policy Enforcement**: Configured CORS origin validation restricting API access to authorized frontend domains.
* **Client-Side Route Protection**: React Router `ProtectedRoute` guards restrict UI access based on authentication status and user roles.

---

## 🖼️ Photo Upload Handling

Relying solely on HTTP `Content-Type` headers or file extensions is insecure because malicious files can be renamed (e.g., `shell.php` renamed to `shell.png`).

### Upload Pipeline
```
Client (FormData) 
  ➔ Multipart HTTP POST Request 
  ➔ Multer Storage Engine (disk write with randomized filename) 
  ➔ Extension Filter Check 
  ➔ Binary Magic-Byte Inspection (fs.readSync checks header bytes: 89 50 4E 47...) 
  ➔ Safe Storage in /uploads/ 
  ➔ Relative Path stored in database (/uploads/filename.png)
```
If binary header validation fails, the uploaded file is unlinked immediately from disk and an HTTP 400 error is returned.

---

## 📜 Audit History Engine

Every status transition, priority modification, or manual overdue flag creates an immutable audit event in `complaint_history`:
- `created`: Recorded when a resident submits a complaint.
- `status_change`: Recorded when status moves between Open, In Progress, and Resolved.
- `priority_change`: Recorded when priority is adjusted between Low, Medium, and High.
- `overdue_flag`: Recorded when an admin manually flags or unflags SLA breach status.

**Actor Identity Resolution**: The actor's identity is derived from the verified JWT payload (`req.user.id` and `req.user.role`). Audit queries execute a `LEFT JOIN users u ON u.id = h.actor_id` to dynamically attach the actor's full name to timeline views.

---

## ⏱️ Overdue SLA Engine

The system calculates overdue status **dynamically on demand**:
- The administrative overdue threshold (`overdue_threshold_days`) is stored in the `settings` table and editable via `PUT /api/settings/overdue-threshold`.
- When complaints are fetched, `annotateOverdue()` dynamically compares `created_at` against the active threshold setting.
- This dynamic evaluation eliminates the need for background cron schedulers and guarantees that threshold changes immediately reflect across all complaints across the application.

---

## 📧 Email Notification System

Implemented using **Nodemailer** for asynchronous, non-blocking notifications:
1. **Status Update Alerts**: Sent to the complaint author when an admin modifies complaint status.
2. **Important Community Announcements**: Broadcast to all registered residents when an important notice is posted.

### Safe Fallback Mechanism
If SMTP environment variables (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`) are omitted, `sendEmail()` gracefully operates in **mock mode**, logging email contents cleanly to the server console. This allows local development and demonstration without requiring active mail server credentials.

---

## 🚀 Local Development Setup

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
   npm run seed       # Seeds initial demo accounts
   ```

4. **Start Backend Dev Server**:
   ```bash
   npm run dev        # Starts Express server on http://localhost:4000
   ```

5. **Frontend Setup** (in a new terminal window):
   ```bash
   cd frontend
   npm install
   npm run dev        # Starts Vite React server on http://localhost:5173
   ```

6. **Access Application**:
   Open [http://localhost:5173](http://localhost:5173) in your web browser.

---

## 🔑 Demo Credentials

> **DISCLAIMER**: The credentials below are intended strictly for **LOCAL DEVELOPMENT & DEMONSTRATION PURPOSES**.

| Role | Email | Password | Access Details |
|---|---|---|---|
| **Admin** | `admin@society.com` | `Admin@123` | Full access to Operations Dashboard, Triage Controls, Notices, and SLA Settings. |
| **Resident** | `resident@society.com` | `Resident@123` | Access to Resident Portal, Raise Complaint, My Complaints, and Notices. |

*(Note: The login screen includes 1-click quick-fill buttons for both Admin and Resident demo accounts).*

---

## ⚙️ Environment Variables

### Backend Configuration (`backend/.env`)

```env
# Server Configuration
PORT=4000
CORS_ORIGIN=http://localhost:5173

# Database (PostgreSQL string; falls back to SQLite if omitted)
DATABASE_URL=postgresql://user:password@localhost:5432/society_tracker
DATABASE_SSL=false

# Authentication
JWT_SECRET=your_secure_random_jwt_secret_key

# Default Seed Credentials
SEED_ADMIN_EMAIL=admin@society.com
SEED_ADMIN_PASSWORD=Admin@123

# SMTP Configuration (Optional - logs to console if blank)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com
```

### Frontend Configuration (`frontend/.env`)

```env
VITE_API_URL=http://localhost:4000/api
```

---

## 📚 API Reference Documentation

All protected endpoints require HTTP header: `Authorization: Bearer <JWT_TOKEN>`.

| Method | Endpoint | Auth | Role | Purpose |
|---|---|---|---|---|
| `POST` | `/api/auth/register` | Public | None | Register new resident account |
| `POST` | `/api/auth/login` | Public | None | Authenticate user & return JWT token |
| `GET` | `/api/dashboard` | Required | Admin | Get operational KPI statistics & category breakdown |
| `GET` | `/api/complaints` | Required | Admin | Fetch all society complaints (supports filters) |
| `GET` | `/api/complaints/mine` | Required | Resident | Fetch logged-in resident's complaints |
| `GET` | `/api/complaints/:id` | Required | Any | Fetch single complaint details and audit timeline history |
| `POST` | `/api/complaints` | Required | Resident | Submit complaint with optional photo (`multipart/form-data`) |
| `PATCH` | `/api/complaints/:id` | Required | Admin | Atomic triage update (status, priority, overdue flag, note) |
| `GET` | `/api/notices` | Required | Any | List society notices (important notices pinned to top) |
| `POST` | `/api/notices` | Required | Admin | Publish notice (broadcasts email if `is_important: true`) |
| `DELETE`| `/api/notices/:id` | Required | Admin | Delete notice by ID |
| `GET` | `/api/settings/overdue-threshold` | Required | Admin | Get current overdue threshold in days |
| `PUT` | `/api/settings/overdue-threshold` | Required | Admin | Update overdue threshold setting |

---

## 💡 Key Engineering Decisions

1. **Why JWT Authentication?**: Stateless authentication allows independent scaling of frontend and backend without server session state overhead.
2. **Why Separate `complaint_history` Table?**: Storing immutable audit records in a dedicated table guarantees full historical auditability without polluting the primary complaint entity.
3. **Why Atomic Triage Updates?**: Processing status, priority, overdue flags, and notes inside a single SQL transaction prevents partial updates and state drift.
4. **Why Configurable SLA Threshold?**: Storing threshold days in a database `settings` table allows administrators to adjust SLA policies on the fly without code redeploys.
5. **Why Backend Authorization in Addition to Client-Side Protection?**: Client-side `ProtectedRoute` guards enhance user experience, but server-side middleware (`requireAdmin`) is essential for actual security.
6. **Why Binary Magic-Byte Image Validation?**: Header inspection validates true file signatures, preventing malicious file execution disguised by fake file extensions.
7. **Why Dual SQLite & PostgreSQL Support?**: Enables zero-config local testing for developers out of the box while providing production readiness for PostgreSQL cloud hosting.

---

## ⚠️ Known Limitations

- **Local File Storage**: Uploaded complaint photos are written to local disk (`backend/uploads/`). For multi-instance cloud deployments (e.g., Kubernetes, AWS ECS), this should be transitioned to S3 or Cloudflare R2 object storage.
- **Single-Node In-Memory Email Queue**: Email notifications process asynchronously in background promises. Highly scaled deployments should use a dedicated job queue (e.g., BullMQ with Redis).

---

## 💬 Interview Talking Points

1. **Atomic Complaint Triage**: Single-transaction PATCH route ensuring status updates and history logs commit atomically.
2. **Immutable Audit History**: Append-only event tracking capturing actor identity, old/new values, and contextual notes.
3. **Dynamic Overdue SLA Engine**: Read-time SLA evaluation driven by configurable database settings without cron dependency.
4. **Secure Image Pipeline**: Binary magic-byte inspection validating JPEG, PNG, GIF, and WebP buffer headers.
5. **Role-Based Security Architecture**: Multi-layered authorization with JWT validation, backend route guards, and safe production exit fallbacks.
6. **Dual Database Adapter**: `pool.js` translation layer enabling zero-config SQLite local dev and PostgreSQL cloud deployment.
7. **High-Fidelity Responsive Interface**: Automatic table-to-card transformation at mobile breakpoints ensuring accessible UX on all viewports.
