# Existing-resource verification

No Firebase/Google Cloud project, cloud user, hosting channel or paid resource is
created. `firebase.emulators.json` uses Auth 9099, Firestore 8080 and Storage 9199,
all on 127.0.0.1, under the non-cloud fixture ID `demo-saarthi-release`.
`tests/emulator/run.mjs` starts only those local emulators. CI supplies Java 21.

`auth-storage.test.mjs` creates one synthetic Admin and two Student identities in
the local Auth emulator, uses actual SDK sessions for profile/ownership rules,
admin file upload, draft privacy and student access to published metadata. The
fixture password is public test data; no real passwords or ID tokens are logged.
The Admin designation exists only in emulator Firestore. Published metadata is
written by a trusted test fixture, not by the backend approval endpoint.

This is evidence of local Auth/Firestore/Storage integration, NOT real Google
OAuth, backend knowledge review, private PDF proxy access or complete cloud E2E.
The isolated Neon branch already exists. The backend opt-in test requires its
credential through `SAARTHI_TEST_DATABASE_URL` and rejects all other hostnames;
the root project's database URL did not match that branch and was not reused.
No credential should be sent in chat or committed. Configure it through an
existing secure local/CI secret mechanism before running the opt-in test.

Until an existing isolated Firebase application and authorized Google test
accounts are identified, real OAuth and the complete deployed publication
journey remain UNVERIFIED. Do not create accounts or upload fixtures into the
production project to substitute for those missing resources.
