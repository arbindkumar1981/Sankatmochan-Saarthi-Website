import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
const result = await build({ absWorkingDir: fileURLToPath(new URL('../', import.meta.url)), entryPoints: ['./src/services/uploadedTopics.ts'], bundle: true, platform: 'node', format: 'esm', write: false });
const { withUploadedTopics, matchesUploadedTopic } = await import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
const subjects = [{ id: 'science', name: 'Science', chapters: [{ id: 'life', title: 'Life Processes', topics: [] }] }];
const note = (changes = {}) => ({ id: 'note-1', board: 'CBSE', classGrade: 'Class 10', subjectId: 'science', subjectName: 'Science', chapterId: 'life', chapterTitle: 'Life Processes', approved: true, published: true, topicId: 'topic-respiration', topicTitle: 'Respiration', title: 'Respiration notes', ...changes });
const topics = (records, hidden = new Set(), catalogue = subjects) => withUploadedTopics(catalogue, records, 'CBSE', 'Class 10', hidden)[0].chapters[0].topics;

test('published upload appears immediately without changing the curriculum seed and disappears when unpublished', () => {
  const material = note();
  const added = topics([material]);
  assert.equal(added[0].title, 'Respiration');
  assert.equal(matchesUploadedTopic(material, added[0]), true);
  assert.deepEqual(subjects[0].chapters[0].topics, []);
  assert.deepEqual(topics([note({ published: false })]), []);
});
test('unapproved, archived, hidden and different board/class/subject/chapter notes stay out of search', () => {
  for (const changes of [{ approved: false }, { deleted: true }, { status: 'ARCHIVED' }, { board: 'UP_BOARD' }, { classGrade: 'Class 12' }, { subjectId: 'physics', subjectName: 'Physics' }, { chapterId: 'other' }]) assert.deepEqual(topics([note(changes)]), []);
  assert.deepEqual(topics([note()], new Set(['learning_contents/note-1'])), []);
});
test('legacy uploaded file without a topic label is searchable by title and opens that exact record', () => {
  const material = note({ topicId: undefined, topicTitle: undefined, title: 'Human Reproduction', attachmentUrl: 'https://example.com/file.pdf' });
  const found = topics([material]);
  assert.equal(found[0].title, 'Human Reproduction');
  assert.equal(matchesUploadedTopic(material, found[0]), true);
  assert.equal(matchesUploadedTopic(note({ id: 'another-note' }), found[0]), false);
});
test('different modules and capitalization do not create duplicate topics', () => {
  assert.equal(topics([note(), note({ id: 'revision', topicTitle: ' respiration ' })]).length, 1);
});
test('Hindi topic ID collisions still select the correct uploaded notes', () => {
  const first = note({ topicId: 'topic-custom', topicTitle: 'श्वसन' });
  const second = note({ id: 'note-2', topicId: 'topic-custom', topicTitle: 'पोषण' });
  const found = topics([first, second]);
  assert.notEqual(found[0].id, found[1].id);
  assert.equal(matchesUploadedTopic(first, found[1]), false);
  assert.equal(matchesUploadedTopic(second, found[1]), true);
});
test('older catalogue IDs reuse only exact subject and chapter names', () => {
  const catalogue = [{ id: 'cbse-science', name: 'Science', chapters: [{ id: 'cbse-life', title: 'Life Processes', topics: [] }] }];
  assert.equal(topics([note()], new Set(), catalogue).length, 1);
  assert.deepEqual(topics([note({ chapterTitle: 'Another chapter' })], new Set(), catalogue), []);
});
