# Authenticated isolated staging acceptance checklist — Master Admin Phase 3

Prepared 18 October 2026. **NOT EXECUTED against authenticated cloud staging.** All boxes below start NOT RUN/BLOCKED. Synthetic local/CI evidence must be recorded separately from these gates.

## Entry conditions and evidence record

- [ ] Owner/operator has explicitly approved the isolated staging environment and named operators. No production URL, database, Firebase project, Storage bucket or runtime identity is reused as a supposed staging boundary.
- [ ] Record observed Hosting version, Cloud Run image/revision and exact Website/Backend commit SHAs. Compare observed SHAs with the reviewed draft heads; a manifest's intended SHA is not deployment proof.
- [ ] Confirm dedicated synthetic accounts, separate academic database, private file storage, approved Qwen endpoint and authorized domains. Do not copy live students or reuse a production Firebase identity.
- [ ] Confirm MFA/Identity Platform readiness without changing billing, IAM, providers or APIs under this task. Missing prerequisites are BLOCKED and need separate approval.
- [ ] Run exact-head CI and record all workflow links, timestamps, warnings/skips and browser version/viewports. Never mark a missing cloud check PASS because unit tests pass.
- [ ] Assign an evidence run ID and owner; use redacted screenshots/request status/audit event references. Never attach tokens, TOTP seeds/codes, secrets, student answers or credentials.

## First Super Admin and recovery

- [ ] Operator creates an approved expiring server-only bootstrap grant in the isolated environment; browser writes to grants/initialization/rosters are denied.
- [ ] Wrong UID/email, unverified email, missing/stale MFA, expired/consumed grant and arbitrary empty-system login are denied before any role is granted.
- [ ] Correct synthetic identity initializes exactly once; roster contains one Super Admin within the ten-seat policy; audit and consumed grant commit atomically.
- [ ] Two simultaneous claims produce exactly one initialization, without orphan membership or a second Super Admin.
- [ ] Recovery requires two distinct designated guardian identities with recent MFA; target self-approval, unauthorized guardian, one guardian, stale approval and stale initialization revision are denied.
- [ ] Completion atomically revokes the previous Super Admin, installs the approved replacement, preserves remaining seats/history and consumes the grant. Previous sessions fail on every protected API; stale concurrent writes fail their preconditions.
- [ ] Cancel/expire an unused recovery grant; confirm no access was changed. Retain audit/history rather than deleting evidence.

## Ten individual administrator sessions

Use ten separate synthetic Firebase identities, never shared credentials:

- [ ] Super Admin: 1 session — roster/invitations, CMS publication, Notes publication, academic review/reporting and audit allowed.
- [ ] Website CMS Admin: 2 sessions — CMS drafts/media allowed; role management, Notes publication, student reports and evaluation correction denied.
- [ ] Academic Admin: 2 sessions — own-school reports, server test/rubric authoring, appeals and reconciliation allowed; accounts/CMS publication denied.
- [ ] Content Admin: 3 sessions — scoped Notes drafts/upload/edit/replace/preview/history/restore allowed; publication and other roles' APIs denied.
- [ ] User Management Admin: 1 session — permitted invitations allowed; privileged invitations/role elevation/marks changes denied.
- [ ] Security/Audit Admin: 1 session — redacted own-school audit reads allowed; all mutation requests denied, including direct forged requests.
- [ ] Each session completes real Firebase MFA enrollment and a subsequent MFA sign-in. Verify signed server MFA claim, recent reauthentication and token cutoff; enrolling a factor alone grants no role.
- [ ] Enforce exactly ten occupied/reserved seats under concurrent invitation acceptance. Expired/cancelled reservations do not overfill a role; replays do not create another membership.
- [ ] Disable, change role, revoke and restore through a new invitation. Old tokens remain rejected after restored access; do not globally disable unrelated student identity as an access-revocation substitute.

## Tenant-scoped academic reporting

- [ ] Apply the additive academic membership proposal only to the approved empty staging academic database after review. Load generated students for school A and B with one authoritative membership per student.
- [ ] Academic/Super report searches, filters and all pagination pages return only that actor's school; percentages/missing mastery remain correct and mastery target remains 80.
- [ ] Query the other school's exact academic ID/name, forged tenant query/body and manipulated cursor: no foreign record or aggregate leaks.
- [ ] Missing/disabled mapping, missing schema, missing trusted tenant and unknown legacy report endpoint all fail closed. There is no unscoped fallback query.
- [ ] Students, Website/Content/User/Audit roles and revoked sessions cannot reach reporting SQL.

## CMS, publishing and media

