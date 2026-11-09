# Appointment cancellation and archives

Migration `backend/migrations/008_appointment_archives.sql` has been applied to the local Neon database. It reuses `appointments.archived_at`, `archived_by`, and `archive_reason`, adds active/archive lookup indexes, and automatically archives any appointment set to CANCELLED, including direct SQL or existing checkout-failure paths. Older cancelled appointments are also archived. Existing staff assignments, bookings and payment records are retained.

## Admin Schedule

The Appointments tab has Active appointments and Archived appointments lists. Both use five cards per page with Previous/Next controls; search resets the page, and deletion from the active list clamps the current page. Up to the latest 1,000 matching records are loaded, with the existing notice if additional records exist.

Booking details offer Cancel appointment for pending, confirmed, deposit-hold and payment-review bookings. The existing six-digit management PIN is required. Cancellation sets status=CANCELLED, archive timestamp, authenticated actor and archive reason in one transaction, releases the reservation hold, and records one operational event. A repeated cancellation does not duplicate the event or replace its original archive actor. Logging failure rolls the whole operation back. Completed and no-show bookings are not rewritten by cancellation.

The existing payment status, total and deposit amounts are preserved. This action does not issue a refund or contact a payment provider. The appointment's staff_id is retained. Unassigned appointments remain in the Admin archive, with no fabricated staff assignment.

## Assigned Staff

The Staff Appointments page has the same Active/Archived choice and five-row pagination. Archived records are read-only and omit promotion, confirmation and no-show actions. The archive query allows staff to read only records whose assigned staff profile belongs to their authenticated user, including historical records for an inactive/archived profile. Active-list availability rules remain unchanged. The backend rejects status updates to archived appointments, including direct calls attempting to reconfirm them.

## API

- `GET /api/admin/schedule/appointments?archived=true` reads the Admin archive.
- `PATCH /api/admin/schedule/appointments/:id/cancel` requires management JWT, Admin/Superadmin role, and the existing management action PIN guard. The actor comes from the authenticated session.
- `GET /api/appointments/staff?archived=true` reads the caller's assigned archive (Admin/Superadmin may read all). The default remains active appointments, so existing calendar calls continue to load active bookings.

Migration `009_appointment_retrieval.sql` adds `status_before_archive`. Admin booking details in Archived appointments now offer Retrieve appointment with the existing management PIN guard. `PATCH /api/admin/schedule/appointments/:id/retrieve` restores the previous status (legacy cancellations default to Pending), retains staff/payment history, clears archive metadata and records one transaction-bound event. Repeated retrieval is idempotent. It checks active service/staff, current salon hours, saved staff shifts, slot conflicts and deposit eligibility before retrieval. Staff archives remain read-only. No delete, refund or payment-changing action is added.

## Verification

- Both production builds passed; all 187 backend tests passed.
- Rolled-back Neon tests verified cancellation, metadata, assigned-staff privacy, unassigned Admin visibility, payment/deposit preservation, repeat-event protection, blocked archived status changes, terminal-status protection, audit failure rollback, and direct SQL auto-archiving. All test bookings and events were rolled back.
- Live HTTP checks verified authenticated archive reads, cancellation PIN/role protection, and safe response fields without credential/payment tokens.
- An isolated browser fixture verified five rows per page, next-page navigation, PIN-protected cancellation, movement from active to archived, matching assigned-staff archive visibility, and read-only Staff archive details. It never changed real bookings and was removed afterward.

No commits, pushes or pull requests were created.
