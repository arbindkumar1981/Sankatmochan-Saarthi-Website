import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { PDFDocument, degrees, PDFName } from 'pdf-lib';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const result = await build({ absWorkingDir: fileURLToPath(new URL('../', import.meta.url)), entryPoints: ['./src/services/noteBranding.ts'], bundle: true, platform: 'node', format: 'esm', write: false });
const { brandPdf } = await import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
const logo = new Uint8Array(await readFile(new URL('../public/sankatmochan-saarthi-logo.png', import.meta.url)));
test('branding preserves every PDF page and original bytes, including landscape and rotated pages', async () => {
  const source = await PDFDocument.create();
  source.addPage([595, 842]); source.addPage([842, 595]);
  for (const angle of [90, 180, 270]) source.addPage([595, 842]).setRotation(degrees(angle));
  for (const [index, page] of source.getPages().entries()) page.drawText(`Biology diagram page ${index + 1}`, { x: 50, y: 100 });
  const bytes = await source.save(), original = bytes.slice();
  const branded = await PDFDocument.load(await brandPdf(bytes, { logo, watermark: logo, name: 'Sankatmochan Saarthi' }));
  assert.deepEqual(bytes, original);
  assert.equal(branded.getPageCount(), 5);
  assert.deepEqual(branded.getPages().map(page => [page.getWidth(), page.getHeight()]), [[627, 874], [874, 627], [874, 627], [627, 874], [874, 627]]);
  for (const page of branded.getPages()) assert.ok(page.node.Resources().lookup(PDFName.of('XObject')).entries().length >= 2);
});
test('invalid PDF input never returns an unbranded file', async () => {
  await assert.rejects(brandPdf(new Uint8Array([1, 2, 3]), { logo, watermark: logo, name: 'Saarthi' }));
});
