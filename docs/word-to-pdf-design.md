# Word uploads to branded student PDFs

Status: architecture, protected reading access and production deployment approved
by the Founder on 2026-10-05; implementation and validation in progress.

## Student and administrator experience

An authenticated administrator uploads a `.docx` file in Add Content or Replace.
The interface displays “Converting Word to PDF”, then “Adding logo and watermark”,
then saves the resulting PDF alongside the unchanged private original Word file.
No content is published if conversion fails. The administrator can retry or upload
a PDF directly. Students open the approved PDF inside Learning Hub and save a
reference to that content in their own dashboard. No Word download link is shown.

## Proposed implementation

Use a small private Cloud Run conversion service with LibreOffice Writer and fonts
for English, Hindi and the other supported languages. Only the existing Saarthi
backend can invoke it. This keeps the working backend build and teacher execution
job unchanged. No documents are sent to a new third-party conversion provider.

The existing backend verifies the Firebase ID token and administrator membership
before accepting a conversion request. It limits upload size, concurrent jobs,
temporary disk use and execution duration. It rejects malformed archives,
macros, embedded executable objects and external resources. Each conversion uses
an isolated temporary directory and LibreOffice profile, cleaned after success
or failure. Documents and authentication tokens are not logged.

The converted PDF returns to the existing upload flow, which applies the website
logo and watermark using the existing PDF branding implementation. Original Word
files remain in the current administrator-only Storage area. Branded PDFs are
also private; a new authenticated backend reading endpoint checks the current
content record is approved, published and not archived before streaming only its
branded PDF. The endpoint does not accept arbitrary Storage paths or URLs.

Render PDF pages inside the student interface without the browser PDF toolbar,
using an authenticated request and a bounded canvas reader. Add the existing
personal watermark over the rendered pages. Dashboard entries store a content
ID rather than a public download URL; access is checked again when reopened.
Unpublishing or archiving content stops future reads, including saved references.

## Scope and limits

- Start with `.docx`; legacy `.doc` and PowerPoint remain PDF-upload only.
- Existing uploaded Word files require administrator replacement/re-upload.
- Preserve original files and existing records; no destructive migration.
- Layout can vary with fonts and complex Word features. Verify representative
  tables, images, page breaks, Hindi text and equations before production release.
- Do not promise a fixed conversion duration until runtime timings are measured.
- Browser screenshots and capture by an authorized user cannot be fully prevented.
- New Cloud Run conversion usage may add cost; set bounded instance and concurrency
  limits and report the deployed settings.

## Acceptance checks

1. Word upload produces a valid multi-page PDF with logo and watermark on every page.
2. Original Word bytes remain unchanged and inaccessible to students.
3. Failed or timed-out conversion never publishes an incomplete file.
4. Signed-out and anonymous callers cannot convert or read; students cannot convert.
5. Unapproved, unpublished and archived PDFs cannot be read via guessed content IDs.
6. Dashboard references survive reload and still enforce current publication status.
7. Compare rendered PDF pages against sample Word content for clipping, missing
   images, tables, equations and language glyphs.
8. Run frontend tests, TypeScript, build and backend tests/lint; review both diffs.
9. Verify production upload, dashboard reading and access denials after authorized
   deployment; leave existing teacher-generation flows unchanged.

## Approval required

Approve the private conversion service, its backend-only invocation permission,
authenticated reading of approved PDFs by signed-in students (matching current
published-notes access), and deployment of this feature. No public Storage access
or third-party document processing is proposed.
