import type { User } from 'firebase/auth';

export async function cleanupMaterialFiles(user: User, paths: string[]) {
  const api = (import.meta.env.VITE_SAARTHI_API_URL || '').replace(/\/$/, '');
  const unique = [...new Set(paths.filter(path => typeof path === 'string' && path.startsWith('learning-materials/')))];
  if (!api || !unique.length) return;

  const response = await fetch(`${api}/v1/materials/cleanup-files`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${await user.getIdToken()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ paths: unique })
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(typeof body.detail === 'string' ? body.detail : 'Old file cleanup failed.');
  }
}
