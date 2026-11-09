# Staff user profiles and job roles

Apply `backend/migrations/007_staff_user_profiles_and_roles.sql` before running this version. It has already been applied to the locally configured Neon database. A copy for manual import is available as `Sync-Staff-Users-And-Job-Roles.sql` in the task outputs.

The migration backfills missing profiles for all `user.role = 'STAFF'` accounts and installs an insert/role-change trigger. The unique `staff.user_id` relationship ensures one profile per account. Existing staff UUIDs, account credentials, schedules, appointments, and assigned job roles are preserved. Staff names remain linked through `staff.user_id`; they are not copied into another table.

Karl Maverick Anonuevo (verified user 10) is Hair Stylist. The other six existing Staff accounts remain Unassigned because their individual assignments were not specified. Use the roster pencil action to choose their actual jobs.

Approved job roles:

- Hair Stylist
- Nail Technician
- Beauty Therapist
- Lash/Brow Technician
- Receptionist
- Cashier

Account role (`STAFF` versus `ADMIN`) and job role are separate. Unassigned is allowed only for existing/directly imported accounts pending assignment. Both Admin Staff-creation forms require an approved job role: Schedule → Add Staff, and Users → Add User when STAFF is selected. Admin creation does not require a job role. The server validates the role and returns its selected value as `staffJobRole`.

`GET /api/admin/users/staff-job-roles` and `GET /api/admin/schedule/staff-job-roles` return the same canonical role list, with existing management JWT/role guards. The roster editor and filters also use this list. Legacy profile labels Stylist, Therapist, Nail Tech and Staff are normalized to Hair Stylist, Beauty Therapist, Nail Technician and Unassigned.

The existing account creation API now saves the account, selected staff job role, profile, and management PIN inside one PostgreSQL transaction. Failure to provision the PIN rolls back onboarding, instead of leaving a partial profile or account. The established temporary credential generation, forced first-time setup, PIN guard and one-time credential display remain in use. `ManagementSecurityService.provision` accepts an optional transaction client; existing callers retain their original behavior.

Booking specialist queries include only the four service-provider job roles. Receptionist, Cashier and Unassigned profiles cannot be selected as booking specialists, including by submitting their UUID directly. This prevents the synchronization from making every employee a stylist. Other booking, payment and scheduling behavior is unchanged.

Verification:

- Both production builds passed; all 157 backend tests passed.
- Live Neon rollback tests verified selected-role profile creation, password/PIN hashes, onboarding rollback, unaffected Admin creation, automatic profile creation after role changes, and preservation of existing profile IDs/job roles without duplicates.
- Live API checks confirmed the matching role catalogs, authenticated access requirements, receptionist rejection as a booking specialist, and Karl as the only currently assigned booking specialist.
- Isolated browser checks confirmed required job-role fields in both creation forms, selected Nail Technician submission, one-time credential display, roster refresh/role badge, and hiding the job-role field when ADMIN is selected. No real accounts were created by browser tests.

No commits, pushes or pull requests were created.
