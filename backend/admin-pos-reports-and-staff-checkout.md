# POS reports and Staff checkout — local handover

Completed on the local `feature/pos-reports-wip` working tree. No pull, fetch, commit, push, merge or pull request was performed. Earlier inventory, schedule, account, settings and appointment work remains present.

## Staff navigation and workflow

Click **POS** in the Staff sidebar to expand:

- **POS Checkout** — the existing service checkout screen, now connected to the database.
- **My Cashier Closeout** — a separate page showing only the signed-in Staff account’s sales and cash count for today.

Karl’s signed-in account supplies his identity; another Staff account cannot submit a checkout or read a cashier summary as Karl by changing the request body. The database links cashier user IDs to their matching `staff.id` through `cashier_staff_id`.

Checkout validates active services and prices on the backend. It saves a transaction, service lines, payment breakdown and Staff-linked POS reporting row atomically. Reports count the linked reporting row once, rather than adding the same checkout twice. Successful saves clear the cart. Failed saves retain it; retrying the same checkout does not duplicate the sale. Cash change is calculated from the received amount. Discounts are retained in the transaction total.

QR Ph entries are **manual records of externally received payments**. The cashier must verify the payment in the salon wallet/terminal and enter its receipt reference. The screen no longer displays a generated placeholder QR as though it could charge the customer. Recording the same external receipt twice is rejected. This update does not charge, refund or integrate a new payment gateway.

Cashier closeout requires opening cash, actual counted cash and the account’s management PIN. Saved reports retain their original sales snapshot and cash difference. **Saving a closeout ends that cashier’s checkout day; perform checkout demonstrations before closing the register.** Unsaved carts and cash counts are protected when navigating away.

## Admin Reports

- Calendar controls cover the latest 30 days, with Today, Last 7 days, Last 30 days and custom date ranges such as October 25–27.
- Transaction CSV exports include all rows for the selected dates. Closeout batch exports include saved closeouts within those dates only.
- Cashiers come from linked Staff/user records. Service and inventory item names come from their catalog tables; the amount actually charged is preserved rather than recalculated from today’s catalog price.
- Exact integer-cent calculations distinguish completed sales, refunds, voids, net cash, net digital and unallocated/mismatched payments. Unknown payment methods do not silently disappear from total sales. Unreconciled payments prevent closeout.
- The previous fixed August dates, made-up growth percentage, default cashier, default opening float and no-op closeout saves are removed.
- The dashboard’s Daily net sales card uses the same reporting service. Reports and dashboard refresh on focus, periodically, and after saved POS updates between tabs on the same site.
- Staff cashier closeouts and a consolidated Salon daily closeout have separate scopes. CSV exports label the scope; do not add overlapping Staff and Salon totals together.
- Admin may save a final Salon daily closeout with a PIN. This stops all further Staff checkouts for that salon day. Staff can close their own register independently.
- Closed reports are not silently overwritten. If source sales change later, a warning distinguishes live totals from the original saved snapshot.

The embedded `mochakoi` alias was corrected only on the 11 matching POS rows and 4 matching closeouts, as explicitly requested. Those records now link to Karl Maverick Anonuevo’s existing Staff profile and user account. Original cashier labels are retained in `original_cashier`, and charged amounts were preserved. Other unmatched historical service labels were not guessed or relabeled.

## Search and notifications

Admin header search and the existing page search fields now highlight matching page text without hiding rows. Match navigation and clear controls are included. Existing category, role, date and status filters remain available. Other roles retain their existing search behavior.

Admin notifications use real pending/unassigned appointments, enabled low-stock alerts and outstanding salon closeouts. Unread badges and mark-read state are saved separately for each Admin account. Notification links open the corresponding workspace page; alerts refresh periodically and on focus.

## Database and checks

Applied to the configured development Neon database:

1. `011_admin_reports_and_notifications.sql`
2. `012_staff_pos_ownership.sql`
3. `013_cashier_closeout_scope.sql`

The combined SQL copy in outputs is for another development database; the current database has already been updated. Karl must have an unambiguous matching Staff profile before mapping the old alias in a different database. No sales, payments, closeouts or existing accounts were deleted.

Verification passed:

- Backend build, frontend production build and lint checks for the changed report/checkout/menu components.
- All 196 backend tests.
- Rollback-only database integration tests covering Staff ownership, foreign-key consistency, catalog prices, cash/split payments, duplicate receipt protection, exact totals, reporting-row deduplication, retry behavior, audit rollback, own-account privacy, separate Staff closeouts, salon closing, saved snapshots, dashboard totals and separate notification read states.
- Live HTTP checks for authentication, latest-30-day limits, matching dashboard/report totals, Staff-only checkout, own-account summaries, PIN protection and sanitized responses. These checks did not create real sales or closeouts.
- Isolated browser checks for failed-save cart retention and retry, cashier PIN closeout, Admin batch CSV exports, custom dates, search highlighting without row removal, notification read controls, and the final POS submenu/separate page.

All test sales, payments, closeouts, users and audit events were rolled back. Temporary browser fixtures were removed. The screenshot preview uses mock data. The frontend retains its existing bundle-size advisory.

Await the user’s explicit go-ahead before any Git synchronization or push.
