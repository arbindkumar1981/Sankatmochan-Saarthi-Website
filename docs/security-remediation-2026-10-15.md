# Development security remediation — 15 October 2026

**Production NO-GO.** Scope: existing draft website #51/backend #79 only. The
approved exact website versions are grpc-js 1.13.6 and source-map-js 1.2.2;
chokidar 4.0.3 is an evaluation, not an unconditional upgrade. No release,
production data/schema, cloud resources, IAM, DNS or billing changes are authorized.

## Inspected and changed

Reviewed both manifests/locks, Firebase CLI watcher call sites, actual Firestore
Node client dependency resolution, PostCSS/source-map composition and upstream
advisory fixes. Website uses exact root overrides for the two approved packages.
Firestore declares grpc-js `~1.9.0`, so 1.13.6 requires compatibility testing;
both source-map parents allow `^1.2.1`, which includes 1.2.2.

The Bun lock changes only grpc-js and source-map-js records plus grpc's required
ordered-map 4.4.2 addition and removal of its obsolete private Node/Undici type
records. No other package version or framework is upgraded. Both emulator npm
locks retain the verified UUID override and Firebase CLI 15.33.0.

Added website dependency tests, a root SDK emulator test and a reproducible
gRPC security probe. Existing CI now also audits the website lock and exercises
the website's root SDK inside Firebase emulators. Tooling authorization rules
and deployment audit gates remain enforced.

## Chokidar 4.0.3 — rejected

Isolated comparison: chokidar 3.6.0 passes 12/12 cases; exact 4.0.3 passes 8/12,
fails 4. CommonJS/FSWatcher API, add/change/unlink/close, literal Firestore/Storage/
Realtime Database rules, literal brace filenames and regex ignores pass. Glob
watch paths receive no change event. Firebase Functions-style ignored strings
`**/generated/**`, `**/*.test.js`, `**/package-lock.json` fail to exclude changes.
The actual Firebase Functions emulator creates these ignored globs, so a direct
override would alter behavior. No incompatible chokidar override is adopted.
See [saved direct results](security-evidence/chokidar-direct-results.json).

The isolated candidate's zero-vulnerability audit is not an audit of either
repository. The retained exact path in both emulator/deployment tooling locks is
`firebase-tools@15.33.0 → chokidar@3.6.0 → braces@3.0.3`.
Three HIGH package entries share [one advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
On 15 October the registry lists braces 3.0.3 and Firebase CLI 15.34.0, which
still declares chokidar `^3.6.0`; it does not remove this vulnerable path.
No CLI upgrade is applied. The suggested CLI 6.8 downgrade is rejected.

Safer alternative investigated in scratch: explicitly translate ignored globs
through the existing anymatch 3.1.3/picomatch 2.3.2 matcher when an upstream Firebase
CLI update adopts chokidar 4. This restores the three tested ignored-pattern
cases without bringing back braces. Prototype passes 11/12; glob watch paths
remain unsupported. It is feasibility evidence, not a complete CLI patch or
approved replacement. See [prototype results](security-evidence/chokidar-prototype-results.json).
Prefer a compatible upstream release. A maintained vendor patch/fork would need
separate review/approval, explicit supported path semantics, watcher/rule reload
and Functions tests on Windows/Linux, CLI/emulator integration and clean audits.

## Website fixes and a residual audit blind spot

Source-map-js 1.2.2 passes generation/lookup/PostCSS composition and promptly
rejects excessive, negative, fractional, infinite and nested-summed indexed
offsets. Paths:

- `vite@8.3.1 → postcss@8.5.28 → source-map-js@1.2.2`
- `@tailwindcss/vite@4.3.3 → @tailwindcss/node@4.3.3 → source-map-js@1.2.2`
- Autoprefixer uses the same PostCSS through its peer dependency.

The website path is `firebase@12.19.0 → @firebase/firestore@4.17.2 →
@grpc/grpc-js@1.13.6`. This version fixes the listed HIGH certificate-authorization
finding, and the package audit reports zero findings. However, direct loopback
security tests reproduce remaining **LOW error disclosure**: synthetic request
deserializer/response serializer error text reaches the client, status INTERNAL.
The separate emulator grpc-js 1.14.6 control returns generic text in both cases.

The [upstream 1.13.7 release](https://github.com/grpc/grpc-node/releases/tag/@grpc%2Fgrpc-js@1.13.7)
and [fix PR](https://github.com/grpc/grpc-node/pull/3106) explicitly address remaining
[GHSA-f596-whhp-79r4](https://github.com/grpc/grpc-node/security/advisories/GHSA-f596-whhp-79r4)
instances, while the audit's affected range omits 1.13.6. Therefore a clean audit
is insufficient evidence of full remediation. The website uses a gRPC client;
server-side reachability through application code is not demonstrated, but the
dependency's residual flaw is not waived. The probe exits **1** on disclosure:
`node tests/security-probes/grpc-disclosure.mjs .` from the website checkout.

## Verification and remaining action

Executed after independent frozen installation: 96 website tests PASS; TypeScript,
ESLint and production build PASS; all six local Firebase authorization/integration
groups PASS, including the exact root grpc-js version, transactions and watch.
Both sets of three UUID compatibility tests PASS; locked CLI 15.33.0 PASS.
Root Bun audit PASS (359 packages, zero reported findings); both npm tooling
audits FAIL (three HIGH package findings); direct grpc-js disclosure probe FAIL
(both serializer/deserializer cases). No new registry findings were reported.
The existing 528.05/567.52 kB bundle warnings remain unsuppressed.

Local compiler initially failed because dependencies were linked to another
checkout and then incompletely installed. The junction was removed without
deleting its target; a new cache and frozen reinstall repaired the empty folders.
The first new indexed-map assertion was corrected to inspect generated mappings;
all actual security offset-rejection checks passed. An earlier emulator attempt
was blocked when automatic approval review hit an account usage limit; it was
successfully executed after resuming. These initial failures are not hidden.
Full backend conversion/image/Python checks and fresh exact-commit CI links are
recorded in the paired PR descriptions after completion, not predeclared here.

Exact next approvals: test/adopt website grpc-js **1.13.7** to close the reproduced
LOW flaw; separately approve review of an explicit upstream/vendor Firebase CLI
watcher adaptation if no compatible released fix appears. Neither approval is
a security exception or production release authorization. No security findings
are suppressed and no audit threshold is lowered. Real-cloud release verification
and production authorization remain separate blockers.
