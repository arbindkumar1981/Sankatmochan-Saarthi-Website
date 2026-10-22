# Saarthi Backend Setup (Admin Panel + Teacher Generator)

This project frontend already calls a backend through `VITE_SAARTHI_API_URL`.

A backend implementation now exists at `backend/server.mjs` with these endpoints:

- `GET /health`
- `POST /v1/materials/convert-office`
- `GET /v1/materials/branding-logo`
- `GET /v1/materials/:contentId/pdf`
- `POST /v1/materials/cleanup-files`
- `POST /v1/website/teacher/generate`
- `POST /v1/website/test/evaluate`
- `GET /v1/website/youtube/search`

## Required keys and credentials

1. Firebase Admin credential (required)
- Needed for token verification and access to Firestore/Storage.
- Configure either:
  - `GOOGLE_APPLICATION_CREDENTIALS` path to service account JSON, or
  - `FIREBASE_SERVICE_ACCOUNT_JSON` as inline JSON.

2. Test generator key (required for AI generation)
- Use `GOOGLE_GENAI_API_KEY`.
- `GEMINI_API_KEY` is also accepted for compatibility.
- The backend uses this key for `POST /v1/website/teacher/generate`.

3. YouTube search key (optional)
- Use `YOUTUBE_DATA_API_KEY` if you want live YouTube API search.

4. Office conversion URL (optional but needed for DOCX/PPTX uploads)
- Use `SAARTHI_CONVERTER_URL` pointing to your private converter service.
- PDF/image/TXT uploads work without this.

## Local run

1. Install dependencies:
```bash
npm install --legacy-peer-deps
```

2. Set env values in `.env`.

3. Start frontend:
```bash
npm run dev
```

4. Start backend:
```bash
npm run backend:dev
```

5. Run backend smoke test:
```bash
npm run backend:test
```

6. Point frontend to backend:
- Set `VITE_SAARTHI_API_URL` to the backend base URL, for example `http://localhost:8787`.

## Deploy to Cloud Run

1. Build image:
```bash
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/saarthi-backend -f backend/Dockerfile .
```

2. Deploy service:
```bash
gcloud run deploy saarthi-backend \
  --image gcr.io/YOUR_PROJECT_ID/saarthi-backend \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated
```

3. Set required environment variables on service:
- `GOOGLE_GENAI_API_KEY`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `SAARTHI_ALLOWED_ORIGIN`

4. Optional environment variables:
- `SAARTHI_CONVERTER_URL`
- `YOUTUBE_DATA_API_KEY`
- `SAARTHI_GENAI_MODEL`

5. Update frontend env:
- `VITE_SAARTHI_API_URL=<your-cloud-run-url>`

## Notes for Admin PDF workflows

- Replace/Edit in Admin records now triggers backend cleanup for replaced old files.
- Delete remains soft-delete (restorable) and does not physically remove current files.
- PDF reader endpoint enforces published+approved checks before streaming.
