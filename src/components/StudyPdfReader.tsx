import React, { useEffect, useRef, useState } from 'react';
import { getDocument, GlobalWorkerOptions, type PDFDocumentProxy } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { useAuth } from '../context/AuthContext';
import { ProtectedMaterial } from './ProtectedMaterial';

GlobalWorkerOptions.workerSrc = workerUrl;

export function StudyPdfReader({ contentId }: { contentId: string }) {
  const { user } = useAuth();
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [width, setWidth] = useState(600);
  const container = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const observer = new ResizeObserver(entries => setWidth(Math.max(180, Math.min(1000, entries[0].contentRect.width))));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    let document: PDFDocumentProxy | undefined;
    let active = true;
    let task: ReturnType<typeof getDocument> | undefined;
    const timer = setTimeout(() => controller.abort(), 60000);
    setPdf(null); setPage(1); setError(''); setLoading(true);
    if (canvas.current) { canvas.current.width = 0; canvas.current.height = 0; }
    if (!user || user.isAnonymous) { clearTimeout(timer); setLoading(false); return; }
    (async () => {
      try {
        const api = import.meta.env.VITE_SAARTHI_API_URL;
        if (!api) throw new Error('PDF reading is unavailable.');
        const response = await fetch(`${api.replace(/\/$/, '')}/v1/materials/${encodeURIComponent(contentId)}/pdf`, { headers: { Authorization: `Bearer ${await user.getIdToken()}` }, signal: controller.signal, cache: 'no-store' });
        if (!response.ok) { const data = await response.json().catch(() => ({})); throw new Error(data.detail || 'Unable to open this PDF.'); }
        const data = new Uint8Array(await response.arrayBuffer());
        if (data.byteLength > 50 * 1024 * 1024) throw new Error('This PDF is too large to read. Ask Admin to split it.');
        if (controller.signal.aborted) return;
        task = getDocument({ data, useWasm: false, enableXfa: false, stopAtErrors: true });
        document = await task.promise;
        if (controller.signal.aborted) { await task.destroy(); return; }
        if (!document.numPages || document.numPages > 500) throw new Error('Ask Admin to split this PDF into smaller notes.');
        setPdf(document);
      } catch (error) {
        if (active) setError(controller.signal.aborted ? 'PDF loading timed out. Please reopen it.' : error instanceof Error ? error.message : 'Unable to open this PDF.');
      } finally { clearTimeout(timer); if (active) setLoading(false); }
    })();
    return () => { active = false; controller.abort(); clearTimeout(timer); void task?.destroy(); if (canvas.current) { canvas.current.width = 0; canvas.current.height = 0; } };
  }, [contentId, user?.uid]);
  useEffect(() => {
    if (!pdf || !canvas.current) return;
    let cancelled = false;
    let render: ReturnType<Awaited<ReturnType<PDFDocumentProxy['getPage']>>['render']> | undefined;
    const element = canvas.current;
    (async () => {
      try {
        const sheet = await pdf.getPage(page);
        if (cancelled) return;
        const original = sheet.getViewport({ scale: 1 });
        const scale = Math.min(width / original.width, 3000 / original.height);
        const dpr = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(4000000 / (original.width * original.height * scale * scale)));
        const viewport = sheet.getViewport({ scale: scale * dpr });
        element.width = Math.ceil(viewport.width); element.height = Math.ceil(viewport.height);
        element.style.width = `${viewport.width / dpr}px`; element.style.height = `${viewport.height / dpr}px`;
        render = sheet.render({ canvas: element, viewport, background: '#ffffff' });
        await render.promise;
      } catch (error) { if (!cancelled) setError('Unable to render this PDF page. Reopen the material or contact Admin.'); }
    })();
    return () => { cancelled = true; render?.cancel(); };
  }, [pdf, page, width]);
  return <div ref={container} className="min-w-0 w-full"><ProtectedMaterial>
    {loading && !error && <p role="status">Opening your PDF…</p>}
    {error && <p role="alert" className="text-red-700 border rounded-xl p-3">{error}</p>}
    {pdf && !error && <div className="flex items-center gap-3 mb-3"><button className="border rounded-lg p-2" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page} / {pdf.numPages}</span><button className="border rounded-lg p-2" disabled={page >= pdf.numPages} onClick={() => setPage(page + 1)}>Next</button></div>}
    <canvas ref={canvas} aria-label={`Study PDF page ${page}`} className="max-w-full border rounded-lg" hidden={!pdf || Boolean(error)} />
  </ProtectedMaterial></div>;
}
