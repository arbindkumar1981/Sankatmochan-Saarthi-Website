# Sankatmochan Saarthi — Target Website Architecture

## Public Website
- Home: public landing page, mission, Classes IX–XII overview and student sign-in entry.
- About Us: existing `AboutUsView`.
- Courses: board/class/stream/subject catalogue drawn from approved curriculum (public, read-only).
- Notice Board: existing `NoticeBoardView`, with admin-approved publication.

## Student Dashboard (authentication required)
- Curriculum Sidebar: existing `LearningSidebar`, board → class → stream → subject → chapter → topic.
- Learning Workspace: existing `ContentArea` with eight Teacher-Agent assets.
- Practice & Tests: existing practice/test module inside `ContentArea`.
- Evaluation Hub: existing `EvaluationHub`, mastery and mistake tracking.
- Saved Materials: existing `MyMaterials`.

## Admin Dashboard (role-gated)
- Curriculum Manager: existing `CurriculumManager`.
- Content Manager: existing `AdminPanel` content tools.
- Video Manager: existing `AdminPanel` video tools.
- Question & Test Manager: existing `AdminPanel` test tools.
- Notice Manager: existing `AdminPanel` notice tools.

## Backend API
- Authentication: verify Firebase ID tokens and role/consent claims server-side.
- Curriculum: versioned boards/classes/streams/subjects/chapters/topics.
- Learning Content: approved material, storage and Teacher-Agent generation.
- Assessment: questions, attempts, scoring, explanations and mistake records.
- Student Progress: mastery, recommendations and longitudinal progress.

## PostgreSQL
- Canonical relational entities: users, curriculum_nodes, learning_content, questions, tests, attempts, student_answers, mastery, mistake_log, notices, content_reviews.
- **Important:** the current website uses Firebase Auth/Firestore for several live operations. PostgreSQL must not be claimed as the sole production source of truth until a designed, tested migration exists.

## Delivery phases
1. Group existing navigation into Public / Student / Admin while retaining existing IDs and functions (this PR).
2. Implement public Home and Courses pages with accessible routing and public-only approved data.
3. Split Student Dashboard into dedicated curriculum, learning, practice/test and evaluation routes, preserving progress.
4. Split Admin Dashboard into dedicated role-gated manager routes, retaining approval workflows.
5. Align backend API contracts, introduce PostgreSQL persistence with migration/rollback, and run authenticated end-to-end tests.

**Release gate:** no deployment until CI, role-based access tests, real student/admin sign-in, PDF rendering and all eight asset E2E checks pass. No database cutover without migration and rollback verification.
