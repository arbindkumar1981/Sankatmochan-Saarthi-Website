import 'dotenv/config';
import express from 'express';
import { randomUUID } from 'node:crypto';
import { initializeApp, applicationDefault, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const app = express();
const port = Number(process.env.PORT || 8787);
const allowedOrigin = process.env.SAARTHI_ALLOWED_ORIGIN || '*';
const modelName = process.env.SAARTHI_GENAI_MODEL || 'gemini-2.0-flash';
const geminiApiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY || '';
const youtubeApiKey = process.env.YOUTUBE_DATA_API_KEY || '';
const converterUrl = process.env.SAARTHI_CONVERTER_URL || '';
const skipFirebase = process.env.SAARTHI_BACKEND_SKIP_FIREBASE === '1';

function getFirebaseCredential() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) return applicationDefault();
  try {
    return cert(JSON.parse(raw));
  } catch (error) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON.');
  }
}

if (!skipFirebase && !getApps().length) {
  initializeApp({
    credential: getFirebaseCredential(),
    projectId: process.env.FIREBASE_PROJECT_ID || undefined,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || undefined
  });
}

const auth = skipFirebase
  ? { verifyIdToken: async () => { throw new Error('Firebase disabled in backend test mode.'); } }
  : getAuth();
const db = skipFirebase
  ? { collection: () => ({ doc: () => ({ get: async () => ({ exists: false, data: () => ({}) }) }) }) }
  : getFirestore();
const storage = skipFirebase
  ? { bucket: () => ({ file: () => ({ exists: async () => [false] }) }) }
  : getStorage();

app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Document-Format');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
});

app.use('/v1/website', express.json({ limit: '1mb' }));
app.use('/v1/materials/cleanup-files', express.json({ limit: '128kb' }));

function fail(res, status, detail) {
  res.status(status).json({ detail });
}

function getBearer(req) {
  const raw = req.headers.authorization || '';
  const [scheme, token] = raw.split(' ');
  if (scheme !== 'Bearer' || !token) return '';
  return token;
}

async function requireAuth(req, res, next) {
  const token = getBearer(req);
  if (!token) return fail(res, 401, 'Authorization bearer token is required.');
  try {
    const decoded = await auth.verifyIdToken(token, true);
    if (decoded.firebase?.sign_in_provider === 'anonymous') return fail(res, 403, 'Anonymous access is not allowed.');
    req.user = decoded;
    return next();
  } catch {
    return fail(res, 401, 'Invalid or expired Firebase token.');
  }
}

async function requireAdmin(req, res, next) {
  await requireAuth(req, res, async () => {
    try {
      const adminDoc = await db.collection('admins').doc(req.user.uid).get();
      if (!adminDoc.exists) return fail(res, 403, 'Administrator access is required.');
      req.isAdmin = true;
      return next();
    } catch {
      return fail(res, 500, 'Unable to verify administrator access.');
    }
  });
}

function safePath(value) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 512) return '';
  if (trimmed.includes('..') || trimmed.startsWith('/') || trimmed.startsWith('gs://')) return '';
  return trimmed;
}

async function callGemini(prompt, temperature = 0.35, maxOutputTokens = 3500) {
  if (!geminiApiKey) throw new Error('GOOGLE_GENAI_API_KEY (or GEMINI_API_KEY) is required on the backend.');
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelName)}:generateContent?key=${encodeURIComponent(geminiApiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature, maxOutputTokens }
    })
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = json?.error?.message || 'Model generation failed.';
    throw new Error(message);
  }
  const parts = json?.candidates?.[0]?.content?.parts;
  const text = Array.isArray(parts) ? parts.map(p => (typeof p?.text === 'string' ? p.text : '')).join('\n').trim() : '';
  if (!text) throw new Error('Model returned an empty response.');
  return text;
}

function normalize(value) {
  return String(value || '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function scoreAnswer(modelAnswer, studentAnswer, maxMarks) {
  const modelTokens = new Set(normalize(modelAnswer).split(' ').filter(Boolean));
  const studentTokens = new Set(normalize(studentAnswer).split(' ').filter(Boolean));
  if (!studentTokens.size) {
    return { awarded: 0, feedback: 'No answer submitted. Add key points from the model answer.' };
  }
  let overlap = 0;
  for (const token of studentTokens) if (modelTokens.has(token)) overlap += 1;
  const ratio = modelTokens.size ? overlap / modelTokens.size : 0;
  let awarded = 0;
  if (ratio >= 0.8) awarded = maxMarks;
  else if (ratio >= 0.55) awarded = Math.max(1, Math.round(maxMarks * 0.7));
  else if (ratio >= 0.35) awarded = Math.max(1, Math.round(maxMarks * 0.45));
  else awarded = 0;
  const feedback = ratio >= 0.8
    ? 'Strong answer. Keep this structure and precision.'
    : ratio >= 0.55
      ? 'Good start. Add missing keywords and one concrete example.'
      : ratio >= 0.35
        ? 'Partial understanding. Include definition, process, and key terms.'
        : 'Answer is too far from the expected concept. Revise and retry.';
  return { awarded, feedback };
}

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'saarthi-backend', model: modelName, time: new Date().toISOString() });
});

