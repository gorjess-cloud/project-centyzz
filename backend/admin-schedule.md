# Admin Staff and Schedule Management

The Admin Schedule page loads Staff users and appointments from PostgreSQL. The previous sample arrays and fake in-memory saves have been removed.

## Database

The existing relationships are reused:

`public.user.id -> public.staff.user_id -> public.staff_schedules.staff_id`

`public.appointments.staff_id -> public.staff.id`

All `user` accounts with role `STAFF` appear in the roster unless their staff profile was removed from the roster. The Staff synchronization migration automatically creates missing profiles; names continue to come from the linked account. Account names and email addresses are read from `user`; this page never creates login accounts or changes account roles, passwords, PINs, or login activation flags.

Migration `backend/migrations/005_admin_schedule.sql` adds employment type, leave, and roster archival metadata to `staff`, plus a schedule lookup index. It has been applied to the locally configured Neon database. It does not insert sample staff or shifts, or change existing appointments. No duplicate schedule table is created.

## Admin workflow

- **Add Staff** reuses the Users account-creation form and existing PIN-protected account-creation API, with STAFF preselected as the only account role and a required staff job-role selection. It shows the existing one-time credentials after success and refreshes the roster. Use the pencil action on a staff row to edit job title, employment type, and leave status.
- **Schedule → Edit** selects a Staff user and saves shifts for one dated Monday–Sunday week in Manila time. Navigate between weeks with the date picker or arrow buttons. Each working day supports one same-day shift; split/overnight shifts already in the database are displayed and preserved, with editing blocked for that staff/week.
- Missing shifts display as Off. Saving a week does not establish a recurring schedule for future weeks.
- Admin may edit past dates in the selected week; completed shifts remain read-only. Stale revisions are rejected; identical repeated saves do not duplicate shifts or activity events. Existing pending/confirmed appointments and live deposit holds must remain inside a changed shift.
- Leave disables the staff profile's booking availability flag while retaining its prior value for restoration. It does not deactivate the login account or cancel existing bookings.
- Archive disables the staff profile and retains its shifts and bookings. An upcoming appointment prevents archiving. Restore reinstates its previous profile availability. Remove from Roster hides an already-archived profile, retaining the user account, schedules, and appointment references.
- **Appointments** shows real, unarchived appointment records, services, client details, assigned staff, and statuses. Unassigned bookings display Unassigned. PIN-protected cancellation moves supported appointments into the Admin and assigned Staff archives, retaining booking and payment history. It does not charge or refund bookings. Existing booking/payment endpoints and slot selection behavior remain unchanged; this task does not add shift enforcement to those endpoints.

Each active/archive appointment list shows five records per page and is capped at the latest 1,000 records, with an explicit notice when more exist. Its search includes client, staff, service, and reference. The roster supports search, job title filters, and pagination.

## API

All routes use the `/api/admin/schedule` prefix, the existing JWT/role guards (Admin or Superadmin), and authenticated actor IDs. All mutations additionally require the existing management action PIN header. Only the Admin layout is wired to the connected page in this change.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/?week=YYYY-MM-DD` | User-backed roster and shifts; week must begin Monday |
| GET | `/staff-users` | Existing active Staff accounts available for profile details |
| GET | `/appointments` | Safe appointment display fields and total count |
| PUT | `/staff/:userId/details` | Job title, employment type, leave, and profile version |
| PUT | `/staff/:userId/week` | Week, revision, and all seven dated day entries |
| PATCH | `/staff/:userId/archive` | Archive a roster profile |
| PATCH | `/staff/:userId/restore` | Restore a roster profile |
| DELETE | `/staff/:userId` | Hide an archived roster profile |

Staff IDs in these URLs are integer `user.id` values. The server resolves the staff profile UUID and validates that the user has role STAFF. Schedule rows and a single operational event commit in the same transaction using the existing OperationalLogsService. Logs contain record IDs, week dates, and counts; they do not include PINs, tokens, customer contact details, or notes. Appointment responses explicitly select display fields and exclude booking/payment tokens.

## Verification

- Backend and frontend production builds passed; the existing frontend bundle-size advisory remains.
- All 135 backend tests passed, including date/time validation, role/PIN protection, stale revisions, transaction rollback, unchanged saves, and no account deletion/status changes.
- Neon rollback verification passed for user-backed roster inclusion, profile setup, dated shifts, repeat-save deduplication, stale revisions, audit failure rollback, appointment joins, booking conflict checks, leave availability, archive/restore/hide, and retained account/history. All fixture users, shifts, and bookings were rolled back.
- Live HTTP checks passed for configured Admin reads, anonymous/customer denial, required PIN on writes, and omission of credential/payment-token fields. The API returned 7 real Staff accounts and 13 appointment records during verification.
- An isolated browser fixture checked existing Staff selection, profile metrics, incorrect-PIN recovery, week navigation, shift validation/duration, selected-staff saves, and appointment details. It never contacted Neon and was removed after verification.

No commits, pushes, or pull requests were created for this change.
