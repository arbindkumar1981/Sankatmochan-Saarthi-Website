# Existing-resource verification

Both Firebase projects are protected existing systems. The Founder confirmed
`quick-xylopolist-tt3g1` is active AI Studio Starter tier with three named
Enterprise Firestore databases, not empty staging. Do not modify or repurpose it
or `sankatmochan-509100`, create resources, upgrade billing or change IAM.

The backend bridge uses actual emulator HTTP, approval/publication commits,
a disposable localhost Postgres database and Student API PDF reads. Backend CI
uses checksum-verified snapshots of these reviewed website rules because the
private backend cannot be checked out with this repository's CI token. No new
cross-repository credential or access grant is introduced. Auth identity lookup and
server-owner transport exist only in the test; production auth/IAM is unchanged.
The demo-project/localhost/database guards prevent cloud fallback. This workflow
provisions no cloud user, database, bucket or project.

No Firebase/Google Cloud project, cloud user, hosting channel or paid resource is
created. `firebase.emulators.json` uses Auth 9099, Firestore 8080 and Storage 9199,
all on 127.0.0.1, under the non-cloud fixture ID `demo-saarthi-release`.
`tests/emulator/run.mjs` starts only those local emulators. CI supplies Java 21.

`auth-storage.test.mjs` creates one synthetic Admin and two Student identities in
the local Auth emulator, uses actual SDK sessions for profile/ownership rules,
admin file upload, draft privacy and student access to published metadata. The
fixture password is public test data; no real passwords or ID tokens are logged.
The Admin designation exists only in emulator Firestore. This individual rules
test uses a trusted publication fixture; the backend bridge exercises the real
approval/publication endpoint against matching rule snapshots in its emulators.

The bridge is local API/PDF integration evidence, NOT real Google OAuth,
effective cloud IAM or complete cloud E2E. See backend
`docs/cloud-only-verification.md` for the narrow cloud-only gates and the
strictly optional, unapproved staging proposal. Neither existing project is a
staging candidate.
The isolated Neon branch already exists. The backend opt-in test requires its
credential through `SAARTHI_TEST_DATABASE_URL` and rejects all other hostnames;
the root project's database URL did not match that branch and was not reused.
No credential should be sent in chat or committed. Configure it through an
existing secure local/CI secret mechanism before running the opt-in test.

Until an existing isolated Firebase application and authorized Google test
accounts are identified, real OAuth and the complete deployed publication
journey remain UNVERIFIED. Do not create accounts or upload fixtures into the
production project to substitute for those missing resources.
