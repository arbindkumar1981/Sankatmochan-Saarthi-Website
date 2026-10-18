import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
const result = await build({ absWorkingDir: fileURLToPath(new URL('../', import.meta.url)),
  stdin: {contents: "export * from './src/services/teacherArtifact'; export * from './src/services/savedMaterials';", resolveDir: fileURLToPath(new URL('../', import.meta.url))},
  bundle: true, platform: 'node', format: 'esm', write: false });
const { validateTeacherArtifact, encodeTeacherArtifact, readTeacherArtifact, teacherArtifactText, prepareSavedMaterial } = await import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
const fixtures = JSON.parse(await readFile(new URL('./fixtures/eight-assets.json', import.meta.url)));
const response = row => ({...row,topic_id:'synthetic-heredity',language:'ENGLISH',provenance:[{source:'Synthetic official fixture',evidence_fingerprint:'fixture-1',source_url:'https://ncert.nic.in/fixture-1'}]});
for (const row of fixtures) test(`${row.asset_type}: validate, persistable copy, reload and readable rendering`, () => {
  const asset = validateTeacherArtifact(response(row), {asset_type:row.asset_type,topic_id:'synthetic-heredity',language:'ENGLISH'});
  const saved = prepareSavedMaterial({id:row.asset_type,title:'Synthetic study copy',body:encodeTeacherArtifact(asset),curriculum:'CBSE Class X Science',savedAt:'2026-10-16T00:00:00Z'});
  const loaded = readTeacherArtifact(JSON.parse(JSON.stringify(saved)).body);
  assert.deepEqual(loaded, asset);
  assert.match(teacherArtifactText(loaded), /Heredity/);
  assert.equal(loaded.provenance[0].evidence_fingerprint, 'fixture-1');
});
test('wrong asset/topic/language and absent provenance are rejected', () => {
  const good = response(fixtures[0]);
  for (const key of ['asset_type','topic_id','language']) assert.throws(() => validateTeacherArtifact(good, {...good,[key]:'wrong'}));
  assert.throws(() => validateTeacherArtifact({...good,provenance:[]}));
  assert.throws(() => validateTeacherArtifact({...good,content:' '}));
  assert.equal(readTeacherArtifact('Legacy readable notes'), undefined);
  assert.equal(readTeacherArtifact('SAARTHI_STUDY_COPY_V1\nnull'), undefined);
});
test('invalid structured output and cyclic mind maps cannot be saved', () => {
  assert.throws(() => validateTeacherArtifact(response({asset_type:'FLASHCARDS',content:'{"flashcards":[{"question":"Heredity","answer":""}]}'})));
  assert.throws(() => validateTeacherArtifact(response({asset_type:'MIND_MAP',content:JSON.stringify({nodes:[{id:'a',label:'Heredity',description:'',children:['b']},{id:'b',label:'B',description:'',children:['a']}]})})));
});
