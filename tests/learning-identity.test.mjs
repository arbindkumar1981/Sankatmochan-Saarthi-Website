import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const result=await build({absWorkingDir:root,bundle:true,platform:'node',format:'cjs',write:false,logLevel:'silent',define:{'import.meta.env.VITE_SAARTHI_API_URL':'"https://fixture.invalid"'},stdin:{resolveDir:root,contents:`export {learningApi} from './src/services/learningApi';export {uploadBrandedStudyFile} from './src/services/studyFileUpload';`},plugins:[{name:'identity-fixtures',setup(b){
  for(const [filter,path] of [[/^\.\/firebase$/,'firebase'],[/^firebase\/storage$/,'storage'],[/^\.\/noteBranding$/,'branding']])b.onResolve({filter},()=>({path,namespace:'fixture'}));
  b.onLoad({filter:/.*/,namespace:'fixture'},({path})=>({loader:'js',contents:{firebase:`export const auth={get currentUser(){return globalThis.identityFixture.user}};export const storage={};`,storage:`export const ref=(_,path)=>path;export const uploadBytes=async path=>{globalThis.identityFixture.uploads.push(path);globalThis.identityFixture.user=null};`,branding:`export const loadBrandingImages=async()=>({});export const brandPdf=async()=>new TextEncoder().encode('%PDF-fixture');`}[path]}));
}}]});
const loaded={exports:{}};new Function('require','module','exports',result.outputFiles[0].text)(createRequire(import.meta.url),loaded,loaded.exports);
const api=loaded.exports;
const setup=()=>{globalThis.identityFixture={user:{uid:'admin',isAnonymous:false,getIdToken:async()=> 'fixture-token'},uploads:[]};};
test('account switch during token refresh prevents assessment request',async()=>{
  setup();let calls=0;const prior=globalThis.fetch;
  try{globalThis.fetch=async()=>{calls++;};globalThis.identityFixture.user.getIdToken=async()=>{globalThis.identityFixture.user=null;return 'fixture-token'};
    await assert.rejects(api.learningApi('/history'),/account changed/);assert.equal(calls,0);
  }finally{globalThis.fetch=prior;}
});
test('account switch during response prevents exposing previous student result',async()=>{
  setup();const prior=globalThis.fetch;
  try{globalThis.fetch=async()=>({ok:true,json:async()=>{globalThis.identityFixture.user=null;return {privateScore:80}}});
    await assert.rejects(api.learningApi('/history'),/account changed/);
  }finally{globalThis.fetch=prior;}
});
test('account switch after original upload prevents branded upload and publication metadata',async()=>{
  setup();const file=new File(['%PDF-fixture'],'fixture.pdf',{type:'application/pdf'});
  await assert.rejects(api.uploadBrandedStudyFile(file,'admin',{name:'Fixture'}),/login changed/);
  assert.equal(globalThis.identityFixture.uploads.length,1);
  assert.match(globalThis.identityFixture.uploads[0],/-original-/);
});
test('anonymous upload is rejected before reading or storing files',async()=>{
  setup();globalThis.identityFixture.user.isAnonymous=true;
  await assert.rejects(api.uploadBrandedStudyFile(new File(['x'],'fixture.pdf'),'admin',{name:'Fixture'}),/login changed/);
  assert.equal(globalThis.identityFixture.uploads.length,0);
});
