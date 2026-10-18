import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
const bundle=await build({entryPoints:['src/services/cmsDiff.ts'],bundle:true,platform:'node',format:'cjs',write:false});
const loaded={exports:{}};new Function('require','module','exports',bundle.outputFiles[0].text)(createRequire(import.meta.url),loaded,loaded.exports);
const {draftDiff}=loaded.exports;
test('draft comparison reports field-level before/after without mutating publication',()=>{
 const before=[Object.freeze({id:'same',title:'Published',icon:'book',visible:true}),Object.freeze({id:'removed',title:'Old'})];
 const after=[{id:'same',title:'Draft',icon:'home',visible:false},{id:'added',title:'New'}];
 const changes=draftDiff(before,after);
 assert.deepEqual(changes.map(row=>row.kind),['added','removed','changed']);
 assert.deepEqual(changes[2].fields,['icon','title','visible']);
 assert.equal(changes[2].before.title,'Published');assert.equal(changes[2].after.title,'Draft');
 assert.equal(before[0].title,'Published');
 assert.deepEqual(draftDiff(before,before),[]);
});
