# Scoped Firebase CLI watcher remediation

Issue: https://github.com/arbindkumar1981/Sankatmochan-Saarthi-Website/issues/52

The real emulator/deployment tooling lock consumes the checked-in tarball in this directory. It needs no generated artifact, network-hosted fork, install script, or cross-repository path. Both repositories carry the same artifact and provenance. Upstream Apache-2.0 LICENSE and notices remain inside the package.

Source: official `firebase-tools@15.33.0`, verified against its original npm SHA-512 integrity, plus website PR #53 at `84356cac9a727b3ed1e8e84a4196c3575b070cdd`. The only code changes in the CLI are the four watcher imports listed in `provenance.json` and the adapter. Its dependency manifest pins chokidar 4.0.3, anymatch 3.1.3 and picomatch 2.3.2, removes upstream development-only overrides, and identifies the adaptation as `15.33.0-saarthi.1`. Consumer overrides remain intact.

The adapter additionally preserves the Stats argument of ignored callbacks; the operational regression exposed its loss in the prototype. Source line endings are normalized to make the artifact reproducible on Windows and Linux. `node tests/watcher-prototype/rebuild.cjs` downloads and verifies the upstream archive, rebuilds the scoped package and requires byte-identical SHA-512 integrity. `--write` is an explicit maintainer-only regeneration mode; any resulting change requires provenance and both locks to be reviewed together.

`verify-working.cjs` checks the artifact hash, manifest, installed source, and actual locked graph. CI clean-installs the real consumer lock, audits without suppression, reproduces the artifact and runs watcher/Functions reload tests on Windows and Linux. Website integration also verifies real Firestore/Storage rule reload, authorization, transactions and live updates. Backend integration uses only disposable local emulators and PostgreSQL.

On 2026-10-15 the registry's latest Firebase CLI was 15.34.0 and still declared chokidar ^3.6.0. Official release/issue searches did not identify a released compatible replacement. Recheck upstream before each release and retire this adaptation when a compatible upstream fix passes the same tests.

Production remains NO-GO pending all CI/security checks, separately approved credentialed candidate deployments, and production E2E generation of all eight assets. CLI help is only a command-schema smoke test. No cloud deployment, database migration or production data change is part of this remediation.
