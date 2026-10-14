const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const {createRequire} = require('node:module');
const {setTimeout: delay} = require('node:timers/promises');
if (!process.env.WEBSITE_ROOT || !process.env.WATCHER_FIXTURE_ROOT) throw Error('Explicit isolated prototype paths are required');
const fixtureRequire = createRequire(path.join(process.env.WEBSITE_ROOT, 'tests/emulator/package.json'));
const {initializeTestEnvironment} = fixtureRequire('@firebase/rules-unit-testing');
const {doc, setDoc, getDocFromServer} = fixtureRequire('firebase/firestore');
const {ref, uploadBytes, getMetadata} = fixtureRequire('firebase/storage');
const root = path.join(process.env.WATCHER_FIXTURE_ROOT, 'reload-fixture');
async function until(action, expected) {
  for (let i = 0; i < 100; i++) {
    try { const value = await action(); if (expected === 'allowed') return value; }
    catch (error) { if (expected === error.code) return; }
    await delay(100);
  }
  throw Error('Rule reload did not reach ' + expected);
}
(async () => {
  assert.equal(process.env.FIRESTORE_EMULATOR_HOST, '127.0.0.1:8080');
  assert.equal(process.env.FIREBASE_STORAGE_EMULATOR_HOST, '127.0.0.1:9199');
  const firestorePath = path.join(root, 'firestore.rules'), storagePath = path.join(root, 'storage.rules');
  const originals = await Promise.all([fs.readFile(firestorePath, 'utf8'), fs.readFile(storagePath, 'utf8')]);
  const env = await initializeTestEnvironment({projectId: 'demo-saarthi-release', firestore: {host: '127.0.0.1', port: 8080}, storage: {host: '127.0.0.1', port: 9199}});
  try {
    await env.withSecurityRulesDisabled(async context => {
      await setDoc(doc(context.firestore(), 'admins', 'prototype-admin'), {fixture: true});
      await setDoc(doc(context.firestore(), 'curriculum_nodes', 'prototype-reload'), {fixture: true});
    });
    const admin = env.authenticatedContext('prototype-admin');
    const document = doc(admin.firestore(), 'curriculum_nodes', 'prototype-reload');
    const file = ref(admin.storage(), 'learning-materials/prototype-admin/00000000-0000-0000-0000-000000000000-branded-fixture.pdf');
    await getDocFromServer(document);
    await uploadBytes(file, new TextEncoder().encode('%PDF-local-reload-fixture'), {contentType: 'application/pdf'});
    await getMetadata(file);
    await fs.writeFile(firestorePath, "rules_version = '2'; service cloud.firestore {match /databases/{database}/documents {match /{document=**} {allow read, write: if false;}}}");
    await until(() => getDocFromServer(document), 'permission-denied');
    await fs.writeFile(firestorePath, originals[0]);
    await until(() => getDocFromServer(document), 'allowed');
    console.log('PASS: real Firestore watcher enforces deny then restored rules');
    await fs.writeFile(storagePath, "rules_version = '2'; service firebase.storage {match /b/{bucket}/o {match /{allPaths=**} {allow read, write: if false;}}}");
    await until(() => getMetadata(file), 'storage/unauthorized');
    await fs.writeFile(storagePath, originals[1]);
    await until(() => getMetadata(file), 'allowed');
    console.log('PASS: real Storage watcher enforces deny then restored rules');
  } finally {
    await fs.writeFile(firestorePath, originals[0]); await fs.writeFile(storagePath, originals[1]);
    await env.cleanup();
  }
})().catch(() => { console.error('FAIL: isolated rule reload validation'); process.exitCode = 1; });
