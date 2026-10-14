# Approved UUID compatibility upgrade — 14 October 2026

Production remains **NO-GO**. This report supersedes earlier statements that UUID
approval was pending or that the tooling audit still had two MODERATE findings.
It does not approve an advisory exception, merge, deployment or cloud change.

## Scope and dependency review

Paired development PRs: website #51 and backend #79. The Product Owner explicitly
approved UUID 9 → 11.1.1 compatibility testing/adoption on these existing branches.
Both isolated npm manifests now use only `"gaxios@6.7.1": {"uuid": "11.1.1"}`.
The paired locks are identical; only the UUID package record changes. Firebase
CLI remains 15.33.0; gaxios remains 6.7.1; analytics UUID remains 14.0.3. Website
`bun.lock`, Python dependencies, application logic and database schema are unchanged.

Installed gaxios uses `require('uuid').v4()` without options or a caller buffer
to generate multipart boundaries. UUID 11.1.1 retains a CommonJS export and that
API. Its v1/v6/v7 option/state changes do not affect this call. No application
source imports UUID directly. The override deliberately exceeds gaxios's declared
`^9.0.1` range; it is exact and parent-scoped, not a global UUID override.

## Executed local checks

- Both clean `npm ci --ignore-scripts --no-fund` installs: PASS.
- Three Node compatibility tests in each repository: PASS. Tests resolve UUID
  through gaxios, validate v4 IDs, exercise the actual gaxios multipart stream
  with two distinct boundaries and exact payload framing, and verify v3/v5/v6
  reject undersized/offset-overflow buffers. No network or credentials are used.
- These tests are mandatory steps in both existing emulator CI workflows.
- Website 93 functional tests: PASS. TypeScript and ESLint: PASS.
- Website production build: PASS; existing 528.05 kB and 567.52 kB chunk warnings
  remain, and warning limits were not changed.
- Locked Firebase CLI 15.33.0 executable check: PASS outside the local filesystem
  sandbox. The sandboxed invocation initially failed; no application fix was needed.
- The initial Windows literal wildcard test invocation matched no files; rerun
  with explicitly enumerated files passed all 93 tests.
- Both fresh npm tooling audits: **FAIL**, exit 1, **3 HIGH / 0 MODERATE**.
  The UUID/gaxios MODERATE findings are removed; braces remains a release blocker.
- Fresh website `bun audit`: **FAIL**, 2 HIGH and 1 LOW in the unchanged root lock.
  These are additional blockers, not caused by the isolated npm override.

Full Linux emulator, backend Python/lint, Office conversion and buildpack checks
run on the pushed commits. Final exact-commit run links and outcomes belong in
the paired PR descriptions; this local report does not predeclare CI success.

## Three HIGH tooling findings: one underlying braces advisory

`firebase-tools@15.33.0 → chokidar@3.6.0 → braces@3.0.3` produces HIGH entries for
all three packages, from [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
Deeply nested brace patterns can exhaust recursive walkers and crash Node.
Registry/advisory recheck: braces latest is 3.0.3, patched version **none**;
Firebase CLI latest is 15.33.0. The audit's suggested Firebase CLI 6.8.0 downgrade
is unsuitable and has not been applied. No audit suppression or threshold change.

Firebase CLI invokes chokidar in Firestore, Storage, Realtime Database and
Functions emulator code. The tested configuration uses fixed local rule paths.
Functions additionally maps configured ignore strings into `**/<pattern>` globs.
Thus a blanket chokidar 4 override is not proven safe: v4 removes glob support.
This tree is developer/CI tooling and credentialed deployment tooling; low observed
exposure in synthetic tests is not a clean security result or a release exception.

Preferred remediation: a compatible upstream braces patch or Firebase CLI update
that removes the affected dependency, followed by both full emulator suites and
an unsuppressed audit. None is available at this review.

Concrete next experiment requiring approval: evaluate a narrowly scoped
`firebase-tools@15.33.0 → chokidar@4.0.3` override on the development branches only.
Registry metadata confirms v4.0.3 depends only on readdirp and supports CommonJS;
this removes the direct braces path, but cannot yet be called safe. Require
watch/add/change/unlink/close, Firestore/Storage rule reload, literal brace paths,
Functions ignore semantics, CLI startup, both integration suites and zero HIGH
audit findings. Reject adoption if glob behavior changes; any adapter/fork needs
separate review. Do not replace globbing with another vulnerable dependency.
See [chokidar 4 documentation](https://github.com/paulmillr/chokidar/tree/4.0.3).

## Additional root-lock blockers and next approval

The unchanged website lock contains `@grpc/grpc-js@1.9.16` (HIGH
[certificate authorization](https://github.com/advisories/GHSA-m9gg-hp2v-232j), LOW
[error disclosure](https://github.com/advisories/GHSA-f596-whhp-79r4)) and
`source-map-js@1.2.1` (HIGH
[source-map DoS](https://github.com/advisories/GHSA-68fv-2mgg-jv7q)).
Propose a separate narrow root-lock remediation to grpc-js 1.13.6 and source-map-js
1.2.2, subject to parent-range/API review, clean install, full website tests/build
and audit. Do not assume Node gRPC code is shipped in the browser or dismiss the
finding without bundle/reachability verification.

Exact next approval: development-only evaluation of the scoped chokidar 3→4.0.3
replacement, plus the two named website lock fixes and associated regression
checks. This is not approval to suppress audits, accept exceptions, merge, deploy,
or modify production data, IAM, DNS or billing. Unverified real-cloud login,
runtime permissions, database connectivity and full learning/document lifecycle
still require the existing separate isolated-environment/release approvals.
