import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
const bundled=await build({entryPoints:['src/services/publishedCms.ts'],bundle:true,platform:'node',format:'cjs',write:false,define:{'import.meta.env.VITE_CMS_TENANT_ID':'"synthetic-school"','import.meta.env.VITE_SAARTHI_API_URL':'"https://synthetic.example.test"'}});
const loaded={exports:{}};new Function('require','module','exports',bundled.outputFiles[0].text)(createRequire(import.meta.url),loaded,loaded.exports);
const {parsePublished,effectiveEntries,overlayNavigation}=loaded.exports;
const entry={id:'nav',parent:null,kind:'menu',route:'learning',icon:'book',title:'Approved learning',description:'Safe text',locale:'en',visible:true,order:0};
test('published config changes existing navigation but cannot alter security routes',()=>{
  const rows=parsePublished({entries:[entry]});
  const config=overlayNavigation({navigation:[{id:'learning',label:'Old',hindiLabel:'Learn'},{id:'admin',label:'Admin',hindiLabel:'Admin'}]},rows);
  assert.equal(config.navigation.find(row=>row.id==='learning').label,'Approved learning');
  assert.equal(config.navigation.find(row=>row.id==='admin').label,'Admin');
  assert.throws(()=>parsePublished({entries:[{...entry,route:'admin'}]}));
});
test('hidden and archived parent overrides suppress descendants; unsafe schema fails closed',()=>{
  const rows=parsePublished({entries:[{...entry,visible:false},{...entry,id:'child',kind:'section',parent:'nav'}]});
  assert.deepEqual(effectiveEntries(rows),[]);
  assert.equal(overlayNavigation({navigation:[{id:'learning'}]},rows).navigation[0].deleted,true);
  for(const extra of [{route:'javascript:alert(1)'},{icon:'executable'},{parent:'nav'},{mediaId:'../../escape'}])assert.throws(()=>parsePublished({entries:[{...entry,...extra}]}));
});
