# Security Specification: The Grand Kandyan Hotel Contract Management

## 1. Data Invariants
- Only verified users and authenticated administrators can perform operations.
- `admins/{adminId}` documents guarantee RBAC: an authenticated user is admin if `exists(/databases/$(database)/documents/admins/$(request.auth.uid))` or matches runtime bootstrapped admin `ramee.nana@gmail.com`.
- Only Administrators can create, update, or delete `departments` and `users`.
- Users can view profiles of staff within the organization, but only admins can mutate roles, departments, or credentials.
- Users can view contracts they created OR are assigned to (or all if admin).
- Notifications are strictly isolated to the designated `userId` (creators or assigned users).
- Activity logs are audit-only append/create records. Deletion or manipulation of historical audit logs is denied.

## 2. Dirty Dozen Security Payloads & Attack Scenarios
1. Non-admin attempting to create a new user profile with role 'admin' (Privilege escalation).
2. Non-admin attempting to delete or edit a department.
3. Unauthenticated user querying contracts or employee credentials.
4. User attempting to update immutable fields like `creatorId`, `contractNumber`, or `id`.
5. User attempting to delete an activity log (Audit tampering).
6. User attempting to query another user's notifications.
7. Injection of arbitrary oversized 100KB strings into contract ID or title fields.
8. Non-assigned user attempting to view or modify confidential contract terms.
9. Forging a user role inside the token or client payload.
10. Modifying contract status to arbitrary invalid enum values.
11. Bypassing notice periods or setting negative values for contracts.
12. Attempting to assign nonexistent departments.
