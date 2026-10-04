function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function notesPdfHtml(title: string, text: string, curriculum: string[], brand = 'Sankatmochansaarthi'): string {
  if (!text.trim() || text.length > 200_000) throw new Error('Choose prepared notes of up to 200,000 characters.');
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>@page{size:A4;margin:18mm}body{font-family:Arial,'Nirmala UI','Noto Sans Devanagari',sans-serif;line-height:1.55;color:#292524}.brand{color:#9a3412;font-weight:800;font-size:22px;border-bottom:2px solid #f59e0b;padding-bottom:8px}.meta{font-size:12px;color:#57534e;margin:8px 0 20px}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:inherit}.wm{position:fixed;bottom:4mm;right:4mm;color:#a8a29e;font-size:9px}</style></head><body><div class="brand">${escapeHtml(brand)}</div><div class="meta">${curriculum.filter(Boolean).map(escapeHtml).join(' • ')}</div><pre>${escapeHtml(text)}</pre><div class="wm">${escapeHtml(brand)} • Personal Learning Copy</div></body></html>`;
}

/** Prepare existing notes locally, then open the browser's Save as PDF dialog. */
export async function openNotesPdf(title: string, text: string, curriculum: string[], brand?: string): Promise<void> {
  const started = performance.now();
  const html = notesPdfHtml(title, text, curriculum, brand);
  const pdfWindow = window.open('', '_blank');
  if (!pdfWindow) throw new Error('Please allow pop-ups to save these notes as PDF.');
  pdfWindow.opener = null;
  try {
    pdfWindow.document.write(html);
    pdfWindow.document.close();
    // Fonts cannot hold PDF preparation indefinitely. Rendering uses local
    // fallback fonts after 1.5 seconds; no server or AI generation is requested.
    let timer: number | undefined;
    try {
      await Promise.race([
        pdfWindow.document.fonts.ready.catch(() => undefined),
        new Promise<void>(resolve => { timer = window.setTimeout(resolve, 1500); }),
      ]);
    } finally { if (timer !== undefined) window.clearTimeout(timer); }
    if (performance.now() - started > 10_000) throw new Error('PDF preparation took too long. Please try again with shorter notes.');
    if (pdfWindow.closed) return;
    pdfWindow.focus();
    pdfWindow.print();
  } catch (error) {
    if (!pdfWindow.closed) pdfWindow.close();
    throw error;
  }
}
