import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const bundle = await build({
  absWorkingDir: root, entryPoints: ['./src/services/studyFileUpload.ts'], bundle: true,
  platform: 'node', format: 'esm', write: false, logLevel: 'silent',
  define: { 'import.meta.env.VITE_SAARTHI_API_URL': '"https://api.example.test"' },
  plugins: [{ name: 'upload-io', setup(builder) {
    builder.onResolve({ filter: /^firebase\/storage$|^\.\/firebase$|^\.\/noteBranding$/ }, args => ({ path: args.path, namespace: 'upload-mock' }));
    builder.onLoad({ filter: /.*/, namespace: 'upload-mock' }, ({ path }) => ({ loader: 'js', contents:
      path === './firebase' ? 'export const auth={get currentUser(){return globalThis.uploadState.user}};export const storage={};' :
      path === './noteBranding' ? 'export const loadBrandingImages=async()=>({});export const brandPdf=async bytes=>{globalThis.uploadState.pdf=bytes;return new TextEncoder().encode("%PDF-branded");};' :
      'export const ref=(_,path)=>path;export const uploadBytes=async(path,file,metadata)=>{globalThis.uploadState.saved.push({path,file,metadata});};'
    }));
  }}]
});
const { uploadBrandedStudyFile } = await import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text).toString('base64'));
const config = { name: 'Saarthi', logoUrl: '/logo.png' };
const identity = { uid: 'admin', isAnonymous: false, getIdToken: async () => 'firebase-test' };

test('PPTX conversion sends Firebase identity and format, brands PDF, and preserves private original', async () => {
  const savedFetch = globalThis.fetch;
  globalThis.uploadState = { user: identity, saved: [] };
  const source = new File(['presentation-original'], 'Cells.pptx', { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
  globalThis.fetch = async (url, options) => {
    assert.equal(url, 'https://api.example.test/v1/materials/convert-office');
    assert.equal(options.headers['X-Document-Format'], 'pptx');
    assert.equal(options.headers.Authorization, 'Bearer firebase-test');
    assert.equal(options.body, source);
    return new Response('%PDF-converted', { status: 200 });
  };
  try {
    const result = await uploadBrandedStudyFile(source, 'admin', config);
    assert.equal(new TextDecoder().decode(globalThis.uploadState.pdf), '%PDF-converted');
    assert.equal(globalThis.uploadState.saved[0].file, source);
    assert.match(globalThis.uploadState.saved[0].path, /-original-Cells\.pptx$/);
    assert.match(globalThis.uploadState.saved[1].path, /-branded-Cells\.pdf$/);
    assert.equal(result.attachmentType, 'application/pdf');
    assert.equal(result.attachmentName, 'Cells.pdf');
    assert.equal(await globalThis.uploadState.saved[1].file.text(), '%PDF-branded');
  } finally { globalThis.fetch = savedFetch; delete globalThis.uploadState; }
});

test('failed or invalid conversion never uploads original or unbranded content', async () => {
  const savedFetch = globalThis.fetch;
  try {
    for (const response of [new Response('{"detail":"Administrator login required."}', { status: 403 }), new Response('not-pdf')]) {
      globalThis.uploadState = { user: identity, saved: [] };
      globalThis.fetch = async () => response;
      await assert.rejects(uploadBrandedStudyFile(new File(['x'], 'notes.docx'), 'admin', config));
      assert.deepEqual(globalThis.uploadState.saved, []);
    }
  } finally { globalThis.fetch = savedFetch; delete globalThis.uploadState; }
});

test('legacy PPT and mismatched admin identity are rejected without conversion or upload', async () => {
  const savedFetch = globalThis.fetch;
  globalThis.uploadState = { user: { ...identity, uid: 'other' }, saved: [] };
  globalThis.fetch = async () => assert.fail('Rejected file must not reach converter');
  try {
    await assert.rejects(uploadBrandedStudyFile(new File(['x'], 'old.ppt'), 'admin', config), /Export older/);
    await assert.rejects(uploadBrandedStudyFile(new File(['x'], 'notes.pptx'), 'admin', config), /Administrator login required/);
    assert.deepEqual(globalThis.uploadState.saved, []);
  } finally { globalThis.fetch = savedFetch; delete globalThis.uploadState; }
});
