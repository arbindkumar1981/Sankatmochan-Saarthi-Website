import { auth } from './firebase';

export async function adminRead<T>(path: string, signal?: AbortSignal): Promise<T> {
  const user = auth.currentUser;
  if (!user || user.isAnonymous) throw new Error('Administrator sign-in required.');
  const base = import.meta.env.VITE_SAARTHI_API_URL;
  if (!base) throw new Error('Administration service is not configured.');
  const token = await user.getIdToken();
  if (auth.currentUser !== user || signal?.aborted) throw new Error('Account changed. Reload this view.');
  const response = await fetch(`${base.replace(/\/$/, '')}/v1/admin${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(30000)]) : AbortSignal.timeout(30000),
    cache: 'no-store',
  });
  if (auth.currentUser !== user || signal?.aborted) throw new Error('Account changed. Reload this view.');
  if (!response.ok) throw new Error(response.status === 403 ? 'Administrator access is required.' : 'Academic progress could not be loaded. Please retry.');
  const result = await response.json() as T;
  if (auth.currentUser !== user || signal?.aborted) throw new Error('Account changed. Reload this view.');
  return result;
}

export interface TopicProgress {
  student_id: string; student_name: string; topic_id: string; topic_title: string;
  chapter_title: string; subject_name: string; board: string; class_level: string;
  mastery: number | null; mastered: boolean | null; calculated_at: string | null;
  average_test_score: number | null; test_attempts: number;
  notes_viewed: boolean; practice_started: boolean; last_activity_at: string | null;
}
export interface TopicProgressPage {
  rows: TopicProgress[]; threshold: number;
  next: { after_student: string; after_topic: string } | null;
}
