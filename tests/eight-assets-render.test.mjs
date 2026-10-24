import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
const root=fileURLToPath(new URL('../',import.meta.url));
const bundle=await build({absWorkingDir:root,stdin:{contents:`
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {SavedMaterialView} from './src/components/SavedMaterialView';
import {encodeTeacherArtifact} from './src/services/teacherArtifact';
export function render(asset) { return renderToStaticMarkup(<SavedMaterialView material={{id:'synthetic',title:'Synthetic study copy',curriculum:'CBSE Class X',savedAt:'2026-10-16',body:encodeTeacherArtifact(asset)}}/>); }
`,resolveDir:root,loader:'tsx'},bundle:true,platform:'node',format:'cjs',write:false});
const module={exports:{}};
new Function('require','module','exports',bundle.outputFiles[0].text)(createRequire(import.meta.url),module,module.exports);
const fixtures=JSON.parse(await readFile(new URL('./fixtures/eight-assets.json',import.meta.url)));
for(const row of fixtures) test(`${row.asset_type}: persisted copy renders in the actual saved-material React view`,()=>{
  const html=module.exports.render({...row,topic_id:'synthetic',language:'ENGLISH',provenance:[{source:'<script>unsafe()</script>'}]});
  assert.match(html,/Heredity/);
  assert.match(html,/Personal study copy/);
  assert.match(html,/Sources recorded at generation/);
  assert.ok(!html.includes('<script>'));
  assert.match(html,/&lt;script&gt;/);
  assert.ok(!html.includes('SAARTHI_STUDY_COPY_V1'));
});
