import { before, after, test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { initializeTestEnvironment, assertFails } from '@firebase/rules-unit-testing';
import { ref, uploadBytes, getBytes, deleteObject } from 'firebase/storage';
let environment;
before(async () => {
  environment = await initializeTestEnvironment({ projectId: 'demo-saarthi-notes', firestore: { host: '127.0.0.1', port: 8087, rules: await readFile(new URL('../../firestore.rules', import.meta.url), 'utf8') }, storage: { host: '127.0.0.1', port: 9197, rules: await readFile(new URL('../../storage.rules', import.meta.url), 'utf8') } });
  await environment.withSecurityRulesDisabled(async context => { await uploadBytes(ref(context.storage(), 'managed-notes/note-a/file.pdf'), new Uint8Array([1]), { contentType: 'application/pdf' }); });
});
after(async () => { await environment?.cleanup(); });
test('private notes objects deny direct read, overwrite, create and delete for all browser identities', async () => {
  for (const context of [environment.unauthenticatedContext(), ...['admin-a', 'student-a', 'editor-a', 'anonymous-a'].map(uid => environment.authenticatedContext(uid, { role: 'admin', firebase: { sign_in_provider: uid === 'anonymous-a' ? 'anonymous' : 'google.com' } }))]) {
    const object = ref(context.storage(), 'managed-notes/note-a/file.pdf');
    await assertFails(getBytes(object));
    await assertFails(uploadBytes(object, new Uint8Array([2]), { contentType: 'application/pdf' }));
    await assertFails(uploadBytes(ref(context.storage(), 'managed-notes/note-a/new.pdf'), new Uint8Array([2])));
    await assertFails(deleteObject(object));
  }
});