- [ ] Create/edit/reorder/hide/archive/restore English/Hindi menus, pages, sections, cards and banners. Verify allowed icons/routes only; core security/legal routes cannot be changed.
- [ ] Compare unsaved and saved drafts with the current publication; verify field-level changes, additions/removals and visible-entry impact.
- [ ] Independent authorized publisher approves, then publishes after recent MFA. Concurrent draft edits produce a clear conflict without overwriting another editor.
- [ ] Observe actual public site labels/icons/order/content and cache refresh; no draft or hidden text is returned by public APIs.
- [ ] Upload validated PNG; preview privately; choose an existing library image; archive unused media and restore it. Reject SVG/HTML, invalid CRC/pixels, oversized image, foreign-school media and forged file paths.
- [ ] Draft/published references block media archiving; hidden parent revokes child public image access; rollback to a historical publication requires valid restored media. Immutable objects/history remain intact.
- [ ] Check mobile 390px, tablet 768px and desktop 1440px; keyboard focus, screen-reader labels, errors/empty states, axe results and screenshots. Synthetic fixture screenshots do not satisfy this actual deployment check.

## PDF / DOCX / Notes lifecycle and migration rehearsal

- [ ] Generate staging-only fixture Notes and a minimal PDF/DOCX; upload, preview/download, edit and replace in Board→Class→Stream→Subject→Chapter→optional Topic scope.
- [ ] Publish/unpublish, soft-delete/restore and retrieve immutable historical versions. Student gets only own-school published, non-deleted material; direct storage URLs and unauthorized versions are denied.
- [ ] Interrupt an upload and exercise existing recovery journal/checksum/version checks. No orphan file becomes public.
- [ ] Run the offline generated-synthetic migration rehearsal first. Record fingerprint equality, versions/private object preservation, forward routing revision and rollback routing revision.
- [ ] Separately rehearse the approved isolated cloud/database migration with generated data only. Verify school mapping explicitly; never infer school from an email/display name.
- [ ] Reject destination collision, changed source, stale routing revision and concurrent destination edit. Rollback retains shadow objects/versions and audit, never deletes evidence or overwrites newer Notes.

## Evaluation jobs, retry, appeals and recovery

- [ ] Publish a test with server-owned objective keys/written rubrics. Student response omits those keys/rubrics; forged browser scores/keys/reference answers are rejected.
- [ ] Submit objective/written answers; deterministic objective marks and validated AI marks are stored with an immutable test snapshot. Model input excludes unnecessary identity data.
- [ ] Same idempotency ID/answers returns stored result without another user quota debit or inference. Changed answers, foreign owner and foreign school are denied.
- [ ] Exercise deferred pending jobs and bounded authenticated worker ticks. Queue and lease survive worker restart; concurrent workers cannot dispatch twice.
- [ ] Pre-dispatch configuration failure uses bounded exponential backoff and three safe attempts without another admission charge. Expired leases recover safely.
- [ ] Interrupt after provider response receipt but before finalization; restart finalizes stored grades without another model call.
- [ ] Timeout or lost response after dispatch becomes uncertain. Confirm no automatic resend; retain stable provider key and redacted status. Do not claim provider billing exactly-once without provider evidence.
- [ ] Academic Admin reconciles uncertain/failed jobs against the stored rubric with rationale; stale/self/cross-school review is denied. Marks remain within server bounds, with immutable history/audit and no new inference charge.
- [ ] Student opens appeal; paginated own-school Academic appeals queue shows it without exposing answers/rubrics in list responses. Reviewed correction closes the appeal and preserves prior results.
- [ ] Verify persistent daily user/school/admin budgets and queue cursor advancement across more than one page, including pages containing active leases or delayed jobs.

## Eight learning assets — eight independent authenticated results

For each type in the existing eight-assets fixture/runner, record generation → validation → private save → authorized reload → correct browser rendering. Verify both positive owner access and anonymous/cross-account denial for each type:

- [ ] DETAILED_NOTES
- [ ] REVISION_NOTES
- [ ] DEFINITIONS_FORMULAE
- [ ] FLASHCARDS
- [ ] MIND_MAP
- [ ] COMPETENCY
- [ ] CASE_BASED
- [ ] TEST

Use existing `tests/staging-eight-assets.mjs` and its approved isolation manifest. Do not point it at production or treat a Detailed Notes smoke as proof of all eight assets.

## Mandatory release gates — all remain independent of feature CI

- [ ] At least one verified READY backup; correct source database/location/expiry, retention and freshness recorded.
- [ ] Effective runtime/IAM isolation, including inherited grants, proven before restore. No privilege changes are authorized by this checklist.
- [ ] Restore into an approved nonproduction destination; verify integrity and record RPO/RTO. Do not restore over or export live student data under this task.
- [ ] Trusted Eventarc root/nested audit capture, retry/duplicate behavior and redacted persisted events verified.
- [ ] Reviewed Firebase rules/indexes/TTL are present at the intended versions; direct privileged writes and forged audit records are denied.
- [ ] Real authenticated staging acceptance above passes at the exact paired commits. Performance/limits and rollback evidence are attached.
- [ ] Separate explicit merge/deployment authorization is recorded. Until every gate passes: **PRODUCTION NO-GO**.
