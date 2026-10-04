import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';

const result = await build({
  absWorkingDir: fileURLToPath(new URL('../', import.meta.url)),
  entryPoints: ['./src/data/currentCurriculum2026.ts'],
  bundle: true, platform: 'node', format: 'esm', write: false
});
const { CURRENT_CBSE_NCERT_SUBJECTS: subjects } = await import(
  'data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64')
);

test('existing chapters remain available across streams without class mixing', () => {
  for (const subject of subjects) {
    const reference = subjects.find(other => other.name === subject.name &&
      other.classes[0] === subject.classes[0] && other.chapters.length);
    if (reference) {
      assert.deepEqual(subject.chapters.map(ch => ch.title), reference.chapters.map(ch => ch.title));
    }
  }
  const generalPhysics = subjects.find(s => s.name === 'Physics' && s.classes[0] === 'Class 12' && s.stream === 'General');
  assert.ok(generalPhysics.chapters.length > 0);
});

test('reused chapters and topics keep unique identifiers', () => {
  const subjectIds = subjects.map(s => s.id);
  assert.equal(new Set(subjectIds).size, subjectIds.length);
  const chapterIds = subjects.flatMap(s => s.chapters.map(ch => ch.id));
  assert.equal(new Set(chapterIds).size, chapterIds.length);
  const topicIds = subjects.flatMap(s => s.chapters.flatMap(ch => ch.topics.map(topic => topic.id)));
  assert.equal(new Set(topicIds).size, topicIds.length);
});
