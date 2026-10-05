import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from './firebase';
import type { WebsiteConfig } from './websiteConfig';

export async function uploadBrandedStudyFile(file: File, adminUid: string, config: Pick<WebsiteConfig, 'name' | 'logoUrl'>) {
  if (!adminUid || file.size > 50 * 1024 * 1024) throw new Error('Choose a study file up to 50 MB.');
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!['pdf', 'docx', 'png', 'jpg', 'jpeg', 'webp', 'txt'].includes(extension || '')) throw new Error('Automatic branding supports PDF, Word (.docx), images and TXT. Export older Word/PowerPoint files as PDF before uploading.');
  const { loadBrandingImages, brandPdf } = await import('./noteBranding');
  const branding = await loadBrandingImages(config.logoUrl, config.name);
  const source = new Uint8Array(await file.arrayBuffer());
  const word = extension === 'docx';
  const bytes = word ? await (await import('./wordBranding')).brandDocx(source, branding) : await brandPdf(extension === 'pdf' ? source : await browserFilePdf(file), branding);
  const base = `learning-materials/${adminUid}/${crypto.randomUUID()}`;
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const originalStoragePath = `${base}-original-${safeName}`;
  const attachmentName = word || extension === 'pdf' ? file.name : `${file.name.replace(/\.[^.]+$/, '')}.pdf`;
  const storagePath = `${base}-branded-${attachmentName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  await uploadBytes(ref(storage, originalStoragePath), file, { contentType: file.type || 'application/octet-stream' });
  const branded = new Blob([new Uint8Array(bytes)], { type: word ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'application/pdf' });
  const fileRef = ref(storage, storagePath);
  await uploadBytes(fileRef, branded, { contentType: branded.type });
  return { storagePath, originalStoragePath, attachmentUrl: await getDownloadURL(fileRef), attachmentName, attachmentType: branded.type, attachmentSize: branded.size, brandingVersion: 1, brandedWith: config.name };
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
