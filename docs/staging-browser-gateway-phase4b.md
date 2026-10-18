# Phase 4B staging browser gateway — review proposal, NOT deployed

Production remains **NO-GO**. This change authorizes code/tests only. No apply,
cloud provisioning, IAM/API/billing changes, account creation or live data access
was performed. Reuses PR #91 infrastructure and PR #88 website/acceptance flows.

## Request boundary

Browser -> Cloud Run native IAP -> separate staging gateway -> private API.
The gateway serves the reviewed website dist locally. Every request, including
assets, requires a signature/issuer/audience/time-validated IAP assertion and an
explicit approved IAP subject. `/api/v1/*` additionally requires an independently
verified Firebase bearer token whose synthetic UID maps to the same approved
school. Active membership/revocation is reread server-side. Existing backend
role/MFA/tenant checks remain authoritative; the gateway does not grant roles.

The original Firebase Authorization is preserved. Only the gateway obtains a
short-lived audience-bound identity token using its attached service account;
it sends that in X-Serverless-Authorization. The IAP service token received by
the gateway is discarded. Neither token appears in frontend configuration,
responses, cookies, application logs or stored files. No tokenCreator/key grant
is needed. Certificate/token failures fail closed. IAM roles and ingress still
need effective-policy checks; offline tests cannot prove deployed IAM behavior.

Upstream is one operator-reviewed HTTPS run.app origin. No user-controlled host,
URL, forwarding header or browser service token is trusted. Paths are canonical,
restricted to /v1/, redirects are refused, environment proxies disabled, headers
allowlisted, bodies capped at 32 MiB and responses at 40 MiB. API time limit is
120 seconds; long AI work must use the existing durable job workflow. Cookies,
upstream authentication headers and redirects are never returned. Application
access logging is disabled. Cloud Run platform request logs can include URLs; the proposal excludes automatic
HTTP request logs for the two staging services while retaining audit/application logs.
Operators must verify the exclusion and retention before acceptance; never
put identity tokens, PII or signed upload URLs in query parameters.

## Resource and IAM matrix (all proposed, isolated staging project only)

| Resource | Caller / runtime | Proposed permission and boundary |
| --- | --- | --- |
| Gateway Cloud Run | IAP service agent | run.invoker on gateway only; native IAP enabled on every ingress |
| Gateway IAP resource | approved named tester principals | iap.httpsResourceAccessor on this gateway; no public/group wildcard |
| Gateway runtime SA | private staging API | run.invoker on API only; no model invocation, secrets, IAM administration or production access |
| Staging Firestore default database | gateway runtime SA | datastore.viewer with database-name IAM condition for membership reads; no writes; verify effective restriction in staging |
| Private API runtime SA | existing staging database secret and private model | existing proposal only; no browser permission or gateway secret access |
| Website bundle | approved IAP subjects | read packaged files; never publish acceptance bundle to unprotected Hosting |

`tester_members` moves from API invoker to gateway IAP accessor. Terraform member
resources do not remove unknown out-of-band grants: reject ANY inherited/public
or unexpected invoker access during effective IAM review. Do not apply on top of
unreviewed state. No load balancer, static IP, GPU or new model instance proposed.
IAP API enablement is proposed only. OAuth consent/client setup for external or
no-organization projects requires separate operator approval; no secrets in state.
Copy the actual gateway signed-JWT audience from IAP settings, never an OAuth
client ID or guessed URL. The test audience is illustrative only.

## Build and configuration

Website: `vite build --mode staging-gateway`, with all VITE_FIREBASE_* fields,
VITE_FIRESTORE_DATABASE_ID=(default), VITE_CMS_TENANT_ID and
VITE_SAARTHI_API_URL=/api supplied from the approved isolated manifest. The build
fails on missing fields, non-staging project, mismatched auth/storage or remote API.
Do not use real identities. Firebase browser configuration is public, never service
credentials. No environment file is committed.

Backend: separate factory `master_builder.staging_gateway:from_environment`.
Requires APP_ENV=staging, matching FIREBASE_PROJECT_ID, exact GATEWAY_UPSTREAM,
GATEWAY_IAP_AUDIENCE, and GATEWAY_SYNTHETIC_IDENTITIES JSON mapping signed IAP
subjects to synthetic UID/school pairs. Missing/invalid config prevents startup.
Run without access logs or proxy-header trust as specified in gateway.tf.
Gateway.Dockerfile uses a named `website` build context containing ONLY reviewed
staging dist; record both source commits, lockfiles and final immutable digest.
No image build/push/deployment is authorized or claimed by this document.

## Incremental cost estimate (planning only)

