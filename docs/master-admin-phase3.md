# Master Admin Phase 3 — implementation and evidence boundary

Prepared 18 October 2026. Continues Website #88 and Backend #91 on `codex/master-admin-v1`; preserves Phase 1 and all Phase 2/dependency work. The paired authenticated acceptance checklist is [authenticated-staging-acceptance-phase3.md](authenticated-staging-acceptance-phase3.md).

## Implemented

### First Super Admin and recovery

`admin_access.py` adds authenticated `/v1/control-center/access/bootstrap`, `/recovery/approve` and `/recovery/complete`. There is no public grant-creation endpoint and no default privileged credentials. An operator-preauthorized server grant binds school, exact Firebase UID, verified email hash, approval reference and a finite expiry within fifteen minutes. All actions require signed recent MFA identity. Empty installation alone conveys no authority.

Initialization atomically creates a permanent marker, one-seat Super Admin membership, ten-seat roster, consumed grant and redacted audit. Create/updateTime preconditions make replay/concurrent initialization fail closed. Recovery additionally binds the current initialization revision and previous Super Admin, requires two distinct designated recent guardian approvals (target cannot self-approve), atomically revokes the old membership/session cutoff, installs the replacement and consumes the grant. History and the disabled prior identity remain. Cross-school existing membership is rejected.

`synthetic_grant()` generates offline rehearsal fixtures only and rejects non-synthetic identities/schools/emails. No real grant or account was created. Production operator grant issuance still needs separate approval and isolated staging evidence; the code deliberately offers no self-service trust bootstrap or unaudited identity backdoor.

### Tenant academic reporting

The existing `/v1/admin/topic-mastery` implementation is reused. Its SQL now restricts test-score aggregation, progress/mastery scans and final rows through the authoritative `AcademicTenantMembership` relation and a server-derived tenant bind. V1 uses verified current role/tenant; legacy mode requires an explicitly configured trusted school. There is no unscoped fallback. Unknown legacy report routes remain denied; missing schema/mapping fails closed.

`migrations/phase3_academic_tenant_membership.sql` is an **UNAPPLIED additive proposal**, not startup DDL. Student primary key membership prevents simultaneous cross-school assignment; memberships default disabled. No production/student record, schema or mapping was read/modified. The existing disposable PostgreSQL CI integration uses temporary generated tables and checks both schools, foreign-ID search, disabled memberships, pagination, scoring and missing mastery. The proposal must be reviewed/applied only in approved staging before reporting can be enabled there.

The existing mastery dashboard is reused for capability-authorized V1 sessions; no duplicate reporting UI/API was introduced.

### Durable evaluation jobs and appeals

Phase 2 admission now atomically creates a durable job alongside the owner-bound pending attempt and its original usage debit. `evaluation_jobs.py` owns queued/leased/completed/uncertain/failed states, bounded exponential backoff, three pre-dispatch retries, provider timeout, lease ownership fencing and stable provider idempotency keys. State transitions/finalization are audited. No admission quota is debited during retry/reconciliation.

A durable validated receipt precedes result finalization. Restart after receipt reuses stored grades without inference. Restart after uncertain dispatch/timeout/lost receipt never repeats the provider request automatically: it becomes uncertain and requires receipt or independent Academic reconciliation. Stored receipt grades are revalidated against server-owned question IDs and mark bounds. Old workers cannot adopt a replacement lease or overwrite a newer result. **No claim of provider billing exactly-once is made**: unsupported provider idempotency cannot be created by adding a header. Instead ambiguous calls are not repeated; real provider charging evidence is a staging requirement.

Authenticated tenant-scoped `/v1/assessment/queue`, `/jobs/{id}/run`, `/jobs/{id}/resolve` and `/jobs/drain` provide appeals/retry/reconciliation. The bounded worker tick persists pagination cursors so active/delayed first pages cannot indefinitely starve later jobs. A tick is callable by a recently MFA-authenticated Academic/Super Admin. No scheduler/service/GPU was provisioned, started or deployed. `assessment_deferred_enabled` may queue instead of inline processing; runtime scheduling must be configured only after separate approval.

