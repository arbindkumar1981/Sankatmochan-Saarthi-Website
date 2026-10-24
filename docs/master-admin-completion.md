# Master Admin completion

This change preserves the student overview and subject test averages from merged
PRs #77/#78. The new topic dashboard reads the companion Backend admin API and
displays persisted mastery separately from average test percentage. Missing
mastery is never inferred from an assessment average. Firebase and academic
student IDs are not automatically linked. No database schema change is needed.

The audit viewer reads trusted `admin_audit_events` only for a real non-anonymous
administrator. Filters cover category, operation, hashed actor reference and UTC
date range; pages contain at most 50 rows. All client writes to new and legacy
audit collections are denied. Historical client settings events remain available
with an unverified-history label. The backend's auth-context triggers replace the
old browser-generated settings log; deploy the server capture before switching
the website or there will be a capture gap. The new viewer does not prove that
capture is active merely because its query succeeds or returns no events.

After emulator verification and release approval, prepare companion indexes and
`expiresAt` TTL, verify server capture, and switch to the new Website before
enforcing the companion deny-write rules. The old Website includes a legacy audit
write in its settings transaction: denying that write first breaks admin saves.
The cutover is incomplete until the deny-write rules are enforced and verified;
committed rules/TTL configuration is not evidence of a deployed policy.
Coordinate the companion Backend `docs/master-admin-operations.md` runbook:
runtime IAM, cloud provisioning, delivered alerts, a READY daily backup and an
isolated nonproduction restore drill are release gates, not completed by this PR.
Hold merge/deploy while any required check is missing. Configure the existing
backend URL through the established deployment configuration; never commit env
files or credentials. Keep production/student records out of tests and reports.

Verification: existing Node tests, new account-switch/no-cache admin API tests,
TypeScript, ESLint, production build, working Bun audit, tooling npm audit,
reproducible reviewed CLI artifact and real local Firestore emulator tests.
The emulator uses `demo-saarthi-admin`, not the production project. The isolated
tooling lock retains the tested security patch from the earlier dependency work.
There are no changes to PDF replacement or its UI.
