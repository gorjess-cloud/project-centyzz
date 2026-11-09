# Multiple services and Calendar

Implemented locally on October 28, 2026. Nothing committed or pushed.

- Signed-in Clients can select up to 20 distinct services and one start time. Availability reserves the combined duration, and server catalog prices determine the combined booking amount.
- A successful request creates one appointment and one `appointment_services` snapshot row per selected service. The legacy `appointments.service_id` retains the first service for compatibility.
- Creation, service snapshots and audit recording share one database transaction. A failure rolls back the whole booking. The new Client page reuses its request key when retrying an interrupted request.
- Client My Bookings, Admin Schedule, Staff appointments and the Admin dashboard show the combined service names and duration without multiplying appointment totals. Existing separate bookings are retained as they were.
- Staff checkout already supports multiple services. A rollback-only live database test verified two distinct services produce one transaction, two transaction items and one payment, with one report row and no duplicated revenue. Chashmere’s locally imported POS card design is retained.
- Guest selection and checkout remain single-service.
- Clients now have **Add to Google Calendar** on the booking confirmation and in My Bookings details. The event includes all service names, the booking reference and the complete appointment interval. The member endpoint checks account ownership. Legacy and guest Calendar events continue to work.

Google Calendar opens a prefilled event. The user must press **Save** in Google Calendar. Automatic account synchronization was not added, and no event was saved into anyone’s Google account during verification.

## Database setup

Additive migration `backend/migrations/014_member_multiple_services.sql` has been applied to the configured development Neon database. Apply it to any other database before deploying this code. It adds appointment service snapshots, the summary view and the booking retry reference; it does not delete or merge historical bookings.

## Verification

- Backend and frontend production builds pass.
- 204 backend tests pass, including validation, Calendar event time conversion, multi-service event names and Calendar ownership.
- Rollback-only Neon checks pass for grouped duration and totals, one appointment/two services, duplicate retries, full-duration conflicts, inactive services, closing-hour rejection and rollback after a second-service failure.
- Live HTTP checks pass for grouped availability, authenticated Client booking validation, own Calendar access, Client listings, Admin/Staff appointment summaries and dashboard queries. HTTP checks created no bookings or sales.
- Isolated browser checks pass for service checkboxes, the combined slot and price, retention after a simulated connection failure, reuse of the retry key, combined booking details and both Calendar controls. Browser data was simulated; the temporary fixture was removed.
- Targeted Client-page ESLint passes. Existing Vite bundle-size advisory remains.

Preview screenshot uses simulated data: `Client-Multiple-Services-Preview.png`.
