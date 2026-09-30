# Sankatmochan Saarthi Website — Audit v1

## Scope
Repository-wide source audit of the Google AI Studio exported website. This audit distinguishes working persistence from demo/static behavior and compares the website with the Saarthi v3 architecture.

## Critical findings fixed in this branch
1. **Client-side admin escalation:** the UI previously allowed `intendedRole === 'admin'` to make any Google sign-in appear as an admin in client state.
2. **Hard-coded browser admin passcodes:** three passcodes were bundled in source and could create a local admin profile without Firebase authentication. This is removed/disabled.
3. **Content deletion was UI-only:** deleting learning content only removed it from React state. It now deletes the Firestore document and requires authenticated admin state.
4. **Admin mutation guard:** learning content, tests, videos and notices now require an authenticated admin before client mutation attempts.

Firestore rules remain the authoritative enforcement layer for privileged writes.

## Existing working foundations
- React/Vite responsive frontend.
- Firebase Authentication with Google sign-in.
- Firestore persistence foundations for users, learning content, tests, test results, mistakes, videos, notices and enquiries.
- Firestore default-deny rules with owner/admin boundaries.
- Admin UI for content/video/test/notice management.
- Test result persistence and mistake-book persistence for authenticated students.
- Local guest-mode storage.
- Embedded YouTube player for supplied/curated video IDs.
- Class/stream/subject/chapter/topic UI hierarchy.
- Notice Board and Evaluation/Mistake Book interfaces.

## High-priority deficiencies still open
### 1. Saarthi v3 backend/agent integration is absent
The website is currently Firebase-centric and does not call the Saarthi v3 Principal Knowledge Agent, Subject Teacher Agent, Evaluation Agent, self-hosted Model Gateway, Student Brain, or mastery APIs.

### 2. Generated-content reuse engine is not implemented end-to-end
There is a `learning_contents` collection, but no canonical content key, semantic duplicate detection, KB-first lookup, generation lock/idempotency, reuse counters, provenance/version workflow, or stale-curriculum invalidation. The target is:
`board + curriculumVersion + class + subject + chapter + topic + concept + assetType + language + level + version`.

### 3. Static/demo academic content remains
Large curriculum and seed content live in `src/data/defaultCurriculum.ts`. `ContentArea.tsx` can display fallback copy that claims approved/verified academic content even when no matching stored content exists. Production must never represent fallback/demo text as verified content.

### 4. YouTube “search” is not an in-app search backend
The page filters the local curated library. When no match exists it opens YouTube search externally. A pasted ID can be embedded directly and is marked approved/published in temporary client state. Production needs an approved-source/search policy and must not label arbitrary pasted videos as academically approved.

### 5. Student authentication is incomplete for production
Google auth exists, but the required student registration profile, verified role lifecycle, parent/guardian fields/consent where applicable, session/RBAC design, and production-grade account recovery/identity flow are incomplete. Guest mode is demo convenience, not durable student identity.

### 6. Admin CMS is partial
Create and publish flows exist, but complete edit/version/archive/restore/audit-history workflows are not present. Content should normally be archived/versioned rather than destructively deleted after publication.

### 7. Tests/evaluation are not connected to Saarthi Evaluation Agent
The current frontend can score/store existing test responses and mistakes, but it does not use the v3 Evaluation Agent diagnostic categories and remediation loop end-to-end.

### 8. Mastery is not the v3 Mastery Engine
The website presents strengths/weaknesses from test result data but is not connected to the v3 attempt-history/mastery persistence/dashboard API and does not implement the richer planned weighting.

### 9. Notice Board personalization is shallow
It aggregates strings from test-result strengths/weaknesses. It is not yet driven by Student Brain + mastery + repeated mistakes + Evaluation Agent next actions.

### 10. Firestore and Neon/Postgres responsibilities are unresolved
The v3 backend uses PostgreSQL/Neon as the system-of-record architecture, while this website introduced Firestore collections. Before production, define one authoritative data ownership model to prevent split-brain student/content records.

### 11. No production API boundary to the self-hosted model
The browser must never hold model/GPU secrets. AI generation should go through the Saarthi backend and Model Gateway. The existing `GEMINI_API_KEY` example is an AI Studio artifact and should not become Saarthi's production intelligence dependency.

### 12. Content lifecycle lacks robust reuse/version metadata
Need status, version, curriculum version, canonical key, source/knowledge-unit reference, generated/validated timestamps, archived status, replacement version, and reuse metrics.

### 13. Admin/student data screens are incomplete
The admin UI does not yet provide the complete student lifecycle, searchable academic history, mastery/mistake drill-down, safe export, or controlled deletion workflow required for production.

### 14. Contact/enquiry persistence is inconsistent
Admin UI contains localStorage-based enquiry handling while Firestore rules/schema define an `enquiries` collection. Consolidate to authenticated/admin-controlled Firestore or Saarthi backend storage.

### 15. Automated CI/testing is insufficient
The repository has TypeScript lint/build scripts but no committed comprehensive unit/integration/security-rule/E2E test suite or GitHub Actions production gate.

## Recommended integration order
1. Finish website security/auth hardening.
2. Define website ↔ Saarthi v3 backend API boundary.
3. Make Neon/Postgres the authoritative Saarthi academic/student system where required; explicitly limit Firebase responsibilities if retained.
4. Implement canonical Content Library + KB-first reuse/idempotency/versioning.
5. Replace demo fallback content with verified-content states.
6. Connect Principal/Teacher generation through backend + self-hosted Model Gateway.
7. Connect Evaluation, Student Brain and Mastery.
8. Harden YouTube acquisition/approval flow.
9. Complete Admin CMS and audit log.
10. Add CI, security-rule tests and E2E tests before production.

## Production status
This repository is a strong interactive prototype/front-end foundation, **not yet a production-complete Saarthi implementation**.
