import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

const result = await build({ entryPoints: ['src/services/managedNotes.ts'], bundle: true, platform: 'node', format: 'esm', write: false,
  define: { 'import.meta.env.VITE_SAARTHI_API_URL': '"https://api.example.test"' },
  plugins: [{ name: 'isolated-auth', setup(b) { b.onResolve({ filter: /^\.\/firebase$/ }, () => ({ path: 'auth', namespace: 'test' })); b.onLoad({ filter: /.*/, namespace: 'test' }, () => ({ contents: 'export const auth = globalThis.__notesTestAuth;' })); } }] });
globalThis.__notesTestAuth = { currentUser: null };
const { noteFile, notesRequest } = await import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
let sent;
beforeEach(() => {
  sent = null;
  globalThis.__notesTestAuth.currentUser = { uid: 'synthetic-a', isAnonymous: false, getIdToken: async () => 'synthetic-token' };
  globalThis.XMLHttpRequest = class {
    upload = {}; status = 200; response = { ok: true }; headers = {};
    open(method, url) { this.method = method; this.url = url; }
    setRequestHeader(key, value) { this.headers[key] = value; }
    send(body) { sent = { method: this.method, url: this.url, body, headers: this.headers }; this.upload.onprogress?.({ lengthComputable: true, loaded: 4, total: 8 }); queueMicrotask(() => this.onload()); }
  };
});

test('anonymous authority never sends a notes request', async () => {
  globalThis.__notesTestAuth.currentUser.isAnonymous = true;
  await assert.rejects(notesRequest('?admin=true'), /registered account/);
  assert.equal(sent, null);
});
test('account switch during token refresh cannot send old identity', async () => {
  globalThis.__notesTestAuth.currentUser.getIdToken = async () => { globalThis.__notesTestAuth.currentUser = null; return 'old-token'; };
  await assert.rejects(notesRequest('?admin=true'), /Account changed/);
  assert.equal(sent, null);
});
test('versioned save uses authenticated API and reports upload progress', async () => {
  let progress;
  await notesRequest('/note-a', { action: 'save', version: 3 }, value => { progress = value; });
  assert.equal(sent.method, 'POST');
  assert.equal(sent.url, 'https://api.example.test/v1/notes/note-a');
  assert.equal(sent.headers.Authorization, 'Bearer synthetic-token');
  assert.deepEqual(JSON.parse(sent.body), { action: 'save', version: 3 });
  assert.equal(progress, 50);
});
test('server conflicts remain errors instead of successful local publication', async () => {
  const Base = globalThis.XMLHttpRequest;
  globalThis.XMLHttpRequest = class extends Base { status = 409; response = { detail: 'Reload before saving.' }; };
  await assert.rejects(notesRequest('/note-a', { action: 'publish', version: 1 }), /Reload before saving/);
});
test('supported file payload preserves original bytes and canonical MIME', async () => {
  const payload = await noteFile(new File(['# Matter'], 'matter.md', { type: '' }));
  assert.equal(payload.fileType, 'text/markdown');
  assert.equal(Buffer.from(payload.fileBase64, 'base64').toString(), '# Matter');
});
test('empty and unsupported files are rejected before upload', async () => {
  await assert.rejects(noteFile(new File([], 'empty.pdf')), /12 MiB/);
  await assert.rejects(noteFile(new File(['<script>'], 'notes.html')), /12 MiB/);
});
