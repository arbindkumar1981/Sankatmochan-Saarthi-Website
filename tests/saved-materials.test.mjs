import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
const result = await build({ absWorkingDir: fileURLToPath(new URL('../', import.meta.url)), entryPoints: ['./src/services/savedMaterials.ts'], bundle: true, platform: 'node', format: 'esm', write: false });
const { prepareSavedMaterial, matchesMaterialSelection } = await import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
const material = () => ({ id: 'saved-1', title: 'Physics notes', body: 'Force = mass × acceleration', curriculum: 'Class 11 · Physics', savedAt: '2026-10-04T17:00:00.000Z' });
test('saved notes preserve readable text without carrying external file links or student identity fields', () => {
  const clean = prepareSavedMaterial({ ...material(), attachmentUrl: 'https://example.org/file.pdf', studentUid: 'another-user' });
  assert.deepEqual(clean, material());
  assert.equal(clean.attachmentUrl, undefined);
  assert.equal(clean.studentUid, undefined);
});
test('empty and oversized dashboard materials are rejected before writing', () => {
  assert.throws(() => prepareSavedMaterial({ ...material(), body: ' ' }));
  assert.throws(() => prepareSavedMaterial({ ...material(), body: 'x'.repeat(200001) }));
  assert.throws(() => prepareSavedMaterial({ ...material(), id: '../other-user' }));
});

test('saved PDFs keep a bounded content reference and never retain a public file link', () => {
  const clean = prepareSavedMaterial({ ...material(), body: '', contentId: 'published-content-1', attachmentUrl: 'https://example.org/secret.pdf' });
  assert.equal(clean.contentId, 'published-content-1');
  assert.equal(clean.body, '');
  assert.equal(clean.attachmentUrl, undefined);
  assert.throws(() => prepareSavedMaterial({ ...material(), contentId: '../original-word' }));
});
test('published notes with old IDs match only the same subject and chapter names', () => {
  const record = { subjectId: 'old-science', subjectName: 'Science', chapterId: 'old-ch1', chapterTitle: 'Chemical Reactions and Equations' };
  assert.ok(matchesMaterialSelection(record, { id: 'new-science', name: 'Science' }, { id: 'new-ch1', title: record.chapterTitle }));
  assert.equal(matchesMaterialSelection(record, { id: 'new-physics', name: 'Physics' }, { id: 'new-ch1', title: record.chapterTitle }), false);
  assert.equal(matchesMaterialSelection(record, { id: 'new-science', name: 'Science' }, { id: 'new-ch2', title: 'Electricity' }), false);
});
