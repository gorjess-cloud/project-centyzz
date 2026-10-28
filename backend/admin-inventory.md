# Admin inventory

The Admin Inventory screen now reads PostgreSQL data instead of the former sample array. No sample products are inserted. Apply `backend/migrations/004_admin_inventory.sql` once to each target database before starting this version. The migration has already been applied to the locally configured Neon database.

## Storage

- Existing `products` stores SKU, name, category, prices, activation/archive information, plus the new stock unit and supplier fields.
- Existing `inventory` stores the current quantity and reorder threshold. Zero is a valid threshold. Low stock means quantity is at or below the threshold.
- Existing `inventory_movements` records nonzero opening quantities and restocks, with the authenticated actor and timestamp.
- New `inventory_requests` stores retry receipts. A repeated request key returns the previous result without adding stock, movements, or logs again. It contains no PINs or access tokens.
- New `inventory_purchase_orders` stores the requester, date, original item/price snapshots, and total. Saving an order neither sends an order to a supplier nor changes stock. Use Restock Item after delivery.

Archiving disables the product while retaining stock. Restoring reinstates its previous activation flag. Removing an archived item hides it from this screen while keeping its database record, stock ledger, order snapshots, and references intact. SKUs remain reserved after archiving/removal.

## API

All routes are under `/api/admin/inventory` and require the existing JWT and role guards (`ADMIN` or `SUPERADMIN`). The Admin layout supplies its authenticated session. Staff inventory and other management pages are outside this change.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/` | List visible active and archived items |
| POST | `/` | Add product and opening balance |
| POST | `/:id/restock` | Increase stock and record its movement |
| PATCH | `/:id/archive` | Archive an active item |
| PATCH | `/:id/restore` | Restore an archived item |
| DELETE | `/:id` | Hide an archived item, retaining its history |
| GET | `/purchase-orders` | Latest 200 saved orders and snapshots |
| POST | `/purchase-orders` | Save an order using server-side costs |

Every mutation also requires `x-management-pin` and a UUID v4 `Idempotency-Key`. Retry an uncertain response with the same key and identical request. Changing the actor, action, or payload for an existing key returns a conflict. Do not log these headers. Stock, movement, retry receipt, and operational event commit in the same transaction. The existing logging service accepts an optional transaction client for this purpose; its previous callers retain their behavior.

Counts must be whole numbers from 0 to 1,000,000 (positive for restocks and order quantities). Prices must be nonnegative with at most two decimal places. New SKUs are trimmed, uppercased, and checked case-insensitively against all products. Purchase order totals are calculated in cents from database prices.

## Verification

- Backend and frontend production builds passed.
- All 113 backend tests passed, including validation, JWT/role/PIN guard attachment, transaction rollback on audit failure, and prevention of archived restocks.
- Neon verification used a rolled-back transaction: opening balance, zero threshold, duplicate SKU, stock retry, exactly one movement/event, audit failure rollback, order snapshot prices, archive/restore/hide, and retained history passed. No test products remain.
- Live HTTP checks confirmed configured Admin reads, anonymous rejection, customer rejection, and PIN requirements on mutations. No accounts or PINs were changed.
- An isolated browser fixture verified empty state, add item, failed PIN retry, saved order document, restock preview/status, and archive/restore. This temporary fixture was removed; it never sent requests to Neon.

The frontend build retains the existing bundle-size advisory.
