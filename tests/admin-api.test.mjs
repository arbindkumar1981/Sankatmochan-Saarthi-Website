import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
const result = await build({
  entryPoints:['src/services/adminApi.ts'], bundle:true, platform:'node', format:'cjs', write:false,
  define:{'import.meta.env.VITE_SAARTHI_API_URL':JSON.stringify('https://synthetic.example.test')},
  plugins:[{name:'test-auth', setup(builder){
    builder.onResolve({filter:/^\.\/firebase$/},()=>({path:'auth',namespace:'test'}));
    builder.onLoad({filter:/.*/,namespace:'test'},()=>({contents:'export const auth = globalThis.__syntheticAdminAuth;'}));
  }}],
});
const identity={isAnonymous:false,getIdToken:async()=>'synthetic-token'};
globalThis.__syntheticAdminAuth={currentUser:identity};
const loaded={exports:{}};
new Function('require','module','exports',result.outputFiles[0].text)(createRequire(import.meta.url),loaded,loaded.exports);
const {adminRead}=loaded.exports;
test('admin read authenticates, disables caching and never exposes server error details',async()=>{
  const original=globalThis.fetch;
  try {
    globalThis.fetch=async(url,options)=>{
      assert.equal(url,'https://synthetic.example.test/v1/admin/topic-mastery');
      assert.equal(options.cache,'no-store');
      assert.equal(options.headers.Authorization,'Bearer synthetic-token');
      return {ok:false,status:403,json:async()=>({detail:'private internal details'})};
    };
    await assert.rejects(adminRead('/topic-mastery'),/Administrator access is required/);
  } finally {globalThis.fetch=original;}
});
test('sign-out while reading response body cannot return previous account data',async()=>{
  const original=globalThis.fetch;
  try {
    globalThis.__syntheticAdminAuth.currentUser=identity;
    globalThis.fetch=async()=>({ok:true,json:async()=>{
      globalThis.__syntheticAdminAuth.currentUser=null;
      return {rows:[{student_name:'Synthetic learner'}]};
    }});
    await assert.rejects(adminRead('/topic-mastery'),/Account changed/);
  } finally {globalThis.fetch=original;globalThis.__syntheticAdminAuth.currentUser=identity;}
});
test('anonymous and signed-out identities make no network request',async()=>{
  const original=globalThis.fetch;
  let requests=0;
  try {
    globalThis.fetch=async()=>{requests++;throw Error('Unexpected request');};
    for(const user of [null,{isAnonymous:true}]){
      globalThis.__syntheticAdminAuth.currentUser=user;
      await assert.rejects(adminRead('/topic-mastery'),/sign-in required/);
    }
    assert.equal(requests,0);
  } finally {globalThis.fetch=original;globalThis.__syntheticAdminAuth.currentUser=identity;}
});
