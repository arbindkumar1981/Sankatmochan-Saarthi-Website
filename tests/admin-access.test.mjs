import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

// Isolated client tests. Firebase IO is mocked only in this test bundle; the
// production application continues using the authenticated SDK and its rules.
const authMock = `let identity = { user: null, isAdmin: false }; export const setIdentity = value => identity = value; export const useAuth = () => identity;`;
const firestoreMock = `let revision=0, writes=[], attempts=0;
export const setup = next => {revision=next;writes=[];attempts=0};
export const state = () => ({writes,attempts});
export const doc = (_db,...parts) => parts.join('/');
export const onSnapshot = () => () => {};
export const runTransaction = async (_db, callback) => { attempts++; const pending=[]; await callback({get: async () => ({data: () => ({revision})}),set:(reference,data) => pending.push({reference,data})}); writes.push(...pending); };`;
const result = await build({
  absWorkingDir: fileURLToPath(new URL('../', import.meta.url)),
  stdin: { resolveDir: fileURLToPath(new URL('../', import.meta.url)), loader: 'tsx', contents: `
    import React from 'react'; import {renderToStaticMarkup} from 'react-dom/server';
    import {WebsiteProvider,useWebsite,WebsiteText} from './src/context/WebsiteContext';
    import {DEFAULT_WEBSITE_CONFIG} from './src/services/websiteConfig';
    import {setIdentity} from './src/context/AuthContext'; import {setup,state} from 'firebase/firestore';
    let captured;
    function Capture(){ captured=useWebsite(); return <WebsiteText original="Test heading"/>; }
    export function render(identity,revision=0){ setIdentity(identity);setup(revision);return renderToStaticMarkup(<WebsiteProvider><Capture/></WebsiteProvider>); }
    export const handle=()=>captured; export {state,DEFAULT_WEBSITE_CONFIG};` },
  bundle: true, platform: 'node', format: 'cjs', write: false,
  plugins: [{ name: 'isolated-test-io', setup(builder) {
    builder.onResolve({ filter: /AuthContext$/ }, () => ({ path: 'auth', namespace: 'test-io' }));
    builder.onResolve({ filter: /services\/firebase$/ }, () => ({ path: 'firebase', namespace: 'test-io' }));
    builder.onResolve({ filter: /^firebase\/firestore$/ }, () => ({ path: 'firestore', namespace: 'test-io' }));
    builder.onLoad({ filter: /.*/, namespace: 'test-io' }, args => ({ contents: args.path === 'auth' ? authMock : args.path === 'firestore' ? firestoreMock : 'export const db = {};', loader: 'js' }));
  }}]
});
const loaded = { exports: {} };
new Function('require', 'module', 'exports', result.outputFiles[0].text)(createRequire(import.meta.url), loaded, loaded.exports);
const api = loaded.exports;
const settings = () => structuredClone(api.DEFAULT_WEBSITE_CONFIG);

test('signed-out, student and anonymous clients cannot write website settings', async () => {
  for (const identity of [{user:null,isAdmin:false}, {user:{uid:'student',isAnonymous:false},isAdmin:false}, {user:{uid:'guest',isAnonymous:true},isAdmin:true}]) {
    api.render(identity);
    await assert.rejects(() => api.handle().save(settings(),0), /Administrator login/);
    assert.equal(api.state().attempts,0); assert.deepEqual(api.state().writes,[]);
  }
});

test('authenticated admin saves only public config with an incremented revision', async () => {
  api.render({user:{uid:'admin',isAnonymous:false},isAdmin:true});
  const next=settings();next.name='Updated Website';
  await api.handle().save(next,0);
  assert.equal(api.state().writes.length,1);
  assert.equal(api.state().writes[0].reference,'curriculum_nodes/_website_config');
  assert.equal(api.state().writes[0].data.revision,1);
  assert.equal(api.state().writes[0].data.config.name,'Updated Website');
  assert.equal('user' in api.state().writes[0].data,false);
  assert.equal(api.state().writes.some(item => item.reference.startsWith('admin_audit_')),false, 'browser must not manufacture server audit events');
});

test('stale admin edits are rejected atomically', async () => {
  api.render({user:{uid:'admin',isAnonymous:false},isAdmin:true},3);
  await assert.rejects(() => api.handle().save(settings(),0), /Another admin/);
  assert.deepEqual(api.state().writes,[]);
});

test('invalid admin settings never start a transaction', async () => {
  api.render({user:{uid:'admin',isAnonymous:false},isAdmin:true});
  const next=settings();next.logoUrl='javascript:alert(1)';
  await assert.rejects(() => api.handle().save(next,0), /Images must/);
  assert.equal(api.state().attempts,0);
});

test('editable website text renders as escaped text rather than executable HTML', () => {
  api.DEFAULT_WEBSITE_CONFIG.copy['Test heading'] = { replacement: '<img src=x onerror=alert(1)>' };
  const html = api.render({user:null,isAdmin:false});
  assert.ok(html.includes('&lt;img'));assert.ok(!html.includes('<img'));
  delete api.DEFAULT_WEBSITE_CONFIG.copy['Test heading'];
});
