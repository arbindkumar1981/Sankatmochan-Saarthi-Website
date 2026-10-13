import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseGeneratedFlashcards, parseGeneratedMindmap } from '../src/services/generatedLearning.ts';
import { readScratchpad, scratchpadKey } from '../src/services/scratchpad.ts';
import { RequestScope, recordsForIdentity } from '../src/services/requestScope.ts';

test('changing selection aborts an old generation and rejects its late response', async () => {
  const scope = new RequestScope();
  const old = scope.start();
  let resolveOld;
  const pending = new Promise(resolve => { resolveOld = resolve; });
  const next = scope.start();
  assert.equal(old.controller.signal.aborted, true);
  resolveOld('wrong chapter response');
  await pending;
  assert.equal(scope.owns(old), false);
  scope.finish(old);
  assert.equal(scope.owns(next), true);
  scope.invalidate();
  assert.equal(next.controller.signal.aborted, true);
  assert.equal(scope.owns(next), false);
});

test('a timeout retains ownership so the current error and loading state can finish', () => {
  const scope = new RequestScope();
  const request = scope.start();
  request.controller.abort();
  assert.equal(scope.owns(request), true);
  scope.finish(request);
  assert.equal(scope.owns(request), false);
});

test('logout and account switching hide records before subscription cleanup runs', () => {
  const records = [{ id: 'private-score', percentage: 42 }];
  assert.deepEqual(recordsForIdentity('student-a', 'guest', records), []);
  assert.deepEqual(recordsForIdentity('student-a', 'student-b', records), []);
  assert.equal(recordsForIdentity('student-a', 'student-a', records), records);
  assert.deepEqual(recordsForIdentity('guest', 'student-a', [{ id: 'local-guest' }]), []);
});

test('generated flashcards become interactive records with unique identities and Hindi text', () => {
  const cards = parseGeneratedFlashcards('```json\n' + JSON.stringify({ flashcards: [
    { id: 'duplicate', question: 'What is pollen?', answer: 'The male gametophyte.', questionHindi: 'पराग क्या है?' },
    { id: 'duplicate', question: 'Where is pollen produced?', answer: 'In the anther.' }
  ] }) + '\n```');
  assert.equal(cards.length, 2);
  assert.notEqual(cards[0].id, cards[1].id);
  assert.equal(cards[0].questionHindi, 'पराग क्या है?');
  assert.equal(cards[1].answer, 'In the anther.');
});

test('incomplete or unstructured flashcards fail with actionable errors', () => {
  for (const value of ['null', '{}', '[]', 'plain notes', '{"flashcards":[{"question":"Q"}]}', '{"flashcards":[{"question":" ","answer":"A"}]}']) {
    assert.throws(() => parseGeneratedFlashcards(value));
  }
  assert.throws(() => parseGeneratedFlashcards(JSON.stringify(Array.from({ length: 101 }, () => ({ question: 'Q', answer: 'A' })))));
});

test('mind maps preserve content and connections rather than generic pillars', () => {
  const nodes = [{ id: 'root', label: 'Flower', description: 'Reproductive organ.', children: ['anther'] },
    { id: 'anther', label: 'Anther', description: 'Produces pollen.', children: [] }];
  assert.deepEqual(parseGeneratedMindmap(JSON.stringify({ nodes })), nodes);
});

test('mind maps reject duplicate nodes, missing targets and self-connections', () => {
  const node = { id: 'a', label: 'A', description: 'Description' };
  for (const nodes of [[node, node], [{ ...node, children: ['missing'] }], [{ ...node, children: ['a'] }], [{ ...node, label: '' }]]) {
    assert.throws(() => parseGeneratedMindmap(JSON.stringify({ nodes })));
  }
});

test('scratchpad notes survive remount and remain isolated between accounts and guests', () => {
  const values = new Map();
  const storage = { getItem: key => values.get(key) || null };
  values.set(scratchpadKey('student-a'), JSON.stringify(['Pollen is a gametophyte.']));
  assert.deepEqual(readScratchpad(storage, scratchpadKey('student-a')), ['Pollen is a gametophyte.']);
  assert.deepEqual(readScratchpad(storage, scratchpadKey('student-b')), []);
  assert.deepEqual(readScratchpad(storage, scratchpadKey()), []);
  assert.deepEqual(readScratchpad(storage, scratchpadKey('student-a')), ['Pollen is a gametophyte.']);
});

test('corrupt, blocked and oversized scratchpad storage does not crash a page', () => {
  assert.deepEqual(readScratchpad({ getItem: () => '{bad' }, 'key'), []);
  assert.deepEqual(readScratchpad({ getItem: () => { throw new Error('Denied'); } }, 'key'), []);
  const notes = ['ok', 2, null, '', 'x'.repeat(5001), ...Array(105).fill('valid')];
  const result = readScratchpad({ getItem: () => JSON.stringify(notes) }, 'key');
  assert.equal(result.length, 100);
  assert.equal(result[0], 'ok');
  assert.ok(result.every(note => typeof note === 'string' && note.length <= 5000));
});
