import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
const result = await build({ absWorkingDir: fileURLToPath(new URL('../', import.meta.url)), entryPoints: ['./src/services/contentDocumentId.ts'], bundle: true, platform: 'node', format: 'esm', write: false });
const { contentDocumentId } = await import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
test('long curriculum keys produce stable valid document IDs without changing short identities', async () => {
  assert.equal(await contentDocumentId('existing-chapter-notes'), 'existing-chapter-notes');
  const key = 'cbse__class-12__science__biology__'.repeat(7);
  const id = await contentDocumentId(key);
  assert.match(id, /^[a-zA-Z0-9_-]{1,128}$/);
  assert.equal(await contentDocumentId(key), id);
  assert.notEqual(await contentDocumentId(key + 'next-chapter'), id);
});
