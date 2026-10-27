# Superadmin POS Reports — Neon-verified, isolated patch

Source baseline: `centyzz-full-review-20261027-164246.zip`.
This package **replaces** the older `centyzz-superadmin-posreports-changed-files.zip` patch. Do not apply both.

## Verified live schema (user's read-only Neon queries, Oct. 27, 2026)

* `public.pos_transactions`: 11 records. Columns include `txn_id`, `txn_time`, `cashier`, `service`, `method`, `amount`, `status`, `report_date`.
* `public.closeout_reports`: 5 records. Columns include `cashier NOT NULL`, `opening_cash`, `total_cash_sales`, `total_digital_sales`, `expected_cash`, `actual_cash`, `discrepancy`, `is_closed`, `report_date`.
* `public.transactions`, `transaction_items`, `payments`, `transaction_discounts`: 0 records.
* `report_date` is text, both `YYYY-MM-DD` and `Month D, YYYY` exist. The Superadmin service accepts both forms.
* October 27 closeout has ₱7,850 sales but no POS transactions; August 17–19 have missing or incomplete POS records; August 20 totals match POS transaction history.

**No SQL migration or database changes are included.**

## Safety and source-of-truth behavior

* Independent protected Superadmin routes at `/api/superadmin/reports/*`, with no Admin service import.
* KPI cards and transaction list summarize actual `pos_transactions` records for the selected report date.
* When a saved closeout exists, the closeout panel and invoice show **saved closeout values** (not recalculated replacements).
* A reconciliation notice highlights any saved cash/digital sales that differ from POS transaction totals, missing POS transactions, and historical zero-cash anomalies.
* Closeout actions are rejected by the frontend **and backend** when POS transactions are missing or recorded sales totals disagree with a saved closeout. No silent corrections.
* Creating a new closeout requests a real cashier-on-duty name and supplies the `cashier NOT NULL` column. It does not assume the Superadmin user was the cashier.
* A duplicate placeholder invoice modal was removed on the Superadmin page only.
* The database is shared: deleting or closing a report using the Superadmin page will also affect Admin reporting **data**, though no Admin code is changed. These actions require a user click.
* There is still no Staff POS checkout persistence in the provided source snapshot. New sales will **not** automatically appear until Staff POS saves transactions. This patch does not touch Staff or Admin code.

## Changed/new files — Superadmin only

- `backend/src/superadmin/superadmin-reports.controller.ts` (new)
- `backend/src/superadmin/superadmin-reports.service.ts` (new)
- `backend/src/superadmin/superadmin.module.ts` (Superadmin registration)
- `backend/src/superadmin/pos-report-schema-check.sql` (new, read-only)
- `frontend/src/pages/superadmin/POSReportsView.jsx` (new)
- `frontend/src/components/superadmin/SuperAdminLayout.jsx` (Superadmin routing)
- `frontend/tests/superadmin-posreports.test.mjs` (new)
- This guide

## Install from PowerShell at `PS C:\VSC\centyzz>`

```powershell
$zip = "$env:USERPROFILE\Downloads\centyzz-superadmin-posreports-neon-verified-20261027.zip"
$extract = "$env:TEMP\centyzz-superadmin-posreports-verified"
if (Test-Path $extract) { Remove-Item $extract -Recurse -Force }
Expand-Archive -LiteralPath $zip -DestinationPath $extract -Force
$backup = "C:\VSC\centyzz-superadmin-reports-backup-$(Get-Date -Format yyyyMMdd-HHmmss)"
New-Item -ItemType Directory -Force -Path "$backup\backend\src\superadmin", "$backup\frontend\src\components\superadmin" | Out-Null
Copy-Item "C:\VSC\centyzz\backend\src\superadmin\superadmin.module.ts" "$backup\backend\src\superadmin\" -ErrorAction Stop
Copy-Item "C:\VSC\centyzz\frontend\src\components\superadmin\SuperAdminLayout.jsx" "$backup\frontend\src\components\superadmin\" -ErrorAction Stop
robocopy $extract "C:\VSC\centyzz" /E /R:1 /W:1
node --test frontend/tests/superadmin-posreports.test.mjs
git status --short
```

`robocopy` may print `*EXTRA Dir` and `*EXTRA File`; without `/MIR` or `/PURGE`, unrelated files are NOT deleted.

After install, run the backend from `C:\VSC\centyzz\backend` using `npm run start:dev`, and the frontend from `C:\VSC\centyzz\frontend` with `npm run dev`. Test data retrieval on August 20 (matched) and October 27 (unmatched), and **do not click Delete or Submit Closeout with valuable records during initial testing.**

## Verification limits

Source parsing and source-only tests passed. A full NestJS build and live Neon integration have not been performed in this environment, as dependencies and database credentials are unavailable. Test compilation and a read-only report fetch on your machine before making closeout changes.
