# Notes Management — Website Issue #84

Prepared 17 October 2026. New Notes Management tab in Master Admin, plus published notes
under My Materials. Delegated notes editors enter through My Materials after server capability
verification; they do not gain legacy administrator access. Server rejects publication by editors.

Create typed/Markdown or upload PDF/DOCX/Markdown/text, edit metadata/content, replace file,
preview current/historical versions, publish/unpublish, confirmed Soft Delete and Restore to
draft. Canonical board/class/stream/subject/chapter/topic selectors cascade and are revalidated
server-side. Topic optional for chapter-wide notes. Search/status/scope filters apply to each
50-row page; Next page and paginated immutable history available. Text always escaped; files
retrieved through authenticated API, never public Storage tokens. 12 MiB file limit.

New route/service is separate from existing Study Materials and Teacher Agent generated
assets; no existing data conversion/deletion. New Firestore/Storage prefixes deny direct client
read/write, with server-managed separate notes_editors delegation records. Existing #87 Website
#82/#83 and Backend #88/#89 remain independent dependencies; this does not duplicate their fixes.
Legacy Storage anonymous-admin flaw on old prefix still belongs to #83, not this new prefix.

Backend companion on `codex/issue-84-notes-management`, stacked on backend Master Admin
PR #84. Website stacked on existing Master Admin PR #79. Detailed contract/recovery/least-
privilege/release plan: backend `docs/issue-84-notes-management.md`. VITE_SAARTHI_API_URL points
to approved backend; no new environment secrets. Both sides and reviewed Firebase rules
must be released together after separate approval. No production deployment or IAM changes.

Failed/interrupted uploads have private server recovery journals; use Check interrupted uploads
in the unsaved editor and Recover as draft. Keep generated note ID if leaving a failed new upload.
Conflicting/incomplete journals remain for approved retention review; no destructive cleanup.
Restore never republishes automatically. Concurrent editors receive 409 and must reload.
Limits are durable server-side budgets, not a cloud spending cap; approve defaults before release.

Local verification and exact CI/PR/commit links are recorded in Issue #84. Real cloud/browser
E2E, PDF/DOCX rendering screenshots and runtime IAM checks require approved isolated staging;
they remain BLOCKED. Production NO-GO. No student data read, exported or changed.
