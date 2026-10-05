import { ref, uploadBytes } from 'firebase/storage';
import { auth, storage } from './firebase';
import type { WebsiteConfig } from './websiteConfig';

export async function uploadBrandedStudyFile(file: File, adminUid: string, config: Pick<WebsiteConfig, 'name' | 'logoUrl'>, onStatus?: (message: string) => void) {
  if (!adminUid || file.size > 50 * 1024 * 1024) throw new Error('Choose a study file up to 50 MB.');
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!['pdf', 'docx', 'png', 'jpg', 'jpeg', 'webp', 'txt'].includes(extension || '')) throw new Error('Automatic branding supports PDF, Word (.docx), images and TXT. Export older Word/PowerPoint files as PDF before uploading.');
  const { loadBrandingImages, brandPdf } = await import('./noteBranding');
  const branding = await loadBrandingImages(config.logoUrl, config.name);
  const source = new Uint8Array(await file.arrayBuffer());
  const word = extension === 'docx';
  let pdfSource: Uint8Array;
  if (word) {
    if (file.size > 12 * 1024 * 1024) throw new Error('Word files must be smaller than 12 MB. Split larger notes or upload a PDF.');
    if (!auth.currentUser || auth.currentUser.uid !== adminUid || auth.currentUser.isAnonymous) throw new Error('Administrator login required.');
    const api = import.meta.env.VITE_SAARTHI_API_URL;
    if (!api) throw new Error('Word conversion is unavailable. Upload a PDF.');
    onStatus?.('Converting Word to PDF…');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 105000);
    try {
      const response = await fetch(`${api.replace(/\/$/, '')}/v1/materials/convert-docx`, { method: 'POST', headers: { Authorization: `Bearer ${await auth.currentUser.getIdToken()}`, 'Content-Type': 'application/octet-stream' }, body: file, signal: controller.signal });
      if (!response.ok) { const error = await response.json().catch(() => ({})); throw new Error(error.detail || 'Word conversion failed. Retry or upload a PDF.'); }
      pdfSource = new Uint8Array(await response.arrayBuffer());
      if (pdfSource.byteLength > 50 * 1024 * 1024 || new TextDecoder().decode(pdfSource.slice(0, 5)) !== '%PDF-') throw new Error('Conversion did not return a valid PDF.');
    } catch (error) {
      if (controller.signal.aborted) throw new Error('Word conversion timed out. Split the notes or upload a PDF.');
      throw error;
    } finally { clearTimeout(timeout); }
  } else pdfSource = extension === 'pdf' ? source : await browserFilePdf(file);
  onStatus?.('Adding logo and watermark…');
  const bytes = await brandPdf(pdfSource, branding);
  if (bytes.byteLength > 50 * 1024 * 1024) throw new Error('The branded PDF is larger than 50 MB. Split the notes before uploading.');
  const base = `learning-materials/${adminUid}/${crypto.randomUUID()}`;
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const originalStoragePath = `${base}-original-${safeName}`;
  const attachmentName = extension === 'pdf' ? file.name : `${file.name.replace(/\.[^.]+$/, '')}.pdf`;
  const storagePath = `${base}-branded-${attachmentName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  onStatus?.('Saving PDF and private original…');
  await uploadBytes(ref(storage, originalStoragePath), file, { contentType: file.type || 'application/octet-stream' });
  const branded = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
  const fileRef = ref(storage, storagePath);
  await uploadBytes(fileRef, branded, { contentType: branded.type });
  return { storagePath, originalStoragePath, attachmentUrl: '', attachmentName, attachmentType: branded.type, attachmentSize: branded.size, brandingVersion: 2, brandedWith: config.name };
}

async function browserFilePdf(file: File): Promise<Uint8Array> {
  const { PDFDocument } = await import('pdf-lib');
  const pdf = await PDFDocument.create();
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d'); if (!context) throw new Error('Unable to prepare notes.');
  const addPage = async () => {
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Unable to prepare notes page.')), 'image/png'));
    const image = await pdf.embedPng(await blob.arrayBuffer());
    const page = pdf.addPage([595, 595 * canvas.height / canvas.width]); page.drawImage(image, { x: 0, y: 0, width: page.getWidth(), height: page.getHeight() });
  };
  if (/\.txt$/i.test(file.name)) {
    if (file.size > 1024 * 1024) throw new Error('TXT notes must be smaller than 1 MB. Split larger notes.');
    canvas.width = 900; canvas.height = 1270;
    const reset = () => { context.fillStyle = '#fff'; context.fillRect(0, 0, 900, 1270); context.fillStyle = '#222'; context.font = '22px sans-serif'; };
    reset(); let y = 50;
    for (const paragraph of (await file.text()).split(/\r?\n/)) {
      let line = '';
      for (const char of paragraph + '\n') {
        if (char === '\n' || context.measureText(line + char).width > 800) {
          context.fillText(line, 50, y); y += 32; line = '';
          if (y > 1200) { await addPage(); if (pdf.getPageCount() >= 500) throw new Error('Split these notes into smaller files.'); reset(); y = 50; }
        }
        if (char !== '\n') line += char;
      }
    }
    if (y > 50 || !pdf.getPageCount()) await addPage();
  } else {
    const url = URL.createObjectURL(file);
    try {
      const image = new Image(); await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error('Invalid study image.')); image.src = url; });
      if (image.naturalWidth * image.naturalHeight > 25000000) throw new Error('Resize images to less than 25 megapixels before uploading.');
      canvas.width = image.naturalWidth; canvas.height = image.naturalHeight; context.drawImage(image, 0, 0); await addPage();
    } finally { URL.revokeObjectURL(url); }
  }
  return pdf.save();
}
