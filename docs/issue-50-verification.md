# Issue #50: deployment investigation and release verification

Issue: https://github.com/arbindkumar1981/Sankatmochan-Saarthi-Website/issues/50

## Evidence and diagnosis limits

### Follow-up review: 14 October 2026

Both draft PRs are open and conflict-free according to GitHub. Website CI and all three backend CI workflows passed on their original repair commits. The supplemental documentation changes below do not change runtime code.

Standalone Cloud Shell now provides existing authenticated read-only access, despite the console history page still failing to load. The latest failed build for the API image in asia-south2 is `92cb8a81-79b2-4c42-a9aa-25fa98f3e993`, created 30 September 2026 at 18:35:35 UTC (1 October at 00:05:35 IST). The two later failures are for the worker image. No failed global build records were returned.

Exact API failure link: https://console.cloud.google.com/cloud-build/builds;region=asia-south2/92cb8a81-79b2-4c42-a9aa-25fa98f3e993?project=247863708315

Actual sanitized log evidence: step 1 uses `google.python.missing-entrypoint@0.9.0` and fails because the Python pyproject source needs a supported main.py/app.py, a project script, GOOGLE_ENTRYPOINT or Procfile. The builder exits with status 51. This establishes a build-time missing-entrypoint failure for this recorded API build. The later worker-as-web Procfile defect fixed by PR #79 is a separate issue, not the observed error. Mapping this record to the original issue screenshot still requires its build ID/source identity; a missing buildTriggerId must not be described as proof of a repository trigger.

Current Cloud Run read-only inspection confirms latest-created and latest-ready are both `sankatmochan-saarthi-v3-git-00192-sbp`, with 100% traffic. Fresh HTTP checks return Hosting 200, API health 200 and unsigned material 401. No service, traffic, database or IAM configuration was changed.

Review findings: PR #51 introduces no authentication/authorization changes; its ESM config is exercised by passing CI. PR #79 keeps API and worker process selection consistent, but its local subprocess test does not build an OCI/buildpack image or exercise the real queue/database worker. Those deployment checks remain required. Both repositories auto-deploy on main pushes, so merging can trigger production actions; explicit release approval and review of the existing production gate are required before merging.

Existing website risks outside these diffs: ContentArea grades using client-visible correctIndex; repository Firestore rules permit owner-created numeric scores without authoritative grading; EvaluationHub permits manual Mark as Mastered. No frontend retest-to-server-mastery integration was found. Assessment integrity and measured retest mastery fail the source-review requirements. Backend learning-loop unit tests do not prove that the website is integrated with that backend flow. These need a separately approved security/assessment task; do not silently add the old uncommitted audit changes to either PR.

Merge recommendation: review/approve website #51 first as the smaller independent change, then backend #79 after image/worker verification and an approved coordinated release. Green CI does not certify the complete learning loop. No merge or deployment was performed.

The earlier investigation record below is retained as historical context; its log-access blocker and unconfirmed root cause are superseded by this follow-up.

Fresh website source: 2d9172f. Fresh backend source: bed35a6 in arbindkumar1981/Sankatmochan-Saarthi-v3. Dedicated repair branches preserve the earlier local audit changes.

Actual GitHub Actions deployment log inspected: https://github.com/arbindkumar1981/Sankatmochan-Saarthi-v3/actions/runs/38334339876 . Both its test and deployment jobs succeeded. The log reports the API revision `sankatmochan-saarthi-v3-git-00192-sbp` serving 100% traffic at deployment, successful private converter checks, and successful Teacher E2E execution `saarthi-teacher-e2e-kq7p5`. This is historical evidence, not a fresh inspection of current traffic or the failed repository trigger.

Google Cloud Build history failed to load in the connected browser, including a reload. The console reported “Failed to load” and client JavaScript errors. Cloud Run detail similarly did not populate, and the Cloud Shell attempt did not provide a usable terminal. No authenticated local gcloud installation/session was available. No permission-denied response was obtained, so missing IAM permissions must not be asserted as the cause.

The failed Cloud Build's ID, source commit, failing step and log remain unavailable. Its exact root cause is unconfirmed.

A separate confirmed source defect was found in the backend: the Procfile's web process launched the non-HTTP execution worker. The existing successful GitHub API workflow overrides its entrypoint; a repository-triggered build relying on Procfile would not. The backend repair defines independent API and worker processes and updates the worker selector. This is a plausible explanation only if the failed trigger uses that Procfile without an override; actual trigger configuration/logs must establish that.

Website repair: Vite's ESM configuration now uses import.meta.dirname, removing the existing warning about __dirname and future native config loading. No framework/dependency upgrades or feature replacement.

## Checks executed