app.post('/v1/materials/convert-office', requireAdmin, express.raw({ type: '*/*', limit: '12mb' }), async (req, res) => {
  const format = String(req.headers['x-document-format'] || '').toLowerCase();
  if (!['docx', 'pptx'].includes(format)) return fail(res, 400, 'X-Document-Format must be docx or pptx.');
  if (!req.body || !Buffer.isBuffer(req.body) || req.body.length < 8) return fail(res, 400, 'Office file payload is missing or invalid.');
  if (!converterUrl) {
    return fail(res, 501, 'Office conversion is not configured. Set SAARTHI_CONVERTER_URL to your private conversion service.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 110000);
  try {
    const response = await fetch(converterUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'X-Document-Format': format,
        'X-Request-Id': randomUUID()
      },
      body: req.body,
      signal: controller.signal
    });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      return fail(res, response.status, text || 'Office conversion failed.');
    }
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length < 5 || bytes.subarray(0, 5).toString('utf8') !== '%PDF-') return fail(res, 502, 'Converter did not return a valid PDF.');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Cache-Control', 'no-store');
    res.send(bytes);
  } catch (error) {
    if (controller.signal.aborted) return fail(res, 504, 'Office conversion timed out.');
    return fail(res, 502, 'Office conversion service is unavailable.');
  } finally {
    clearTimeout(timeout);
  }
});

app.get('/v1/materials/branding-logo', requireAdmin, async (req, res) => {
  const path = safePath(req.query.path);
  if (!path) return fail(res, 400, 'A valid branding logo path is required.');
  try {
    const bucket = storage.bucket();
    const file = bucket.file(path);
    const [exists] = await file.exists();
    if (!exists) return fail(res, 404, 'Branding logo not found.');
    const [meta] = await file.getMetadata();
    const contentType = String(meta.contentType || '');
    const size = Number(meta.size || 0);
    if (!contentType.startsWith('image/')) return fail(res, 415, 'Branding logo must be an image file.');
    if (size > 5 * 1024 * 1024) return fail(res, 413, 'Branding logo exceeds 5 MB.');
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'no-store');
    file.createReadStream().on('error', () => fail(res, 500, 'Unable to stream branding logo.')).pipe(res);
  } catch {
    return fail(res, 500, 'Unable to load branding logo.');
  }
});

app.get('/v1/materials/:contentId/pdf', requireAuth, async (req, res) => {
  const contentId = String(req.params.contentId || '').trim();
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(contentId)) return fail(res, 400, 'Invalid content id.');
  try {
    const snap = await db.collection('learning_contents').doc(contentId).get();
    if (!snap.exists) return fail(res, 404, 'Content not found.');
    const item = snap.data() || {};
    if (!item.approved || !item.published || item.deleted) return fail(res, 403, 'This material is not available.');
    if (item.attachmentType !== 'application/pdf' || typeof item.storagePath !== 'string') return fail(res, 404, 'PDF file is not available for this content.');

    const path = safePath(item.storagePath);
    if (!path) return fail(res, 404, 'Invalid PDF storage path.');

    const bucket = storage.bucket();
    const file = bucket.file(path);
    const [exists] = await file.exists();
    if (!exists) return fail(res, 404, 'PDF file is missing from storage.');
    const [meta] = await file.getMetadata();
    const size = Number(meta.size || 0);
    if (size > 50 * 1024 * 1024) return fail(res, 413, 'PDF exceeds 50 MB.');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Cache-Control', 'no-store');
    file.createReadStream().on('error', () => fail(res, 500, 'Unable to stream PDF file.')).pipe(res);
  } catch {
    return fail(res, 500, 'Unable to open this PDF.');
  }
});

app.post('/v1/materials/cleanup-files', requireAdmin, async (req, res) => {
  const paths = Array.isArray(req.body?.paths) ? req.body.paths : [];
  const valid = [...new Set(paths.map(safePath).filter(Boolean))].filter(path => path.startsWith('learning-materials/'));
  if (!valid.length) return fail(res, 400, 'No valid learning-materials paths provided.');

  try {
    const bucket = storage.bucket();
    const results = await Promise.allSettled(valid.map(async path => {
      await bucket.file(path).delete({ ignoreNotFound: true });
      return path;
    }));
    const deleted = results.filter(result => result.status === 'fulfilled').length;
    res.json({ deleted, requested: valid.length });
  } catch {
    return fail(res, 500, 'Unable to cleanup files.');
  }
});

