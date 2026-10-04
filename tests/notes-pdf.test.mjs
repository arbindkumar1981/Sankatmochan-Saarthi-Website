import { test } from 'node:test';
import assert from 'node:assert/strict';
import { notesPdfHtml, openNotesPdf } from '../src/services/notesPdf.ts';

test('PDF escapes notes, title and curriculum and has no executable script', () => {
  const html = notesPdfHtml('<script>x</script>', '<img onerror="x">', ['<svg onload="x">']);
  assert.ok(!html.includes('<script>'));
  assert.ok(!html.includes('<img'));
  assert.ok(!html.includes('<svg'));
  assert.ok(html.includes('&lt;svg'));
});

test('empty and oversized notes are rejected', () => {
  assert.throws(() => notesPdfHtml('Notes', ' ', []));
  assert.throws(() => notesPdfHtml('Notes', 'x'.repeat(200001), []));
});

test('prepared notes print even when fonts never finish, without a network request', async () => {
  let printed = 0;
  let deadline;
  const popup = { opener: {}, closed: false, document: {
    write() {}, close() {}, fonts: { ready: new Promise(() => {}) },
  }, focus() {}, print() { printed++; }, close() { this.closed = true; } };
  globalThis.window = {
    open: () => popup,
    setTimeout: (callback, milliseconds) => { deadline = milliseconds; queueMicrotask(callback); return 1; },
    clearTimeout() {},
  };
  globalThis.fetch = () => { throw new Error('PDF must not request a server or AI'); };
  await openNotesPdf('Notes', 'Prepared notes', ['CBSE']);
  assert.equal(deadline, 1500);
  assert.equal(printed, 1);
  assert.equal(popup.opener, null);
  delete globalThis.window;
});

test('blocked pop-up gives an actionable error', async () => {
  globalThis.window = { open: () => null };
  await assert.rejects(openNotesPdf('Notes', 'Prepared notes', []), /allow pop-ups/);
  delete globalThis.window;
});
