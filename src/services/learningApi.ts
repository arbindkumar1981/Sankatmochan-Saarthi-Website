import { auth } from './firebase';
import type { EvaluationTest, TestQuestion, TestResult, MistakeRecord } from '../types';
import type { AssessmentSelection } from './testAssessment';
export type PublicEvaluationTest = Omit<EvaluationTest, 'questions'> & { questionCount: number; questions: Omit<TestQuestion, 'correctIndex' | 'explanation'>[] };
export type SecureAttempt = { attemptId: string; expiresAt: string; test: PublicEvaluationTest };
export async function learningApi<T>(path: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  const user = auth.currentUser;
  if (!user || user.isAnonymous) throw new Error('Sign in to use this learning activity.');
  const api = import.meta.env.VITE_SAARTHI_API_URL;
  if (!api) throw new Error('Learning service is not configured.');
  const deadline = AbortSignal.timeout(path === '/generated-attempts' ? 600000 : 60000);
  const requestSignal = signal ? AbortSignal.any([signal, deadline]) : deadline;
  const res = await fetch(`${api.replace(/\/$/, '')}/v1/website/learning${path}`, {method: body === undefined ? 'GET' : 'POST', headers: {Authorization: `Bearer ${await user.getIdToken()}`, 'Content-Type': 'application/json'}, ...(body === undefined ? {} : {body: JSON.stringify(body)}), signal: requestSignal});
  const result = await res.json().catch(() => null);
  if (!res.ok || result === null) throw new Error(typeof result?.detail === 'string' ? result.detail : 'Learning service is unavailable. Please retry.');
  return result as T;
}
export const assessmentScope = (selection: AssessmentSelection) => ({...selection, chapterId: selection.chapterId || '', topicId: selection.topicId || ''});
export const learningHistory = () => learningApi<{results: TestResult[]; mistakes: MistakeRecord[]}>('/history');
