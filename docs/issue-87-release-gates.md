# Issue 87: eight-asset verification and release hold

Backend issue: https://github.com/arbindkumar1981/Sankatmochan-Saarthi-v3/issues/87

Paired drafts: Backend #88 and Website #82. Neither is authorized for merge or production deployment.

## What changed

- Backend validates Flashcard and Mind Map schemas before returning/caching. Mind Map IDs and connections must be valid and acyclic. Structured prompts are server-owned.
- Website validates response asset/topic/language, content, provenance and quality flags. Existing generated-content parsers remain authoritative for rendering.
- All eight generated asset types can be saved as a versioned personal study copy inside the existing owner-private `saved_materials.body` string. The copy retains type, topic, language, content and bounded source metadata. It is not promoted into the approved KB.
- Saved copies render readable content and source labels; old plain text and PDF references remain supported. Saved-list state is scoped to the current identity, including the render before effect cleanup and late subscription callbacks.
- No schema, database, access-rule, authentication configuration, dependency or production workflow changes.

## Avoiding duplicate work

Backend #81/#82 retain source-discovery scope; #79/#80 and Website #51/#54 retain secure-assessment/tooling scope; Backend #84 and Website #79 retain master-admin scope. This pair starts at current main and does not merge those branches. Their remaining release decisions must be coordinated separately. Website emulator CI uses the existing test tooling at immutable commit `0dd3834735c56bd1c03d84e46fb0ec99bcd437c1` in a separate checkout; no tooling source or production dependencies are copied here.

## Evidence boundaries

| Layer | Evidence | Limit |
| --- | --- | --- |
| Backend | Eight independent authenticated ASGI route cases through Principal/Teacher orchestration; invalid identities/browser knowledge/output and HTTP errors covered | KB, source acquisition, model and token-verification I/O are synthetic |
| Website | Eight response/save-copy/reload contracts and eight actual React saved-view render cases, including text escaping | Does not automate browser sign-in or Generate clicks |
| Persistence | Eight actual Firestore emulator save/read cases with cross-user, anonymous and signed-out get/list/write denial | Emulated identities/rules, not live Firebase IAM/token validation |
| Staging runner | `tests/staging-eight-assets.mjs` exercises live API generation, private Firestore persistence, retrieval and renderer conversion, with independent result rows | NOT RUN: approved isolated staging and synthetic users unavailable; browser sign-in/clicks and observed deployed revisions still need separate verification |
| Production | Latest deployment logs contain only Detailed Notes smoke success | Not eight-asset end-to-end acceptance |

