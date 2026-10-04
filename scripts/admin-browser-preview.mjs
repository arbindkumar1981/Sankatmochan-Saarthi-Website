// Builds an isolated local UI test fixture. Test mocks are never included in
// the Vite production build and this server cannot access credentials or data.
import {build} from 'esbuild';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)), output=path.join(root,'.admin-preview');
await mkdir(output,{recursive:true});
await build({absWorkingDir:root,entryPoints:['tests/fixtures/admin-preview.tsx'],bundle:true,format:'esm',platform:'browser',outdir:output,loader:{'.css':'empty'},define:{'import.meta.env':'{}','process.env.NODE_ENV':'"development"'},plugins:[{name:'test-fixture-only',setup(builder){
 builder.onResolve({filter:/AuthContext$/},()=>({path:path.join(root,'tests/fixtures/admin-preview-auth.tsx')}));
 builder.onResolve({filter:/(?:services\/firebase|^\.\/firebase)$/},()=>({path:path.join(root,'tests/fixtures/admin-preview-firebase.ts')}));
 builder.onResolve({filter:/^firebase\/firestore$/},()=>({path:path.join(root,'tests/fixtures/admin-preview-firestore.ts')}));
 builder.onResolve({filter:/^firebase\/storage$/},()=>({path:'storage-mock',namespace:'test-only'}));
 builder.onLoad({filter:/.*/,namespace:'test-only'},()=>({contents:'export const ref=()=>({});export const uploadBytes=async()=>{throw new Error("Upload requires a real authenticated Firebase session; the local fixture never sends files.")};export const getDownloadURL=async()=>"";'}));
}}]});
// Use production-generated CSS for a visual check; only the JS IO is mocked.
const dist=path.join(root,'dist','assets');
const {readdir}=await import('node:fs/promises');
const css=(await readdir(dist)).find(name=>name.endsWith('.css'));
await writeFile(path.join(output,'styles.css'),await readFile(path.join(dist,css)));
await writeFile(path.join(output,'index.html'),'<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Local Admin UI Test</title><link rel="stylesheet" href="/styles.css"></head><body><div style="background:#fff3cd;padding:8px;font:14px Arial">LOCAL TEST ONLY — Firebase writes use isolated local browser storage.</div><div id="root"></div><script type="module" src="/admin-preview.js"></script></body></html>');
const server=createServer(async(request,response)=>{
 try {
  const name=decodeURIComponent(new URL(request.url,'http://127.0.0.1').pathname).slice(1)||'index.html';
  if(name.includes('..')||name.includes('\\')){response.writeHead(403);response.end();return;}
  const file=['index.html','admin-preview.js','styles.css'].includes(name)?path.join(output,name):path.join(root,'public',name);
  const type=name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':name.endsWith('.png')?'image/png':name.endsWith('.jpg')?'image/jpeg':'text/html';
  const bytes=await readFile(file);response.writeHead(200,{'Content-Type':type});response.end(bytes);
 } catch {response.writeHead(404);response.end('Not found');}
});
server.listen(3011,'127.0.0.1',()=>console.log('Isolated Admin UI test: http://127.0.0.1:3011'));
