# Approved gRPC 1.13.7 and isolated watcher evaluation — 15 October 2026

**Production remains NO-GO.** This report supersedes the earlier residual gRPC
1.13.6 finding only. It does not clear the working Firebase CLI audit or approve
prototype adoption, merge, deployment or any production/cloud change.

## Working website: gRPC PASS

The exact approved override changes 1.13.6 to **1.13.7**. Only its Bun package
record and override value change; no other package versions change. Actual path:
`firebase@12.19.0 → @firebase/firestore@4.17.2 → @grpc/grpc-js@1.13.7`.
Source-map-js remains 1.2.2 and both working emulator locks remain unchanged.

Direct loopback probe, not just audit metadata: serializer and deserializer
exceptions both return INTERNAL/status13, **connected=true, disclosed=false**,
probe exit0. The previous 1.13.6 experiment returned disclosed=true in both
cases and exit1. The [upstream patch release](https://github.com/grpc/grpc-node/releases/tag/@grpc%2Fgrpc-js@1.13.7)
addresses these remaining disclosure cases. The direct probe is now a required
step in Website CI, so the audit's earlier range blind spot cannot hide this
regression. No production credential or actual private diagnostic is used.

Local working-CLI Firebase tests: **6 groups PASS**, including the actual website
1.13.7 SDK, authenticated writes/reads, transactions, live updates, sign-out,
cross-student access, administrator escalation and publication protections.
Website **96 tests PASS**, TypeScript/ESLint/build PASS; Bun audit **PASS**, zero
reported vulnerabilities across359 packages. Existing large-bundle warnings
remain, with no threshold adjustment. Fresh exact-commit CI outcomes and SHAs
are recorded in draft PR #51/#79 after their runs finish.

## Isolated watcher prototype: limited compatibility PASS, adoption UNVERIFIED

The prior direct chokidar4 override failed four cases and is not adopted. The
ignore-callback-only prototype still failed glob watching and is not adopted.
This experiment explicitly changes four reviewed Firebase CLI import sites:
Firestore, Storage, Realtime Database and Functions emulator watchers. Its
published package identity remains clearly separate:
`firebase-tools@15.33.0-prototype.0 → chokidar@4.0.3 → readdirp@4.1.2`, plus
`anymatch@3.1.3 → picomatch@2.3.2` for ignored patterns and bounded glob matching.
There is **no braces package and no chokidar3 package** in the isolated lock.

The official15.33.0 artifact is checked against the working lock's SHA512 before
extraction. The explicit adaptation is packed as an unpublished local tarball,
installed and cleanly reinstalled from its own lock. Package/lock/adapter hashes
are recorded. There is no global loader hook and no forced chokidar override.
The vendor's root-only development overrides are omitted from the consumed
fixture package to avoid a local-pack conflict; the consuming fixture preserves
the reviewed baseline overrides and requires a complete unsuppressed audit.

Executed locally on Windows:

- **12/12 focused cases PASS:** API, lifecycle, add/close, literal rule paths and
  brace filenames, glob watching, three Firebase ignored glob patterns and regex
  ignores.
- **6/6 extended cases PASS:** brace alternatives/array paths, negative watch
  patterns, newly created nested matching files, explicit cwd and shared-base
  unwatch, ignore negation, bounded rejection of deeply nested hostile patterns.
- Actual adapted CLI with the complete synthetic Firebase suite: **6 groups PASS**.
- Actual Firestore and Storage file watchers: **PASS**, deny rules take effect,
  then restoration allows access again. Only copied fixture rule files change.
- CLI startup and `deploy --help`: **PASS**. No deploy or dry-run is executed.
- `npm audit`: **PASS**, zero reported findings across808 packages. `npm ls` and
  immutable-tarball clean install: **PASS**. Neither working CLI lock changes.

The adapter and reproducible test builder are in `tests/watcher-prototype/`.
A separate development-branch-only, credentials-free Linux CI job builds and
audits the artifact, runs all18 watcher cases and both real emulator checks, and
uploads provenance/results. It does not supply the CLI to any deployment job.
Local result/provenance snapshots are in `docs/security-evidence/`; Linux CI
evidence and final run links are attached to the PR after successful completion.

This is not a fully interchangeable chokidar implementation. Raw-event API
equivalence, `getWatched()` filtering, arbitrary overlapping-root unwatch,
symlink/resource/performance equivalence and an actual Functions runtime reload
are not certified. Glob adaptation watches a literal base and filters events;
it may traverse more files than chokidar3's glob pruning. The explicit 4096-character/
64-brace-depth input limits also narrow accepted inputs. The tested existing CLI
call sites use only the covered watcher behavior, but these limits must be
reviewed before any maintained vendor adoption. Actual credentialed release
compatibility is **UNVERIFIED** under the current no-cloud-change restrictions.
Do not replace the working CLI or label full compatibility PASS from this suite.

## Alternative comparison and recommendation

- **Preferred maintainable solution:** a compatible official Firebase CLI fix.
  Current latest15.34.0 still declares chokidar^3.6.0; braces latest3.0.3 has no
  patched release. It does not close the path, so no unrelated CLI upgrade occurs.
- **Direct major override:** rejected by actual compatibility failures.
- **Ignore-only adaptation:** smaller but incomplete; glob watcher test fails.
- **Explicit scoped adaptation:** proves a braces-free CLI can preserve tested
  behavior, with inspectable source/artifact provenance and clean audit. Retain
  it as a prototype while the uncovered semantics and maintenance ownership are
  unresolved. Prefer an upstream change scoped to the CLI call sites over growing
  this experiment into a general-purpose watcher compatibility layer.
- **Old CLI downgrade/security exception:** neither recommended nor applied.

Recommendation: adopt the independently verified gRPC patch on development only;
keep the working CLI unchanged, seek a compatible upstream watcher fix, and use
the isolated artifact as a concrete proposal/test harness. Vendor adoption would
require the remaining compatibility evidence and a separate explicit approval.
No adoption or production approval is requested from incomplete evidence.

## Remaining actual findings: FAIL

Each working tooling lock still has **3 HIGH / 0 MODERATE** package findings from
one [braces advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm):
`firebase-tools@15.33.0 → chokidar@3.6.0 → braces@3.0.3`. Both audits remain
nonzero and the deployment gate still audits before cloud authentication. The
prototype's clean audit does not clear this working path. No new registry
vulnerability appears in the approved website lock or tested prototype graph.

Setup failures were corrected within the isolated fixture: initial shell quoting,
local vendor override conflict, npm local-directory provenance mismatch and an
early clean-install attempt before lock generation completed. The final immutable
artifact and clean locked installation pass; no failed initial check is counted
as a PASS. Phase-1 commit259b763 remains recoverable; no application data/schema,
production service, IAM, DNS, resource or billing change is made.
