import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const mocks={
  firebase:`export const auth={get currentUser(){return globalThis.authJourney.current}};export const db={};export const googleProvider={};export const handleFirestoreError=()=>{};export const OperationType={UPDATE:'UPDATE'};`,
  auth:`export const onAuthStateChanged=()=>()=>{};export const signOut=async()=>{globalThis.authJourney.current=null};export const signInWithPopup=async()=>{if(globalThis.authJourney.error)throw new Error('Popup cancelled');return {user:globalThis.authJourney.current}};`,
  firestore:`export const doc=(_,collection,id)=>({collection,id});export const getDoc=async ref=>{const record=ref.collection==='admins'?(globalThis.authJourney.admin?{}:null):globalThis.authJourney.profile;return {exists:()=>record!==null&&record!==undefined,data:()=>record}};export const setDoc=async(ref,data)=>{if(globalThis.authJourney.failSave)throw new Error('Profile unavailable');globalThis.authJourney.writes.push({ref,data});};export const updateDoc=async()=>{};`
};
const bundle=await build({absWorkingDir:root,bundle:true,platform:'node',format:'cjs',write:false,logLevel:'silent',stdin:{resolveDir:root,loader:'tsx',contents:`import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import {AuthProvider,useAuth} from './src/context/AuthContext';let context;function Capture(){context=useAuth();return null}export function load(){renderToStaticMarkup(<AuthProvider><Capture/></AuthProvider>);return context}`},plugins:[{name:'isolated-auth-io',setup(builder){
  for(const [filter,path] of [[/services\/firebase$/,'firebase'],[/^firebase\/auth$/,'auth'],[/^firebase\/firestore$/,'firestore']])builder.onResolve({filter},()=>({path,namespace:'auth-test'}));
  builder.onLoad({filter:/.*/,namespace:'auth-test'},args=>({contents:mocks[args.path],loader:'js'}));
}}]});
const loaded={exports:{}};new Function('require','module','exports',bundle.outputFiles[0].text)(createRequire(import.meta.url),loaded,loaded.exports);
const setup=(admin=false)=>{globalThis.authJourney={admin,current:{uid:'synthetic-user',email:'fixture@example.test',displayName:'Fixture'},profile:null,writes:[]};globalThis.localStorage={removeItem:()=>{}};return loaded.exports.load()};

test('fresh student login cannot become admin by selecting the admin tab',async()=>{
  const context=setup();await context.signInWithGoogle('admin');
  const [{data}]=globalThis.authJourney.writes;assert.equal(data.role,'student');assert.equal(data.uid,'synthetic-user');assert.ok(!Object.values(data).includes(undefined));
});
test('fresh designated administrator gets role only from protected admin membership',async()=>{
  const context=setup(true);await context.signInWithGoogle('student');assert.equal(globalThis.authJourney.writes[0].data.role,'admin');
});
test('cancelled Google popup and failed profile registration report failure without fabricated success',async()=>{
  for(const flag of ['error','failSave']){const context=setup();globalThis.authJourney[flag]=true;await assert.rejects(()=>context.signInWithGoogle('student'));assert.deepEqual(globalThis.authJourney.writes,[]);}
});
test('browser passcodes cannot authenticate administrators',async()=>{
  const context=setup();assert.equal(await context.signInAsAdminWithPasscode('anything'),false);assert.deepEqual(globalThis.authJourney.writes,[]);
});