app.post('/v1/website/teacher/generate', requireAuth, async (req, res) => {
  const payload = req.body || {};
  const board = String(payload.board || '').trim();
  const classLevel = String(payload.class_level || '').trim();
  const subject = String(payload.subject || '').trim();
  const chapter = String(payload.chapter || '').trim();
  const topic = String(payload.topic || '').trim();
  const assetType = String(payload.asset_type || 'DETAILED_NOTES').trim().toUpperCase();
  const style = String(payload.style_profile || '').slice(0, 3000);
  const language = String(payload.language || 'ENGLISH').trim().toUpperCase();

  if (!board || !classLevel || !subject || !chapter || !topic) return fail(res, 400, 'board, class_level, subject, chapter and topic are required.');

  const strictJsonByAsset = {
    TEST: 'Return ONLY JSON as {"questions":[{"questionText":"...","options":["A","B","C","D"],"correctIndex":0,"explanation":"...","marks":1}]} with 8-15 questions.',
    FLASHCARDS: 'Return ONLY JSON as {"flashcards":[{"question":"...","answer":"...","hint":"..."}]} with 10-25 cards.',
    MIND_MAP: 'Return ONLY JSON as {"nodes":[{"id":"n1","label":"...","description":"...","children":["n2"]}]} with valid child ids only.'
  };

  const outputRule = strictJsonByAsset[assetType] || 'Return clean educational notes in markdown with short headings and bullet points.';

  const prompt = [
    'You are Saarthi Teacher Agent for Indian school students.',
    `Board: ${board}`,
    `Class: ${classLevel}`,
    `Subject: ${subject}`,
    `Chapter: ${chapter}`,
    `Topic: ${topic}`,
    `Asset Type: ${assetType}`,
    `Language: ${language}`,
    style ? `Style Profile: ${style}` : '',
    'Safety rules: factual, age-appropriate, no fabricated citations, no hidden chain-of-thought.',
    outputRule
  ].filter(Boolean).join('\n');

  try {
    const content = await callGemini(prompt, assetType === 'TEST' ? 0.2 : 0.35, assetType === 'TEST' ? 5000 : 3500);
    res.json({ content, provenance: [{ source: 'gemini', model: modelName }] });
  } catch (error) {
    return fail(res, 503, error instanceof Error ? error.message : 'Teacher generation failed.');
  }
});

app.post('/v1/website/test/evaluate', requireAuth, async (req, res) => {
  const questions = Array.isArray(req.body?.questions) ? req.body.questions : [];
  if (!questions.length) return fail(res, 400, 'At least one question is required.');

  const grades = [];
  let totalMarks = 0;

  for (const question of questions) {
    const id = String(question?.question_id || '').trim();
    const modelAnswer = String(question?.model_answer || '');
    const studentAnswer = String(question?.student_answer || '');
    const marks = Number(question?.marks || 0);
    if (!id || !Number.isFinite(marks) || marks <= 0 || marks > 20) return fail(res, 400, 'Invalid question payload.');
    totalMarks += marks;
    const graded = scoreAnswer(modelAnswer, studentAnswer, marks);
    grades.push({ question_id: id, awarded: graded.awarded, feedback: graded.feedback });
  }

  res.json({ grades, total_marks: totalMarks });
});

app.get('/v1/website/youtube/search', requireAuth, async (req, res) => {
  const query = String(req.query.q || '').trim();
  const max = Math.min(25, Math.max(1, Number(req.query.max_results || 10)));
  if (!query) return fail(res, 400, 'q is required.');
  if (!youtubeApiKey) return fail(res, 503, 'YOUTUBE_DATA_API_KEY is required for YouTube search.');

  try {
    const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
    searchUrl.searchParams.set('part', 'snippet');
    searchUrl.searchParams.set('type', 'video');
    searchUrl.searchParams.set('q', query);
    searchUrl.searchParams.set('maxResults', String(max));
    searchUrl.searchParams.set('key', youtubeApiKey);

    const searchRes = await fetch(searchUrl);
    const searchJson = await searchRes.json().catch(() => ({}));
    if (!searchRes.ok) return fail(res, searchRes.status, searchJson?.error?.message || 'YouTube search failed.');

    const ids = (searchJson.items || []).map(item => item?.id?.videoId).filter(Boolean);
    if (!ids.length) return res.json({ items: [] });

    const videosUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
    videosUrl.searchParams.set('part', 'contentDetails,statistics,snippet');
    videosUrl.searchParams.set('id', ids.join(','));
    videosUrl.searchParams.set('key', youtubeApiKey);

    const videosRes = await fetch(videosUrl);
    const videosJson = await videosRes.json().catch(() => ({}));
    if (!videosRes.ok) return fail(res, videosRes.status, videosJson?.error?.message || 'YouTube metadata lookup failed.');

    const items = (videosJson.items || []).map(item => ({
      video_id: item.id,
      title: item.snippet?.title || 'YouTube lecture',
      channel_title: item.snippet?.channelTitle || 'YouTube',
      description: item.snippet?.description || '',
      thumbnail: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.default?.url || '',
      duration: item.contentDetails?.duration || '',
      views: item.statistics?.viewCount ? `${item.statistics.viewCount} views` : ''
    }));

    res.json({ items });
  } catch {
    return fail(res, 502, 'YouTube search is temporarily unavailable.');
  }
});

app.listen(port, () => {
  console.log(`[saarthi-backend] listening on :${port}`);
});
