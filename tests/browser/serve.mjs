import {createServer} from 'node:http';
import {readFile,readdir} from 'node:fs/promises';
import {build} from 'esbuild';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const bundle=await build({absWorkingDir:root,stdin:{contents:`
import React from 'react';import {createRoot} from 'react-dom/client';
import {AdminWorkspace} from './src/components/AdminWorkspace';
createRoot(document.getElementById('root')).render(<main className="min-h-screen bg-slate-50 p-3 font-sans text-slate-800 sm:p-6"><h1 className="mb-4 text-2xl font-bold">Saarthi administration test fixture</h1><AdminWorkspace/></main>);`,resolveDir:root,loader:'tsx'},bundle:true,platform:'browser',format:'iife',write:false,
define:{'import.meta.env.VITE_CMS_TENANT_ID':'"synthetic-school"','import.meta.env.VITE_SAARTHI_API_URL':'"http://127.0.0.1:4179/mock"'},plugins:[{name:'synthetic-identities',setup(b){
 b.onResolve({filter:/services\/firebase$|^\.\/firebase$/},()=>({path:'auth',namespace:'synthetic'}));
 b.onResolve({filter:/services\/adminMfa$/},()=>({path:'mfa',namespace:'synthetic'}));
 b.onResolve({filter:/^\.\/NotesManagement$/},()=>({path:'notes',namespace:'synthetic'}));
 b.onLoad({filter:/.*/,namespace:'synthetic'},args=>({contents:args.path==='auth'?`const user={isAnonymous:false,emailVerified:true,getIdToken:async()=>'synthetic-only'}; export const auth={currentUser:user,onAuthStateChanged:fn=>{queueMicrotask(()=>fn(user));return ()=>{};},onIdTokenChanged:fn=>{queueMicrotask(()=>fn(user));return ()=>{};}};`:args.path==='notes'?`export function NotesManagement(){return null;}`:`export const adminSignIn=async()=>null,adminReauthenticate=async()=>null,enrollSecret=async()=>({secretKey:'SYNTHETIC-FIXTURE-ONLY'}),completeEnrollment=async()=>{},completeChallenge=async()=>{};`}));
}}]});
const assets=await readdir(path.join(root,'dist/assets'));
const style=await readFile(path.join(root,'dist/assets',assets.find(name=>/^index-.*\.css$/.test(name))));
const server=createServer((req,res)=>{
 if(req.url==='/app.js'){res.setHeader('Content-Type','text/javascript');res.end(bundle.outputFiles[0].text);}
 else if(req.url==='/styles.css'){res.setHeader('Content-Type','text/css');res.end(style);}
 else {res.setHeader('Content-Type','text/html');res.end('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Saarthi synthetic browser fixture</title><link rel="stylesheet" href="/styles.css"></head><body><div id="root"></div><script src="/app.js"></script></body></html>');}
});server.listen(4179,'127.0.0.1');
