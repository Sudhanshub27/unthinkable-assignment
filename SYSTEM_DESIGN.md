# System Design Write-up

## Complaint History Model

Rather than storing status as a single mutable column with no memory of the past, every change
to a complaint is captured as an **append-only row** in a separate `complaint_history` table:

```
complaint_history(id, complaint_id, actor_id, actor_role, change_type,
                   old_value, new_value, note, created_at)
```

The `complaints` table itself still holds the *current* `status` and `priority` for fast reads
(list views, filters, dashboard aggregates don't need to reconstruct state from history every
time), but any change to either field is written inside a single database transaction that does
two things atomically: (1) updates the current value on `complaints`, and (2) inserts a row into
`complaint_history` recording what changed, who changed it (`actor_id` + `actor_role`), when, and
an optional note. `change_type` distinguishes `created`, `status_change`, and `priority_change`,
so the same table cleanly supports multiple kinds of audit events without schema changes.

This gives a full, tamper-evident timeline per complaint at essentially no extra query cost —
`GET /complaints/:id` does one extra indexed query (`WHERE complaint_id = ?`) to fetch the whole
history ordered by time. Using a transaction for the write means the current-state column and the
audit trail can never drift apart, even under concurrent admin updates (the row is locked with
`FOR UPDATE` during a status change to prevent two admins racing on the same complaint).

Once a complaint's status is set to `Resolved`, `resolved_at` is stamped and the inline status dropdown
in the admin triage panel is locked into a read-only state. Reopening a resolved complaint requires an admin
to perform an explicit, two-step "Reopen Complaint" action with optional reason entry. Reopening fires a
dedicated transition that changes status back to `Open` and records a specific `reopened` history event in the audit trail.

## Overdue Detection

Overdue status is **derived, not stored**, for the primary case: a complaint is overdue if its
`status != 'Resolved'` and `now - created_at > threshold_days`. The threshold lives in a small
`settings` key-value table rather than being hardcoded, so an admin can change it
(`PUT /settings/overdue-threshold`) without a deploy. Deriving this at read-time (rather than a
cron job flipping a boolean) avoids stale data — the definition of "overdue" is a pure function
of `created_at`, `status`, and the current threshold, so it's always correct on read and there's
no background job to keep in sync or debug when it silently fails to run.

A secondary `is_overdue_flag` boolean column exists for the case an automatic day-count doesn't
cover: an admin manually flagging something as urgent/overdue regardless of age (e.g. a safety
issue that's only been open two days but needs to jump the queue). The final `is_overdue` shown
to the UI is `auto_overdue OR manual_flag`. In the admin list view, overdue complaints are sorted
to the top before the normal newest-first ordering, satisfying the requirement that they surface
prominently. The dashboard's overdue count reuses this exact same computation (rather than a
separate SQL COUNT with duplicated date math) to guarantee the number shown on the dashboard and
the flags shown in the list can never disagree.

## Photo Handling

Complaint photos are accepted as `multipart/form-data` on complaint creation and handled by
Multer with disk storage: files are validated by MIME type (jpeg/png/webp/gif only), capped at
5MB, and written to `backend/uploads/` with a randomized filename (timestamp + random suffix) to
avoid collisions and to stop users from inferring anything from the original filename. The
complaint row stores only a relative `photo_url` (e.g. `/uploads/171234-928.jpg`), and Express
serves that directory statically. This keeps the database free of large binary blobs and keeps
the API layer thin — the frontend just renders `<img src={API_ORIGIN + photo_url}>`. For a
production deployment beyond this assignment's scope, this is the one piece I'd swap for S3 or
Cloudinary, since Render's filesystem is not guaranteed persistent across redeploys; the
`photo_url` abstraction means that swap only touches `upload.js`, not any other route or the
frontend.

## Notification Flow

Two triggers fire email: a complaint's status changing, and a new *important* notice being
posted. Both are implemented as **best-effort, non-blocking side effects**: the database write
(status update, or notice insert) commits first inside its own transaction, and the email send is
fired afterward without being awaited into the response path. If the SMTP provider times out or
rejects, the error is logged but never rolled back into the underlying complaint/notice change —
a flaky mail provider should never make a legitimate status update fail. If no SMTP credentials
are configured, `sendEmail()` falls back to logging the message to the console, so the entire
app — including the "resident gets notified" flow — is demoable and testable without needing a
real mail account.
