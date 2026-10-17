# Master Admin V1 implementation evidence — 18 October 2026

Tracks Website #87 and #86. This is an incremental draft, not completed V1 or a release certificate.

## Audited dependency heads

Website #79 0dd3834735c56bd1c03d84e46fb0ec99bcd437c1; #85 5208370011a1298e860c0cb78b10dd7b1eb0a355.
Website #82 9fadd822600aa3c432a5d1f00548a0d1eacd98ec; #83 444be9588dceec8d8a5eae3038ba83dab527e7fd.
Backend #84 26e0f262bc76cbd234876831f46ea14a78a7e5d3; #90 404e982993291d1afe9edb89502f5d0598471f09.
Backend #88 469cdf82f97c21458f0a670da33bc4b5a8bff520; #89 97a7d9539fcdfecf43d2292fb7e77fb4f90bfeaa.

Integration branches start at Notes heads and merge the existing security/eight-asset heads, preserving authorship. The backend workflow branch-filter conflict was resolved by retaining both targets and adding the Notes target. No remote dependency branch was modified.

## Existing architecture reused

React/Vite AdminPanel, WebsiteSettingsManager, NavigationManager, MenuIcon and navigationAppearance contain existing labels, pages and icon allowlists. WebsiteContext still uses the existing website configuration. NotesManagement/managedNotes and backend notes_api implement private upload/preview/versioned replacement/publication/restore; none was duplicated. Admin topic mastery remains in admin_api; trusted provider audit and backup operations remain in existing Firebase functions. Eight-asset save/render and issuer/storage security changes were integrated from their existing PRs.

## Implemented boundary

New `/v1/control-center/session`, GET/POST `/cms`, and public GET `/published/{tenant}`. Session capabilities are server-derived; CMS namespace derives only from persisted membership. New members are deliberately separate from legacy `admins` and never automatically inherit its broad permissions. Server checks project-bound identity, active membership, MFA claim, revoked-before timestamp and role capability on every request. Recent MFA sign-in is required for publication/rollback.

Six initial roles total ten seats: Super 1, Website 2, Academic 2, Content 3, User 1, Audit 1. These are initial policy metadata; this patch does NOT enforce seat admission or provision accounts. Only Super has publish/approve; Website has read/edit. Academic has curriculum/edit and assessment/review capability identifiers; Content notes/edit; User users/manage; Audit audit/read. Those latter identifiers are NOT yet wired into legacy routes. Never certify legacy least privilege from this new boundary.

CMS entries allow only static route IDs and icons, bounded plain text, en/hi, visibility/order, parent IDs and approved component types. Extra executable fields, arbitrary URLs, cycles, missing parents and duplicate IDs are rejected. Core admin/auth/legal routes are outside this registry. Draft writes, immutable version snapshots and redacted audit events commit atomically with Firestore updateTime preconditions. A different authorized publisher approves an editor's draft. Rollback accepts only historical published revisions within the authenticated tenant. Client direct writes to new collections have no allow rule.

Responsive CMS editor is embedded in existing Website & Pages tab. Search covers the bounded entire draft, with labels, preview, loading/errors, explicit publish/rollback confirmations and version-conflict reporting. No unsafe HTML rendering.

## Verification

Frontend: 103 existing functional tests passed; TypeScript and production build passed; scoped ESLint passed. Vite native-config and >500kB bundle warnings remain unsuppressed.
Backend: 12 new synthetic tests passed, including each initial role's CMS capability, unsafe routes/executable fields/cycles, atomic publication/history, stale edits, MFA, revocation and tenant-derived path. Ruff passed for changed Python files. Full integration suite result recorded in PR/issue comments after completion.
Windows sandbox runs stalled while initializing asyncio's socketpair before the async test body. Re-running with permitted local socket support passed. This was not a cloud test or a failing application assertion.

## Remaining implementation and release blockers

- Full menu/action inventory and all legacy routes/rules must receive a reviewed capability matrix. Existing Firestore `admins` grants are broad. New role members cannot safely be added to that collection.
- Secure invitations, ten-seat transactional admission, real identity provisioning adapter, MFA enrolment/challenge UX, reauthentication UX, disable/revoke UI, two-person elevation and break-glass recovery remain unfinished. No real accounts were created.
- Published CMS serving API is implemented but public WebsiteContext/navigation/section rendering is not connected. Existing settings remain separate. Full CMS kinds, media, allowed external links, locale editing, tree editing, diff impact preview, history browser, archive/recovery and accessibility browser tests remain unfinished.
- Existing Notes workflows are reused but delegated role/tenant permissions have not been converted to V1 policy. Notes owner/student and role security regressions remain necessary at integrated heads.
- Server-owned assessment lifecycle from existing work is preserved; written rubric storage/idempotency/quotas and Academic appeals/override remain unfinished. Legacy browser-written test_results must be retired in a coordinated compatible cutover.
- New endpoints still require durable request budgets, audit viewer, limits/performance tests and authenticated staging acceptance. Audit is create-only via API; cloud-owner tamper resistance is not claimed.
- New CMS collections are additive. No migration, database write or cloud rule/IAM change was executed. Rollback removes new UI/router code and retains additive history; no data deletion is needed. No production enablement is authorized.
- Backend #85 READY backups, effective IAM isolation, isolated restore drill, deployed rules/indexes/TTL and authenticated staging acceptance remain UNVERIFIED/BLOCKED. Production NO-GO.
