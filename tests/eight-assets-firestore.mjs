// Run only against the local demo emulator. Uses the already-reviewed pinned
// tooling checkout, keeping this PR separate from the tooling-adoption PRs.
import {after, before, test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
const require = createRequire(resolve(process.env.SAARTHI_TEST_TOOLS || '.issue87-tools', 'tests/emulator/package.json'));
const {initializeTestEnvironment, assertFails, assertSucceeds} = require('@firebase/rules-unit-testing');
const {doc, getDoc, setDoc, collection, getDocs} = require('firebase/firestore');
if (process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8087') throw new Error('Requires isolated loopback emulator on port 8087');
const root = fileURLToPath(new URL('../', import.meta.url));
const bundle = await build({absWorkingDir:root,stdin:{contents:"export * from './src/services/teacherArtifact'; export * from './src/services/savedMaterials';",resolveDir:root},bundle:true,platform:'node',format:'esm',write:false});
const {encodeTeacherArtifact, readTeacherArtifact, teacherArtifactText, prepareSavedMaterial} = await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
const fixtures = JSON.parse(await readFile(new URL('./fixtures/eight-assets.json', import.meta.url)));
let environment, owner, other, anonymous, signedOut;
before(async () => {
  environment = await initializeTestEnvironment({projectId:'demo-saarthi-eight-assets',firestore:{host:'127.0.0.1',port:8087,rules:await readFile(new URL('../firestore.rules',import.meta.url),'utf8')}});
  owner = environment.authenticatedContext('synthetic-owner',{firebase:{sign_in_provider:'google.com'}}).firestore();
  other = environment.authenticatedContext('synthetic-other',{firebase:{sign_in_provider:'google.com'}}).firestore();
  anonymous = environment.authenticatedContext('synthetic-owner',{firebase:{sign_in_provider:'anonymous'}}).firestore();
  signedOut = environment.unauthenticatedContext().firestore();
});
after(async () => {await environment?.cleanup();});
for (const row of fixtures) test(`${row.asset_type}: real rules permit owner save/retrieve/render and deny other identities`, async () => {
  const asset = {...row,topic_id:'synthetic-heredity',language:'ENGLISH',provenance:[{source:'Synthetic official fixture',evidence_fingerprint:'fixture-1'}]};
  const saved = prepareSavedMaterial({id:row.asset_type,title:'Synthetic study copy',body:encodeTeacherArtifact(asset),curriculum:'CBSE Class X Science',savedAt:'2026-10-16T00:00:00Z'});
  const path = ['users','synthetic-owner','saved_materials',row.asset_type];
  await assertSucceeds(setDoc(doc(owner,...path),saved));
  const loaded = await assertSucceeds(getDoc(doc(owner,...path)));
  const artifact = readTeacherArtifact(loaded.data().body);
  assert.deepEqual(artifact,asset);
  assert.match(teacherArtifactText(artifact),/Heredity/);
  for (const db of [other,anonymous,signedOut]) {
    await assertFails(getDoc(doc(db,...path)));
    await assertFails(setDoc(doc(db,...path),saved));
    await assertFails(getDocs(collection(db,'users','synthetic-owner','saved_materials')));
  }
});