- Website automated tests: 75 passed.
- Website npm run lint: passed; this repository script performs TypeScript checking, not ESLint.
- Additional ESLint check: passed against src using the installed audit checkout's existing parser/config. This is a local supplemental check, not a newly configured CI lint gate.
- Website production build: passed before/after repair. The __dirname warning is removed. Existing large-chunk warning remains: Firebase 568.66 kB, PDF worker 1,264.34 kB.
- Backend final suite: 332 passed, 2 skipped. Real DOCX/PPTX LibreOffice conversions are skipped locally because LibreOffice is unavailable; the existing Office conversion CI must run on the repair PR.
- Backend Ruff: passed. Deprecation warnings remain for FastAPI on_event startup handling; unrelated lifecycle changes were excluded.
- Backend Python wheel: built successfully using an isolated build environment. First restricted build failed on temporary-folder permissions; a no-isolation attempt lacked setuptools. Neither failed attempt is reported as passing. No Cloud Build/OCI image was built locally.
- New HTTP process test starts the actual Procfile API command on an assigned local port and verifies HTTP 200 and status ok, with database startup disabled. Independent worker process contract also passes.
- Existing isolated Neon branch br-divine-wave-b4lb5bqo: read-only connectivity and presence of agent_blueprints, agent_instances and agent_runs confirmed. No schema or data modifications.
- Both Firebase Hosting URLs: HTTP 200.
- API /health: HTTP 200, status ok.
- Unsigned /v1/materials/test-fixture/pdf: HTTP 401.
- Unsigned teacher-model and docx-converter /health: HTTP 403.
- Live browser: persisted authenticated Admin profile resolves; curriculum navigation, About and Contact render. No enquiry, upload, publication, generation, assessment submission or profile update was performed.
- Live published PDF initially displayed “Failed to fetch”; reopening through normal navigation loaded the authenticated 11-page PDF, and Next advanced from page 1 to page 2. The transient fetch error remains a monitoring concern; it was not sufficient evidence of a reproducible server defect.
- Git diffs and whitespace reviewed. Generated package/build artifacts and environment files are excluded from commits.

## Exact read-only log access needed

Use an authenticated gcloud session for the existing project sankatmochan-509100, or supply a redacted export of the failed build's logs, build ID, source commit and trigger/build configuration. Do not supply credentials or tokens in chat.

The reader needs cloudbuild.builds.list/get (Cloud Build Viewer, roles/cloudbuild.builds.viewer), Cloud Logging read access (roles/logging.viewer), and service/revision inspection (roles/run.viewer). If build logs live in Cloud Storage, bucket-scoped storage.objects.get access is additionally needed. Existing Owner access may already suffice; do not add roles just because the browser failed. No IAM changes were made.

From an already authenticated terminal, use:

```sh
gcloud builds list --project=sankatmochan-509100 --region=asia-south2 --filter='status=FAILURE' --limit=20 --format='table(id,status,createTime,buildTriggerId,logUrl)'
gcloud builds list --project=sankatmochan-509100 --region=global --filter='status=FAILURE' --limit=20 --format='table(id,status,createTime,buildTriggerId,logUrl)'
gcloud builds log BUILD_ID --project=sankatmochan-509100 --region=BUILD_REGION
gcloud run services describe sankatmochan-saarthi-v3-git --project=sankatmochan-509100 --region=asia-south2 --format='yaml(status.latestCreatedRevisionName,status.latestReadyRevisionName,status.traffic)'
gcloud logging read 'resource.type="cloud_run_revision" AND resource.labels.service_name="sankatmochan-saarthi-v3-git" AND severity>=ERROR' --project=sankatmochan-509100 --freshness=24h --limit=50 --format='table(timestamp,severity,textPayload,jsonPayload.message)'
```

Replace BUILD_ID and BUILD_REGION from the failed build's actual record. Redact any sensitive log content before sharing it. Do not export the whole service environment or Secret Manager contents. Inspect trigger source repository, commit, buildpack/Dockerfile choice and entrypoint before attributing failure to Procfile.

## Production verification steps (approval required for mutations)

1. Retrieve failed-build evidence and current serving revision/traffic first. Compare the failed source commit with the successful GitHub deployment. Review the two repair PRs and require their CI results; do not mark Issue #50 fully resolved while root-cause evidence is missing.
2. Record the existing Firebase release, backend immutable image/revision/traffic, and worker revision before approved release. Review the selected deployment workflow: existing workflows also change IAM and execute production jobs, so approval must explicitly cover any such actions or use a separately approved release procedure that leaves IAM unchanged.
3. With explicit production deployment approval, build the reviewed backend commit using the existing pipeline. Verify readiness, latest-created versus latest-ready revision, entrypoint, HTTP listener and traffic. Keep the recorded previous revision recoverable. Do not promote an unready revision.
4. Confirm API health, unsigned student requests denied, and teacher/converter remaining private. Verify authenticated server-to-server model/converter invocation without making those services public.
5. Test authentic Admin and student accounts: login, refresh, navigation, correct class/subject/topic material, PDF paging, bilingual interface, and saved-material ownership. Upload/conversion, publication, generation and assessment submission write production state or consume services; use the existing isolated database and approved test fixtures/environment, or obtain approval for narrowly scoped production test records. Never use real student data as disposable fixtures.
6. Verify generated/converted material and assessment/retest results through reload; check cross-account access rejection and errors in runtime logs. Read-only checks performed here do not establish that complete flow.
7. Only with explicit Firebase release approval, release the reviewed frontend. Verify both existing Hosting URLs, expected assets/API target, login domains and one mobile viewport. Check post-release browser/API errors and compare to baseline.
8. If release checks fail, obtain approval for restoring the recorded hosting release/API traffic/worker revision; do not delete services or roll back database data. Do not change DNS, billing, security settings or create projects.
9. Custom-domain work is deferred. After verified health, Firebase must show the exact required records for sankatmochansaarthi.in before Hostinger instructions can be documented. No DNS values have been invented or changed.

References:
- https://docs.cloud.google.com/build/docs/securing-builds/store-manage-build-logs
- https://docs.cloud.google.com/build/docs/iam-roles-permissions
- https://docs.cloud.google.com/run/docs/securing/managing-access
- https://docs.cloud.google.com/docs/buildpacks/about-procfile
