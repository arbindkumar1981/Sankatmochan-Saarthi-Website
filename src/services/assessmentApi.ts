import { auth } from './firebase';
export async function assessmentApi<T>(path: string, body?: unknown): Promise<T> {
  const user = auth.currentUser;
  if (!user || user.isAnonymous) throw new Error('Student or assigned Academic Admin sign-in required.');
  const base = import.meta.env.VITE_SAARTHI_API_URL;
  if (!base) throw new Error('Assessment service is unavailable.');
  const token = await user.getIdToken();
  if (auth.currentUser !== user) throw new Error('Account changed. Reload.');
  const result = await fetch(`${base.replace(/\/$/,'')}/v1/assessment${path}`, {method:body ? 'POST':'GET',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:body ? JSON.stringify(body):undefined,signal:AbortSignal.timeout(650000),cache:'no-store'});
  if (auth.currentUser !== user) throw new Error('Account changed. Reload.');
  if (!result.ok) throw new Error(result.status===429 ? 'Your daily assessment allowance has been reached.' : result.status===409 ? 'This version changed or evaluation is already pending. Check the stored attempt before retrying.' : 'Assessment unavailable. Check your access and the stored attempt; no guessed marks will be issued.');
  const value=await result.json() as T;
  if (auth.currentUser !== user) throw new Error('Account changed. Reload.');
  return value;
}
