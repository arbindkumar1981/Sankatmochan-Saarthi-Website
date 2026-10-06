import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
const result = await build({ absWorkingDir: fileURLToPath(new URL('../', import.meta.url)), entryPoints: ['./src/services/materialScope.ts'], bundle: true, platform: 'node', format: 'esm', write: false });
const { catalogueMaterialScopes, EMPTY_MATERIAL_SCOPE, matchesMaterialScope, changeMaterialScope, materialScopeOptions } = await import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
const note = { board:'CBSE', classGrade:'Class 12', stream:'Science', subjectId:'biology', chapterId:'human', topicTitle:'Reproduction', subtopicTitle:'Oogenesis', contentType:'detailed_notes' };
test('materials never cross selected class, stream, subject, chapter, topic, subtopic or module',()=>{
 const scope={...note};assert.equal(matchesMaterialScope(note,scope),true);
 for(const key of Object.keys(scope)) assert.equal(matchesMaterialScope({...note,[key]:'other'},scope),false);
 assert.equal(matchesMaterialScope({...note,deleted:true},scope),true);
 assert.equal(matchesMaterialScope(note,EMPTY_MATERIAL_SCOPE),true);
});
test('changing a parent clears all dependent selections without changing the old scope',()=>{
 const scope={...note};const next=changeMaterialScope(scope,'classGrade','Class 11');
 assert.equal(next.board,'CBSE');assert.equal(next.classGrade,'Class 11');assert.equal(next.subjectId,'');assert.equal(next.topicTitle,'');assert.equal(next.contentType,'');assert.equal(scope.subjectId,'biology');
});
test('dropdown options stay within their selected parents and include removed materials for restore',()=>{
 const records=[note,{...note,subtopicTitle:'Spermatogenesis',deleted:true},{...note,classGrade:'Class 11',subtopicTitle:'Other class'},{...note,topicTitle:'Other topic',subtopicTitle:'Other topic subtopic'}];
 assert.deepEqual(materialScopeOptions(records,note,'subtopicTitle'),['Oogenesis','Spermatogenesis']);
});

test('new subjects, chapters and topics appear in filters before any upload',()=>{
 const subject={id:'new-bio',name:'Biology',board:'CBSE',classes:['Class 12'],stream:'Science',chapters:[{id:'new-ch',title:'New chapter',topics:[{id:'new-topic',title:'New topic'},{id:'removed-topic',title:'Removed topic',deleted:true}]}]};
 const records=catalogueMaterialScopes([subject,{...subject,id:'removed-subject',deleted:true}]);
 assert.deepEqual(materialScopeOptions(records,{...EMPTY_MATERIAL_SCOPE,classGrade:'Class 12'},'subjectId'),['new-bio']);
 assert.deepEqual(materialScopeOptions(records,{...EMPTY_MATERIAL_SCOPE,subjectId:'new-bio'},'chapterId'),['new-ch']);
 assert.deepEqual(materialScopeOptions(records,{...EMPTY_MATERIAL_SCOPE,chapterId:'new-ch'},'topicTitle'),['New topic']);
});
