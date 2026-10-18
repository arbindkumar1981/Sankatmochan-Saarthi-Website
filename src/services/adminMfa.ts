import { getMultiFactorResolver, multiFactor, TotpMultiFactorGenerator, reauthenticateWithPopup, signInWithPopup, type MultiFactorError, type MultiFactorResolver, type TotpSecret } from 'firebase/auth';
import { auth, googleProvider } from './firebase';

export async function adminSignIn(): Promise<MultiFactorResolver | null> {
  try { await signInWithPopup(auth, googleProvider); return null; }
  catch (error) {
    if ((error as {code?: string}).code === 'auth/multi-factor-auth-required') return getMultiFactorResolver(auth, error as MultiFactorError);
    throw new Error('Sign-in could not complete. Check the authorized domain and try again.');
  }
}
export async function adminReauthenticate(): Promise<MultiFactorResolver | null> {
  if (!auth.currentUser) throw new Error('Sign in first.');
  try { await reauthenticateWithPopup(auth.currentUser, googleProvider); return null; }
  catch (error) {
    if ((error as {code?: string}).code === 'auth/multi-factor-auth-required') return getMultiFactorResolver(auth, error as MultiFactorError);
    throw new Error('Reauthentication could not complete.');
  }
}
export async function enrollSecret(): Promise<TotpSecret> {
  const user = auth.currentUser;
  if (!user?.emailVerified) throw new Error('Verify your email before enrollment.');
  return TotpMultiFactorGenerator.generateSecret(await multiFactor(user).getSession());
}
export async function completeEnrollment(secret: TotpSecret, code: string) {
  const user = auth.currentUser;
  if (!user || !/^\d{6}$/.test(code)) throw new Error('Enter the six-digit authenticator code.');
  await multiFactor(user).enroll(TotpMultiFactorGenerator.assertionForEnrollment(secret, code), 'Administrator authenticator');
  await user.getIdToken(true);
}
export async function completeChallenge(resolver: MultiFactorResolver, code: string, factorUid: string) {
  if (!/^\d{6}$/.test(code) || !resolver.hints.some(hint => hint.uid === factorUid && hint.factorId === TotpMultiFactorGenerator.FACTOR_ID)) throw new Error('Choose your enrolled authenticator and enter its six-digit code.');
  await resolver.resolveSignIn(TotpMultiFactorGenerator.assertionForSignIn(factorUid, code));
}