Academic queue lists redact answers/rubrics. Independent detail/review uses existing server-owned snapshots. Manual reconciliation of uncertain/failed/legacy admitted jobs is revision-guarded, bounded by the rubric, prevents self/cross-school review, stores immutable corrected results and does not call the model. Pending legacy attempts with no Phase 3 job may be adopted for human reconciliation without assuming a free/unsent inference.

### Reversible Notes/school rehearsal

`scripts/phase3_rehearsal.py` is **offline, generated-synthetic only**. It has no cloud client, credential/DSN input, production project selector or arbitrary export reader. It creates Notes, immutable versions, private-object payloads and school membership fixtures in memory; validates explicit school assignment/source fingerprints/destination collisions; performs a versioned routing cutover; rolls back routing while retaining shadow versions/objects/audit; and denies rollback over concurrent destination edits.

Executed output: forward PASS, rollback PASS, source unchanged, private objects verified, versions preserved, two audit events, zero production operations. This is an actual offline rehearsal, not a claim of real Firebase/Storage migration or nonproduction restore. An isolated cloud rehearsal remains separately gated.

### CMS media library and draft comparison

The existing CMS editor now offers a paginated tenant-scoped media library, private authenticated preview with account-change checks/blob-URL cleanup, reuse by stable ID and archive/restore. Archiving media referenced by a current draft/publication is rejected. CMS writes and rollbacks verify referenced ready-media records in the same commit, preventing archive/publish races; historical media must be restored before a publication rollback can reference it. Immutable storage files are retained.

Server `/cms/diff` and a local unsaved-draft comparison show field changes/additions/removals and visibility impact. The UI escapes all before/after text. This extends the existing CMS/Notes APIs and does not add another upload pipeline.

## Verification record

Final exact-head counts/workflow links are posted in Issues #86/#87 after checks finish. Tests cover expired/forged/MFA/replayed grants, two-guardian recovery/revocation, bounded retries, lost-response uncertainty, receipt recovery/validation, worker lease theft, queue cursor advancement, tenant queues/media, migration rollback conflicts and CMS field comparison. Existing full functional/security/eight-asset/Notes suites are preserved.

Six Chromium synthetic fixture tests cover 390/768/1440px, Audit role denial, bootstrap/media/diff controls and Academic reconciliation; axe A/AA checks run on responsive and Academic views. SDK/auth/HTTP/Notes are synthetic doubles, not authenticated staging. Initial new dropdown test locators timed out because exact label text included option content; corrected accessible combobox-role locators passed. An initial negative-test import error and an obsolete Phase 2 report-denial assertion were corrected before final regression.

Existing FastAPI startup deprecations, Vite native-config/chunk-size and esbuild legacy-fixture warnings remain unsuppressed. Disposable PostgreSQL and Firebase emulator rules are authoritative CI checks when unavailable locally. No environment/secret files or application dependency upgrades are included.

## Outstanding release gates and rollout/rollback

No merge/deploy, real account/grant creation, live student access/export/mutation/deletion, IAM/billing/API changes, GPU start or live schema/migration occurred. V1 cutover remains disabled by default. Production remains **NO-GO**.

Required before release: approved operator bootstrap/recovery issuance, real Firebase MFA/ten-role sessions, reviewed staging academic mapping/DDL, approved job tick/runtime and real timeout/charging evidence, isolated cloud Notes migration, actual CMS/private media/PDF/eight-asset acceptance, load/budget/retention validation, READY backups, effective inherited IAM isolation, nonproduction restore/RPO/RTO, trusted Eventarc audit and Firebase rules/indexes/TTL proof. All are explicit checklist gates; local/CI success cannot substitute for authenticated staging.

Rollback disables new worker/cutover behavior, preserves pending jobs/receipts/audit/immutable media and leaves additive academic mapping untouched. Reconcile ambiguous provider calls instead of repeating them. Roll back migration routing only after fingerprint/revision checks; never delete newer Notes or revert to broad legacy browser privileges for newly enrolled identities.
