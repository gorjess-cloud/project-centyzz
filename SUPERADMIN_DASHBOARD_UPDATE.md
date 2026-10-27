# Superadmin Dashboard — API Integration (27 October 2026)

## Files modified
- `frontend/src/components/superadmin/Overview.jsx`: renders database-backed dashboard summary and audit logs, loading/error/empty states, refresh, server-side search/action filters, paging, and CSV export.
- `frontend/src/components/superadmin/dashboardData.js`: styles and labels from API data, not sample counts; audit action formatter.
- `frontend/src/components/superadmin/SuperAdminLayout.jsx`: passes the authenticated session token to dashboard and full audit view.
- `frontend/src/components/superadmin/superadmin.css`: styling for refresh/error/loading controls.
- `frontend/src/api/client.js`: dashboard and audit API request helpers.
- `backend/src/superadmin/superadmin.service.ts`: summary queries match available Neon SQL tables, real counts, audit joins to actor and backend filtering.
- `backend/src/superadmin/superadmin.controller.ts`: accepts `search` and `action` query parameters on GET audit logs.
- `frontend/tests/superadmin-dashboard.test.mjs`: pure Node.js tests for data mapping and audit row formatting.

## API contract
Authenticated **SUPERADMIN** access token required in `Authorization: Bearer <accessToken>`.

- `GET /api/superadmin/dashboard/summary`
  - Original keys still returned: `totalUsers`, `activeSuperadmins`, `activeAdmins`, `activeStaff`, `activeClients`, `totalRevenue`, `currency`.
  - New groups: `accounts: { active, inactive, archived }`, `codes: { verification, recovery, expired }`, `errors: { last24Hours, previous6Days, older }`.
- `GET /api/superadmin/logs?page=1&limit=6&search=&action=`
  - Returns `{ success, message, data: [{id, actorId, actorName, actorRole, action, entityType, entityId, createdAt}], pagination }`.
  - `limit` up to 100; filters are applied in SQL before pagination.
  - Known actions include `USER_ROLE_CHANGED`, `USER_ARCHIVED`, and `PRICE_CHANGED`. Other action types still appear in All actions.

## Important definitions
- **Accounts:** Archived is determined by `user.archived_at IS NOT NULL`. Active and inactive count non-archived users. The schema does not define a separate suspended/deleted status.
- **Verification & recovery:** The existing User table holds one OTP hash/expiry at a time. Valid OTPs associated with **unverified** emails are counted under email verification, valid ones for **verified** emails under recovery, and expired retained OTPs under expired. These are not a history of password reset requests (which would need a separate request-events table). No OTP secrets are returned.
- **System errors:** The `error_logs` table currently records server-side errors. Counts are disjoint 24h / 1–7 days / older buckets and are **not** security alert severities. Real security alerts need a dedicated detection/event model later.
- **Audit events:** Only actions actually written to `audit_logs` can be displayed. This project's existing audit coverage is currently limited; updating other modules to write audit events is a separate task.
- **Sales:** The existing summary's `totalRevenue` now sums completed records from `public.pos_transactions`, matching the POS reports table, instead of querying the unrelated `public.transactions` schema.

## Manual testing
1. Configure the backend `.env` locally with your existing Neon URL, JWT/OTP settings and management PIN schema. These credentials are deliberately **not** included in this ZIP.
2. Start the backend (`cd backend; npm ci; npm run start:dev`).
3. Start the frontend (`cd frontend; npm ci; npm run dev`). Vite proxies `/api` to `http://localhost:3000` by default.
4. Log in with a real **SUPERADMIN** account and complete the PIN challenge. Do **not** use a demo login.
5. Load Dashboard, inspect counts, click Refresh, open System Audit Logs, try paging, filtering, searching by actor and exporting CSV.
6. Check Network tab: expect HTTP 200 from both endpoints. HTTP 401 means missing/expired access token; 403 means Superadmin access denied. A 500 means inspect the NestJS log and verify that the current Neon DB has `audit_logs`, `error_logs`, `pos_transactions` and User columns used by this query.

## Local verification performed
- TypeScript's transpiler parsed all six edited JavaScript/JSX/TypeScript source files without syntax diagnostics.
- Data-mapping tests run with `node --test frontend/tests/superadmin-dashboard.test.mjs`.
- **Neon integration and npm build were not run** (no environment secrets and package installation could not complete in this environment). Run the manual checks above in your local repository before merging.
