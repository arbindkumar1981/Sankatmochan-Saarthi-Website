import { PDFDocument, StandardFonts, degrees } from 'pdf-lib';

export interface BrandingImages { logo: Uint8Array; watermark: Uint8Array; name: string; logoAspectRatio?: number }

export async function brandPdf(source: Uint8Array, branding: BrandingImages): Promise<Uint8Array> {
  const original = await PDFDocument.load(source);
  if (!original.getPageCount() || original.getPageCount() > 500) throw new Error('Use a PDF with 1–500 pages. Split larger notes before uploading.');
  const output = await PDFDocument.create();
  const logo = await output.embedPng(branding.logo);
  const watermark = await output.embedPng(branding.watermark);
  const font = await output.embedFont(StandardFonts.Helvetica);
  for (const [index, sourcePage] of original.getPages().entries()) {
    const embedded = await output.embedPage(sourcePage);
    const angle = ((sourcePage.getRotation().angle % 360) + 360) % 360;
    const rotated = angle === 90 || angle === 270;
    const width = rotated ? sourcePage.getHeight() : sourcePage.getWidth();
    const height = rotated ? sourcePage.getWidth() : sourcePage.getHeight();
    const page = output.addPage([width + 32, height + 88]);
    const x = 16 + (angle === 270 ? sourcePage.getHeight() : angle === 180 ? sourcePage.getWidth() : 0);
    const y = 28 + (angle === 180 ? sourcePage.getHeight() : angle === 90 ? sourcePage.getWidth() : 0);
    // PDF /Rotate is clockwise; the drawing transform uses counterclockwise angles.
    page.drawPage(embedded, { x, y, rotate: degrees(-angle) });
    const logoWidth = Math.min(180, width * 0.45, 44 * logo.width / logo.height);
    page.drawImage(logo, { x: 16, y: height + 36, width: logoWidth, height: logoWidth * logo.height / logo.width });
    const watermarkWidth = width * 0.75;
    page.drawImage(watermark, { x: (page.getWidth() - watermarkWidth) / 2, y: (page.getHeight() - watermarkWidth * watermark.height / watermark.width) / 2, width: watermarkWidth, height: watermarkWidth * watermark.height / watermark.width, opacity: 0.12 });
    page.drawText(`Page ${index + 1} / ${original.getPageCount()}`, { x: 16, y: 10, size: 9, font });
  }
  output.setTitle(`${branding.name} — Study notes`);
  return output.save();
}

export async function loadBrandingImages(logoUrl: string, name: string): Promise<BrandingImages> {
  const image = new Image(); image.crossOrigin = 'anonymous';
  await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error('Unable to load the website logo. Check the logo settings before uploading.')); image.src = logoUrl; });
  const canvas = document.createElement('canvas'); canvas.width = 1000; canvas.height = Math.max(1, Math.round(1000 * image.naturalHeight / image.naturalWidth));
  const context = canvas.getContext('2d'); if (!context) throw new Error('Document branding is unavailable in this browser.');
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const png = async (target: HTMLCanvasElement) => new Uint8Array(await (await new Promise<Blob>((resolve, reject) => target.toBlob(blob => blob ? resolve(blob) : reject(new Error('Unable to prepare branding image.')), 'image/png'))).arrayBuffer());
  const logo = await png(canvas);
  canvas.width = 1400; canvas.height = 220;
  context.fillStyle = '#1c4b74'; context.textAlign = 'center'; context.textBaseline = 'middle';
  let size = 85; context.font = `bold ${size}px sans-serif`;
  while (context.measureText(name).width > 1340 && size > 18) { context.font = `bold ${--size}px sans-serif`; }
  context.fillText(name, 700, 110);
  return { logo, watermark: await png(canvas), name, logoAspectRatio: image.naturalWidth / image.naturalHeight };
}
