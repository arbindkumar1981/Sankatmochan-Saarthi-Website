# Isolated emulator dependency exceptions

Reviewed 14 October 2026. Owner: Saarthi Developer Agent. Recheck by 28 October 2026,
  and whenever the Firebase CLI, emulator configuration or dependency lock changes.
These are narrowly scoped development-tool exceptions, not a clean security audit.
Fresh npm audit still reports three HIGH and two MODERATE package findings and
exits 1. The deployment job runs that audit before Google Cloud authentication,
without continue-on-error or suppression. It therefore cannot currently deploy.
This document is not an executable bypass or release acceptance; no exception
approval input has been added.

## HIGH: braces, chokidar and firebase-tools

All three findings trace to [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
Installed chain: firebase-tools 15.33.0 → chokidar 3.6.0 → braces 3.0.3.
The advisory has no patched braces release. Registry audit recommends downgrading
Firebase CLI to 6.8.0; that is not a supported replacement for our current emulators.
An uncontrolled major CLI/chokidar change is excluded by the project upgrade rules.

Exception justification: the Firestore and Storage watchers receive the fixed
repository paths `firestore.rules` and `storage.rules`, not student input, uploaded
filenames or request-supplied glob patterns. The emulator runner fixes the project
to `demo-saarthi-release`, enables only Auth/Firestore/Storage, and binds all three to
127.0.0.1. PR CI has read-only repository permissions, no cloud login step and no
production secrets. The CLI is installed in `tests/emulator`, not the browser app.
A malicious repository change can still crash the disposable CI process; this
exception does not make running untrusted checkout code with credentials safe.

## MODERATE: uuid and gaxios

Both findings trace to [GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq).
Installed chain: Firebase CLI/Google auth tools → gaxios 6.7.1 → uuid 9.0.1.
The affected APIs are v3/v5/v6 with caller-provided buffers; uuid 11.1.1 fixes them.
Installed gaxios `build/src/gaxios.js` imports uuid only for `v4()` multipart
boundaries without a caller buffer. Thus the reported vulnerable call is not
reachable through this dependency's observed usage. A forced uuid major override
would violate its declared range and is not adopted without compatibility review.

## Conditions and removal

Do not ship this tooling tree, expose the emulators publicly, supply arbitrary
watch globs, or run these tests with production credentials. Revoke the exceptions
if those assumptions change. Keep audit failures visible; do not suppress advisory
IDs or label the dependency audit PASS. Upgrade to a compatible upstream fix when
available, rerun actual rule tests and ESLint, and remove this exception document.
The deployment workflow now installs this same locked CLI 15.33.0 tree with
compatible grpc/OpenTelemetry/FTP overrides and disabled install scripts before
cloud authentication. Its reviewed command is limited to `deploy --only hosting,firestore`.
Hosting scans the generated `dist` directory with the fixed repository ignore
patterns `**/.*` and `**/node_modules/**`; uploaded study documents live in Storage,
not this directory. No arbitrary uploaded glob is accepted. The deploy code paths
reviewed do not start emulator watchers, and gaxios retains the same v4-only use.
This extends the exception to this exact locked command and trusted build paths,
not to arbitrary CLI commands or credentialed untrusted checkouts. Revoke it if
hosting paths/globs, CLI commands or dependency usage change. Credentials remain
scoped to the existing deployer; the CLI exception does not approve any rollout.

Exposure classification: CI/developer tooling and the reviewed credentialed
Hosting/Firestore deployment command, not application runtime dependencies.
Thus these findings are not strictly test-only. Backend emulator snapshots use
the identical locked tooling; backend cloud source excludes test tooling.
Fresh advisory recheck on 14 October confirms no patched braces release and
uuid fixes at 11.1.1/12.0.1/13.0.1. No dependency version changed in this audit.

Registry review confirms latest current-major versions: firebase-tools 15.33.0,
chokidar 3.6.0, braces 3.0.3, gaxios 6.7.1 and uuid 9.0.1. Firebase CLI still
declares chokidar ^3.6.0, gaxios ^6.7.0 and Google auth ^9.11.0; gaxios declares
uuid ^9.0.1. No compatible patched release was found. A scoped gaxios→uuid 11.1.1
override requires explicit major-upgrade approval and CJS/v4/multipart/CLI/auth
compatibility tests before adoption. It would address only the two MODERATE
findings; unpatched braces would remain. Never force the suggested CLI 6.8 downgrade.

Deployment uses the auth action's ADC file instead of an access token supplied
to the CLI's legacy refresh-token flag. Real WIF/ADC deployment is UNVERIFIED and
cannot be attempted while the audit gate fails. The reviewed existing command
scope and trusted-path limitations above remain mandatory.
