# Admin dashboard, settings and account updates

These changes are local and uncommitted. No branch, remote, pull request, or teammate branch was changed.

## Dashboard

- White cards and consistent Admin page headers, without greeting emojis or the New Appointment shortcut.
- Good morning / afternoon / evening uses Philippine time and the signed-in user's first name.
- Real POS revenue, active clients and staff, bookings by service category, five selected-day appointments, saved shifts, calendar dates, and pending/unassigned/low-stock counts.
- Calendar dates select the dashboard day; Today returns to the current day. Revenue uses the same completed POS source as Admin Reports.

## Settings

- Salon name, address, contact number, business email, optional TIN and description save to `system_settings` after management PIN authorization.
- Public footer reads the saved name, description, contact details and weekly hours. Private configuration, credentials and TIN are excluded from the public response.
- Operating hours and booking intervals affect available guest and member booking slots. Hours that would exclude an existing upcoming booking cannot be saved. Initial 12 PM–9 PM hours preserve the existing booking engine's hours; the old mock footer had different hours.
- Inventory preferences control the default low-stock threshold for new items and whether alerts appear. Existing item thresholds are preserved.
- Staff & Roles shows real Admin/Staff accounts and links to Users/Schedule. Database shows connection status and record counts. Download settings backup exports salon preferences only; full database backups remain in Neon.
- Stale edits are rejected; saving identical settings again does not create a duplicate audit event.

## Account Settings

- Names, optional contact number and profile picture save to the signed-in user's database record. Photos are resized and validated; picture removal is saved too.
- Sign-in email and assigned account role remain read-only here; existing account-management workflows handle those changes.
- Password changes require the current password, 12–128 characters, upper/lowercase, a number and a symbol. The form includes live requirements and a visibility toggle.
- PIN changes require the current six-digit PIN and a different, nontrivial six-digit PIN. A visibility toggle is included.
- Credential changes invalidate older sessions and unused reset links. The current session receives a refreshed token. No real account password or PIN was changed during verification.
- Activity lists the signed-in user's latest 50 recorded actions, replacing sample IP/device rows. No password, PIN, reset token or photo contents are logged.

## Appointment retrieval

Schedule → Appointments → Archived appointments → open booking → Retrieve appointment → enter management PIN.

Retrieval retains the original staff/payment history and restores the prior status when available (legacy records default to Pending). It rejects unavailable staff/services, conflicting slots, bookings outside current salon hours or saved staff shifts, and bookings needing a new deposit checkout. Active and Archived lists show five appointments per page. Staff can read their own assigned archive; retrieval is an Admin action.

## Database and verification

Migration `010_admin_workspace_settings.sql` was applied to the configured development Neon database. A copy is provided as `Admin-Workspace-Database-Support.sql` for other development databases. It adds configuration/avatar columns without dropping existing tables or records.

Both production builds passed. The backend suite has 187 passing tests. Read-only live API checks verified real dashboard/database/profile data, public-field filtering, role/PIN protection and old-session rejection. Transactional checks verified settings/profile/photo persistence, duplicate-event protection, credential rotation and appointment retrieval; all test changes were rolled back. Isolated browser checks exercised the dashboard, PIN-protected settings saves, footer updates, database overview, account profile/activity/password indicators and appointment retrieval/pagination. Temporary browser fixtures were removed afterward.

The frontend build retains its existing bundle-size advisory. No production deployment was performed.