Initial exact-head CI results (16 October 2026):
- Backend `b3814959331728302779b3d4fb746a334dd1db59`: Python 349 passed / 2 skipped, Master Builder CI and Office PDF conversion succeeded. Runs: [Python](https://github.com/arbindkumar1981/Sankatmochan-Saarthi-v3/actions/runs/38869021877), [Master Builder](https://github.com/arbindkumar1981/Sankatmochan-Saarthi-v3/actions/runs/38869022031), [Office](https://github.com/arbindkumar1981/Sankatmochan-Saarthi-v3/actions/runs/38869021870).
- Website initial implementation `ccda0cfaa0c462f51c90b7397de31dff60a449c3`: [Website CI](https://github.com/arbindkumar1981/Sankatmochan-Saarthi-Website/actions/runs/38869119384), [eight Firestore cases](https://github.com/arbindkumar1981/Sankatmochan-Saarthi-Website/actions/runs/38869119683). Later render/account-scope checks must be green at the final PR head; the issue comment records that final revision.
- Existing FastAPI lifecycle deprecations, Vite config/chunk-size warnings and upstream test-tool warnings remain. No thresholds suppressed.

## Current production evidence, not a release certificate

- Cloud Run workflow [38751903981](https://github.com/arbindkumar1981/Sankatmochan-Saarthi-v3/actions/runs/38751903981), created 2026-10-15 14:29:47 UTC, ran at `8acfa2a0701bfdaa1053968e8ce574a9db891362`. Job `deploy` logged revision `sankatmochan-saarthi-v3-git-00193-k6v` serving traffic at 14:35:23 UTC. Step `Run Teacher Agent E2E smoke test inside production revision` logged execution `saarthi-teacher-e2e-sk6kk` and only `SAARTHI_E2E_OK:DETAILED_NOTES` at 14:45 UTC. No current cloud revision query was available in this session.
- Website [Firebase deploy 38777725130](https://github.com/arbindkumar1981/Sankatmochan-Saarthi-Website/actions/runs/38777725130), created 2026-10-15 17:29:11 UTC, succeeded at `be97ddf21a45b7775b5cbbfc58c02c8a950c5534` (job `deploy`, step `Deploy hosting and Firestore rules`). This is deployment-log evidence, not a fresh Hosting release inventory.
- Read-only HTTP checks on 2026-10-16: production website 200 at 07:45:36 UTC; backend `/health` 200 and `/v1/website/learning/history` 404 at 07:45:52 UTC. History integration remains in Backend #79; not duplicated here.
- The Teacher route uses server Firebase-token verification and discards browser knowledge. The existing website uses `VITE_SAARTHI_API_URL`. Hosting rewrites only its SPA; it does not proxy the API.
- Checked-in saved-material rules restrict read/create/update to the non-anonymous owner, reject unrecognized top-level fields and bound body size. No composite index is needed for the current unfiltered owner collection read. Main has no checked-in index or TTL configuration; live indexes/TTL and authorized domains have NOT been verified. Prior unauthorized-domain reports are historical, not re-proven here.

## Staging prerequisites and execution

Execution follow-up on 16 October: Backend #88 now includes the un-applied
`infra/staging` Terraform proposal, provider lockfile and seven mock-only safety
tests. Website includes `firebase.staging.json` with an intentionally invalid
site placeholder. Review and approval are required before applying either.
The proposal uses a private API; securely supply its short-lived invoker ID token
as `SAARTHI_STAGING_RUN_TOKEN`, separately from both Firebase user tokens. The
runner sends it only to the API in `X-Serverless-Authorization`. See Google's
[dual-header authentication documentation](https://docs.cloud.google.com/run/docs/authenticating/service-to-service).
The private browser access gateway remains an explicit approval/integration gate.
No IAM token belongs in the website bundle.

Fresh local checks: 94 website tests PASS; TypeScript, scoped ESLint, staging
runner syntax, JSON and production build PASS. Backend 349 PASS / 2 SKIP and
Ruff PASS. Initial backend run had 348 PASS / 2 SKIP / 1 setup ERROR:
`PermissionError: [WinError 5] Access is denied` on the shared Windows pytest
temporary directory. Full rerun using a fresh workspace temporary directory
passed. Existing FastAPI lifecycle and Vite config/chunk warnings remain.
The added subprocess runner regression uses an entirely synthetic transport:
all eight flows pass with separate IAM/Firebase identity, no infrastructure
credential reaches Firestore/Hosting, and reports contain none of the test
tokens. This is runner validation, not live staging evidence.

Cloud inventory blocker was rechecked: Firebase CLI configuration has no current
user/token session; neither authenticated cloud CLI nor a cloud-console browser
tab is available. The existing read-only audit stopped before any cloud API
query because its expected token session was absent. This is missing local
authentication, not an observed IAM permission denial. GitHub deployment logs
remain historical evidence only. No student records were queried.

The supplied `https://sankatmochansaarthi.in/` is production. Do not use it as staging, point a candidate at a production database, copy student records, or create synthetic records in production.

Need an explicitly approved isolated website/API pair, isolated Firebase project and academic DB, and two dedicated synthetic users with UIDs starting `issue87-`. Runtime/model access must be configured for staging. Do not grant new production roles to unblock a test. The operator needs staging user sign-in, API invocation and owner-scoped document access; privileged database credentials are not required by the runner.

Provide a local, uncommitted manifest with fields `environment: "staging"`, `isolationApproved: true`, `apiUrl`, `websiteUrl`, `firebaseProjectId` (containing `staging`), `ownerUid`, `otherUid`, `backendCommit`, and `websiteCommit` (full 40-character intended commits). Approval must represent verified isolation; editing a flag does not establish isolation. Securely supply the two ID tokens through `SAARTHI_STAGING_OWNER_TOKEN` and `SAARTHI_STAGING_OTHER_TOKEN`, never through an issue, command argument or committed file.

Run `node tests/staging-eight-assets.mjs <approved-manifest-path>` from this checkout. It refuses known production targets; performs only synthetic writes in the approved project; emits an independent PASS/FAIL for each asset and a redacted evidence JSON. It leaves synthetic artifacts for review and does not delete data. It never prints tokens, model content, user identity or server error bodies. Configured SHAs are labeled intended, not independently observed.

Separately record actual Cloud Run/Hosting release SHAs, real Google sign-in, authorized domains and mobile browser Generate→Save→Dashboard rendering for all eight assets. Inspect live rules/indexes/TTL through an authenticated read-only cloud session. Required reads include Cloud Run `run.services.get`/`run.revisions.get`, Hosting release inventory, Firebase Auth `firebaseauth.configs.get`, ruleset/release reads, and Firestore `datastore.indexes.list`/field-config reads. This session had no authenticated GCP CLI or cloud-console tab; missing resource access is not evidence that IAM denied these permissions.

## Release and rollback

Keep production NOT READY until all eight isolated live tests, browser acceptance, required dependency PR decisions, observed revision checks and release gates pass. Production deployment and merges require separate explicit authorization. The existing production smoke workflow remains unchanged and is insufficient to waive these gates.

After authorization, record the currently serving backend revision and Hosting version before cutover; deploy the approved pair; verify observed SHAs and eight independent production acceptance results using separately authorized synthetic accounts. Do not reuse staging credentials in production.

Rollback to those recorded revisions without deleting saved records or altering rules/schema. Old Website code displays versioned study copies as text; the new viewer remains backward-compatible with legacy saved bodies. No destructive migration is required. Preserve Phase-1 commit `259b763`, verified recoverable locally.