Assume 10,000 gateway requests/month, average 1 second active time, 1 vCPU,
0.5 GiB RAM, minimum zero/maximum one instance. At illustrative Tier-1 request
list rates of $0.000024/vCPU-second, $0.0000025/GiB-second and $0.40/million
requests: CPU $0.24 + RAM $0.0125 + requests $0.004 = **about $0.26/month**
before free tier, regional adjustments, tax and currency conversion. At continuous
active use for 30 days, illustrative compute alone is about $65.45/month. Max one
instance is not a spending cap. Budget alerts do not stop spending.

This excludes existing API/model/SQL/storage costs, Firestore membership reads
(one or two per API request), image storage/builds, logging, internet egress and
any IAP premium features. No GPU cost is authorized. Operator must obtain an
asia-south2 calculator estimate with expected PDF traffic and retention, approve
the total INR ceiling and quotas, and verify OAuth/IAP eligibility before apply.
Sources: [Cloud Run pricing](https://cloud.google.com/run/pricing),
[native Cloud Run IAP](https://docs.cloud.google.com/run/docs/securing/identity-aware-proxy-cloud-run),
[signed assertions](https://docs.cloud.google.com/iap/docs/signed-headers-howto),
[service tokens](https://docs.cloud.google.com/run/docs/authenticating/service-to-service).

## Reversible rollback procedure (operator approval required; not executed)

1. Stop acceptance testing and remove tester access on the gateway IAP resource.
   Keep IAP and private invocation enforced throughout rollback.
2. Restore the prior reviewed gateway image/revision and matching website digest
   and synthetic mapping. Record both commits; never route to production.
3. If no safe revision exists, leave gateway inaccessible and revoke its backend
   invocation grant. Do not restore direct tester backend invocation as a shortcut.
4. Verify unauthenticated gateway/backend denial, revoked-session denial, and no
   production access. Preserve sanitized audit evidence; do not delete databases,
   secrets, backups or state. Review a new plan before any resource removal.

## Operator approval and acceptance checklist — ALL pending

- [ ] Approve isolated project/number, immutable source/image digests, service
  accounts, IAP audience, OAuth setup, synthetic subject/UID/school mapping,
  proposed IAM diff, cost ceiling, quotas and rollback owner. No real accounts.
- [ ] Confirm READY backups, effective IAM isolation, successful nonproduction
  restore, Eventarc audit, Firebase rules/indexes/TTL and existing release gates.
- [ ] Review Terraform plan using approved staging-only state; reject public or
  inherited invoker grants and unintended replacements. Apply only with separate
  written authorization. Verify database IAM condition actually denies other DBs.
- [ ] Verify unauthenticated direct gateway run.app AND backend run.app deny access;
  forged identity headers, wrong IAP audience/signature, expired assertions,
  unauthorized IAP subject, non-synthetic Firebase UID, wrong Firebase project,
  expired Firebase token, revoked membership and cross-school requests all fail.
- [ ] Approved IAP session plus synthetic Firebase MFA exercises all 10 admin seats
  and role restrictions. Inspect browser network: only Firebase bearer on /api;
  no service ID token, server credential or upstream redirect visible.
- [ ] Execute existing authenticated-staging-acceptance-phase3.md: CMS draft/diff,
  publish/rollback, PDF upload/replace/preview/restore, isolation, assessment job
  retries/reconciliation, appeals/marks audit and all eight learning assets.
- [ ] Check cookie-based IAP navigation, Firebase popup authorized domain and MFA
  enrollment without weakening auth; capture mobile/desktop and accessibility
  evidence. Confirm public CMS fetches work through authenticated /api too.
- [ ] Inspect sanitized platform/application logs for query/body/token leakage,
  limits/timeouts, response headers and rate/cost behavior. No raw tokens in evidence.
- [ ] Rehearse rollback, rerun exact-head CI, record operator/date/results in #86/#87.

## Offline evidence and limitations

Final local checks: backend regression includes 17 gateway tests with ephemeral
ES256 signatures; frontend functional tests, TypeScript, ESLint, normal and
synthetic gateway builds; six Chromium responsive/accessibility fixtures; Terraform
schema validation and eight mock plan tests. Exact results/commits and CI links
are recorded in #86/#87. Terraform initially failed on an unknown computed mock
assertion; corrected to a plan-time permission assertion. No apply was used.
Existing FastAPI lifecycle deprecations, Vite native-loader/chunk warnings and
esbuild import.meta test-harness warnings remain visible. Three optional backend
integration tests require separate services; disposable Postgres is covered by CI.
Container build/direct-origin smoke runs in CI; local Docker is unavailable.

Authenticated cloud/browser acceptance remains NOT EXECUTED. Until these gates
pass, this implementation is not a release authorization. Production NO-GO.
