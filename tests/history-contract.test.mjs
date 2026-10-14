import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const result=await build({absWorkingDir:root,bundle:true,platform:'node',format:'cjs',write:false,
  define:{'import.meta.env':JSON.stringify({VITE_SAARTHI_API_URL:'https://fixture.invalid/'})},
  stdin:{resolveDir:root,contents:`export {learningHistory} from './src/services/learningApi';`},
  plugins:[{name:'synthetic-auth',setup(b){b.onResolve({filter:/\.\/firebase$/},()=>({path:'auth',namespace:'fixture'}));b.onLoad({filter:/.*/,namespace:'fixture'},()=>({contents:`const user={isAnonymous:false,getIdToken:async()=> 'synthetic-token'};export const auth={currentUser:user};`}));}}]});
const loaded={exports:{}};
new Function('require','module','exports',result.outputFiles[0].text)(createRequire(import.meta.url),loaded,loaded.exports);
test('history uses the backend GET route and Firebase identity, with the matching response shape',async()=>{
  const previous=globalThis.fetch;
  const history={results:[],mistakes:[]};
  try{
    globalThis.fetch=async(url,init)=>{
      assert.equal(url,'https://fixture.invalid/v1/website/learning/history');
      assert.equal(init.method,'GET');
      assert.equal(init.headers.Authorization,'Bearer synthetic-token');
      assert.equal(init.body,undefined);
      return new Response(JSON.stringify(history),{status:200});
    };
    assert.deepEqual(await loaded.exports.learningHistory(),history);
  }finally{globalThis.fetch=previous;}
});
