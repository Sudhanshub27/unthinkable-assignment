-- Society Maintenance Tracker - Database Schema (PostgreSQL & SQLite compatible)

CREATE TABLE IF NOT EXISTS users (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(150) NOT NULL,
    email           VARCHAR(150) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    role            VARCHAR(20) NOT NULL DEFAULT 'resident' CHECK (role IN ('resident', 'admin')),
    admin_status    VARCHAR(20) CHECK (admin_status IN ('pending', 'approved', 'rejected')),
    flat_number     VARCHAR(20),
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS complaints (
    id              SERIAL PRIMARY KEY,
    resident_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category        VARCHAR(50) NOT NULL,
    description     TEXT NOT NULL,
    photo_url       VARCHAR(500),
    status          VARCHAR(20) NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Resolved')),
    priority        VARCHAR(10) NOT NULL DEFAULT 'Low' CHECK (priority IN ('Low', 'Medium', 'High')),
    is_overdue_flag BOOLEAN NOT NULL DEFAULT FALSE,
    resolved_at     TIMESTAMP,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_complaints_resident ON complaints(resident_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_category ON complaints(category);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON complaints(created_at);

CREATE TABLE IF NOT EXISTS complaint_history (
    id              SERIAL PRIMARY KEY,
    complaint_id    INTEGER NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    actor_id        INTEGER REFERENCES users(id) ON DELETE SET NULL,
    actor_role      VARCHAR(20) NOT NULL,
    change_type     VARCHAR(30) NOT NULL,
    old_value       VARCHAR(50),
    new_value       VARCHAR(50),
    note            TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_history_complaint ON complaint_history(complaint_id);

CREATE TABLE IF NOT EXISTS notices (
    id              SERIAL PRIMARY KEY,
    title           VARCHAR(200) NOT NULL,
    body            TEXT NOT NULL,
    is_important    BOOLEAN NOT NULL DEFAULT FALSE,
    posted_by       INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notices_important ON notices(is_important);

CREATE TABLE IF NOT EXISTS settings (
    key             VARCHAR(50) PRIMARY KEY,
    value           VARCHAR(200) NOT NULL
);

INSERT INTO settings (key, value) VALUES ('overdue_threshold_days', '5')
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS notifications (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type            VARCHAR(50) NOT NULL,
    title           VARCHAR(200) NOT NULL,
    message         TEXT NOT NULL,
    complaint_id    INTEGER REFERENCES complaints(id) ON DELETE SET NULL,
    notice_id       INTEGER REFERENCES notices(id) ON DELETE SET NULL,
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);

CREATE TABLE IF NOT EXISTS email_logs (
    id              SERIAL PRIMARY KEY,
    recipient_email VARCHAR(150) NOT NULL,
    recipient_name  VARCHAR(150),
    event_type      VARCHAR(50) NOT NULL,
    subject         VARCHAR(255) NOT NULL,
    body            TEXT,
    status          VARCHAR(20) NOT NULL,
    provider_msg_id VARCHAR(100),
    error_details   TEXT,
    complaint_id    INTEGER REFERENCES complaints(id) ON DELETE SET NULL,
    notice_id       INTEGER REFERENCES notices(id) ON DELETE SET NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created ON email_logs(created_at);
