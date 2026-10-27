# Centyzz – Superadmin User Management separation (October 27, 2026)

## What changed

- The **Admin User Management page** is a thin wrapper around `components/users/UserManagementWorkspace.jsx` that uses `/api/admin/users` and only displays ADMIN/STAFF accounts.
- The **Superadmin User Management page** is a *separate* wrapper under `pages/superadmin/` that uses `/api/superadmin/users` and displays SUPERADMIN/ADMIN/STAFF accounts.
- The shared workspace retains the existing UI: the search bar, filter, tabs, rows, menus, edit form, management PIN modal, creation modal, one-time credential modal, and pagination.
- A separate `SuperadminUsersService` provides Superadmin CRUD operations with JWT + live Superadmin DB role + management PIN on all writes. It does not delegate to the Admin controller or Admin service.
- The shared `managementUserRecord` formatter returns only table-safe fields, excluding password hashes, temporary credentials and verification tokens.
- Superadmin rows now show a distinct SUPERADMIN badge instead of the old fallback STAFF badge. Superadmin accounts are read-only from the table; users update their own profile in Account Settings.
- Admin's GET `/api/admin/users` now excludes SUPERADMIN and CUSTOMER at the server layer, not only in frontend filters.
- Management action PIN guard lives in a neutral `auth` module; the original path re-exports it for compatibility.
- The existing Superadmin AuditInterceptor records Superadmin create/edit/role/status/archive-or-restore operations.

## User Management API endpoints

| HTTP | Superadmin route | Protection |
| --- | --- | --- |
| GET | `/api/superadmin/users?archived=false` | JWT + Superadmin DB-role guard |
| GET | `/api/superadmin/users?archived=true` | JWT + Superadmin DB-role guard |
| POST | `/api/superadmin/users` | Above + `X-Management-Pin` |
| PATCH | `/api/superadmin/users/:id` | Above + `X-Management-Pin` |
| PATCH | `/api/superadmin/users/:id/role` | Above + `X-Management-Pin` |
| PATCH | `/api/superadmin/users/:id/status` | Above + `X-Management-Pin` |
| PATCH | `/api/superadmin/users/:id/archive` | Above + `X-Management-Pin` |

All Superadmin user routes are separate from the Admin route namespace. Existing `/api/superadmin/users` response shape changes from an envelope (`{success, data}`) to a table-ready array, consistent with `/api/admin/users`.

## Intentional restrictions

- The User Management screen creates ADMIN or STAFF accounts only. It does **not** provision or demote SUPERADMIN accounts.
- SUPERADMIN accounts cannot be edited, deactivated, archived or role-changed from the table. The backend enforces this even if someone bypasses the UI.
- Superadmins cannot deactivate/archive their own accounts.
- Archiving from the Superadmin page deactivates the account; restoring it reactivates the account. If a previously inactive account is archived, restoring it also reactivates it, because the existing schema doesn't separately store the pre-archive activation state.
- The existing **Reset Password Email** menu item is still informational—it does not send email. That feature was not implemented as part of this UI separation.
- Do not change any SUPERADMIN role directly in Neon simply to fix the old badge. If a user still shows STAFF, check the actual stored role before altering access controls.

## Installation with PowerShell at PS C:\VSC\centyzz>

```powershell
$zip = "$env:USERPROFILE\Downloads\centyzz-superadmin-usermanagement-changed-files.zip"
$extract = "$env:TEMP\centyzz-usermanagement-update"
if (Test-Path $extract) { Remove-Item $extract -Recurse -Force }
Expand-Archive -LiteralPath $zip -DestinationPath $extract -Force
robocopy $extract "C:\VSC\centyzz" /E /R:1 /W:1
# Robocopy exit codes 0–7 can indicate success. Check the FAILED column.
git status --short
```

Run `cd backend; npm run start:dev` and `cd frontend; npm run dev` in separate terminals. Check the backend console for errors, and verify a Superadmin login. For the static UI contract tests, run:

```powershell
cd C:\VSC\centyzz
node --test frontend/tests/superadmin-usermanagement.test.mjs
```

## Verification limits

Syntax and UI-source contract tests were run on the exported snapshot. No live Neon connection, full `nest build`, or Vite production build was available in the preparation environment; test the API behavior against your local environment before committing.
