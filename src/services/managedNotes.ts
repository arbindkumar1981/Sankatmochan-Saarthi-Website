import { auth } from './firebase';

export interface ManagedNote {
  id: string; title: string; board: string; classGrade: string; stream: string;
  subjectId: string; chapterId: string; topicId: string; body: string; version: number;
  published: boolean; deleted: boolean; source: 'admin_uploaded'; updatedBy: string;
  updatedAt: string; storagePath?: string; fileName?: string; fileType?: string;
  hasAttachment?: boolean;
}
export interface NotePage { rows: ManagedNote[]; next: string | null }

/** No direct Firestore/Storage writes or public download tokens. */
export async function notesRequest<T>(path: string, body?: unknown, progress?: (value: number) => void, binary = false): Promise<T> {
  const user = auth.currentUser;
  if (!user || user.isAnonymous) throw new Error('Sign in with a registered account.');
  const base = import.meta.env.VITE_SAARTHI_API_URL;
  if (!base) throw new Error('Notes service is not configured.');
  const token = await user.getIdToken();
  if (auth.currentUser !== user) throw new Error('Account changed. Reload notes.');
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(body ? 'POST' : 'GET', `${base.replace(/\/$/, '')}/v1/notes${path}`);
    xhr.timeout = 120000;
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    if (body) xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.responseType = binary ? 'blob' : 'json';
    xhr.upload.onprogress = event => { if (event.lengthComputable) progress?.(Math.round(100 * event.loaded / event.total)); };
    xhr.onerror = () => reject(new Error('Notes service could not be reached. Reload before retrying.'));
    xhr.ontimeout = () => reject(new Error('Request timed out. Reload to check whether the change completed.'));
    xhr.onload = () => {
      if (auth.currentUser !== user) return reject(new Error('Account changed. Reload notes.'));
      if (xhr.status < 200 || xhr.status >= 300) return reject(new Error(xhr.response?.detail || `Notes request failed (${xhr.status}). Reload before retrying.`));
      resolve(xhr.response as T);
    };
    xhr.send(body ? JSON.stringify(body) : null);
  });
}

export async function noteFile(file: File) {
  const types: Record<string, string> = { pdf: 'application/pdf', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', md: 'text/markdown', txt: 'text/plain' };
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  if (!types[extension] || !file.size || file.size > 12 * 1024 * 1024) throw new Error('Choose PDF, DOCX, Markdown or text up to 12 MiB.');
  const bytes = new Uint8Array(await file.arrayBuffer());
  let encoded = '';
  for (let start = 0; start < bytes.length; start += 8192) encoded += String.fromCharCode(...bytes.subarray(start, start + 8192));
  return { fileName: file.name, fileType: types[extension], fileBase64: btoa(encoded) };
}
