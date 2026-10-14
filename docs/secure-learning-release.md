# Secure learning website release

Paired draft PRs: website #51 and backend #79. No merge or production release is authorized.

Latest follow-up: assessment API calls and every upload stage require the same
authenticated account before returning data/publication metadata. Restored
anonymous sessions do not register a student profile. Backend #79 canonicalizes
the two audited legacy Class 10 chapter scopes without changing bank records or
exposing answer keys; unrelated topics/boards/classes remain excluded. Reviewed
generation rechecks publication/revision after model completion.

The locked deployment CLI remains 15.33.0. Website/API/worker deployment jobs are
proposed to require manual dispatch and `release_approved=true`, default false.
Main pushes run checks; no rollout occurs from these jobs automatically. Actual
candidate staging and rule/Hosting cutover require explicit approval and the
remaining real-cloud checks. This flag is not an identity/authorization mechanism.

The extended isolated Neon API test passed in 39.70 seconds, including legacy
scope persistence and the admin knowledge import/review/publication/rejection
sequence with fixture rollback. Firebase IO is mocked there; real OAuth,
private Storage/PDF access and least-privilege cloud IAM remain UNVERIFIED.

The browser no longer reads the answer bank, grades submissions, writes new scores or lets students set mastery. It starts server-owned attempts, sends selected options, shows backend results and obtains automatic exact-scope mastery. Retests reference server attempt IDs; historical Firestore scores remain visible but do not certify mastery.

Admin-uploaded PDFs/notes are saved unpublished, imported into a review queue, reviewed for accuracy/curriculum/rights/privacy, and published by the backend using revision preconditions. Verified branded PDF objects cannot be overwritten or deleted/recreated through client Storage rules. Existing Phase-1 material is preserved. The Knowledge review section is in the content tab; server-reviewed materials cannot use the old client approval button.

Fresh Google login implementation tests cover Student and designated Admin registration, attempted role selection, popup cancellation, missing photo fields and profile write failures. These isolate Firebase IO and do not certify a real Google OAuth session. The new PR-only emulator workflow executes actual Firestore/Storage rules against a local `demo-` fixture ID; it creates no cloud project and uses no production credentials. It checks score/key/role/ownership permissions, draft publication bypass, authenticated upload and file immutability.

Release blockers:

- Production Hosting workflow explicitly selects the existing `sankatmochan-509100` project and default Firestore database, matching backend defaults and Storage rule admin lookups. Repository-only local fallback names a different database; local verification must use explicit isolated configuration. Storage rules cannot read named Firestore databases. No production identity or security configuration has been changed.
- Backend #79, additive Neon schema and runtime configuration must be ready before this frontend/rules release. Do not merge while automatic main-branch production deployment is enabled without release approval.
- Existing bank tests must have current exact curriculum IDs and valid answer keys. Legacy browser scores are preserved but deliberately excluded from verified summary/mastery.
- Fresh real-cloud OAuth, complete Admin upload → review → publish → Student read, cross-instance submission races and actual deployed worker execution require verification in an existing isolated environment.
- The admin results directory now reads the latest 1,000 server-verified summaries through an admin-only endpoint, alongside historical Firestore records. It does not retrieve answer payloads or additional contact details from the backend; pagination beyond this recent window remains a future reporting improvement.
- Scanned/image notes need readable academic text for knowledge review; interrupted uploads can leave private orphan objects. A retention/cleanup policy requires review.
- Isolated emulator tooling audit: 5 transitive advisories remain (3 high, 2 moderate): unpatched `braces` propagates through `chokidar`/`firebase-tools`, and older `uuid` through `gaxios`. Compatible grpc, OpenTelemetry and FTP fixes are locked. These tools run only local fixtures in CI without production credentials; do not use forced major upgrades or confuse this test-only dependency tree with the shipped browser bundle. Review/update tooling before release.

Backend runbook: https://github.com/arbindkumar1981/Sankatmochan-Saarthi-v3/blob/codex/issue-50-cloud-run-repair/docs/secure-learning-release.md

Evidence must distinguish application tests, actual emulator rules, Neon SQL constraints, OCI image startup and real-cloud journeys. A passing test at one layer does not certify all layers.
